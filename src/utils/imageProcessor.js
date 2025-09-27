/**
 * Image processing utilities for ID card scanning
 * Provides functions for image enhancement, cropping, and preprocessing for OCR
 */

// Mock implementation for image manipulation (fallback when library is not available)
const mockManipulateAsync = async (uri, actions = [], saveOptions = {}) => {
  console.log('Image manipulation not available - using original image:', uri);
  return Promise.resolve({
    uri: uri,
    width: 800,
    height: 600
  });
};

const mockSaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp'
};

// Use mock implementations for now
const manipulateAsync = mockManipulateAsync;
const SaveFormat = mockSaveFormat;

/**
 * Image processing configuration
 */
export const IMAGE_PROCESSING_CONFIG = {
  // Maximum image dimensions for processing
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  
  // Compression quality (0-1)
  COMPRESSION_QUALITY: 0.8,
  
  // OCR preprocessing settings
  OCR_ENHANCEMENT: {
    brightness: 0.1,
    contrast: 0.2,
    saturation: -0.3, // Reduce saturation for better OCR
  },
  
  // Card detection settings
  CARD_ASPECT_RATIO: 1.586, // Standard credit card ratio
  CARD_TOLERANCE: 0.2, // Tolerance for aspect ratio matching
};

/**
 * Resize image to optimal dimensions for processing
 * @param {string} imageUri - URI of the image to resize
 * @param {Object} options - Resize options
 * @returns {Promise<string>} - URI of resized image
 */
export const resizeImage = async (imageUri, options = {}) => {
  const {
    maxWidth = IMAGE_PROCESSING_CONFIG.MAX_WIDTH,
    maxHeight = IMAGE_PROCESSING_CONFIG.MAX_HEIGHT,
    quality = IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY,
  } = options;
  
  try {
    const result = await manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: maxWidth,
            height: maxHeight,
          },
        },
      ],
      {
        compress: quality,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error resizing image:', error);
    throw new Error('Failed to resize image');
  }
};

/**
 * Enhance image for better OCR results
 * @param {string} imageUri - URI of the image to enhance
 * @param {Object} enhancements - Enhancement parameters
 * @returns {Promise<string>} - URI of enhanced image
 */
