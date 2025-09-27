/**
 * OCR Helper utilities for processing and extracting data from ID cards
 * Provides functions for text processing, field extraction, and confidence scoring
 */

import { REGEX_PATTERNS, FIELD_LABELS, CONFIDENCE_THRESHOLDS } from '../constants/regexPatterns';
import { detectCardFormat } from '../constants/idCardFormats';

/**
 * Clean and preprocess OCR text
 * @param {string} rawText - Raw text from OCR
 * @returns {string} - Cleaned text
 */
export const cleanOCRText = (rawText) => {
  if (!rawText) return '';
  
  return rawText
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that might interfere with parsing
    .replace(/[^\w\s\-\/\.,:'"()]/g, '')
    // Normalize line breaks
    .replace(/\r\n|\r/g, '\n')
    // Trim whitespace
    .trim();
};

/**
 * Extract structured data from OCR text using regex patterns
 * @param {string} ocrText - Cleaned OCR text
 * @returns {Object} - Extracted data with confidence scores
 */
export const extractDataFromText = (ocrText) => {
  const extractedData = {};
  const confidenceScores = {};
  
  if (!ocrText) {
    return { data: extractedData, confidence: confidenceScores };
  }
  
  // Detect card format first
  const cardFormat = detectCardFormat(ocrText);
  
  // Process each field in the detected format
  cardFormat.fields.forEach(field => {
    const { key, pattern } = field;
    
    if (pattern && pattern.extractPattern) {
      const match = ocrText.match(pattern.extractPattern);
      if (match && match[1]) {
        const extractedValue = match[1].trim();
        
        // Validate extracted value against pattern
        if (pattern.pattern.test(extractedValue)) {
          extractedData[key] = extractedValue;
          confidenceScores[key] = pattern.confidence || 0.7;
        } else {
          // Store with lower confidence if pattern doesn't match exactly
          extractedData[key] = extractedValue;
          confidenceScores[key] = (pattern.confidence || 0.7) * 0.5;
        }
      }
    }
  });
  
  // Try to extract additional fields using generic patterns
  Object.entries(REGEX_PATTERNS).forEach(([fieldKey, pattern]) => {
    if (!extractedData[fieldKey] && pattern.extractPattern) {
      const match = ocrText.match(pattern.extractPattern);
      if (match && match[1]) {
        const extractedValue = match[1].trim();
        
        if (pattern.pattern.test(extractedValue)) {
          extractedData[fieldKey] = extractedValue;
          confidenceScores[fieldKey] = pattern.confidence;
        }
      }
    }
  });
  
  return {
    data: extractedData,
    confidence: confidenceScores,
    format: cardFormat,
  };
};

/**
 * Find potential field values by searching for labels
 * @param {string} text - OCR text
 * @param {Array} labels - Array of possible field labels
 * @returns {Array} - Array of potential values
 */
export const findFieldByLabels = (text, labels) => {
  const results = [];
  const lines = text.split('\n');
  
  labels.forEach(label => {
    lines.forEach((line, index) => {
      const upperLine = line.toUpperCase();
      if (upperLine.includes(label)) {
        // Look for value on same line after the label
        const labelIndex = upperLine.indexOf(label);
        const afterLabel = line.substring(labelIndex + label.length).trim();
        
        if (afterLabel && afterLabel.length > 0) {
          // Remove common separators
          const value = afterLabel.replace(/^[:\s-]+/, '').trim();
          if (value) {
            results.push({
              value,
              confidence: 0.8,
              line: index,
              label,
            });
          }
        }
        
        // Also check next line for value
        if (index + 1 < lines.length) {
          const nextLine = lines[index + 1].trim();
          if (nextLine && nextLine.length > 0) {
            results.push({
              value: nextLine,
              confidence: 0.6,
              line: index + 1,
              label,
            });
          }
        }
      }
    });
  });
  
  return results;
};

/**
 * Extract dates from text with various formats
 * @param {string} text - Text to search for dates
 * @returns {Array} - Array of found dates with confidence
 */
export const extractDates = (text) => {
  const datePatterns = [
    // MM/DD/YYYY or DD/MM/YYYY
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
    // YYYY-MM-DD
    /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,
    // Month DD, YYYY
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/gi,
    // DD Month YYYY
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/gi,
  ];
  
  const dates = [];
  
  datePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      dates.push({
        value: match[0],
        confidence: 0.8,
        position: match.index,
      });
    }
  });
  
  return dates;
};

/**
 * Extract names from text using various patterns
 * @param {string} text - Text to search for names
 * @returns {Array} - Array of potential names
 */
