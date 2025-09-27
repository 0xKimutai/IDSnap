/**
 * usePermissions Hook
 * Custom hook for managing device permissions (camera, storage, etc.)
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { request, check, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';

/**
 * Permission types mapping
 */
const PERMISSION_TYPES = {
  CAMERA: Platform.select({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  }),
  PHOTO_LIBRARY: Platform.select({
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
  }),
  WRITE_STORAGE: Platform.select({
    ios: null, // iOS doesn't need this permission
    android: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
  }),
};

/**
 * Permission status enum
 */
export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  DENIED: 'denied',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'unavailable',
  LIMITED: 'limited',
  UNKNOWN: 'unknown',
};

/**
 * Custom hook for managing permissions
 * @param {Array} requiredPermissions - Array of permission types needed
 * @returns {Object} - Permission state and methods
 */
export const usePermissions = (requiredPermissions = ['CAMERA']) => {
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasAllPermissions, setHasAllPermissions] = useState(false);

  /**
   * Check current status of a permission
   * @param {string} permissionType - Permission type
   * @returns {Promise<string>} - Permission status
   */
  const checkPermission = useCallback(async (permissionType) => {
    const permission = PERMISSION_TYPES[permissionType];
    
    if (!permission) {
      return PERMISSION_STATUS.UNAVAILABLE;
    }

    try {
      const result = await check(permission);
      return mapPermissionResult(result);
    } catch (error) {
      console.error(`Error checking ${permissionType} permission:`, error);
      return PERMISSION_STATUS.UNKNOWN;
    }
  }, []);

  /**
   * Request a specific permission
   * @param {string} permissionType - Permission type
   * @returns {Promise<string>} - Permission status after request
   */
  const requestPermission = useCallback(async (permissionType) => {
    const permission = PERMISSION_TYPES[permissionType];
    
    if (!permission) {
      return PERMISSION_STATUS.UNAVAILABLE;
    }

    try {
      const result = await request(permission);
      return mapPermissionResult(result);
    } catch (error) {
      console.error(`Error requesting ${permissionType} permission:`, error);
      return PERMISSION_STATUS.UNKNOWN;
    }
  }, []);

  /**
   * Check all required permissions
   */
  const checkAllPermissions = useCallback(async () => {
    setIsLoading(true);
    const permissionStatuses = {};
    
    for (const permissionType of requiredPermissions) {
      const status = await checkPermission(permissionType);
      permissionStatuses[permissionType] = status;
    }
    
    setPermissions(permissionStatuses);
    
    // Check if all required permissions are granted
    const allGranted = requiredPermissions.every(
      type => permissionStatuses[type] === PERMISSION_STATUS.GRANTED
    );
    
    setHasAllPermissions(allGranted);
    setIsLoading(false);
    
    return permissionStatuses;
  }, [requiredPermissions, checkPermission]);

  /**
   * Request all required permissions
   */
  const requestAllPermissions = useCallback(async () => {
    setIsLoading(true);
    const permissionStatuses = {};
    
    for (const permissionType of requiredPermissions) {
      let status = await checkPermission(permissionType);
      
      if (status !== PERMISSION_STATUS.GRANTED) {
        status = await requestPermission(permissionType);
      }
      
      permissionStatuses[permissionType] = status;
    }
    
    setPermissions(permissionStatuses);
    
    // Check if all required permissions are granted
    const allGranted = requiredPermissions.every(
      type => permissionStatuses[type] === PERMISSION_STATUS.GRANTED
    );
    
    setHasAllPermissions(allGranted);
    setIsLoading(false);
    
    return permissionStatuses;
  }, [requiredPermissions, checkPermission, requestPermission]);

  /**
   * Show permission denied alert with options
   * @param {string} permissionType - Permission type that was denied
   */
  const showPermissionDeniedAlert = useCallback((permissionType) => {
    const permissionName = getPermissionDisplayName(permissionType);
    const isBlocked = permissions[permissionType] === PERMISSION_STATUS.BLOCKED;
    
    Alert.alert(
      `${permissionName} Permission Required`,
      `IDSnap needs ${permissionName.toLowerCase()} permission to scan ID cards. ${isBlocked ? 'Please enable it in Settings.' : 'Would you like to grant permission?'}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: isBlocked ? 'Open Settings' : 'Grant Permission',
          onPress: isBlocked ? openAppSettings : () => requestPermission(permissionType),
        },
      ]
    );
  }, [permissions, requestPermission]);

  /**
   * Open app settings
   */
  const openAppSettings = useCallback(async () => {
    try {
      await openSettings();
    } catch (error) {
      console.error('Error opening settings:', error);
      // Fallback to system settings
      Linking.openSettings();
    }
  }, []);

  /**
   * Get permission status for a specific type
   * @param {string} permissionType - Permission type
   * @returns {string} - Permission status
   */
  const getPermissionStatus = useCallback((permissionType) => {
    return permissions[permissionType] || PERMISSION_STATUS.UNKNOWN;
  }, [permissions]);

  /**
   * Check if a specific permission is granted
   * @param {string} permissionType - Permission type
   * @returns {boolean} - Whether permission is granted
   */
  const isPermissionGranted = useCallback((permissionType) => {
    return permissions[permissionType] === PERMISSION_STATUS.GRANTED;
  }, [permissions]);

  /**
   * Check if a specific permission is blocked
   * @param {string} permissionType - Permission type
   * @returns {boolean} - Whether permission is blocked
   */
  const isPermissionBlocked = useCallback((permissionType) => {
    return permissions[permissionType] === PERMISSION_STATUS.BLOCKED;
  }, [permissions]);

  // Initialize permissions on mount
  useEffect(() => {
    checkAllPermissions();
  }, [checkAllPermissions]);

  return {
    // State
    permissions,
    isLoading,
    hasAllPermissions,
    
    // Methods
    checkPermission,
    requestPermission,
    checkAllPermissions,
    requestAllPermissions,
    showPermissionDeniedAlert,
    openAppSettings,
    getPermissionStatus,
    isPermissionGranted,
    isPermissionBlocked,
    
    // Convenience getters
    isCameraGranted: isPermissionGranted('CAMERA'),
    isPhotoLibraryGranted: isPermissionGranted('PHOTO_LIBRARY'),
    isStorageGranted: isPermissionGranted('WRITE_STORAGE'),
  };
};

/**
 * Map permission result to our status enum
 * @param {string} result - Permission result from react-native-permissions
 * @returns {string} - Mapped permission status
 */
const mapPermissionResult = (result) => {
  switch (result) {
    case RESULTS.GRANTED:
      return PERMISSION_STATUS.GRANTED;
    case RESULTS.DENIED:
      return PERMISSION_STATUS.DENIED;
    case RESULTS.BLOCKED:
      return PERMISSION_STATUS.BLOCKED;
    case RESULTS.UNAVAILABLE:
      return PERMISSION_STATUS.UNAVAILABLE;
    case RESULTS.LIMITED:
      return PERMISSION_STATUS.LIMITED;
    default:
      return PERMISSION_STATUS.UNKNOWN;
  }
};

/**
 * Get display name for permission type
 * @param {string} permissionType - Permission type
 * @returns {string} - Display name
 */
const getPermissionDisplayName = (permissionType) => {
  switch (permissionType) {
    case 'CAMERA':
      return 'Camera';
    case 'PHOTO_LIBRARY':
      return 'Photo Library';
    case 'WRITE_STORAGE':
      return 'Storage';
    default:
      return permissionType;
  }
};

/**
 * Hook for camera permission specifically
 * @returns {Object} - Camera permission state and methods
 */
export const useCameraPermission = () => {
  return usePermissions(['CAMERA']);
};

/**
 * Hook for photo library permission specifically
 * @returns {Object} - Photo library permission state and methods
 */
export const usePhotoLibraryPermission = () => {
  return usePermissions(['PHOTO_LIBRARY']);
};

/**
 * Hook for all media permissions (camera + photo library)
 * @returns {Object} - Media permissions state and methods
 */
export const useMediaPermissions = () => {
  return usePermissions(['CAMERA', 'PHOTO_LIBRARY']);
};

export default usePermissions;