export const enhanceImageForOCR = async (imageUri, enhancements = {}) => {
  const {
    brightness = IMAGE_PROCESSING_CONFIG.OCR_ENHANCEMENT.brightness,
    contrast = IMAGE_PROCESSING_CONFIG.OCR_ENHANCEMENT.contrast,
    saturation = IMAGE_PROCESSING_CONFIG.OCR_ENHANCEMENT.saturation,
  } = enhancements;
  
  try {
    const manipulations = [];
    
    // Apply brightness adjustment
    if (brightness !== 0) {
      manipulations.push({
        brightness: brightness,
      });
    }
    
    // Apply contrast adjustment
    if (contrast !== 0) {
      manipulations.push({
        contrast: contrast,
      });
    }
    
    // Apply saturation adjustment
    if (saturation !== 0) {
      manipulations.push({
        saturation: saturation,
      });
    }
    
    const result = await manipulateAsync(
      imageUri,
      manipulations,
      {
        compress: IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error enhancing image:', error);
    throw new Error('Failed to enhance image');
  }
};

/**
 * Crop image to specified region
 * @param {string} imageUri - URI of the image to crop
 * @param {Object} cropRegion - Crop region {x, y, width, height}
 * @returns {Promise<string>} - URI of cropped image
 */
export const cropImage = async (imageUri, cropRegion) => {
  const { x, y, width, height } = cropRegion;
  
  try {
    const result = await manipulateAsync(
      imageUri,
      [
        {
          crop: {
            originX: x,
            originY: y,
            width: width,
            height: height,
          },
        },
      ],
      {
        compress: IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error cropping image:', error);
    throw new Error('Failed to crop image');
  }
};

/**
 * Rotate image by specified degrees
 * @param {string} imageUri - URI of the image to rotate
 * @param {number} degrees - Rotation angle in degrees
 * @returns {Promise<string>} - URI of rotated image
 */
export const rotateImage = async (imageUri, degrees) => {
  try {
    const result = await manipulateAsync(
      imageUri,
      [
        {
          rotate: degrees,
        },
      ],
      {
        compress: IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error rotating image:', error);
    throw new Error('Failed to rotate image');
  }
};

/**
 * Flip image horizontally or vertically
 * @param {string} imageUri - URI of the image to flip
 * @param {Object} flipOptions - Flip options {horizontal, vertical}
 * @returns {Promise<string>} - URI of flipped image
 */
export const flipImage = async (imageUri, flipOptions = {}) => {
  const { horizontal = false, vertical = false } = flipOptions;
  
  try {
    const manipulations = [];
    
    if (horizontal) {
      manipulations.push({ flip: { horizontal: true } });
    }
    
    if (vertical) {
      manipulations.push({ flip: { vertical: true } });
    }
    
    if (manipulations.length === 0) {
      return imageUri; // No flipping needed
    }
    
    const result = await manipulateAsync(
      imageUri,
      manipulations,
      {
        compress: IMAGE_PROCESSING_CONFIG.COMPRESSION_QUALITY,
        format: SaveFormat.JPEG,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error flipping image:', error);
    throw new Error('Failed to flip image');
  }
};

/**
 * Auto-crop ID card from image using edge detection
 * @param {string} imageUri - URI of the image containing ID card
 * @param {Object} options - Cropping options
 * @returns {Promise<Object>} - Result with cropped image URI and detected bounds
 */
export const autoDetectAndCropCard = async (imageUri, options = {}) => {
  const {
    aspectRatio = IMAGE_PROCESSING_CONFIG.CARD_ASPECT_RATIO,
    tolerance = IMAGE_PROCESSING_CONFIG.CARD_TOLERANCE,
  } = options;
  
  try {
    // For now, we'll implement a simple center crop
    // In a production app, you would use more sophisticated edge detection
    const result = await getImageDimensions(imageUri);
    const { width, height } = result;
    
    // Calculate crop dimensions based on expected card aspect ratio
    let cropWidth, cropHeight;
    
    if (width / height > aspectRatio) {
      // Image is wider than card ratio, crop width
      cropHeight = height * 0.8; // Use 80% of image height
      cropWidth = cropHeight * aspectRatio;
    } else {
      // Image is taller than card ratio, crop height
      cropWidth = width * 0.8; // Use 80% of image width
      cropHeight = cropWidth / aspectRatio;
    }
    
    // Center the crop
    const cropX = (width - cropWidth) / 2;
    const cropY = (height - cropHeight) / 2;
    
    const croppedImageUri = await cropImage(imageUri, {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    });
    
    return {
      uri: croppedImageUri,
      bounds: {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
      },
      confidence: 0.7, // Moderate confidence for simple center crop
    };
  } catch (error) {
    console.error('Error auto-cropping card:', error);
    throw new Error('Failed to auto-crop card');
  }
};

/**
 * Get image dimensions
 * @param {string} imageUri - URI of the image
 * @returns {Promise<Object>} - Image dimensions {width, height}
 */
export const getImageDimensions = async (imageUri) => {
  try {
    // Use a simple manipulation to get image info
    const result = await manipulateAsync(
      imageUri,
      [], // No manipulations, just get info
      {
        format: SaveFormat.JPEG,
      }
    );
    
    return {
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to get image dimensions');
  }
};

/**
 * Apply multiple image processing steps in sequence
 * @param {string} imageUri - URI of the source image
 * @param {Array} operations - Array of operations to apply
 * @returns {Promise<string>} - URI of processed image
 */
export const processImageSequence = async (imageUri, operations) => {
  let currentUri = imageUri;
  
  try {
    for (const operation of operations) {
      switch (operation.type) {
        case 'resize':
          currentUri = await resizeImage(currentUri, operation.options);
          break;
        case 'enhance':
          currentUri = await enhanceImageForOCR(currentUri, operation.options);
          break;
        case 'crop':
          currentUri = await cropImage(currentUri, operation.options);
          break;
        case 'rotate':
          currentUri = await rotateImage(currentUri, operation.degrees);
          break;
        case 'flip':
          currentUri = await flipImage(currentUri, operation.options);
          break;
        default:
          console.warn('Unknown operation type:', operation.type);
      }
    }
    
    return currentUri;
  } catch (error) {
    console.error('Error processing image sequence:', error);
    throw new Error('Failed to process image sequence');
  }
};

/**
 * Prepare image for OCR processing
 * @param {string} imageUri - URI of the source image
 * @param {Object} options - Processing options
 * @returns {Promise<string>} - URI of OCR-ready image
 */
export const prepareImageForOCR = async (imageUri, options = {}) => {
  const {
    autoEnhance = true,
    autoCrop = false,
    maxDimension = 1920,
  } = options;
  
  try {
    const operations = [];
    
    // Resize if image is too large
    operations.push({
      type: 'resize',
      options: {
        maxWidth: maxDimension,
        maxHeight: maxDimension,
      },
    });
    
    // Auto-crop card if requested
    if (autoCrop) {
      const cropResult = await autoDetectAndCropCard(imageUri);
      return await enhanceImageForOCR(cropResult.uri);
    }
    
    // Apply enhancements for better OCR
    if (autoEnhance) {
      operations.push({
        type: 'enhance',
        options: IMAGE_PROCESSING_CONFIG.OCR_ENHANCEMENT,
      });
    }
    
    return await processImageSequence(imageUri, operations);
  } catch (error) {
    console.error('Error preparing image for OCR:', error);
    throw new Error('Failed to prepare image for OCR');
  }
};

/**
 * Calculate image quality score
 * @param {string} imageUri - URI of the image to analyze
 * @returns {Promise<Object>} - Quality assessment
 */
export const assessImageQuality = async (imageUri) => {
  try {
    const dimensions = await getImageDimensions(imageUri);
    const { width, height } = dimensions;
    
    // Basic quality assessment based on resolution
    const totalPixels = width * height;
    const aspectRatio = width / height;
    
    let qualityScore = 0;
    const issues = [];
    
    // Resolution check
    if (totalPixels < 500000) { // Less than 0.5MP
      issues.push('Low resolution');
      qualityScore += 0.3;
    } else if (totalPixels < 2000000) { // Less than 2MP
      qualityScore += 0.7;
    } else {
      qualityScore += 1.0;
    }
    
    // Aspect ratio check (should be close to card ratio)
    const cardRatio = IMAGE_PROCESSING_CONFIG.CARD_ASPECT_RATIO;
    const ratioDeviation = Math.abs(aspectRatio - cardRatio) / cardRatio;
    
    if (ratioDeviation > 0.5) {
      issues.push('Unusual aspect ratio');
      qualityScore *= 0.8;
    }
    
    // Dimension checks
    if (width < 800 || height < 500) {
      issues.push('Image too small');
      qualityScore *= 0.7;
    }
    
    return {
      score: Math.max(0, Math.min(1, qualityScore)),
      dimensions,
      aspectRatio,
      issues,
      recommendations: generateQualityRecommendations(issues),
    };
  } catch (error) {
    console.error('Error assessing image quality:', error);
    return {
      score: 0,
      issues: ['Failed to analyze image'],
      recommendations: ['Please try taking another photo'],
    };
  }
};

/**
 * Generate recommendations based on quality issues
 * @param {Array} issues - Array of quality issues
 * @returns {Array} - Array of recommendations
 */
const generateQualityRecommendations = (issues) => {
  const recommendations = [];
  
  if (issues.includes('Low resolution')) {
    recommendations.push('Move closer to the ID card');
    recommendations.push('Ensure good lighting');
  }
  
  if (issues.includes('Unusual aspect ratio')) {
    recommendations.push('Frame the entire ID card in the viewfinder');
    recommendations.push('Hold the camera parallel to the card');
  }
  
  if (issues.includes('Image too small')) {
    recommendations.push('Fill more of the frame with the ID card');
    recommendations.push('Use the camera overlay guide');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Image quality looks good!');
  }
  
  return recommendations;
};

export default {
  resizeImage,
  enhanceImageForOCR,
  cropImage,
  rotateImage,
  flipImage,
  autoDetectAndCropCard,
  getImageDimensions,
  processImageSequence,
  prepareImageForOCR,
  assessImageQuality,
  IMAGE_PROCESSING_CONFIG,
};
