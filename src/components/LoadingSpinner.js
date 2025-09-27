/**
 * LoadingSpinner Component
 * Reusable loading spinner with various styles and overlay options
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Basic loading spinner component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - LoadingSpinner component
 */
const LoadingSpinner = ({
  size = 'large',
  color = null,
  message = null,
  style = {},
  textStyle = {},
}) => {
  const { colors } = useTheme();
  const spinnerColor = color || colors.primary;
  
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }, textStyle]}>{message}</Text>
      )}
    </View>
  );
};

/**
 * Full screen loading overlay
 * @param {Object} props - Component props
 * @returns {JSX.Element} - LoadingOverlay component
 */
export const LoadingOverlay = ({
  visible = false,
  message = 'Loading...',
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  spinnerColor = null,
  textColor = null,
  onRequestClose = null,
}) => {
  const { colors } = useTheme();
  const finalSpinnerColor = spinnerColor || colors.primary;
  const finalTextColor = textColor || colors.white;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, { backgroundColor }]}>
        <View style={[styles.overlayContent, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={finalSpinnerColor} />
          <Text style={[styles.overlayText, { color: finalTextColor }]}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Inline loading spinner with customizable layout
 * @param {Object} props - Component props
 * @returns {JSX.Element} - InlineLoader component
 */
export const InlineLoader = ({
  loading = false,
  children,
  message = 'Loading...',
  spinnerSize = 'small',
  spinnerColor = null,
  style = {},
}) => {
  const { colors } = useTheme();
  const finalSpinnerColor = spinnerColor || colors.primary;
  
  if (!loading) {
    return children;
  }

  return (
    <View style={[styles.inlineContainer, style]}>
      <ActivityIndicator size={spinnerSize} color={finalSpinnerColor} />
      {message && (
        <Text style={[styles.inlineMessage, { color: colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
};

/**
 * Progress spinner with percentage
 * @param {Object} props - Component props
 * @returns {JSX.Element} - ProgressSpinner component
 */
export const ProgressSpinner = ({
  progress = 0,
  message = null,
  showPercentage = true,
  size = 'large',
  color = null,
  style = {},
}) => {
  const { colors } = useTheme();
  const finalColor = color || colors.primary;
  const percentage = Math.round(progress * 100);
  
  return (
    <View style={[styles.progressContainer, style]}>
      <View style={styles.progressSpinner}>
        <ActivityIndicator size={size} color={finalColor} />
        {showPercentage && (
          <Text style={[styles.percentage, { color: colors.primary }]}>{percentage}%</Text>
        )}
      </View>
      {message && (
        <Text style={[styles.progressMessage, { color: colors.textSecondary }]}>{message}</Text>
      )}
    </View>
  );
};

/**
 * Step-by-step loading indicator
 * @param {Object} props - Component props
 * @returns {JSX.Element} - StepLoader component
 */
export const StepLoader = ({
  steps = [],
  currentStep = 0,
  message = null,
  spinnerColor = null,
  completedColor = null,
  pendingColor = null,
  style = {},
}) => {
  const { colors } = useTheme();
  const finalSpinnerColor = spinnerColor || colors.primary;
  const finalCompletedColor = completedColor || colors.success;
  const finalPendingColor = pendingColor || colors.gray;
  return (
    <View style={[styles.stepContainer, style]}>
      <View style={styles.stepsHeader}>
        <ActivityIndicator size="large" color={finalSpinnerColor} />
        {message && (
          <Text style={[styles.stepMessage, { color: colors.textPrimary }]}>{message}</Text>
        )}
      </View>
      
      {steps.length > 0 && (
        <View style={styles.stepsList}>
          {steps.map((step, index) => {
            let stepColor = finalPendingColor;
            let stepIcon = 'radio-button-unchecked';
            
            if (index < currentStep) {
              stepColor = finalCompletedColor;
              stepIcon = 'check-circle';
            } else if (index === currentStep) {
              stepColor = finalSpinnerColor;
              stepIcon = 'radio-button-checked';
            }
            
            return (
              <View key={index} style={styles.stepItem}>
                <View style={[styles.stepIndicator, { borderColor: stepColor }]}>
                  {index === currentStep ? (
                    <ActivityIndicator size="small" color={stepColor} />
                  ) : (
                    <View
                      style={[
                        styles.stepDot,
                        {
                          backgroundColor: index < currentStep ? stepColor : 'transparent',
                        },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.stepText, { color: stepColor }]}>
                  {step}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

/**
 * Skeleton loader for content placeholders
 * @param {Object} props - Component props
 * @returns {JSX.Element} - SkeletonLoader component
 */
export const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  backgroundColor = null,
  highlightColor = null,
  style = {},
}) => {
  const { colors } = useTheme();
  const finalBackgroundColor = backgroundColor || colors.grayLight;
  const finalHighlightColor = highlightColor || colors.white;
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: finalBackgroundColor,
        },
        style,
      ]}
    />
  );
};

/**
 * Card skeleton loader
 * @param {Object} props - Component props
 * @returns {JSX.Element} - CardSkeleton component
 */
export const CardSkeleton = ({ style = {} }) => {
  return (
    <View style={[styles.cardSkeleton, style]}>
      <SkeletonLoader width="60%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="100%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="80%" height={12} style={{ marginBottom: 4 }} />
      <SkeletonLoader width="40%" height={12} />
    </View>
  );
};

/**
 * Button loading state
 * @param {Object} props - Component props
 * @returns {JSX.Element} - ButtonLoader component
 */
export const ButtonLoader = ({
  loading = false,
  children,
  spinnerColor = null,
  spinnerSize = 'small',
}) => {
  const { colors } = useTheme();
  const finalSpinnerColor = spinnerColor || colors.white;
  if (!loading) {
    return children;
  }

  return (
    <View style={styles.buttonLoader}>
      <ActivityIndicator size={spinnerSize} color={finalSpinnerColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Overlay styles
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  overlayMessage: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Inline loader styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineMessage: {
    marginLeft: 12,
    fontSize: 14,
  },
  
  // Progress spinner styles
  progressContainer: {
    alignItems: 'center',
    padding: 20,
  },
  progressSpinner: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressMessage: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  
  // Step loader styles
  stepContainer: {
    padding: 20,
  },
  stepsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stepMessage: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  stepsList: {
    paddingHorizontal: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepText: {
    fontSize: 14,
    flex: 1,
  },
  
  // Skeleton styles
  skeleton: {
    opacity: 0.7,
  },
  cardSkeleton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  
  // Button loader styles
  buttonLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;
