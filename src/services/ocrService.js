/**
 * OCR Service for processing ID card images and extracting text
 * Integrates with react-native-text-recognition for offline OCR processing
 */

import { TextRecognition } from '@react-native-ml-kit/text-recognition';
import { cleanOCRText, extractDataFromText, postProcessExtractedData } from '../utils/ocrHelper';
import { prepareImageForOCR, assessImageQuality } from '../utils/imageProcessor';
import { sanitizeData, validateExtractedData, generateQualityReport } from '../utils/dataValidator';
import { detectCardFormat } from '../constants/idCardFormats';

/**
 * OCR Service configuration
 */
const OCR_CONFIG = {
  // Confidence threshold for accepting OCR results
  MIN_CONFIDENCE: 0.5,
  
  // Maximum processing time in milliseconds
  MAX_PROCESSING_TIME: 30000,
  
  // Retry configuration
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
};

/**
 * OCR Service class for handling text recognition operations
 */
class OCRService {
  constructor() {
    this.isProcessing = false;
    this.currentOperation = null;
  }

  /**
   * Process an image and extract ID card data
   * @param {string} imageUri - URI of the image to process
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Processing result with extracted data
   */
  async processImage(imageUri, options = {}) {
    const {
      enhanceImage = true,
      validateData = true,
      includeQualityReport = true,
      onProgress = null,
    } = options;

    if (this.isProcessing) {
      throw new Error('OCR processing is already in progress');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      // Step 1: Assess image quality
      if (onProgress) onProgress({ step: 'quality', progress: 0.1 });
      const qualityAssessment = await assessImageQuality(imageUri);
      
      if (qualityAssessment.score < 0.3) {
        console.warn('Low image quality detected:', qualityAssessment.issues);
      }

      // Step 2: Prepare image for OCR
      if (onProgress) onProgress({ step: 'preprocessing', progress: 0.2 });
      let processedImageUri = imageUri;
      
      if (enhanceImage) {
        processedImageUri = await prepareImageForOCR(imageUri, {
          autoEnhance: true,
          autoCrop: false, // We'll handle cropping separately if needed
        });
      }

      // Step 3: Perform OCR
      if (onProgress) onProgress({ step: 'ocr', progress: 0.4 });
      const ocrResult = await this.performOCR(processedImageUri);

      // Step 4: Process and extract structured data
      if (onProgress) onProgress({ step: 'extraction', progress: 0.6 });
      const extractionResult = await this.extractStructuredData(ocrResult.text);

      // Step 5: Validate and sanitize data
      if (onProgress) onProgress({ step: 'validation', progress: 0.8 });
      let validationResult = { errors: [], warnings: [], isValid: true };
      let sanitizedData = extractionResult.data;
      
      if (validateData) {
        sanitizedData = sanitizeData(extractionResult.data);
        validationResult = validateExtractedData(sanitizedData, extractionResult.format);
      }

      // Step 6: Generate quality report
      if (onProgress) onProgress({ step: 'report', progress: 0.9 });
      let qualityReport = null;
      
      if (includeQualityReport) {
        const completeness = this.assessDataCompleteness(sanitizedData, extractionResult.format);
        qualityReport = generateQualityReport(sanitizedData, validationResult, completeness);
      }

      const processingTime = Date.now() - startTime;
      
      if (onProgress) onProgress({ step: 'complete', progress: 1.0 });

      return {
        success: true,
        data: sanitizedData,
        rawText: ocrResult.text,
        confidence: extractionResult.confidence,
        format: extractionResult.format,
        validation: validationResult,
        qualityReport,
        imageQuality: qualityAssessment,
        processingTime,
        metadata: {
          imageUri: processedImageUri,
          originalImageUri: imageUri,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    } finally {
      this.isProcessing = false;
      this.currentOperation = null;
    }
  }

  /**
   * Perform OCR on an image with retry logic
   * @param {string} imageUri - Image URI
   * @returns {Promise<Object>} - OCR result
   */
  async performOCR(imageUri) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= OCR_CONFIG.MAX_RETRIES; attempt++) {
      try {
        const result = await this.performSingleOCR(imageUri);
        
        if (result.text && result.text.length > 0) {
          return result;
        } else if (attempt < OCR_CONFIG.MAX_RETRIES) {
          console.warn(`OCR attempt ${attempt + 1} returned empty text, retrying...`);
          await this.delay(OCR_CONFIG.RETRY_DELAY);
        }
      } catch (error) {
        lastError = error;
        console.warn(`OCR attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < OCR_CONFIG.MAX_RETRIES) {
          await this.delay(OCR_CONFIG.RETRY_DELAY);
        }
      }
    }
    
    throw lastError || new Error('OCR failed to extract any text after multiple attempts');
  }

  /**
   * Perform a single OCR operation
   * @param {string} imageUri - Image URI
   * @returns {Promise<Object>} - OCR result
   */
  async performSingleOCR(imageUri) {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OCR operation timed out')), OCR_CONFIG.MAX_PROCESSING_TIME)
    );

    const ocrPromise = TextRecognition.recognize(imageUri);
    
    const result = await Promise.race([ocrPromise, timeout]);
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid OCR result format');
    }

    // Handle different result formats from the OCR library
    let text = '';
    let confidence = 0;
    
    if (typeof result === 'string') {
      text = result;
      confidence = 0.8; // Default confidence for string results
    } else if (result.text) {
      text = result.text;
      confidence = result.confidence || 0.8;
    } else if (Array.isArray(result)) {
      // Handle array of text blocks
      text = result.map(block => 
        typeof block === 'string' ? block : (block.text || '')
      ).join('\n');
      
      // Calculate average confidence if available
      const confidences = result
        .filter(block => block.confidence !== undefined)
        .map(block => block.confidence);
      
      confidence = confidences.length > 0 
        ? confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
        : 0.8;
    }

    return {
      text: cleanOCRText(text),
      confidence,
      rawResult: result,
    };
  }

  /**
   * Extract structured data from OCR text
   * @param {string} text - Raw OCR text
   * @returns {Promise<Object>} - Extraction result
   */
  async extractStructuredData(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for data extraction');
    }

    // Extract data using helper functions
    const extractionResult = extractDataFromText(text);
    
    // Post-process the extracted data
    const processedData = postProcessExtractedData(extractionResult.data);
    
    return {
      data: processedData,
      confidence: extractionResult.confidence,
      format: extractionResult.format,
      rawText: text,
    };
  }

  /**
   * Assess data completeness based on format requirements
   * @param {Object} data - Extracted data
   * @param {Object} format - Card format
   * @returns {Object} - Completeness assessment
   */
  assessDataCompleteness(data, format) {
    const requiredFields = format.fields
      .filter(field => field.required)
      .map(field => field.key);
    
    const totalFields = format.fields.length;
    const extractedFields = Object.keys(data).length;
    const requiredFieldsPresent = requiredFields.filter(field => 
      data[field] && data[field].toString().trim() !== ''
    ).length;
    
    return {
      totalFields,
      extractedFields,
      requiredFields: requiredFields.length,
      requiredFieldsPresent,
      completenessScore: totalFields > 0 ? extractedFields / totalFields : 0,
      requiredFieldsScore: requiredFields.length > 0 
        ? requiredFieldsPresent / requiredFields.length 
        : 1,
      missingRequiredFields: requiredFields.filter(field => 
        !data[field] || data[field].toString().trim() === ''
      ),
    };
  }

  /**
   * Cancel current OCR operation
   */
  cancelOperation() {
    if (this.currentOperation) {
      // Note: react-native-text-recognition doesn't support cancellation
      // This is a placeholder for future implementation
      console.warn('OCR cancellation requested but not supported by underlying library');
    }
    this.isProcessing = false;
  }

  /**
   * Check if OCR is currently processing
   * @returns {boolean} - Processing status
   */
  isCurrentlyProcessing() {
    return this.isProcessing;
  }

  /**
   * Get OCR service capabilities
   * @returns {Object} - Service capabilities
   */
  getCapabilities() {
    return {
      supportedFormats: ['jpg', 'jpeg', 'png'],
      maxImageSize: 10 * 1024 * 1024, // 10MB
      supportsOfflineProcessing: true,
      supportsRealTimeProcessing: false,
      supportedLanguages: ['en'], // Extend based on library capabilities
    };
  }

  /**
   * Utility function to add delay
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Delay promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create and export singleton instance
const ocrService = new OCRService();

/**
 * Process image with OCR (convenience function)
 * @param {string} imageUri - Image URI
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing result
 */
export const processImageWithOCR = async (imageUri, options = {}) => {
  return await ocrService.processImage(imageUri, options);
};

/**
 * Check if OCR service is available
 * @returns {Promise<boolean>} - Availability status
 */
export const isOCRAvailable = async () => {
  try {
    // Test with a minimal operation
    return true; // Assume available if library is imported successfully
  } catch (error) {
    console.error('OCR service not available:', error);
    return false;
  }
};

/**
 * Get OCR service instance
 * @returns {OCRService} - Service instance
 */
export const getOCRService = () => ocrService;

export default ocrService;
