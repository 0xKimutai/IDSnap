/**
 * Camera Screen - Enhanced Version with OCR
 * Full camera interface with image processing and OCR
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  Animated,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try different import methods for new architecture compatibility
let TextRecognition;
try {
  // Method 1: Named import
  const mlkit = require('@react-native-ml-kit/text-recognition');
  TextRecognition = mlkit.TextRecognition || mlkit.default || mlkit;
  console.log('ML Kit imported via require:', !!TextRecognition);
} catch (error) {
  console.log('Failed to import ML Kit via require:', error.message);
  try {
    // Method 2: ES6 import
    const { TextRecognition: MLKitTextRecognition } = require('@react-native-ml-kit/text-recognition');
    TextRecognition = MLKitTextRecognition;
    console.log('ML Kit imported via named import:', !!TextRecognition);
  } catch (error2) {
    console.log('Failed to import ML Kit via named import:', error2.message);
  }
}

const { width, height } = Dimensions.get('window');

const CameraScreen = ({ navigation }) => {
  const [imageUri, setImageUri] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanAnimation] = useState(() => new Animated.Value(0));
  const [cameraPermission, setCameraPermission] = useState(false);

  useEffect(() => {
    requestCameraPermission();
    startScanAnimation();
  }, []);

  const startScanAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'IDSnap Camera Permission',
            message: 'IDSnap needs access to your camera to scan ID cards',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        const storageGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'IDSnap Storage Permission',
            message: 'IDSnap needs access to your storage to select images',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        setCameraPermission(
          cameraGranted === PermissionsAndroid.RESULTS.GRANTED && 
          storageGranted === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (err) {
        console.warn(err);
        setCameraPermission(false);
      }
    } else {
      setCameraPermission(true);
    }
  };

  const generateRandomID = () => {
    return Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  };



  const parseOCRResult = (rawText) => {
    console.log('=== PARSING OCR TEXT ===');
    console.log('Raw OCR text:', rawText);
    
    // Enhanced parsing logic for common ID card formats
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
    console.log('Lines to parse:', lines);
    console.log('Total lines:', lines.length);
    
    let extractedData = {
      serialNumber: '',
      idNumber: '',
      name: '',
      dateOfBirth: '',
      sex: '',
      districtOfBirth: '',
      placeOfIssue: '',
      dateOfIssue: '',
      holdersSign: '',
      confidence: 0.85,
    };

    // Combine all text for pattern matching
    const allText = rawText.toUpperCase();
    const allTextLower = rawText.toLowerCase();

    // Parse line by line
    lines.forEach((line, index) => {
      const upperLine = line.toUpperCase();
      const cleanLine = line.replace(/[^\w\s\-\.\/]/g, ' ').trim();
      
      console.log(`Line ${index}: "${line}" -> "${upperLine}"`);

      // Skip header lines
      if (upperLine.includes('REPUBLIC') || 
          upperLine.includes('NATIONAL') || 
          upperLine.includes('IDENTITY') || 
          upperLine.includes('CARD') ||
          upperLine.length < 3) {
        console.log(`Skipping header line: ${line}`);
        return;
      }

      // SERIAL NUMBER DETECTION - Enhanced
      if (!extractedData.serialNumber) {
        // Look for patterns like "KE-12345678-9" or similar
        if (upperLine.includes('SERIAL') || /KE-\d{8}-\d/.test(line)) {
          const serialMatch = line.match(/KE-\d{8}-\d/);
          if (serialMatch) {
            extractedData.serialNumber = serialMatch[0];
            console.log(`Found Serial Number: ${extractedData.serialNumber}`);
          }
        }
        // Look for other serial number patterns
        else if (upperLine.includes('SERIAL NUMBER') || upperLine.includes('SERIAL NO')) {
          // Check next line for serial number
          if (index < lines.length - 1) {
            const nextLine = lines[index + 1].trim();
            const serialMatch = nextLine.match(/[A-Z]{2}-\d{8}-\d/) || nextLine.match(/\d{8,12}/);
            if (serialMatch) {
              extractedData.serialNumber = serialMatch[0];
              console.log(`Found Serial Number (next line): ${serialMatch[0]}`);
            }
          }
        }
        // Also try to extract from the demo data format
        else if (upperLine.includes('KE-') && /KE-\d{8}-\d/.test(line)) {
          const match = line.match(/KE-\d{8}-\d/);
          if (match) {
            extractedData.serialNumber = match[0];
            console.log(`Found Serial Number (KE format): ${extractedData.serialNumber}`);
          }
        }
      }

      // NAME DETECTION - Enhanced for real OCR text from Kenyan IDs
      if (!extractedData.name) {
        // Skip header lines and system text, look for actual person names
        if (index >= 1 && index <= 10 && 
            !upperLine.includes('REPUBLIC') && 
            !upperLine.includes('NATIONAL') && 
            !upperLine.includes('IDENTITY') &&
            !upperLine.includes('CARD') &&
            !upperLine.includes('ID NO') &&
            !upperLine.includes('DATE') &&
            !upperLine.includes('SEX') &&
            !upperLine.includes('DISTRICT') &&
            !upperLine.includes('PLACE') &&
            !upperLine.includes('HOLDER') &&
            !upperLine.includes('SIGNATURE') &&
            !upperLine.includes('SERIAL') &&
            !upperLine.includes('NUMBER') &&
            !upperLine.includes('BIRTH') &&
            !upperLine.includes('ISSUE') &&
            !upperLine.includes('FULL NAMES') &&
            !upperLine.includes('NAMES') &&
            !upperLine.includes('NAME') &&
            // Must be mostly letters (names), allow some common OCR artifacts
            /^[A-Za-z\s\.\-']{5,}$/.test(line.replace(/[0-9]/g, '').trim()) &&
            line.trim().length > 5 &&
            // Additional check: should contain at least 2 words (first and last name)
            line.trim().split(/\s+/).length >= 2) {
          
          // Clean up OCR artifacts from name
          const cleanedName = line.trim()
            .replace(/[0-9]/g, '') // Remove numbers
            .replace(/[^\w\s\-'\.]/g, ' ') // Remove special chars except common name chars
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim()
            .toUpperCase();
            
          if (cleanedName.length > 5 && cleanedName.split(/\s+/).length >= 2) {
            extractedData.name = cleanedName;
            console.log(`Found Name: ${extractedData.name}`);
          }
        }
        
        // Alternative: Look for name after "FULL NAMES" or "NAME" label
        if (!extractedData.name && (upperLine.includes('FULL NAMES') || upperLine.includes('NAME'))) {
          // Check next line for the actual name
          if (index < lines.length - 1) {
            const nextLine = lines[index + 1].trim();
            if (nextLine.length > 5 && 
                /^[A-Za-z\s\.\-']{5,}$/.test(nextLine) &&
                nextLine.split(/\s+/).length >= 2 &&
                !nextLine.includes('ID') &&
                !nextLine.includes('DATE') &&
                !nextLine.includes('SEX')) {
              
              const cleanedName = nextLine.trim()
                .replace(/[0-9]/g, '')
                .replace(/[^\w\s\-'\.]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();
                
              if (cleanedName.length > 5) {
                extractedData.name = cleanedName;
                console.log(`Found Name (after label): ${cleanedName}`);
              }
            }
          }
        }
      }

      // ID NUMBER DETECTION - Enhanced for real OCR with variations
      if (!extractedData.idNumber) {
        // Look for "ID NO:" or similar patterns
        if (upperLine.includes('ID NO') || upperLine.includes('ID:') || upperLine.includes('IDNO')) {
          const idMatch = line.split(/[:]/)[1]?.trim().replace(/[^\d]/g, '');
          if (idMatch && idMatch.length >= 7) {
            extractedData.idNumber = idMatch;
            console.log(`Found ID Number: ${idMatch}`);
          }
        }
        
        // Fallback: Look for 8-digit numbers (common Kenyan ID format)
        if (!extractedData.idNumber) {
          const digitMatch = line.match(/\b\d{8}\b/);
          if (digitMatch && !upperLine.includes('DATE') && !upperLine.includes('BIRTH')) {
            extractedData.idNumber = digitMatch[0];
            console.log(`Found ID Number (8-digit pattern): ${extractedData.idNumber}`);
          }
        }
      }

      // DATE DETECTION - Enhanced patterns for better OCR recognition
      const datePatterns = [
        /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,  // DD/MM/YYYY
        /\b\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,  // YYYY/MM/DD
        /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}\b/g,      // DD Month YYYY
        /\b\d{1,2}\s*\/\s*\d{1,2}\s*\/\s*\d{2,4}\b/g,  // DD / MM / YYYY (with spaces)
        /\b\d{1,2}\s*\-\s*\d{1,2}\s*\-\s*\d{2,4}\b/g,  // DD - MM - YYYY (with spaces)
      ];

      // Enhanced DATE OF BIRTH detection
      if (!extractedData.dateOfBirth) {
        // Method 1: Look for "DATE OF BIRTH" label
        if (upperLine.includes('DATE OF BIRTH') || upperLine.includes('DOB')) {
          const dobMatch = line.split(/[:]/)[1]?.trim();
          if (dobMatch && /\d/.test(dobMatch)) {
            extractedData.dateOfBirth = dobMatch;
            console.log(`Found Date of Birth: ${dobMatch}`);
          }
          // Check next line for date
          else if (index < lines.length - 1) {
            const nextLine = lines[index + 1].trim();
            const dateMatch = nextLine.match(/(\d{1,2}[\/\-\.\s]*\d{1,2}[\/\-\.\s]*\d{2,4})/);
            if (dateMatch) {
              extractedData.dateOfBirth = dateMatch[1].replace(/\s+/g, '/');
              console.log(`Found Date of Birth (next line): ${extractedData.dateOfBirth}`);
            }
          }
        }
        
        // Method 2: Look for any date pattern in lines containing "BIRTH"
        if (!extractedData.dateOfBirth && upperLine.includes('BIRTH')) {
          datePatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches && matches[0]) {
              extractedData.dateOfBirth = matches[0];
              console.log(`Found Date of Birth (pattern in birth line): ${matches[0]}`);
            }
          });
        }
      }
      
      // Enhanced DATE OF ISSUE detection
      if (!extractedData.dateOfIssue) {
        // Method 1: Look for "DATE OF ISSUE" label
        if (upperLine.includes('DATE OF ISSUE') || upperLine.includes('ISSUE')) {
          const issueMatch = line.split(/[:]/)[1]?.trim();
          if (issueMatch && /\d/.test(issueMatch)) {
            extractedData.dateOfIssue = issueMatch;
            console.log(`Found Date of Issue: ${issueMatch}`);
          }
          // Check next line for date
          else if (index < lines.length - 1) {
            const nextLine = lines[index + 1].trim();
            const dateMatch = nextLine.match(/(\d{1,2}[\/\-\.\s]*\d{1,2}[\/\-\.\s]*\d{2,4})/);
            if (dateMatch) {
              extractedData.dateOfIssue = dateMatch[1].replace(/\s+/g, '/');
              console.log(`Found Date of Issue (next line): ${extractedData.dateOfIssue}`);
            }
          }
        }
        
        // Method 2: Look for any date pattern in lines containing "ISSUE"
        if (!extractedData.dateOfIssue && upperLine.includes('ISSUE')) {
          datePatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches && matches[0]) {
              extractedData.dateOfIssue = matches[0];
              console.log(`Found Date of Issue (pattern in issue line): ${matches[0]}`);
            }
          });
        }
      }
      
      // Fallback date patterns - Enhanced with aggressive scanning
      datePatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(date => {
            // Context-based date assignment
            if ((upperLine.includes('DOB') || upperLine.includes('BIRTH') || upperLine.includes('BORN')) && !extractedData.dateOfBirth) {
              extractedData.dateOfBirth = date;
              console.log(`Found Date of Birth (pattern): ${date}`);
            } else if ((upperLine.includes('ISSUE') || upperLine.includes('VALID FROM')) && !extractedData.dateOfIssue) {
              extractedData.dateOfIssue = date;
              console.log(`Found Date of Issue (pattern): ${date}`);
            }
            // If no context, assign to missing field based on position and date logic
            else if (!extractedData.dateOfBirth && index < lines.length / 2) {
              // Earlier in document, likely birth date
              extractedData.dateOfBirth = date;
              console.log(`Found Date of Birth (position-based): ${date}`);
            } else if (!extractedData.dateOfIssue && index >= lines.length / 2) {
              // Later in document, likely issue date
              extractedData.dateOfIssue = date;
              console.log(`Found Date of Issue (position-based): ${date}`);
            }
            // Last resort: assign any date to missing field
            else if (!extractedData.dateOfBirth) {
              extractedData.dateOfBirth = date;
              console.log(`Found Date of Birth (last resort): ${date}`);
            } else if (!extractedData.dateOfIssue) {
              extractedData.dateOfIssue = date;
              console.log(`Found Date of Issue (last resort): ${date}`);
            }
          });
        }
      });

      // Additional aggressive date scanning - scan entire line for any date-like patterns
      if ((!extractedData.dateOfBirth || !extractedData.dateOfIssue) && /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(line)) {
        const allDates = line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g);
        if (allDates) {
          allDates.forEach(date => {
            if (!extractedData.dateOfBirth) {
              extractedData.dateOfBirth = date;
              console.log(`Found Date of Birth (aggressive scan): ${date}`);
            } else if (!extractedData.dateOfIssue) {
              extractedData.dateOfIssue = date;
              console.log(`Found Date of Issue (aggressive scan): ${date}`);
            }
          });
        }
      }

      // ADDRESS DETECTION
      if (!extractedData.address) {
        if ((upperLine.includes('ADDRESS') || upperLine.includes('RESIDENCE') || upperLine.includes('ADDR')) && 
            index + 1 < lines.length) {
          // Get the next line(s) as address
          const addressLines = [];
          for (let i = index + 1; i < Math.min(index + 4, lines.length); i++) {
            const nextLine = lines[i].trim();
            if (nextLine.length > 3 && !nextLine.match(/\d{4}/)) { // Avoid years
              addressLines.push(nextLine);
            } else {
              break;
            }
          }
          if (addressLines.length > 0) {
            extractedData.address = addressLines.join(', ');
          }
        }
        // Or look for address-like patterns
        else if (line.length > 10 && 
                 (line.includes(',') || line.includes('Street') || line.includes('Road') || line.includes('Ave')) &&
                 !line.match(/\d{4}/) && // Avoid years
                 !/NAME|DOB|ID|ISSUE|EXPIR/i.test(line)) {
          extractedData.address = line;
        }
      }

      // SEX DETECTION (Kenyan ID uses "SEX" not "GENDER")
      if (!extractedData.sex) {
        if (upperLine.includes('SEX') && line.includes(':')) {
          const sexMatch = line.split(':')[1]?.trim();
          if (sexMatch && /^[MF]$/i.test(sexMatch)) {
            extractedData.sex = sexMatch.toUpperCase();
            console.log(`Found Sex: ${extractedData.sex}`);
          }
        } else if (/\b(MALE|FEMALE|M|F)\b/i.test(line)) {
          const sexMatch = line.match(/\b(MALE|FEMALE|M|F)\b/i);
          if (sexMatch) {
            extractedData.sex = sexMatch[1].charAt(0).toUpperCase(); // Convert to M or F
            console.log(`Found Sex (pattern): ${extractedData.sex}`);
          }
        }
      }

      // DISTRICT OF BIRTH DETECTION - Enhanced
      if (!extractedData.districtOfBirth && (upperLine.includes('DISTRICT OF BIRTH') || upperLine.includes('DISTRICT'))) {
        const districtMatch = line.split(':')[1]?.trim();
        if (districtMatch && districtMatch.length > 2) {
          extractedData.districtOfBirth = districtMatch.toUpperCase();
          console.log(`Found District of Birth: ${districtMatch}`);
        }
        // Check next line if district name is on separate line
        else if (index < lines.length - 1) {
          const nextLine = lines[index + 1].trim();
          if (nextLine.length > 2 && /^[A-Za-z\s]+$/.test(nextLine) && !nextLine.includes('PLACE') && !nextLine.includes('DATE')) {
            extractedData.districtOfBirth = nextLine.toUpperCase();
            console.log(`Found District of Birth (next line): ${nextLine}`);
          }
        }
      }

      // PLACE OF ISSUE DETECTION - Enhanced
      if (!extractedData.placeOfIssue && (upperLine.includes('PLACE OF ISSUE') || upperLine.includes('PLACE'))) {
        const placeMatch = line.split(':')[1]?.trim();
        if (placeMatch && placeMatch.length > 2) {
          extractedData.placeOfIssue = placeMatch.toUpperCase();
          console.log(`Found Place of Issue: ${placeMatch}`);
        }
        // Check next line if place name is on separate line
        else if (index < lines.length - 1) {
          const nextLine = lines[index + 1].trim();
          if (nextLine.length > 2 && /^[A-Za-z\s]+$/.test(nextLine) && !nextLine.includes('DATE') && !nextLine.includes('HOLDER')) {
            extractedData.placeOfIssue = nextLine.toUpperCase();
            console.log(`Found Place of Issue (next line): ${nextLine}`);
          }
        }
      }

      // HOLDER'S SIGNATURE DETECTION
      if (!extractedData.holdersSign && upperLine.includes('HOLDER')) {
        const signMatch = line.split(':')[1]?.trim();
        if (signMatch) {
          extractedData.holdersSign = signMatch;
          console.log(`Found Holder's Sign: ${signMatch}`);
        } else {
          extractedData.holdersSign = 'Present';
          console.log(`Found Holder's Sign: Present (default)`);
        }
      }

      // NATIONALITY DETECTION
      if (!extractedData.nationality && 
          (upperLine.includes('NATIONALITY') || upperLine.includes('CITIZEN'))) {
        const nationalityMatch = line.split(/[:]/)[1]?.trim();
        if (nationalityMatch) {
          extractedData.nationality = nationalityMatch;
        }
      }
    });

    // Calculate confidence based on extracted fields
    const fieldsFound = Object.values(extractedData).filter(v => v && v !== '').length - 1; // Exclude confidence field
    extractedData.confidence = Math.min(0.95, fieldsFound / 8); // Max 95% confidence

    console.log('=== PARSING COMPLETE ===');
    console.log('Fields found:', fieldsFound, 'out of 8');
    console.log('Final extracted data:', extractedData);
    console.log('========================');
    return extractedData;
  };

  const saveScanToHistory = async (imageUri, extractedData, rawText) => {
    try {
      const scanRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        imageUri,
        extractedData,
        rawText,
      };

      // Save individual scan
      const existingScans = await AsyncStorage.getItem('scanHistory');
      const scans = existingScans ? JSON.parse(existingScans) : [];
      scans.unshift(scanRecord);
      
      // Keep only last 50 scans
      if (scans.length > 50) {
        scans.splice(50);
      }
      
      await AsyncStorage.setItem('scanHistory', JSON.stringify(scans));

      // Update stats
      const stats = await AsyncStorage.getItem('appStats');
      const currentStats = stats ? JSON.parse(stats) : { totalScans: 0, successfulScans: 0 };
      
      currentStats.totalScans++;
      if (extractedData.name || extractedData.idNumber) {
        currentStats.successfulScans++;
      }
      
      await AsyncStorage.setItem('appStats', JSON.stringify(currentStats));
    } catch (error) {
      console.error('Error saving scan:', error);
    }
  };

  const processImageWithOCR = async (uri) => {
    if (!uri) {
      console.error('No image URI provided for OCR processing');
      return;
    }

    setProcessing(true);
    setOcrProgress(0);
    let progressInterval;

    try {
      // Simulate progress
      progressInterval = setInterval(() => {
        setOcrProgress(prev => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return 80;
          }
          return prev + 10;
        });
      }, 300);

      console.log('Starting ML Kit OCR processing for URI:', uri);
      
      // ONLY ML Kit - NO FALLBACKS, NO MOCK DATA
      console.log('Using ML Kit Text Recognition...');
      console.log('TextRecognition object:', TextRecognition);
      console.log('TextRecognition.recognize function:', typeof TextRecognition.recognize);
      
      // Check if ML Kit is available
      if (!TextRecognition || typeof TextRecognition.recognize !== 'function') {
        clearInterval(progressInterval);
        throw new Error(`ML Kit Text Recognition is not available. TextRecognition: ${!!TextRecognition}, recognize function: ${typeof TextRecognition?.recognize}. Please check the installation and linking.`);
      }
      
      // Process with ML Kit
      console.log('Calling TextRecognition.recognize with URI:', uri);
      const result = await TextRecognition.recognize(uri);
      
      clearInterval(progressInterval);
      setOcrProgress(100);
      
      console.log('ML Kit Raw Result:', result);
      
      // Validate result
      if (!result || (typeof result === 'string' && result.trim().length === 0)) {
        throw new Error('ML Kit could not extract any text from this image. Please try a clearer image.');
      }
      
      // ML Kit returns text directly
      let extractedText = result;
      if (typeof result === 'object' && result.text) {
        extractedText = result.text;
      }
      
      console.log('Final extracted text:', extractedText);
      
      // Parse the OCR result
      const extractedData = parseOCRResult(extractedText);
      console.log('Parsed Data:', extractedData);
      
      clearInterval(progressInterval);
      setOcrProgress(100);

      // Save scan to history
      await saveScanToHistory(uri, extractedData, result);

      // Navigate to results
      navigation.navigate('Result', {
        scanData: {
          data: extractedData,
          confidence: {
            serialNumber: extractedData.confidence || 0.85,
            idNumber: extractedData.confidence || 0.85,
            name: extractedData.confidence || 0.85,
            dateOfBirth: extractedData.confidence || 0.85,
            sex: extractedData.confidence || 0.85,
            districtOfBirth: extractedData.confidence || 0.85,
            placeOfIssue: extractedData.confidence || 0.85,
            dateOfIssue: extractedData.confidence || 0.85,
            holdersSign: extractedData.confidence || 0.85,
          },
          timestamp: Date.now()
        },
        imageUri: uri,
      });
      
    } catch (error) {
      console.error('OCR Processing Error:', error);
      
      // Clear any existing interval
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Show error to user
      Alert.alert(
        'Processing Failed',
        `Unable to extract information from image: ${error.message}`,
        [
          { 
            text: 'Try Again', 
            onPress: () => setImageUri(null) 
          },
          { 
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setImageUri(null);
              setProcessing(false);
              setOcrProgress(0);
            }
          }
        ]
      );
    } finally {
      setProcessing(false);
      setOcrProgress(0);
    }
  };

  const openCamera = async () => {
    try {
      console.log('Opening camera...');
      
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2000,
        maxHeight: 2000,
        includeBase64: false,
      };

      const result = await new Promise((resolve, reject) => {
        launchCamera(options, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Camera result:', result);
      handleImageResponse(result);
      
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(
        'Camera Error', 
        `Unable to open camera: ${error.message}`,
        [
          { text: 'Try Again', onPress: () => openCamera() },
          { text: 'Cancel' }
        ]
      );
    }
  };

  const openGallery = async () => {
    try {
      console.log('Opening gallery...');
      
      const options = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 2000,
        maxHeight: 2000,
        includeBase64: false,
        selectionLimit: 1,
      };

      const result = await new Promise((resolve, reject) => {
        launchImageLibrary(options, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });

      console.log('Gallery result:', result);
      handleImageResponse(result);
      
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(
        'Gallery Error', 
        `Unable to open gallery: ${error.message}`,
        [
          { text: 'Try Again', onPress: () => openGallery() },
          { text: 'Cancel' }
        ]
      );
    }
  };

  const handleImageResponse = (response) => {
    console.log('Image Response:', response);
    
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }
    
    if (response.error) {
      console.log('ImagePicker Error: ', response.error);
      Alert.alert('Error', `Failed to access camera/gallery: ${response.error}`);
      return;
    }
    
    if (response.errorMessage) {
      console.log('ImagePicker Error Message: ', response.errorMessage);
      Alert.alert('Error', `Failed to access camera/gallery: ${response.errorMessage}`);
      return;
    }

    if (response.assets && response.assets[0] && response.assets[0].uri) {
      const imageUri = response.assets[0].uri;
      console.log('Selected image URI:', imageUri);
      setImageUri(imageUri);
      processImageWithOCR(imageUri);
    } else {
      console.log('No valid image selected');
      Alert.alert('Error', 'No valid image was selected');
    }
  };

  const retakeImage = () => {
    setImageUri(null);
    setProcessing(false);
    setOcrProgress(0);
  };

  const scanLineTranslateY = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan ID Card</Text>
        <TouchableOpacity 
          style={styles.flashButton}
          onPress={() => setFlashEnabled(!flashEnabled)}
        >
          <Text style={styles.flashText}>⚡</Text>
        </TouchableOpacity>
      </View>

      {/* Camera/Preview Area */}
      <View style={styles.cameraContainer}>
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            
            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.processingText}>Processing Image...</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[styles.progressFill, { width: `${ocrProgress}%` }]} 
                    />
                  </View>
                  <Text style={styles.progressText}>{ocrProgress}%</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.cameraPreview}>
            <Text style={styles.instructionText}>
              Your Preview will Appear Here
            </Text>
            
            {/* Camera Icon */}
            <View style={styles.cameraIconContainer}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {!imageUri ? (
          <>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={openCamera}
              disabled={processing}
            >
              <Text style={styles.captureButtonText}>📸 Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={openGallery}
            >
              <Text style={styles.galleryButtonText}>📁 Choose from Gallery</Text>
            </TouchableOpacity>
          </>
        ) : !processing ? (
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={retakeImage}
          >
            <Text style={styles.retakeButtonText}>📷 Retake Photo</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>For best results:</Text>
        <Text style={styles.tipText}>• Ensure good, even lighting</Text>
        <Text style={styles.tipText}>• Keep ID card flat and straight</Text>
        <Text style={styles.tipText}>• Avoid shadows and reflections</Text>
        <Text style={styles.tipText}>• Fill the frame with the ID card</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    marginRight: 60,
  },
  flashButton: {
    padding: 8,
  },
  flashText: {
    fontSize: 20,
    color: '#ffffff',
  },
  
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cameraPreview: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scanFrame: {
    width: width - 80,
    height: 240,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00ff00',
    borderWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#00ff00',
    opacity: 0.8,
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  cameraIconContainer: {
    marginTop: 30,
  },
  cameraIcon: {
    fontSize: 48,
    opacity: 0.5,
  },

  imagePreviewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'contain',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  processingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 20,
    alignItems: 'center',
    width: '80%',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 3,
  },
  progressText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },

  controlsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  galleryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  retakeButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retakeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },

  tipsContainer: {
    padding: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
  },
  tipsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default CameraScreen;