export const extractNames = (text) => {
  const namePatterns = [
    // All caps names (common on ID cards)
    /\b[A-Z][A-Z\s'\-]{2,50}\b/g,
    // Title case names
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
  ];
  
  const names = [];
  const lines = text.split('\n');
  
  lines.forEach((line, lineIndex) => {
    namePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const name = match[0].trim();
        
        // Filter out common non-name words
        const nonNameWords = [
          'DRIVER', 'LICENSE', 'STATE', 'EXPIRES', 'ISSUED', 'DOB',
          'ADDRESS', 'HEIGHT', 'WEIGHT', 'EYES', 'HAIR', 'SEX',
          'MALE', 'FEMALE', 'CLASS', 'RESTRICTIONS', 'ENDORSEMENTS'
        ];
        
        const isLikelyName = !nonNameWords.some(word => 
          name.toUpperCase().includes(word)
        ) && name.length >= 3;
        
        if (isLikelyName) {
          names.push({
            value: name,
            confidence: 0.7,
            line: lineIndex,
            position: match.index,
          });
        }
      }
    });
  });
  
  return names;
};

/**
 * Extract ID numbers from text
 * @param {string} text - Text to search for ID numbers
 * @returns {Array} - Array of potential ID numbers
 */
export const extractIdNumbers = (text) => {
  const idPatterns = [
    // Alphanumeric with possible dashes/spaces
    /\b[A-Z0-9][A-Z0-9\s\-]{5,19}[A-Z0-9]\b/g,
    // Pure numeric sequences
    /\b\d{6,15}\b/g,
  ];
  
  const ids = [];
  
  idPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const id = match[0].trim();
      
      // Filter out dates and other non-ID sequences
      const isDate = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(id) ||
                     /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(id);
      
      if (!isDate && id.length >= 6) {
        ids.push({
          value: id,
          confidence: 0.8,
          position: match.index,
        });
      }
    }
  });
  
  return ids;
};

/**
 * Calculate overall confidence score for extracted data
 * @param {Object} confidenceScores - Individual field confidence scores
 * @param {Object} requiredFields - Required fields for the card format
 * @returns {number} - Overall confidence score (0-1)
 */
export const calculateOverallConfidence = (confidenceScores, requiredFields = []) => {
  const scores = Object.values(confidenceScores);
  
  if (scores.length === 0) return 0;
  
  // Calculate average confidence
  const averageConfidence = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Bonus for having required fields
  const requiredFieldsFound = requiredFields.filter(field => 
    confidenceScores[field] && confidenceScores[field] > CONFIDENCE_THRESHOLDS.LOW
  ).length;
  
  const requiredFieldsBonus = requiredFields.length > 0 
    ? (requiredFieldsFound / requiredFields.length) * 0.2 
    : 0;
  
  return Math.min(1, averageConfidence + requiredFieldsBonus);
};

/**
 * Post-process extracted data to improve accuracy
 * @param {Object} extractedData - Raw extracted data
 * @returns {Object} - Processed data
 */
export const postProcessExtractedData = (extractedData) => {
  const processed = { ...extractedData };
  
  // Normalize names to title case
  if (processed.fullName) {
    processed.fullName = processed.fullName
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  if (processed.firstName) {
    processed.firstName = processed.firstName
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  if (processed.lastName) {
    processed.lastName = processed.lastName
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
  
  // Normalize gender
  if (processed.gender) {
    const gender = processed.gender.toUpperCase();
    if (gender === 'M' || gender === 'MALE') {
      processed.gender = 'Male';
    } else if (gender === 'F' || gender === 'FEMALE') {
      processed.gender = 'Female';
    }
  }
  
  // Format dates consistently
  ['dateOfBirth', 'issueDate', 'expiryDate'].forEach(dateField => {
    if (processed[dateField]) {
      processed[dateField] = formatDate(processed[dateField]);
    }
  });
  
  // Clean up ID numbers (remove extra spaces)
  if (processed.idNumber) {
    processed.idNumber = processed.idNumber.replace(/\s+/g, ' ').trim();
  }
  
  return processed;
};

/**
 * Format date string to consistent format
 * @param {string} dateString - Input date string
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // Try to parse various date formats
  const datePatterns = [
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/, // YYYY-MM-DD
  ];
  
  for (const pattern of datePatterns) {
    const match = dateString.match(pattern);
    if (match) {
      const [, part1, part2, part3] = match;
      
      // Assume YYYY-MM-DD format if first part is 4 digits
      if (part1.length === 4) {
        return `${part2.padStart(2, '0')}/${part3.padStart(2, '0')}/${part1}`;
      } else {
        // Assume MM/DD/YYYY format
        return `${part1.padStart(2, '0')}/${part2.padStart(2, '0')}/${part3}`;
      }
    }
  }
  
  return dateString; // Return original if no pattern matches
};

export default {
  cleanOCRText,
  extractDataFromText,
  findFieldByLabels,
  extractDates,
  extractNames,
  extractIdNumbers,
  calculateOverallConfidence,
  postProcessExtractedData,
  formatDate,
};
