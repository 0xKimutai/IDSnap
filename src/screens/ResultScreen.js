/**
 * Result Screen
 * Display extracted ID card data with editing capabilities
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Mock implementations for file operations (fallback when Expo is not available)
const FileSystem = {
  writeAsStringAsync: async (uri, content) => {
    console.log('File write operation (mock):', uri);
    return Promise.resolve();
  },
  documentDirectory: '/mock/documents/'
};

const MediaLibrary = {
  requestPermissionsAsync: async () => {
    console.log('Media library permission request (mock)');
    return Promise.resolve({ status: 'granted' });
  },
  saveToLibraryAsync: async (uri) => {
    console.log('Save to library (mock):', uri);
    return Promise.resolve({ id: 'mock-asset-id' });
  }
};

const ResultScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { scanData, imageUri } = route.params || {};
  const { data = {}, confidence = {}, timestamp } = scanData || {};
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState(null);

  // Debug logging
  React.useEffect(() => {
    console.log('ResultScreen received params:', route.params);
    console.log('Scan data:', scanData);
    console.log('Data object:', data);
    console.log('Confidence object:', confidence);
    console.log('Image URI:', imageUri);
  }, [route.params, scanData, data, confidence, imageUri]);

  // Request media library permissions
  React.useEffect(() => {
    (async () => {
      if (Platform.OS === 'ios') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save to scan history
      await saveToHistory();
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Save Successful',
        'The scan results have been saved to your history.',
        [
          {
            text: 'View History',
            onPress: () => navigation.navigate('History'),
          },
          {
            text: 'Scan Another',
            onPress: () => navigation.navigate('Camera'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving data:', error);
      Alert.alert('Error', 'Failed to save the scan results. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveToHistory = async () => {
    try {
      // Get existing history
      const existingHistory = await AsyncStorage.getItem('@scan_history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Create new history item
      const newHistoryItem = {
        id: Date.now().toString(),
        timestamp: timestamp || Date.now(),
        data: data,
        imageUri: imageUri
      };
      
      // Add to beginning of history array
      history.unshift(newHistoryItem);
      
      // Keep only last 50 items to prevent storage bloat
      const limitedHistory = history.slice(0, 50);
      
      // Save back to storage
      await AsyncStorage.setItem('@scan_history', JSON.stringify(limitedHistory));
      
      console.log('Saved to history:', newHistoryItem);
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleEdit = (field) => {
    // In a real app, you would navigate to an edit screen or show a modal
    Alert.alert(
      'Edit Field',
      `Edit ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            // Handle the save logic here
            console.log(`Saving ${field}:`, text);
          },
        },
      ],
      Platform.OS === 'ios' ? 'plain-text' : 'default',
      Platform.OS === 'ios' ? 'default' : undefined,
      data[field] || ''
    );
  };

  const handleShare = async () => {
    try {
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const filename = `idscan_${new Date().getTime()}.jpg`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      await Share.share({
        title: 'ID Card Scan',
        message: 'Here is the scanned ID card',
        url: fileUri,
      });
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Failed to share the image. Please try again.');
    }
  };

  const handleSaveToGallery = async () => {
    if (hasPermission === false) {
      Alert.alert('Permission required', 'Please grant permission to save images to your gallery.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      await MediaLibrary.createAlbumAsync('IDSnap', asset, false);
      
      Alert.alert('Success', 'Image saved to gallery!');
    } catch (error) {
      console.error('Error saving to gallery:', error);
      Alert.alert('Error', 'Failed to save image to gallery. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    Alert.alert(
      'Export Options',
      'Choose export format:',
      [
        { text: 'JSON', onPress: () => console.log('Export as JSON') },
        { text: 'CSV', onPress: () => console.log('Export as CSV') },
        { text: 'Print', onPress: () => console.log('Print document') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleNewScan = () => {
    navigation.navigate('Camera');
  };

  const handleHome = () => {
    navigation.navigate('Home');
  };


  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan Results</Text>
          <Text style={styles.timestamp}>
            {timestamp ? new Date(timestamp).toLocaleString() : 'Just now'}
          </Text>
        </View>

        {/* Scanned Image */}
        {imageUri && (
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Scanned Image</Text>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.scannedImage}
                resizeMode="contain"
              />
            </View>
          </View>
        )}


        {/* Extracted Data */}
        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Extracted Information</Text>
          {data && Object.keys(data).length > 0 ? (
            <View style={styles.dataContainer}>
              {Object.entries(data).map(([key, value]) => {
                // Format field names for better display
                const formatFieldName = (fieldName) => {
                  const fieldMappings = {
                    serialNumber: 'Serial Number',
                    idNumber: 'ID Number',
                    dateOfBirth: 'Date of Birth',
                    sex: 'Sex',
                    districtOfBirth: 'District of Birth',
                    placeOfIssue: 'Place of Issue',
                    dateOfIssue: 'Date of Issue',
                    holdersSign: "Holder's Signature"
                  };
                  
                  return fieldMappings[fieldName] || 
                    fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                };

                return (
                  <View key={key} style={styles.dataRow}>
                    <Text style={styles.dataLabel}>
                      {formatFieldName(key)}:
                    </Text>
                    <Text style={styles.dataValue}>{value || 'N/A'}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No data extracted</Text>
              <Text style={styles.noDataSubtext}>
                The image may be unclear or not contain recognizable text
              </Text>
            </View>
          )}
        </View>


        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <PrimaryButton
            title="💾 Save Results"
            onPress={handleSave}
            size="large"
            fullWidth
            style={styles.saveButton}
          />
          
          <View style={styles.secondaryActions}>
            <SecondaryButton
              title="📤 Export"
              onPress={handleExport}
              size="medium"
              style={styles.actionButton}
            />
            <SecondaryButton
              title="📷 New Scan"
              onPress={handleNewScan}
              size="medium"
              style={styles.actionButton}
            />
          </View>
          
          <SecondaryButton
            title="🏠 Back to Home"
            onPress={handleHome}
            size="medium"
            fullWidth
            style={styles.homeButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Image Section
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  scannedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  
  // Data Section
  dataSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  dataSummary: {
    marginBottom: 0,
  },
  dataContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  dataRow: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayLight,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  noDataContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.cardShadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Actions Section
  actionsSection: {
    marginBottom: 20,
  },
  saveButton: {
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  homeButton: {
    marginTop: 8,
  },
});

export default ResultScreen;
