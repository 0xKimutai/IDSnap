/**
 * useCamera Hook
 * Custom hook for managing camera functionality with react-native-vision-camera
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { Camera, useCameraDevices, useCameraFormat } from 'react-native-vision-camera';
import { useCameraPermission } from './usePermissions';

/**
 * Camera configuration constants
 */
const CAMERA_CONFIG = {
  // Photo settings
  photoQuality: 85,
  enableAutoStabilization: true,
  enableAutoRedEyeReduction: true,
  
  // Focus settings
  autoFocusSystem: 'contrast-detection',
  
  // Flash modes
  flashModes: ['off', 'on', 'auto'],
};

/**
 * Camera states enum
 */
export const CAMERA_STATE = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  CAPTURING: 'capturing',
  ERROR: 'error',
  PERMISSION_DENIED: 'permission_denied',
};

/**
 * Flash modes enum
 */
export const FLASH_MODE = {
  OFF: 'off',
  ON: 'on',
  AUTO: 'auto',
};

/**
 * Custom hook for camera functionality
 * @param {Object} options - Camera options
 * @returns {Object} - Camera state and methods
 */
export const useCamera = (options = {}) => {
  const {
    preferredPosition = 'back',
    enableHdr = true,
    enableLowLightBoost = true,
    onCameraReady = null,
    onError = null,
  } = options;

  // State
  const [cameraState, setCameraState] = useState(CAMERA_STATE.INITIALIZING);
  const [flashMode, setFlashMode] = useState(FLASH_MODE.OFF);
  const [isFlashAvailable, setIsFlashAvailable] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoomLevel, setMaxZoomLevel] = useState(1);
  const [isFocused, setIsFocused] = useState(true);
  const [error, setError] = useState(null);

  // Refs
  const cameraRef = useRef(null);
  const lastPhotoRef = useRef(null);

  // Hooks
  const { hasAllPermissions, requestAllPermissions, isLoading: permissionsLoading } = useCameraPermission();
  const devices = useCameraDevices();
  
  // Get the preferred camera device
  const device = devices[preferredPosition];
  
  // Get optimal format for the device
  const format = useCameraFormat(device, [
    { photoResolution: 'max' },
    { videoResolution: 'max' },
    { photoAspectRatio: 4/3 },
    { fps: 30 },
  ]);

  /**
   * Initialize camera
   */
  const initializeCamera = useCallback(async () => {
    try {
      setCameraState(CAMERA_STATE.INITIALIZING);
      setError(null);

      // Check permissions first
      if (!hasAllPermissions) {
        const permissions = await requestAllPermissions();
        if (!permissions.CAMERA || permissions.CAMERA !== 'granted') {
          setCameraState(CAMERA_STATE.PERMISSION_DENIED);
          setError('Camera permission is required');
          return;
        }
      }

      // Check if device is available
      if (!device) {
        setCameraState(CAMERA_STATE.ERROR);
        setError('No camera device available');
        return;
      }

      // Set camera capabilities
      setIsFlashAvailable(device.hasFlash);
      setMaxZoomLevel(device.maxZoom || 1);
      
      setCameraState(CAMERA_STATE.READY);
      
      if (onCameraReady) {
        onCameraReady();
      }
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraState(CAMERA_STATE.ERROR);
      setError(err.message || 'Failed to initialize camera');
      
      if (onError) {
        onError(err);
      }
    }
  }, [device, hasAllPermissions, requestAllPermissions, onCameraReady, onError]);

  /**
   * Take a photo
   * @param {Object} photoOptions - Photo capture options
   * @returns {Promise<Object>} - Photo result
   */
  const takePhoto = useCallback(async (photoOptions = {}) => {
    if (!cameraRef.current || cameraState !== CAMERA_STATE.READY) {
      throw new Error('Camera is not ready');
    }

    try {
      setCameraState(CAMERA_STATE.CAPTURING);
      
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
        enableAutoStabilization: CAMERA_CONFIG.enableAutoStabilization,
        enableAutoRedEyeReduction: CAMERA_CONFIG.enableAutoRedEyeReduction,
        ...photoOptions,
      });

      lastPhotoRef.current = photo;
      setCameraState(CAMERA_STATE.READY);
      
      return {
        uri: `file://${photo.path}`,
        width: photo.width,
        height: photo.height,
        path: photo.path,
        metadata: photo.metadata,
      };
    } catch (err) {
      console.error('Photo capture error:', err);
      setCameraState(CAMERA_STATE.READY);
      throw new Error(err.message || 'Failed to capture photo');
    }
  }, [cameraState, flashMode]);

  /**
   * Toggle flash mode
   */
  const toggleFlash = useCallback(() => {
    if (!isFlashAvailable) return;
    
    const modes = [FLASH_MODE.OFF, FLASH_MODE.ON, FLASH_MODE.AUTO];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  }, [flashMode, isFlashAvailable]);

  /**
   * Set specific flash mode
   * @param {string} mode - Flash mode
   */
  const setFlash = useCallback((mode) => {
    if (!isFlashAvailable || !CAMERA_CONFIG.flashModes.includes(mode)) return;
    setFlashMode(mode);
  }, [isFlashAvailable]);

  /**
   * Set zoom level
   * @param {number} zoom - Zoom level (1 to maxZoomLevel)
   */
  const setZoom = useCallback((zoom) => {
    const clampedZoom = Math.max(1, Math.min(zoom, maxZoomLevel));
    setZoomLevel(clampedZoom);
  }, [maxZoomLevel]);

  /**
   * Focus at specific point
   * @param {Object} point - Focus point {x, y}
   */
  const focusAt = useCallback(async (point) => {
    if (!cameraRef.current || cameraState !== CAMERA_STATE.READY) return;
    
    try {
      await cameraRef.current.focus(point);
    } catch (err) {
      console.warn('Focus error:', err);
    }
  }, [cameraState]);

  /**
   * Reset camera settings to defaults
   */
  const resetSettings = useCallback(() => {
    setFlashMode(FLASH_MODE.OFF);
    setZoomLevel(1);
  }, []);

  /**
   * Get camera capabilities
   * @returns {Object} - Camera capabilities
   */
  const getCapabilities = useCallback(() => {
    if (!device) return null;
    
    return {
      hasFlash: device.hasFlash,
      hasTorch: device.hasTorch,
      maxZoom: device.maxZoom,
      minZoom: device.minZoom,
      supportedFormats: device.formats?.length || 0,
      position: device.position,
      name: device.name,
    };
  }, [device]);

  /**
   * Handle camera mount/unmount
   */
  const handleCameraMount = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleCameraUnmount = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Initialize camera when permissions and device are ready
  useEffect(() => {
    if (!permissionsLoading && device) {
      initializeCamera();
    }
  }, [permissionsLoading, device, initializeCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        // Cleanup camera resources
        cameraRef.current = null;
      }
    };
  }, []);

  return {
    // Refs
    cameraRef,
    
    // State
    cameraState,
    device,
    format,
    flashMode,
    isFlashAvailable,
    zoomLevel,
    maxZoomLevel,
    isFocused,
    error,
    lastPhoto: lastPhotoRef.current,
    
    // Computed state
    isReady: cameraState === CAMERA_STATE.READY,
    isCapturing: cameraState === CAMERA_STATE.CAPTURING,
    isInitializing: cameraState === CAMERA_STATE.INITIALIZING,
    hasError: cameraState === CAMERA_STATE.ERROR,
    hasPermissionError: cameraState === CAMERA_STATE.PERMISSION_DENIED,
    
    // Methods
    takePhoto,
    toggleFlash,
    setFlash,
    setZoom,
    focusAt,
    resetSettings,
    getCapabilities,
    initializeCamera,
    
    // Event handlers
    onMount: handleCameraMount,
    onUnmount: handleCameraUnmount,
  };
};

