/**
 * ID Card format definitions for different countries and card types
 * Provides structure and validation rules for various ID card formats
 */

import { REGEX_PATTERNS } from './regexPatterns';

// Generic ID card format that works with most cards
export const GENERIC_ID_FORMAT = {
  name: 'Generic ID Card',
  fields: [
    {
      key: 'fullName',
      label: 'Full Name',
      required: true,
      pattern: REGEX_PATTERNS.fullName,
      position: { x: 0.1, y: 0.2, width: 0.8, height: 0.15 },
    },
    {
      key: 'idNumber',
      label: 'ID Number',
      required: true,
      pattern: REGEX_PATTERNS.idNumber,
      position: { x: 0.1, y: 0.4, width: 0.8, height: 0.1 },
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      required: true,
      pattern: REGEX_PATTERNS.dateOfBirth,
      position: { x: 0.1, y: 0.55, width: 0.4, height: 0.1 },
    },
    {
      key: 'gender',
      label: 'Gender',
      required: false,
      pattern: REGEX_PATTERNS.gender,
      position: { x: 0.55, y: 0.55, width: 0.35, height: 0.1 },
    },
    {
      key: 'address',
      label: 'Address',
      required: false,
      pattern: REGEX_PATTERNS.address,
      position: { x: 0.1, y: 0.7, width: 0.8, height: 0.2 },
    },
  ],
  dimensions: {
    width: 85.6, // mm - standard credit card size
    height: 53.98, // mm
    aspectRatio: 1.586,
  },
};

// US Driver's License format
export const US_DRIVERS_LICENSE_FORMAT = {
  name: 'US Driver\'s License',
  fields: [
    {
      key: 'fullName',
      label: 'Full Name',
      required: true,
      pattern: REGEX_PATTERNS.fullName,
      position: { x: 0.35, y: 0.15, width: 0.6, height: 0.12 },
    },
    {
      key: 'licenseNumber',
      label: 'License Number',
      required: true,
      pattern: REGEX_PATTERNS.idNumber,
      position: { x: 0.35, y: 0.3, width: 0.6, height: 0.08 },
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      required: true,
      pattern: REGEX_PATTERNS.dateOfBirth,
      position: { x: 0.35, y: 0.42, width: 0.3, height: 0.08 },
    },
    {
      key: 'gender',
      label: 'Sex',
      required: true,
      pattern: REGEX_PATTERNS.gender,
      position: { x: 0.7, y: 0.42, width: 0.25, height: 0.08 },
    },
    {
      key: 'address',
      label: 'Address',
      required: true,
      pattern: REGEX_PATTERNS.address,
      position: { x: 0.35, y: 0.54, width: 0.6, height: 0.15 },
    },
    {
      key: 'height',
      label: 'Height',
      required: false,
      pattern: REGEX_PATTERNS.height,
      position: { x: 0.35, y: 0.72, width: 0.25, height: 0.08 },
    },
    {
      key: 'weight',
      label: 'Weight',
      required: false,
      pattern: REGEX_PATTERNS.weight,
      position: { x: 0.65, y: 0.72, width: 0.25, height: 0.08 },
    },
    {
      key: 'expiryDate',
      label: 'Expires',
      required: true,
      pattern: REGEX_PATTERNS.expiryDate,
      position: { x: 0.35, y: 0.84, width: 0.3, height: 0.08 },
    },
  ],
  dimensions: {
    width: 85.6,
    height: 53.98,
    aspectRatio: 1.586,
  },
};

// National ID Card format (generic)
export const NATIONAL_ID_FORMAT = {
  name: 'National ID Card',
  fields: [
    {
      key: 'fullName',
      label: 'Full Name',
      required: true,
      pattern: REGEX_PATTERNS.fullName,
      position: { x: 0.35, y: 0.2, width: 0.6, height: 0.12 },
    },
    {
      key: 'idNumber',
      label: 'National ID',
      required: true,
      pattern: REGEX_PATTERNS.idNumber,
      position: { x: 0.35, y: 0.35, width: 0.6, height: 0.1 },
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      required: true,
      pattern: REGEX_PATTERNS.dateOfBirth,
      position: { x: 0.35, y: 0.48, width: 0.3, height: 0.08 },
    },
    {
      key: 'gender',
      label: 'Gender',
      required: true,
      pattern: REGEX_PATTERNS.gender,
      position: { x: 0.7, y: 0.48, width: 0.25, height: 0.08 },
    },
    {
      key: 'nationality',
      label: 'Nationality',
      required: false,
      pattern: REGEX_PATTERNS.nationality,
      position: { x: 0.35, y: 0.6, width: 0.6, height: 0.08 },
    },
    {
      key: 'issueDate',
      label: 'Issue Date',
      required: false,
      pattern: REGEX_PATTERNS.issueDate,
      position: { x: 0.35, y: 0.72, width: 0.3, height: 0.08 },
    },
    {
      key: 'expiryDate',
      label: 'Expiry Date',
      required: false,
      pattern: REGEX_PATTERNS.expiryDate,
      position: { x: 0.7, y: 0.72, width: 0.25, height: 0.08 },
    },
  ],
  dimensions: {
    width: 85.6,
    height: 53.98,
    aspectRatio: 1.586,
  },
};

