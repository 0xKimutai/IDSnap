/**
 * Preview Screen
 * Preview captured image before processing
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

const PreviewScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { imageUri } = route.params || {};
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [imageSize, setImageSize] = React.useState({ width: 0, height: 0 });

  // Get image dimensions for proper display
  React.useEffect(() => {
    if (imageUri) {
      Image.getSize(imageUri, (width, height) => {
        const ratio = width / height;
        const maxWidth = width * 0.9;
        const maxHeight = height * 0.6;
        
        if (width > height) {
          // Landscape
          const scaledHeight = Math.min(maxWidth / ratio, maxHeight);
          setImageSize({
            width: maxWidth,
            height: scaledHeight,
          });
        } else {
          // Portrait or square
          const scaledWidth = Math.min(maxHeight * ratio, maxWidth);
          setImageSize({
            width: scaledWidth,
            height: maxHeight,
          });
        }
      });
    }
  }, [imageUri]);

  const handleProcess = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'No image to process');
      return;
    }

    try {
      setIsProcessing(true);
      
      // In a real app, you would send the image to your OCR service here
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR results
      const mockOcrData = {
        data: {
          fullName: 'John Doe',
          idNumber: '123456789',
          dateOfBirth: '01/01/1990',
          address: '123 Main St, City, State',
          expiryDate: '01/01/2030',
          nationality: 'KENYAN',
          gender: 'MALE',
          placeOfBirth: 'NAIROBI',
          dateOfIssue: '01/01/2020',
        },
        confidence: {
          fullName: 0.95,
          idNumber: 0.98,
          dateOfBirth: 0.92,
          address: 0.85,
          expiryDate: 0.90,
          nationality: 0.97,
          gender: 0.99,
          placeOfBirth: 0.88,
          dateOfIssue: 0.87,
        },
        timestamp: new Date().toISOString(),
      };
      
      navigation.navigate('Result', {
        scanData: mockOcrData,
        imageUri,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.navigate('Home');
  };

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.processingContainer}>
          <LoadingSpinner
            size="large"
            message="Processing ID card..."
            color={colors.primary}
          />
          <Text style={styles.processingText}>
            Extracting text and analyzing data
          </Text>
          <Text style={styles.processingSubtext}>
            This may take a few seconds
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const styles = createStyles(colors);

  if (!imageUri) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Icon name="error-outline" size={60} color={colors.error} style={styles.errorIcon} />
          <Text style={[styles.errorText, { color: colors.textPrimary }]}>
            No image to display
          </Text>
          <Text style={[styles.subText, { color: colors.textSecondary, marginBottom: 30 }]}>
            Please go back and capture an ID card.
          </Text>
          <SecondaryButton
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={[styles.button, { borderColor: colors.primary }]}
            textStyle={{ color: colors.primary }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Preview ID
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Check the image quality before processing
          </Text>
        </View>
        
        <View style={[styles.imageContainer, { 
          backgroundColor: colors.surface,
          borderColor: colors.grayLight,
          ...(imageSize.width > 0 && imageSize.height > 0 ? {
            width: imageSize.width + 40,
            height: imageSize.height + 40,
          } : {})
        }]}>
          {imageSize.width > 0 && imageSize.height > 0 ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: imageSize.width,
                  height: imageSize.height,
                }
              ]}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator size="large" color={colors.primary} />
          )}
        </View>
        
        <View style={styles.buttonsContainer}>
          <SecondaryButton
            title="Retake"
            onPress={handleRetake}
            style={[styles.button, { borderColor: colors.primary }]}
            textStyle={{ color: colors.primary }}
            disabled={isProcessing}
            iconName="camera-alt"
            iconPosition="left"
          />
          <PrimaryButton
            title={isProcessing ? 'Processing...' : 'Process Image'}
            onPress={handleProcess}
            style={styles.button}
            disabled={isProcessing}
            loading={isProcessing}
            iconName="check-circle"
            iconPosition="left"
          />
        </View>
      </ScrollView>
      
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <View style={[
            styles.loadingContent,
            { backgroundColor: colors.surface }
          ]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textPrimary, marginTop: 15 }]}>
              Processing ID Card...
            </Text>
            <Text style={[styles.subText, { color: colors.textSecondary, marginTop: 5 }]}>
              This may take a few seconds
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    maxWidth: 400,
    height: 300,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
    height: 50,
    borderRadius: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    width: '80%',
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  imageText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  imageSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // Instructions
  instructionsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Actions
  actionsContainer: {
    padding: 20,
  },
  processButton: {
    marginBottom: 16,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default PreviewScreen;
