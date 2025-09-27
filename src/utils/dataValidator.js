/**
 * Data validation utilities for ID card information
 * Provides functions to validate and sanitize extracted data
 */

import { REGEX_PATTERNS, CONFIDENCE_THRESHOLDS } from '../constants/regexPatterns';

/**
 * Validate extracted data against expected patterns
 * @param {Object} data - Extracted data object
 * @param {Object} format - ID card format definition
 * @returns {Object} - Validation results with errors and warnings
 */
export const validateExtractedData = (data, format) => {
  const errors = [];
  const warnings = [];
  const validatedData = { ...data };
  
  if (!format || !format.fields) {
    errors.push('Invalid card format provided');
    return { errors, warnings, data: validatedData };
  }
  
  // Validate each field according to format requirements
  format.fields.forEach(field => {
    const { key, label, required, pattern } = field;
    const value = data[key];
    
    // Check required fields
    if (required && (!value || value.trim() === '')) {
      errors.push(`${label} is required but missing`);
      return;
    }
    
    // Validate pattern if value exists
    if (value && pattern && pattern.pattern) {
      if (!pattern.pattern.test(value)) {
        warnings.push(`${label} format may be incorrect: ${value}`);
      }
    }
  });
  
  // Additional validation checks
  validateSpecificFields(validatedData, errors, warnings);
  
  return {
    errors,
    warnings,
    data: validatedData,
    isValid: errors.length === 0,
  };
};

/**
 * Validate specific field types with custom logic
 * @param {Object} data - Data to validate
 * @param {Array} errors - Errors array to populate
 * @param {Array} warnings - Warnings array to populate
 */
const validateSpecificFields = (data, errors, warnings) => {
  // Validate dates
  validateDates(data, errors, warnings);
  
  // Validate names
  validateNames(data, errors, warnings);
  
  // Validate ID numbers
  validateIdNumbers(data, errors, warnings);
  
  // Validate addresses
  validateAddresses(data, errors, warnings);
  
  // Cross-field validation
  validateCrossFields(data, errors, warnings);
};

/**
 * Validate date fields
 * @param {Object} data - Data object
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateDates = (data, errors, warnings) => {
  const dateFields = ['dateOfBirth', 'issueDate', 'expiryDate'];
  const currentDate = new Date();
  
  dateFields.forEach(field => {
    const dateValue = data[field];
    if (!dateValue) return;
    
    const parsedDate = parseDate(dateValue);
    if (!parsedDate) {
      errors.push(`Invalid date format for ${field}: ${dateValue}`);
      return;
    }
    
    // Validate date ranges
    switch (field) {
      case 'dateOfBirth':
        if (parsedDate > currentDate) {
          errors.push('Date of birth cannot be in the future');
        } else if (parsedDate < new Date('1900-01-01')) {
          warnings.push('Date of birth seems unusually old');
        }
        break;
        
      case 'issueDate':
        if (parsedDate > currentDate) {
          warnings.push('Issue date is in the future');
        } else if (parsedDate < new Date('1950-01-01')) {
          warnings.push('Issue date seems unusually old');
        }
        break;
        
      case 'expiryDate':
        if (parsedDate < currentDate) {
          warnings.push('Document appears to be expired');
        } else if (parsedDate > new Date(currentDate.getTime() + 50 * 365 * 24 * 60 * 60 * 1000)) {
          warnings.push('Expiry date seems unusually far in the future');
        }
        break;
    }
  });
  
  // Cross-validate dates
  if (data.dateOfBirth && data.issueDate) {
    const dob = parseDate(data.dateOfBirth);
    const issued = parseDate(data.issueDate);
    
    if (dob && issued && issued < dob) {
      errors.push('Issue date cannot be before date of birth');
    }
  }
  
  if (data.issueDate && data.expiryDate) {
    const issued = parseDate(data.issueDate);
    const expires = parseDate(data.expiryDate);
    
    if (issued && expires && expires < issued) {
      errors.push('Expiry date cannot be before issue date');
    }
  }
};

/**
 * Validate name fields
 * @param {Object} data - Data object
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateNames = (data, errors, warnings) => {
  const nameFields = ['fullName', 'firstName', 'lastName'];
  
  nameFields.forEach(field => {
    const nameValue = data[field];
    if (!nameValue) return;
    
    // Check for suspicious patterns
    if (nameValue.length < 2) {
      warnings.push(`${field} seems too short: ${nameValue}`);
    }
    
    if (nameValue.length > 50) {
      warnings.push(`${field} seems unusually long: ${nameValue}`);
    }
    
    // Check for numbers in names (usually not valid)
    if (/\d/.test(nameValue)) {
      warnings.push(`${field} contains numbers, which is unusual: ${nameValue}`);
    }
    
    // Check for excessive special characters
    const specialCharCount = (nameValue.match(/[^a-zA-Z\s'-]/g) || []).length;
    if (specialCharCount > 2) {
      warnings.push(`${field} contains many special characters: ${nameValue}`);
    }
  });
};

/**
 * Validate ID number fields
 * @param {Object} data - Data object
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateIdNumbers = (data, errors, warnings) => {
  const idFields = ['idNumber', 'licenseNumber', 'passportNumber', 'studentId'];
  
  idFields.forEach(field => {
    const idValue = data[field];
    if (!idValue) return;
    
    // Check length
    if (idValue.length < 4) {
      warnings.push(`${field} seems too short: ${idValue}`);
    }
    
    if (idValue.length > 25) {
      warnings.push(`${field} seems too long: ${idValue}`);
    }
    
    // Check for suspicious patterns (all same digit)
    if (/^(.)\1+$/.test(idValue.replace(/[\s-]/g, ''))) {
      warnings.push(`${field} contains repeated characters: ${idValue}`);
    }
  });
};

/**
 * Validate address fields
 * @param {Object} data - Data object
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateAddresses = (data, errors, warnings) => {
  if (!data.address) return;
  
  const address = data.address;
  
  // Check minimum length
  if (address.length < 10) {
    warnings.push('Address seems too short');
  }
  
  // Check for common address components
  const hasNumber = /\d/.test(address);
  const hasStreetIndicator = /(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ln|lane|ct|court)/i.test(address);
  
  if (!hasNumber && !hasStreetIndicator) {
    warnings.push('Address may be incomplete (missing street number or type)');
  }
};

/**
 * Cross-field validation
 * @param {Object} data - Data object
 * @param {Array} errors - Errors array
 * @param {Array} warnings - Warnings array
 */