// Passport format
export const PASSPORT_FORMAT = {
  name: 'Passport',
  fields: [
    {
      key: 'fullName',
      label: 'Name',
      required: true,
      pattern: REGEX_PATTERNS.fullName,
      position: { x: 0.1, y: 0.3, width: 0.8, height: 0.1 },
    },
    {
      key: 'passportNumber',
      label: 'Passport Number',
      required: true,
      pattern: REGEX_PATTERNS.idNumber,
      position: { x: 0.1, y: 0.45, width: 0.4, height: 0.08 },
    },
    {
      key: 'nationality',
      label: 'Nationality',
      required: true,
      pattern: REGEX_PATTERNS.nationality,
      position: { x: 0.55, y: 0.45, width: 0.35, height: 0.08 },
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      required: true,
      pattern: REGEX_PATTERNS.dateOfBirth,
      position: { x: 0.1, y: 0.58, width: 0.3, height: 0.08 },
    },
    {
      key: 'gender',
      label: 'Sex',
      required: true,
      pattern: REGEX_PATTERNS.gender,
      position: { x: 0.45, y: 0.58, width: 0.15, height: 0.08 },
    },
    {
      key: 'issueDate',
      label: 'Date of Issue',
      required: true,
      pattern: REGEX_PATTERNS.issueDate,
      position: { x: 0.1, y: 0.7, width: 0.3, height: 0.08 },
    },
    {
      key: 'expiryDate',
      label: 'Date of Expiry',
      required: true,
      pattern: REGEX_PATTERNS.expiryDate,
      position: { x: 0.45, y: 0.7, width: 0.3, height: 0.08 },
    },
  ],
  dimensions: {
    width: 125, // mm - passport page size
    height: 88, // mm
    aspectRatio: 1.42,
  },
};

// Student ID format
export const STUDENT_ID_FORMAT = {
  name: 'Student ID',
  fields: [
    {
      key: 'fullName',
      label: 'Student Name',
      required: true,
      pattern: REGEX_PATTERNS.fullName,
      position: { x: 0.35, y: 0.2, width: 0.6, height: 0.12 },
    },
    {
      key: 'studentId',
      label: 'Student ID',
      required: true,
      pattern: REGEX_PATTERNS.idNumber,
      position: { x: 0.35, y: 0.35, width: 0.6, height: 0.1 },
    },
    {
      key: 'dateOfBirth',
      label: 'Date of Birth',
      required: false,
      pattern: REGEX_PATTERNS.dateOfBirth,
      position: { x: 0.35, y: 0.48, width: 0.6, height: 0.08 },
    },
    {
      key: 'program',
      label: 'Program',
      required: false,
      pattern: { pattern: /^[A-Za-z\s]{3,50}$/, confidence: 0.7 },
      position: { x: 0.35, y: 0.6, width: 0.6, height: 0.08 },
    },
    {
      key: 'expiryDate',
      label: 'Valid Until',
      required: false,
      pattern: REGEX_PATTERNS.expiryDate,
      position: { x: 0.35, y: 0.72, width: 0.6, height: 0.08 },
    },
  ],
  dimensions: {
    width: 85.6,
    height: 53.98,
    aspectRatio: 1.586,
  },
};

// All supported formats
export const ID_CARD_FORMATS = {
  GENERIC: GENERIC_ID_FORMAT,
  US_DRIVERS_LICENSE: US_DRIVERS_LICENSE_FORMAT,
  NATIONAL_ID: NATIONAL_ID_FORMAT,
  PASSPORT: PASSPORT_FORMAT,
  STUDENT_ID: STUDENT_ID_FORMAT,
};

// Format detection based on detected text
export const FORMAT_DETECTION_KEYWORDS = {
  US_DRIVERS_LICENSE: [
    'DRIVER LICENSE', 'DRIVERS LICENSE', 'DL', 'CDL', 'COMMERCIAL DRIVER',
    'STATE OF', 'DEPARTMENT OF MOTOR VEHICLES', 'DMV'
  ],
  PASSPORT: [
    'PASSPORT', 'PASSEPORT', 'PASAPORTE', 'REISEPASS', 'PASSAPORTO',
    'UNITED STATES OF AMERICA', 'REPUBLIC OF', 'KINGDOM OF'
  ],
  STUDENT_ID: [
    'STUDENT', 'UNIVERSITY', 'COLLEGE', 'SCHOOL', 'ACADEMIC',
    'STUDENT ID', 'STUDENT CARD'
  ],
  NATIONAL_ID: [
    'NATIONAL ID', 'IDENTITY CARD', 'CITIZEN', 'NATIONAL IDENTITY',
    'ID CARD', 'IDENTIFICATION CARD'
  ],
};

/**
 * Detect ID card format based on extracted text
 * @param {string} extractedText - Raw text extracted from OCR
 * @returns {Object} - Detected format object
 */
export const detectCardFormat = (extractedText) => {
  const upperText = extractedText.toUpperCase();
  
  // Check for specific format keywords
  for (const [formatKey, keywords] of Object.entries(FORMAT_DETECTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (upperText.includes(keyword)) {
        return ID_CARD_FORMATS[formatKey];
      }
    }
  }
  
  // Default to generic format if no specific format detected
  return ID_CARD_FORMATS.GENERIC;
};

/**
 * Get field positions for overlay rendering
 * @param {Object} format - ID card format object
 * @param {Object} dimensions - Card dimensions on screen
 * @returns {Array} - Array of field positions
 */
export const getFieldPositions = (format, dimensions) => {
  return format.fields.map(field => ({
    ...field,
    screenPosition: {
      x: field.position.x * dimensions.width,
      y: field.position.y * dimensions.height,
      width: field.position.width * dimensions.width,
      height: field.position.height * dimensions.height,
    },
  }));
};

export default ID_CARD_FORMATS;
