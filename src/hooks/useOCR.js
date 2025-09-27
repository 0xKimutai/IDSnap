/**
 * useOCR Hook
 * Custom hook for managing OCR operations and state
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { processImageWithOCR, getOCRService } from '../services/ocrService';
import storageService from '../services/storageService';

/**
 * OCR processing states
 */
export const OCR_STATE = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

/**
 * Processing steps for progress tracking
 */
export const PROCESSING_STEPS = {
  QUALITY: 'quality',
  PREPROCESSING: 'preprocessing',
  OCR: 'ocr',
  EXTRACTION: 'extraction',
  VALIDATION: 'validation',
  REPORT: 'report',
  COMPLETE: 'complete',
};

/**
 * Custom hook for OCR operations
 * @param {Object} options - OCR options
 * @returns {Object} - OCR state and methods
 */
export const useOCR = (options = {}) => {
  const {
    autoSave = true,
    enhanceImage = true,
    validateData = true,
    includeQualityReport = true,
    onProgress = null,
    onSuccess = null,
    onError = null,
  } = options;

  // State
  const [ocrState, setOcrState] = useState(OCR_STATE.IDLE);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);

  // Refs
  const startTimeRef = useRef(null);
  const abortControllerRef = useRef(null);

  /**
   * Handle progress updates
   */
  const handleProgress = useCallback((progressData) => {
    const { step, progress: progressValue } = progressData;
    
    setCurrentStep(step);
    setProgress(progressValue);
    
    if (onProgress) {
      onProgress(progressData);
    }
  }, [onProgress]);

  /**
   * Process an image with OCR
   * @param {string} imageUri - URI of the image to process
   * @param {Object} processingOptions - Processing options
   * @returns {Promise<Object>} - Processing result
   */
  const processImage = useCallback(async (imageUri, processingOptions = {}) => {
    if (ocrState === OCR_STATE.PROCESSING) {
      throw new Error('OCR processing is already in progress');
    }

    try {
      setOcrState(OCR_STATE.PROCESSING);
      setError(null);
      setResult(null);
      setProgress(0);
      setCurrentStep(null);
      startTimeRef.current = Date.now();

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const ocrOptions = {
        enhanceImage,
        validateData,
        includeQualityReport,
        onProgress: handleProgress,
        ...processingOptions,
      };

      const ocrResult = await processImageWithOCR(imageUri, ocrOptions);
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'OCR processing failed');
      }

      setResult(ocrResult);
      setOcrState(OCR_STATE.SUCCESS);
      setProcessingTime(Date.now() - startTimeRef.current);

      // Auto-save if enabled
      if (autoSave && ocrResult.success) {
        try {
          await storageService.saveScanResult({
            ...ocrResult,
            originalImageUri: imageUri,
          });
        } catch (saveError) {
          console.warn('Failed to auto-save scan result:', saveError);
        }
      }

      if (onSuccess) {
        onSuccess(ocrResult);
      }

      return ocrResult;
    } catch (err) {
      console.error('OCR processing error:', err);
      setError(err.message || 'OCR processing failed');
      setOcrState(OCR_STATE.ERROR);
      setProcessingTime(Date.now() - (startTimeRef.current || Date.now()));

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      abortControllerRef.current = null;
    }
  }, [ocrState, enhanceImage, validateData, includeQualityReport, autoSave, handleProgress, onSuccess, onError]);

  /**
   * Cancel current OCR operation
   */
  const cancelProcessing = useCallback(() => {
    if (ocrState !== OCR_STATE.PROCESSING) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Try to cancel the OCR service operation
    const ocrService = getOCRService();
    if (ocrService && ocrService.cancelOperation) {
      ocrService.cancelOperation();
    }

    setOcrState(OCR_STATE.IDLE);
    setProgress(0);
    setCurrentStep(null);
    setError('Operation cancelled');
  }, [ocrState]);

  /**
   * Reset OCR state
   */
  const reset = useCallback(() => {
    setOcrState(OCR_STATE.IDLE);
    setProgress(0);
    setCurrentStep(null);
    setResult(null);
    setError(null);
    setProcessingTime(0);
    startTimeRef.current = null;
    abortControllerRef.current = null;
  }, []);

  /**
   * Retry last operation
   * @param {string} imageUri - Image URI to retry with
   * @returns {Promise<Object>} - Processing result
   */
  const retry = useCallback(async (imageUri) => {
    reset();
    return await processImage(imageUri);
  }, [reset, processImage]);

  /**
   * Get processing step display name
   * @param {string} step - Processing step
   * @returns {string} - Display name
   */
  const getStepDisplayName = useCallback((step) => {
    switch (step) {
      case PROCESSING_STEPS.QUALITY:
        return 'Analyzing image quality';
      case PROCESSING_STEPS.PREPROCESSING:
        return 'Preparing image';
      case PROCESSING_STEPS.OCR:
        return 'Extracting text';
      case PROCESSING_STEPS.EXTRACTION:
        return 'Processing data';
      case PROCESSING_STEPS.VALIDATION:
        return 'Validating information';
      case PROCESSING_STEPS.REPORT:
        return 'Generating report';
      case PROCESSING_STEPS.COMPLETE:
        return 'Complete';
      default:
        return 'Processing';
    }
  }, []);

  /**
   * Get current step display name
   */
  const currentStepDisplayName = currentStep ? getStepDisplayName(currentStep) : null;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    state: ocrState,
    progress,
    currentStep,
    currentStepDisplayName,
    result,
    error,
    processingTime,
    
    // Computed state
    isIdle: ocrState === OCR_STATE.IDLE,
    isProcessing: ocrState === OCR_STATE.PROCESSING,
    isSuccess: ocrState === OCR_STATE.SUCCESS,
    hasError: ocrState === OCR_STATE.ERROR,
    canCancel: ocrState === OCR_STATE.PROCESSING,
    
    // Methods
    processImage,
    cancelProcessing,
    reset,
    retry,
    getStepDisplayName,
  };
};

