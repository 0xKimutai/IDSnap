/**
 * CameraOverlay Component
 * Overlay component for camera screen with ID card frame guide
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ID card dimensions (standard credit card size ratio)
const CARD_ASPECT_RATIO = 1.586;
const OVERLAY_WIDTH = screenWidth * 0.85;
const OVERLAY_HEIGHT = OVERLAY_WIDTH / CARD_ASPECT_RATIO;

/**
 * Camera overlay with ID card frame guide
 * @param {Object} props - Component props
 * @returns {JSX.Element} - CameraOverlay component
 */
const CameraOverlay = ({
  isActive = true,
  showGuide = true,
  showInstructions = true,
  onFlashToggle = null,
  onGalleryPress = null,
  onCapturePress = null,
  onBackPress = null,
  flashMode = 'off',
  isCapturing = false,
  style = {},
}) => {
  const frameStyle = {
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    borderWidth: 2,
    borderColor: isActive ? COLORS.cameraFrame : COLORS.cameraFrameActive,
    borderRadius: 12,
  };

  return (
    <View style={[styles.overlay, style]}>
      {/* Top section */}
      <View style={styles.topSection}>
        <View style={styles.topControls}>
          {onBackPress && (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={onBackPress}
            >
              <Icon name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
          
          <View style={styles.topRight}>
            {onFlashToggle && (
              <TouchableOpacity
                style={styles.controlButton}
                onPress={onFlashToggle}
              >
                <Icon
                  name={
                    flashMode === 'on'
                      ? 'flash-on'
                      : flashMode === 'auto'
                      ? 'flash-auto'
                      : 'flash-off'
                  }
                  size={24}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {showInstructions && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionText}>
              Position the ID card within the frame
            </Text>
            <Text style={styles.subInstructionText}>
              Make sure all corners are visible and text is clear
            </Text>
          </View>
        )}
      </View>

      {/* Center section with card frame */}
      <View style={styles.centerSection}>
        {showGuide && (
          <View style={styles.frameContainer}>
            <View style={frameStyle}>
              {/* Corner indicators */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Center crosshair */}
              <View style={styles.crosshair}>
                <View style={styles.crosshairHorizontal} />
                <View style={styles.crosshairVertical} />
              </View>
            </View>
            
            {/* Frame label */}
            <Text style={styles.frameLabel}>ID Card</Text>
          </View>
        )}
      </View>

      {/* Bottom section with controls */}
      <View style={styles.bottomSection}>
        <View style={styles.bottomControls}>
          {onGalleryPress && (
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={onGalleryPress}
            >
              <Icon name="photo-library" size={24} color={COLORS.white} />
              <Text style={styles.buttonLabel}>Gallery</Text>
            </TouchableOpacity>
          )}
          
          {onCapturePress && (
            <TouchableOpacity
              style={[
                styles.captureButton,
                isCapturing && styles.captureButtonActive,
              ]}
              onPress={onCapturePress}
              disabled={isCapturing}
            >
              <View style={styles.captureButtonInner}>
                {isCapturing ? (
                  <View style={styles.captureButtonCapturing} />
                ) : (
                  <Icon name="camera" size={32} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>
          )}
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.bottomHint}>
          <Text style={styles.hintText}>
            Tap to capture • Hold for burst mode
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * Quality indicator overlay
 * @param {Object} props - Component props
 * @returns {JSX.Element} - QualityIndicator component
 */
export const QualityIndicator = ({
  quality = 'good',
  message = null,
  style = {},
}) => {
  const getQualityColor = () => {
    switch (quality) {
      case 'excellent':
        return COLORS.success;
      case 'good':
        return COLORS.success;
      case 'fair':
        return COLORS.warning;
      case 'poor':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const getQualityIcon = () => {
    switch (quality) {
      case 'excellent':
      case 'good':
        return 'check-circle';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'help';
    }
  };

  return (
    <View style={[styles.qualityIndicator, style]}>
      <View style={[styles.qualityBadge, { backgroundColor: getQualityColor() }]}>
        <Icon
          name={getQualityIcon()}
          size={16}
          color={COLORS.white}
        />
        <Text style={styles.qualityText}>{quality.toUpperCase()}</Text>
      </View>
      {message && (
        <Text style={styles.qualityMessage}>{message}</Text>
      )}
    </View>
  );
};

/**
 * Focus indicator component
 * @param {Object} props - Component props
 * @returns {JSX.Element} - FocusIndicator component
 */
export const FocusIndicator = ({
  visible = false,
  position = { x: 0, y: 0 },
  style = {},
}) => {
  if (!visible) return null;

  return (
    <View
      style={[
        styles.focusIndicator,
        {
          left: position.x - 25,
          top: position.y - 25,
        },
        style,
      ]}
    >
      <View style={styles.focusRing} />
    </View>
  );
};

/**
 * Grid overlay for better composition
 * @param {Object} props - Component props
 * @returns {JSX.Element} - GridOverlay component
 */
export const GridOverlay = ({ visible = false, style = {} }) => {
  if (!visible) return null;

  return (
    <View style={[styles.gridOverlay, style]}>
      {/* Vertical lines */}
      <View style={[styles.gridLine, styles.gridVertical1]} />
      <View style={[styles.gridLine, styles.gridVertical2]} />
      
      {/* Horizontal lines */}
      <View style={[styles.gridLine, styles.gridHorizontal1]} />
      <View style={[styles.gridLine, styles.gridHorizontal2]} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  
  // Top section
  topSection: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 50,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  topRight: {
    flexDirection: 'row',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subInstructionText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Center section
  centerSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameContainer: {
    alignItems: 'center',
  },
  frameLabel: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Frame corners
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: COLORS.white,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  
  // Crosshair
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    marginTop: -10,
    marginLeft: -10,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: 9,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.white,
    opacity: 0.7,
  },
  crosshairVertical: {
    position: 'absolute',
    left: 9,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: COLORS.white,
    opacity: 0.7,
  },
  
  // Bottom section
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  galleryButton: {
    alignItems: 'center',
    width: 60,
  },
  buttonLabel: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCapturing: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  placeholder: {
    width: 60,
  },
  bottomHint: {
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Quality indicator
  qualityIndicator: {
    position: 'absolute',
    top: 120,
    right: 20,
    alignItems: 'center',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  qualityMessage: {
    fontSize: 11,
    color: COLORS.white,
    marginTop: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Focus indicator
  focusIndicator: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: 'transparent',
  },
  
  // Grid overlay
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridVertical1: {
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridVertical2: {
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridHorizontal1: {
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
  },
  gridHorizontal2: {
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
  },
});

export default CameraOverlay;