/**
 * Hook for basic camera functionality (simplified version)
 * @returns {Object} - Basic camera state and methods
 */
export const useBasicCamera = () => {
  const camera = useCamera();
  
  return {
    cameraRef: camera.cameraRef,
    device: camera.device,
    format: camera.format,
    isReady: camera.isReady,
    isCapturing: camera.isCapturing,
    error: camera.error,
    takePhoto: camera.takePhoto,
    flashMode: camera.flashMode,
    toggleFlash: camera.toggleFlash,
  };
};

/**
 * Hook for camera with auto-focus capabilities
 * @returns {Object} - Camera with auto-focus state and methods
 */
export const useCameraWithAutoFocus = () => {
  const camera = useCamera();
  const [isAutoFocusing, setIsAutoFocusing] = useState(false);
  
  const autoFocus = useCallback(async () => {
    if (!camera.isReady || isAutoFocusing) return;
    
    setIsAutoFocusing(true);
    try {
      // Focus at center of screen
      await camera.focusAt({ x: 0.5, y: 0.5 });
    } catch (error) {
      console.warn('Auto focus failed:', error);
    } finally {
      setIsAutoFocusing(false);
    }
  }, [camera.isReady, camera.focusAt, isAutoFocusing]);
  
  return {
    ...camera,
    isAutoFocusing,
    autoFocus,
  };
};

export default useCamera;
