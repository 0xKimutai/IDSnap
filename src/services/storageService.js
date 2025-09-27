/**
 * Storage Service for managing scan history and app data
 * Provides persistent storage using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys for different data types
 */
const STORAGE_KEYS = {
  SCAN_HISTORY: '@IDSnap:scanHistory',
  APP_SETTINGS: '@IDSnap:appSettings',
  USER_PREFERENCES: '@IDSnap:userPreferences',
  CACHED_IMAGES: '@IDSnap:cachedImages',
  STATISTICS: '@IDSnap:statistics',
};

/**
 * Default app settings
 */
const DEFAULT_SETTINGS = {
  autoEnhanceImages: true,
  saveScansLocally: true,
  maxHistoryItems: 50,
  enableHapticFeedback: true,
  theme: 'light',
  language: 'en',
  compressionQuality: 0.8,
  autoDeleteAfterDays: 30,
};

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES = {
  showTutorial: true,
  enableNotifications: true,
  defaultExportFormat: 'json',
  autoSaveResults: true,
  confirmBeforeDelete: true,
};

/**
 * Storage Service class for managing app data persistence
 */
class StorageService {
  constructor() {
    this.initialized = false;
    this.cache = new Map();
  }

  /**
   * Initialize the storage service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize default settings if they don't exist
      await this.initializeDefaults();
      this.initialized = true;
      console.log('Storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  /**
   * Initialize default settings and preferences
   * @private
   */
  async initializeDefaults() {
    const [settings, preferences] = await Promise.all([
      this.getAppSettings(),
      this.getUserPreferences(),
    ]);

    if (!settings) {
      await this.saveAppSettings(DEFAULT_SETTINGS);
    }

    if (!preferences) {
      await this.saveUserPreferences(DEFAULT_PREFERENCES);
    }
  }

  /**
   * Save a scan result to history
   * @param {Object} scanResult - Scan result data
   * @returns {Promise<string>} - Scan ID
   */
  async saveScanResult(scanResult) {
    try {
      const scanId = this.generateScanId();
      const scanData = {
        id: scanId,
        timestamp: new Date().toISOString(),
        ...scanResult,
      };

      const history = await this.getScanHistory();
      const updatedHistory = [scanData, ...history];

      // Limit history size based on settings
      const settings = await this.getAppSettings();
      const maxItems = settings?.maxHistoryItems || DEFAULT_SETTINGS.maxHistoryItems;
      
      if (updatedHistory.length > maxItems) {
        const removedItems = updatedHistory.splice(maxItems);
        // Clean up associated cached images
        await this.cleanupRemovedScans(removedItems);
      }

      await this.setScanHistory(updatedHistory);
      await this.updateStatistics('scansCompleted');
      
      return scanId;
    } catch (error) {
      console.error('Failed to save scan result:', error);
      throw error;
    }
  }

  /**
   * Get scan history
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Array of scan results
   */
  async getScanHistory(options = {}) {
    try {
      const { limit, offset = 0, sortBy = 'timestamp', sortOrder = 'desc' } = options;
      
      let history = await this.getStorageItem(STORAGE_KEYS.SCAN_HISTORY, []);
      
      // Sort history
      history.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
      
      // Apply pagination
      if (limit) {
        history = history.slice(offset, offset + limit);
      } else if (offset > 0) {
        history = history.slice(offset);
      }
      
      return history;
    } catch (error) {
      console.error('Failed to get scan history:', error);
      return [];
    }
  }

  /**
   * Get a specific scan by ID
   * @param {string} scanId - Scan ID
   * @returns {Promise<Object|null>} - Scan data or null if not found
   */
  async getScanById(scanId) {
    try {
      const history = await this.getScanHistory();
      return history.find(scan => scan.id === scanId) || null;
    } catch (error) {
      console.error('Failed to get scan by ID:', error);
      return null;
    }
  }