const validateCrossFields = (data, errors, warnings) => {
  // Check age consistency
  if (data.dateOfBirth) {
    const dob = parseDate(data.dateOfBirth);
    if (dob) {
      const age = calculateAge(dob);
      
      if (age < 0) {
        errors.push('Calculated age is negative');
      } else if (age > 150) {
        warnings.push('Calculated age seems unusually high');
      } else if (age < 16) {
        warnings.push('Person appears to be under 16 years old');
      }
    }
  }
  
  // Check name consistency
  if (data.fullName && data.firstName && data.lastName) {
    const fullNameLower = data.fullName.toLowerCase();
    const firstNameLower = data.firstName.toLowerCase();
    const lastNameLower = data.lastName.toLowerCase();
    
    if (!fullNameLower.includes(firstNameLower) || !fullNameLower.includes(lastNameLower)) {
      warnings.push('Full name does not match first and last name components');
    }
  }
};

/**
 * Parse date string into Date object
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} - Parsed date or null if invalid
 */
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try different date formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      let year, month, day;
      
      if (match[1].length === 4) {
        // YYYY format
        [, year, month, day] = match;
      } else {
        // MM/DD format
        [, month, day, year] = match;
      }
      
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Validate the date is real
      if (date.getFullYear() == year && 
          date.getMonth() == month - 1 && 
          date.getDate() == day) {
        return date;
      }
    }
  }
  
  return null;
};

/**
 * Calculate age from date of birth
 * @param {Date} dateOfBirth - Date of birth
 * @returns {number} - Age in years
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Sanitize extracted data
 * @param {Object} data - Raw extracted data
 * @returns {Object} - Sanitized data
 */
