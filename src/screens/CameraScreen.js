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
import { TextRecognition } from '@react-native-ml-kit/text-recognition';

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
    console.log('Parsing OCR text:', rawText);
    
    // Enhanced parsing logic for common ID card formats
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line);
    console.log('Lines to parse:', lines);
    
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
          upperLine.includes('DOCUMENT') ||
          upperLine.length < 3) {
        console.log(`Skipping header line: ${line}`);
        return;
      }

      // SERIAL NUMBER DETECTION - Kenyan IDs have format like KE-12345678-9
      if (!extractedData.serialNumber) {
        const serialPattern = /KE[-\s]*\d{8,10}[-\s]*\d{1,2}/gi;
        const serialMatch = line.match(serialPattern);
        if (serialMatch) {
          extractedData.serialNumber = serialMatch[0].replace(/\s+/g, '-');
          console.log(`Found Serial Number: ${extractedData.serialNumber}`);
        }
        // Also try to extract from the demo data format
        else if (upperLine.includes('KE-') && /KE-\d{8}-\d/.test(line)) {
          const match = line.match(/KE-\d{8}-\d/);
          if (match) {
            extractedData.serialNumber = match[0];
            console.log(`Found Serial Number (demo): ${extractedData.serialNumber}`);
          }
        }
      }

      // NAME DETECTION - For Kenyan ID format
      if (!extractedData.name) {
        // Skip header lines and look for name (usually appears after headers)
        if (index >= 1 && index <= 4 && 
            !upperLine.includes('REPUBLIC') && 
            !upperLine.includes('NATIONAL') && 
            !upperLine.includes('IDENTITY') &&
            !upperLine.includes('ID NO') &&
            !upperLine.includes('DATE') &&
            !upperLine.includes('SEX') &&
            !upperLine.includes('DISTRICT') &&
            !upperLine.includes('PLACE') &&
            !upperLine.includes('HOLDER') &&
            /^[A-Za-z\s]+$/.test(line) &&
            line.length > 5) {
          extractedData.name = line.trim();
          console.log(`Found Name: ${extractedData.name}`);
        }
      }

      // ID NUMBER DETECTION - Enhanced for Kenyan format
      if (!extractedData.idNumber && upperLine.includes('ID NO')) {
        const idMatch = line.split(':')[1]?.trim();
        if (idMatch) {
          extractedData.idNumber = idMatch;
          console.log(`Found ID Number: ${idMatch}`);
        }
      }
      
      // Fallback ID patterns
      if (!extractedData.idNumber) {
        const idPatterns = [
          /\b\d{8,15}\b/g,              // 8-15 digit numbers
          /[A-Z]\d{7,12}/g,             // Letter followed by 7-12 digits
          /\d{2,4}[-\s]\d{3,6}[-\s]\d{3,6}/g, // Segmented numbers
        ];
        
        idPatterns.forEach(pattern => {
          const matches = line.match(pattern);
          if (matches && !extractedData.idNumber) {
            // Get the longest match (likely the ID number)
            const longestMatch = matches.sort((a, b) => b.length - a.length)[0];
            if (longestMatch.length >= 8) {
              extractedData.idNumber = longestMatch.replace(/[^\w]/g, '');
              console.log(`Found ID Number (pattern): ${extractedData.idNumber}`);
            }
          }
        });
      }

      // DATE DETECTION - Enhanced patterns
      const datePatterns = [
        /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,  // DD/MM/YYYY
        /\b\d{2,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,  // YYYY/MM/DD
        /\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}\b/g,      // DD Month YYYY
      ];

      // Specific date field detection for Kenyan ID
      if (!extractedData.dateOfBirth && upperLine.includes('DATE OF BIRTH')) {
        const dobMatch = line.split(':')[1]?.trim();
        if (dobMatch) {
          extractedData.dateOfBirth = dobMatch;
          console.log(`Found Date of Birth: ${dobMatch}`);
        }
      }
      
      if (!extractedData.dateOfIssue && upperLine.includes('DATE OF ISSUE')) {
        const issueMatch = line.split(':')[1]?.trim();
        if (issueMatch) {
          extractedData.dateOfIssue = issueMatch;
          console.log(`Found Date of Issue: ${issueMatch}`);
        }
      }
      
      // Fallback date patterns
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
          });
        }
      });

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

      // DISTRICT OF BIRTH DETECTION
      if (!extractedData.districtOfBirth && upperLine.includes('DISTRICT OF BIRTH')) {
        const districtMatch = line.split(':')[1]?.trim();
        if (districtMatch) {
          extractedData.districtOfBirth = districtMatch;
          console.log(`Found District of Birth: ${districtMatch}`);
        }
      }

      // PLACE OF ISSUE DETECTION
      if (!extractedData.placeOfIssue && upperLine.includes('PLACE OF ISSUE')) {
        const placeMatch = line.split(':')[1]?.trim();
        if (placeMatch) {
          extractedData.placeOfIssue = placeMatch;
          console.log(`Found Place of Issue: ${placeMatch}`);
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

    console.log('Final extracted data:', extractedData);
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

      console.log('Starting ML Kit text recognition for URI:', uri);
      
      // Check if TextRecognition is available
      if (!TextRecognition || typeof TextRecognition.recognize !== 'function') {
        throw new Error('ML Kit text recognition module not available. Please ensure the module is properly linked.');
      }
      
      // Use ML Kit for real OCR
      const result = await TextRecognition.recognize(uri);
      console.log('Raw OCR result from ML Kit:', result);
      
      if (!result) {
        throw new Error('No text was recognized in the image');
      }
      
      console.log('OCR Raw Result:', result);
      
      // Parse the OCR result
      const extractedData = parseOCRResult(result);
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