  /**
   * Update a scan result
   * @param {string} scanId - Scan ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<boolean>} - Success status
   */
  async updateScanResult(scanId, updates) {
    try {
      const history = await this.getScanHistory();
      const scanIndex = history.findIndex(scan => scan.id === scanId);
      
      if (scanIndex === -1) {
        throw new Error('Scan not found');
      }
      
      history[scanIndex] = {
        ...history[scanIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await this.setScanHistory(history);
      return true;
    } catch (error) {
      console.error('Failed to update scan result:', error);
      return false;
    }
  }

  /**
   * Delete a scan from history
   * @param {string} scanId - Scan ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteScan(scanId) {
    try {
      const history = await this.getScanHistory();
      const scanIndex = history.findIndex(scan => scan.id === scanId);
      
      if (scanIndex === -1) {
        return false;
      }
      
      const removedScan = history.splice(scanIndex, 1)[0];
      await this.setScanHistory(history);
      
      // Clean up associated cached images
      await this.cleanupRemovedScans([removedScan]);
      
      return true;
    } catch (error) {
      console.error('Failed to delete scan:', error);
      return false;
    }
  }

  /**
   * Clear all scan history
   * @returns {Promise<boolean>} - Success status
   */
  async clearScanHistory() {
    try {
      const history = await this.getScanHistory();
      await this.removeStorageItem(STORAGE_KEYS.SCAN_HISTORY);
      await this.cleanupRemovedScans(history);
      return true;
    } catch (error) {
      console.error('Failed to clear scan history:', error);
      return false;
    }
  }

  /**
   * Get app settings
   * @returns {Promise<Object>} - App settings
   */
  async getAppSettings() {
    return await this.getStorageItem(STORAGE_KEYS.APP_SETTINGS, DEFAULT_SETTINGS);
  }

  /**
   * Save app settings
   * @param {Object} settings - Settings to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveAppSettings(settings) {
    try {
      const currentSettings = await this.getAppSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await this.setStorageItem(STORAGE_KEYS.APP_SETTINGS, updatedSettings);
      return true;
    } catch (error) {
      console.error('Failed to save app settings:', error);
      return false;
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} - User preferences
   */
  async getUserPreferences() {
    return await this.getStorageItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_PREFERENCES);
  }

  /**
   * Save user preferences
   * @param {Object} preferences - Preferences to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveUserPreferences(preferences) {
    try {
      const currentPreferences = await this.getUserPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      await this.setStorageItem(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
      return true;
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      return false;
    }
  }

  /**
   * Cache an image
   * @param {string} imageUri - Image URI
   * @param {string} cacheKey - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async cacheImage(imageUri, cacheKey) {
    try {
      const cachedImages = await this.getStorageItem(STORAGE_KEYS.CACHED_IMAGES, {});
      cachedImages[cacheKey] = {
        uri: imageUri,
        timestamp: new Date().toISOString(),
      };
      await this.setStorageItem(STORAGE_KEYS.CACHED_IMAGES, cachedImages);
      return true;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return false;
    }
  }

  /**
   * Get cached image
   * @param {string} cacheKey - Cache key
   * @returns {Promise<string|null>} - Image URI or null
   */
  async getCachedImage(cacheKey) {
    try {
      const cachedImages = await this.getStorageItem(STORAGE_KEYS.CACHED_IMAGES, {});
      const cached = cachedImages[cacheKey];
      return cached ? cached.uri : null;
    } catch (error) {
      console.error('Failed to get cached image:', error);
      return null;
    }
  }

  /**
   * Get app statistics
   * @returns {Promise<Object>} - App statistics
   */
  async getStatistics() {
    return await this.getStorageItem(STORAGE_KEYS.STATISTICS, {
      scansCompleted: 0,
      totalProcessingTime: 0,
      averageConfidence: 0,
      lastScanDate: null,
      appInstallDate: new Date().toISOString(),
    });
  }

  /**
   * Update statistics
   * @param {string} metric - Metric to update
   * @param {*} value - Value to add/set
   * @returns {Promise<boolean>} - Success status
   */
  async updateStatistics(metric, value = 1) {
    try {
      const stats = await this.getStatistics();
      
      switch (metric) {
        case 'scansCompleted':
          stats.scansCompleted += value;
          stats.lastScanDate = new Date().toISOString();
          break;
        case 'processingTime':
          stats.totalProcessingTime += value;
          break;
        case 'confidence':
          // Calculate running average
          const totalScans = stats.scansCompleted || 1;
          stats.averageConfidence = ((stats.averageConfidence * (totalScans - 1)) + value) / totalScans;
          break;
        default:
          stats[metric] = value;
      }
      
      await this.setStorageItem(STORAGE_KEYS.STATISTICS, stats);
      return true;
    } catch (error) {
      console.error('Failed to update statistics:', error);
      return false;
    }
  }

  /**
   * Export data in various formats
   * @param {string} format - Export format ('json', 'csv')
   * @param {Object} options - Export options
   * @returns {Promise<string>} - Exported data
   */
  async exportData(format = 'json', options = {}) {
    try {
      const { includeHistory = true, includeSettings = false, includeStats = false } = options;
      
      const exportData = {};
      
      if (includeHistory) {
        exportData.scanHistory = await this.getScanHistory();
      }
      
      if (includeSettings) {
        exportData.settings = await this.getAppSettings();
        exportData.preferences = await this.getUserPreferences();
      }
      
      if (includeStats) {
        exportData.statistics = await this.getStatistics();
      }
      
      exportData.exportDate = new Date().toISOString();
      exportData.version = '1.0.0';
      
      switch (format.toLowerCase()) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        case 'csv':
          return this.convertToCSV(exportData.scanHistory || []);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Import data from exported format
   * @param {string} data - Data to import
   * @param {string} format - Data format
   * @param {Object} options - Import options
   * @returns {Promise<boolean>} - Success status
   */
  async importData(data, format = 'json', options = {}) {
    try {
      const { mergeWithExisting = true, overwriteSettings = false } = options;
      
      let importData;
      
      switch (format.toLowerCase()) {
        case 'json':
          importData = JSON.parse(data);
          break;
        default:
          throw new Error(`Unsupported import format: ${format}`);
      }
      
      if (importData.scanHistory) {
        if (mergeWithExisting) {
          const existingHistory = await this.getScanHistory();
          const mergedHistory = [...importData.scanHistory, ...existingHistory];
          await this.setScanHistory(mergedHistory);
        } else {
          await this.setScanHistory(importData.scanHistory);
        }
      }
      
      if (importData.settings && overwriteSettings) {
        await this.saveAppSettings(importData.settings);
      }
      
      if (importData.preferences && overwriteSettings) {
        await this.saveUserPreferences(importData.preferences);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  /**
   * Clean up old data based on retention settings
   * @returns {Promise<number>} - Number of items cleaned up
   */
  async cleanupOldData() {
    try {
      const settings = await this.getAppSettings();
      const retentionDays = settings.autoDeleteAfterDays || DEFAULT_SETTINGS.autoDeleteAfterDays;
      
      if (retentionDays <= 0) return 0; // Cleanup disabled
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const history = await this.getScanHistory();
      const itemsToKeep = [];
      const itemsToRemove = [];
      
      history.forEach(scan => {
        const scanDate = new Date(scan.timestamp);
        if (scanDate >= cutoffDate) {
          itemsToKeep.push(scan);
        } else {
          itemsToRemove.push(scan);
        }
      });
      
      if (itemsToRemove.length > 0) {
        await this.setScanHistory(itemsToKeep);
        await this.cleanupRemovedScans(itemsToRemove);
      }
      
      return itemsToRemove.length;
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
      return 0;
    }
  }

  // Private helper methods

  /**
   * Set scan history
   * @private
   */
  async setScanHistory(history) {
    await this.setStorageItem(STORAGE_KEYS.SCAN_HISTORY, history);
  }

  /**
   * Generate unique scan ID
   * @private
   */
  generateScanId() {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up removed scans
   * @private
   */
  async cleanupRemovedScans(removedScans) {
    // Clean up cached images for removed scans
    const cachedImages = await this.getStorageItem(STORAGE_KEYS.CACHED_IMAGES, {});
    
    removedScans.forEach(scan => {
      if (cachedImages[scan.id]) {
        delete cachedImages[scan.id];
      }
    });
    
    await this.setStorageItem(STORAGE_KEYS.CACHED_IMAGES, cachedImages);
  }

  /**
   * Convert data to CSV format
   * @private
   */
  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return 'No data available';
    }
    
    const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  /**
   * Generic storage item getter
   * @private
   */
  async getStorageItem(key, defaultValue = null) {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to get storage item ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Generic storage item setter
   * @private
   */
  async setStorageItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set storage item ${key}:`, error);
      return false;
    }
  }

  /**
   * Generic storage item remover
   * @private
   */
  async removeStorageItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove storage item ${key}:`, error);
      return false;
    }
  }
}

// Create and export singleton instance
const storageService = new StorageService();

export default storageService;

// Export convenience functions
export const {
  initialize,
  saveScanResult,
  getScanHistory,
  getScanById,
  updateScanResult,
  deleteScan,
  clearScanHistory,
  getAppSettings,
  saveAppSettings,
  getUserPreferences,
  saveUserPreferences,
  getStatistics,
  updateStatistics,
  exportData,
  importData,
  cleanupOldData,
} = storageService;