export const sanitizeData = (data) => {
  const sanitized = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Remove extra whitespace
      let cleanValue = value.trim().replace(/\s+/g, ' ');
      
      // Remove common OCR artifacts
      cleanValue = cleanValue
        .replace(/[|\\]/g, '') // Remove pipes and backslashes
        .replace(/[{}\[\]]/g, '') // Remove brackets
        .replace(/[`~]/g, '') // Remove backticks and tildes
        .trim();
      
      // Specific field sanitization
      switch (key) {
        case 'fullName':
        case 'firstName':
        case 'lastName':
          cleanValue = sanitizeName(cleanValue);
          break;
        case 'idNumber':
        case 'licenseNumber':
        case 'passportNumber':
          cleanValue = sanitizeIdNumber(cleanValue);
          break;
        case 'dateOfBirth':
        case 'issueDate':
        case 'expiryDate':
          cleanValue = sanitizeDate(cleanValue);
          break;
        case 'address':
          cleanValue = sanitizeAddress(cleanValue);
          break;
        case 'gender':
          cleanValue = sanitizeGender(cleanValue);
          break;
      }
      
      if (cleanValue && cleanValue.length > 0) {
        sanitized[key] = cleanValue;
      }
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

/**
 * Sanitize name fields
 * @param {string} name - Name to sanitize
 * @returns {string} - Sanitized name
 */
const sanitizeName = (name) => {
  return name
    .replace(/[^a-zA-Z\s'-]/g, '') // Keep only letters, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Sanitize ID number fields
 * @param {string} id - ID to sanitize
 * @returns {string} - Sanitized ID
 */
const sanitizeIdNumber = (id) => {
  return id
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Keep only alphanumeric, spaces, hyphens
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Sanitize date fields
 * @param {string} date - Date to sanitize
 * @returns {string} - Sanitized date
 */
const sanitizeDate = (date) => {
  return date
    .replace(/[^0-9\/\-]/g, '') // Keep only numbers and date separators
    .trim();
};

/**
 * Sanitize address fields
 * @param {string} address - Address to sanitize
 * @returns {string} - Sanitized address
 */
const sanitizeAddress = (address) => {
  return address
    .replace(/[^a-zA-Z0-9\s,.'#-]/g, '') // Keep common address characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

/**
 * Sanitize gender fields
 * @param {string} gender - Gender to sanitize
 * @returns {string} - Sanitized gender
 */
const sanitizeGender = (gender) => {
  const cleaned = gender.toUpperCase().trim();
  
  if (cleaned === 'M' || cleaned === 'MALE') {
    return 'Male';
  } else if (cleaned === 'F' || cleaned === 'FEMALE') {
    return 'Female';
  }
  
  return gender; // Return original if no match
};

/**
 * Check data completeness
 * @param {Object} data - Data to check
 * @param {Array} requiredFields - Array of required field keys
 * @returns {Object} - Completeness assessment
 */
export const checkDataCompleteness = (data, requiredFields = []) => {
  const totalFields = Object.keys(data).length;
  const filledFields = Object.values(data).filter(value => 
    value && value.toString().trim() !== ''
  ).length;
  
  const requiredFieldsPresent = requiredFields.filter(field => 
    data[field] && data[field].toString().trim() !== ''
  ).length;
  
  const completenessScore = totalFields > 0 ? filledFields / totalFields : 0;
  const requiredFieldsScore = requiredFields.length > 0 
    ? requiredFieldsPresent / requiredFields.length 
    : 1;
  
  return {
    totalFields,
    filledFields,
    completenessScore,
    requiredFieldsPresent,
    requiredFieldsScore,
    missingRequiredFields: requiredFields.filter(field => 
      !data[field] || data[field].toString().trim() === ''
    ),
  };
};

/**
 * Generate data quality report
 * @param {Object} data - Extracted data
 * @param {Object} validation - Validation results
 * @param {Object} completeness - Completeness assessment
 * @returns {Object} - Quality report
 */
export const generateQualityReport = (data, validation, completeness) => {
  const { errors, warnings } = validation;
  const { completenessScore, requiredFieldsScore } = completeness;
  
  // Calculate overall quality score
  let qualityScore = 1.0;
  
  // Penalize for errors (major impact)
  qualityScore -= errors.length * 0.2;
  
  // Penalize for warnings (minor impact)
  qualityScore -= warnings.length * 0.05;
  
  // Factor in completeness
  qualityScore *= (completenessScore * 0.3 + requiredFieldsScore * 0.7);
  
  // Ensure score is between 0 and 1
  qualityScore = Math.max(0, Math.min(1, qualityScore));
  
  let qualityLevel;
  if (qualityScore >= 0.8) {
    qualityLevel = 'Excellent';
  } else if (qualityScore >= 0.6) {
    qualityLevel = 'Good';
  } else if (qualityScore >= 0.4) {
    qualityLevel = 'Fair';
  } else {
    qualityLevel = 'Poor';
  }
  
  return {
    score: qualityScore,
    level: qualityLevel,
    errors,
    warnings,
    completeness,
    recommendations: generateRecommendations(errors, warnings, completeness),
  };
};

/**
 * Generate recommendations based on validation results
 * @param {Array} errors - Validation errors
 * @param {Array} warnings - Validation warnings
 * @param {Object} completeness - Completeness assessment
 * @returns {Array} - Array of recommendations
 */
const generateRecommendations = (errors, warnings, completeness) => {
  const recommendations = [];
  
  if (errors.length > 0) {
    recommendations.push('Review and correct the identified errors');
    recommendations.push('Consider retaking the photo for better OCR results');
  }
  
  if (warnings.length > 0) {
    recommendations.push('Verify the flagged fields for accuracy');
  }
  
  if (completeness.completenessScore < 0.7) {
    recommendations.push('Try to capture more fields by improving image quality');
    recommendations.push('Ensure the entire ID card is visible in the photo');
  }
  
  if (completeness.missingRequiredFields.length > 0) {
    recommendations.push(`Missing required fields: ${completeness.missingRequiredFields.join(', ')}`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Data quality looks good!');
  }
  
  return recommendations;
};

export {
  validateExtractedData,
  sanitizeData,
  checkDataCompleteness,
  generateQualityReport,
  generateRecommendations,
  validateSpecificFields,
  validateDates,
  validateNames,
  validateIdNumbers,
  validateAddresses,
  validateCrossFields,
  parseDate,
  calculateAge,
  sanitizeName,
  sanitizeIdNumber,
  sanitizeDate,
  sanitizeAddress,
  sanitizeGender,
};
