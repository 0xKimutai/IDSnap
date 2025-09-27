/**
 * Regex patterns for extracting data from ID cards
 * These patterns are designed to work with various ID card formats
 */

export const REGEX_PATTERNS = {
  // Name patterns - matches various name formats
  fullName: {
    // Matches: "JOHN SMITH", "JANE DOE BROWN", "O'CONNOR", "VAN DER BERG"
    pattern: /^[A-Z][a-zA-Z'\-\s]{1,50}$/,
    extractPattern: /(?:NAME|FULL NAME|SURNAME|FIRST NAME)[:\s]*([A-Z][a-zA-Z'\-\s]{1,50})/i,
    confidence: 0.8,
  },
  
  firstName: {
    pattern: /^[A-Z][a-zA-Z'\-]{1,25}$/,
    extractPattern: /(?:FIRST NAME|GIVEN NAME|FORENAME)[:\s]*([A-Z][a-zA-Z'\-]{1,25})/i,
    confidence: 0.8,
  },
  
  lastName: {
    pattern: /^[A-Z][a-zA-Z'\-\s]{1,25}$/,
    extractPattern: /(?:LAST NAME|SURNAME|FAMILY NAME)[:\s]*([A-Z][a-zA-Z'\-\s]{1,25})/i,
    confidence: 0.8,
  },
  
  // ID Number patterns - various formats
  idNumber: {
    // Generic ID number pattern - alphanumeric with possible dashes/spaces
    pattern: /^[A-Z0-9\-\s]{6,20}$/,
    extractPattern: /(?:ID|ID NUMBER|IDENTIFICATION|CARD NUMBER|DOC NUMBER)[:\s]*([A-Z0-9\-\s]{6,20})/i,
    confidence: 0.9,
  },
  
  // US Social Security Number
  ssn: {
    pattern: /^\d{3}-?\d{2}-?\d{4}$/,
    extractPattern: /(?:SSN|SOCIAL SECURITY)[:\s]*(\d{3}-?\d{2}-?\d{4})/i,
    confidence: 0.95,
  },
  
  // Date patterns
  dateOfBirth: {
    // Matches: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD
    pattern: /^(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})$/,
    extractPattern: /(?:DOB|DATE OF BIRTH|BIRTH DATE|BORN)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    confidence: 0.9,
  },
  
  issueDate: {
    pattern: /^(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})$/,
    extractPattern: /(?:ISSUE DATE|ISSUED|DATE ISSUED)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    confidence: 0.8,
  },
  
  expiryDate: {
    pattern: /^(?:\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})$/,
    extractPattern: /(?:EXPIRY|EXPIRES|EXP DATE|VALID UNTIL)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{4}|\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
    confidence: 0.8,
  },
  
  // Gender patterns
  gender: {
    pattern: /^(M|F|MALE|FEMALE)$/i,
    extractPattern: /(?:SEX|GENDER)[:\s]*(M|F|MALE|FEMALE)/i,
    confidence: 0.9,
  },
  
  // Address patterns
  address: {
    pattern: /^[A-Za-z0-9\s,.'\-#]{10,100}$/,
    extractPattern: /(?:ADDRESS|ADDR|RESIDENCE)[:\s]*([A-Za-z0-9\s,.'\-#]{10,100})/i,
    confidence: 0.7,
  },
  
  // Postal/ZIP code patterns
  postalCode: {
    // Matches various postal code formats: 12345, 12345-6789, A1B 2C3, etc.
    pattern: /^[A-Z0-9\s\-]{3,10}$/i,
    extractPattern: /(?:ZIP|POSTAL CODE|POST CODE)[:\s]*([A-Z0-9\s\-]{3,10})/i,
    confidence: 0.8,
  },
  
  // Phone number patterns
  phoneNumber: {
    pattern: /^[\+]?[0-9\s\-\(\)]{10,15}$/,
    extractPattern: /(?:PHONE|TEL|MOBILE)[:\s]*([\+]?[0-9\s\-\(\)]{10,15})/i,
    confidence: 0.7,
  },
  
  // Email patterns
  email: {
    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    extractPattern: /(?:EMAIL|E-MAIL)[:\s]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
    confidence: 0.9,
  },
  
  // Nationality patterns
  nationality: {
    pattern: /^[A-Z\s]{3,30}$/,
    extractPattern: /(?:NATIONALITY|CITIZEN)[:\s]*([A-Z\s]{3,30})/i,
    confidence: 0.8,
  },
  
  // Height patterns
  height: {
    pattern: /^\d{1,3}(?:\.\d{1,2})?\s?(?:CM|M|FT|IN|'|")$/i,
    extractPattern: /(?:HEIGHT|HT)[:\s]*(\d{1,3}(?:\.\d{1,2})?\s?(?:CM|M|FT|IN|'|"))/i,
    confidence: 0.7,
  },
  
  // Weight patterns
  weight: {
    pattern: /^\d{1,3}(?:\.\d{1,2})?\s?(?:KG|LB|LBS)$/i,
    extractPattern: /(?:WEIGHT|WT)[:\s]*(\d{1,3}(?:\.\d{1,2})?\s?(?:KG|LB|LBS))/i,
    confidence: 0.7,
  },
  
  // Eye color patterns
  eyeColor: {
    pattern: /^(BROWN|BLUE|GREEN|HAZEL|GRAY|BLACK|AMBER)$/i,
    extractPattern: /(?:EYES|EYE COLOR)[:\s]*(BROWN|BLUE|GREEN|HAZEL|GRAY|BLACK|AMBER)/i,
    confidence: 0.8,
  },
  
  // Hair color patterns
  hairColor: {
    pattern: /^(BLACK|BROWN|BLONDE|RED|GRAY|WHITE|BALD)$/i,
    extractPattern: /(?:HAIR|HAIR COLOR)[:\s]*(BLACK|BROWN|BLONDE|RED|GRAY|WHITE|BALD)/i,
    confidence: 0.8,
  },
};

// Common field labels that might appear on ID cards
export const FIELD_LABELS = {
  name: ['NAME', 'FULL NAME', 'SURNAME', 'FIRST NAME', 'LAST NAME', 'GIVEN NAME', 'FORENAME', 'FAMILY NAME'],
  id: ['ID', 'ID NUMBER', 'IDENTIFICATION', 'CARD NUMBER', 'DOC NUMBER', 'DOCUMENT NUMBER'],
  dob: ['DOB', 'DATE OF BIRTH', 'BIRTH DATE', 'BORN', 'BIRTHDAY'],
  gender: ['SEX', 'GENDER', 'M/F'],
  address: ['ADDRESS', 'ADDR', 'RESIDENCE', 'HOME ADDRESS'],
  issue: ['ISSUE DATE', 'ISSUED', 'DATE ISSUED'],
  expiry: ['EXPIRY', 'EXPIRES', 'EXP DATE', 'VALID UNTIL', 'EXPIRATION'],
  nationality: ['NATIONALITY', 'CITIZEN', 'CITIZENSHIP'],
  phone: ['PHONE', 'TEL', 'MOBILE', 'TELEPHONE'],
  email: ['EMAIL', 'E-MAIL'],
  height: ['HEIGHT', 'HT'],
  weight: ['WEIGHT', 'WT'],
  eyes: ['EYES', 'EYE COLOR'],
  hair: ['HAIR', 'HAIR COLOR'],
};

// Confidence thresholds for OCR results
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.7,
  LOW: 0.5,
};

export default REGEX_PATTERNS;