/**
 * Hook for batch OCR processing
 * @param {Object} options - Batch processing options
 * @returns {Object} - Batch OCR state and methods
 */
export const useBatchOCR = (options = {}) => {
  const {
    maxConcurrent = 1,
    onBatchProgress = null,
    onItemComplete = null,
    onBatchComplete = null,
    onBatchError = null,
  } = options;

  const [batchState, setBatchState] = useState(OCR_STATE.IDLE);
  const [queue, setQueue] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [failed, setFailed] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);

  const processingRef = useRef(false);

  /**
   * Add images to processing queue
   * @param {Array} imageUris - Array of image URIs
   */
  const addToQueue = useCallback((imageUris) => {
    const newItems = imageUris.map((uri, index) => ({
      id: `${Date.now()}_${index}`,
      uri,
      status: 'pending',
      result: null,
      error: null,
    }));
    
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  /**
   * Process batch queue
   */
  const processBatch = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return;

    processingRef.current = true;
    setBatchState(OCR_STATE.PROCESSING);
    setCurrentIndex(0);
    setBatchProgress(0);
    setCompleted([]);
    setFailed([]);

    try {
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        setCurrentIndex(i);
        
        try {
          const result = await processImageWithOCR(item.uri);
          
          const completedItem = {
            ...item,
            status: 'completed',
            result,
          };
          
          setCompleted(prev => [...prev, completedItem]);
          
          if (onItemComplete) {
            onItemComplete(completedItem, i, queue.length);
          }
        } catch (error) {
          const failedItem = {
            ...item,
            status: 'failed',
            error: error.message,
          };
          
          setFailed(prev => [...prev, failedItem]);
        }
        
        const progress = ((i + 1) / queue.length) * 100;
        setBatchProgress(progress);
        
        if (onBatchProgress) {
          onBatchProgress({
            current: i + 1,
            total: queue.length,
            progress,
            completed: completed.length,
            failed: failed.length,
          });
        }
      }
      
      setBatchState(OCR_STATE.SUCCESS);
      
      if (onBatchComplete) {
        onBatchComplete({
          completed,
          failed,
          total: queue.length,
        });
      }
    } catch (error) {
      setBatchState(OCR_STATE.ERROR);
      
      if (onBatchError) {
        onBatchError(error);
      }
    } finally {
      processingRef.current = false;
    }
  }, [queue, completed, failed, onItemComplete, onBatchProgress, onBatchComplete, onBatchError]);

  /**
   * Clear batch queue
   */
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCompleted([]);
    setFailed([]);
    setCurrentIndex(0);
    setBatchProgress(0);
    setBatchState(OCR_STATE.IDLE);
  }, []);

  /**
   * Cancel batch processing
   */
  const cancelBatch = useCallback(() => {
    processingRef.current = false;
    setBatchState(OCR_STATE.IDLE);
  }, []);

  return {
    // State
    batchState,
    queue,
    completed,
    failed,
    currentIndex,
    batchProgress,
    
    // Computed state
    totalItems: queue.length,
    completedCount: completed.length,
    failedCount: failed.length,
    isProcessing: batchState === OCR_STATE.PROCESSING,
    isComplete: batchState === OCR_STATE.SUCCESS,
    
    // Methods
    addToQueue,
    processBatch,
    clearQueue,
    cancelBatch,
  };
};

/**
 * Hook for OCR with real-time feedback
 * @param {Object} options - Real-time OCR options
 * @returns {Object} - Real-time OCR state and methods
 */
export const useRealTimeOCR = (options = {}) => {
  const {
    debounceMs = 1000,
    minConfidence = 0.7,
    onTextDetected = null,
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastProcessTime, setLastProcessTime] = useState(0);

  const debounceTimerRef = useRef(null);
  const lastImageRef = useRef(null);

  /**
   * Process image for real-time text detection
   * @param {string} imageUri - Image URI
   */
  const processRealTime = useCallback(async (imageUri) => {
    if (!isActive || lastImageRef.current === imageUri) return;

    lastImageRef.current = imageUri;
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the processing
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const startTime = Date.now();
        const result = await processImageWithOCR(imageUri, {
          enhanceImage: false, // Skip enhancement for speed
          validateData: false,
          includeQualityReport: false,
        });

        if (result.success) {
          const overallConfidence = Object.values(result.confidence || {}).reduce(
            (sum, conf) => sum + conf, 0
          ) / Object.keys(result.confidence || {}).length || 0;

          if (overallConfidence >= minConfidence) {
            setDetectedText(result.rawText || '');
            setConfidence(overallConfidence);
            setLastProcessTime(Date.now() - startTime);

            if (onTextDetected) {
              onTextDetected({
                text: result.rawText,
                data: result.data,
                confidence: overallConfidence,
                processingTime: Date.now() - startTime,
              });
            }
          }
        }
      } catch (error) {
        console.warn('Real-time OCR error:', error);
      }
    }, debounceMs);
  }, [isActive, debounceMs, minConfidence, onTextDetected]);

  /**
   * Start real-time processing
   */
  const start = useCallback(() => {
    setIsActive(true);
    setDetectedText('');
    setConfidence(0);
  }, []);

  /**
   * Stop real-time processing
   */
  const stop = useCallback(() => {
    setIsActive(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // State
    isActive,
    detectedText,
    confidence,
    lastProcessTime,
    
    // Methods
    processRealTime,
    start,
    stop,
  };
};

export default useOCR;
