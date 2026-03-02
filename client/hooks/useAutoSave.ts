/**
 * Auto-Save Hook with Focus Preservation
 * Provides debounced auto-save functionality that doesn't interrupt user typing
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface SaveResult {
  success: boolean;
  timestamp: Date;
  error?: Error;
}

export interface AutoSaveConfig {
  delay?: number;
  enabled?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onSave: (data: any) => Promise<void>;
  onSuccess?: (result: SaveResult) => void;
  onError?: (error: Error, retryCount: number) => void;
  onRetryExhausted?: (error: Error) => void;
}

export interface AutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  pendingChanges: boolean;
  retryCount: number;
  forceSave: () => Promise<void>;
  cancelSave: () => void;
  resetStatus: () => void;
}

/**
 * Custom hook for debounced auto-save with focus preservation
 */
export const useAutoSave = <T>(
  data: T,
  config: AutoSaveConfig
): AutoSaveReturn => {
  const {
    delay = 2000,
    enabled = true,
    maxRetries = 3,
    retryDelay = 1000,
    onSave,
    onSuccess,
    onError,
    onRetryExhausted
  } = config;

  // State management
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for managing save operations
  const previousDataRef = useRef<T>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialRender = useRef(true);
  const isSavingRef = useRef(false);

  /**
   * Performs the actual save operation with retry logic
   */
  const performSave = useCallback(async (dataToSave: T, currentRetryCount = 0): Promise<void> => {
    if (!enabled || isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');
      setPendingChanges(false);

      await onSave(dataToSave);

      const result: SaveResult = {
        success: true,
        timestamp: new Date()
      };

      setSaveStatus('saved');
      setLastSaved(result.timestamp);
      setRetryCount(0);
      onSuccess?.(result);

      // Reset to idle after showing saved status
      setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);

    } catch (error) {
      const saveError = error as Error;
      
      if (currentRetryCount < maxRetries) {
        // Retry after delay
        const nextRetryCount = currentRetryCount + 1;
        setRetryCount(nextRetryCount);
        onError?.(saveError, nextRetryCount);

        retryTimeoutRef.current = setTimeout(() => {
          performSave(dataToSave, nextRetryCount);
        }, retryDelay * Math.pow(2, currentRetryCount)); // Exponential backoff

      } else {
        // Max retries exhausted
        setSaveStatus('error');
        setRetryCount(0);
        onRetryExhausted?.(saveError);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [enabled, onSave, onSuccess, onError, onRetryExhausted, maxRetries, retryDelay]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback((dataToSave: T) => {
    if (!enabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setPendingChanges(true);

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      performSave(dataToSave);
    }, delay);
  }, [enabled, delay, performSave]);

  /**
   * Force immediate save (bypasses debouncing)
   */
  const forceSave = useCallback(async (): Promise<void> => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    if (data) {
      await performSave(data);
    }
  }, [data, performSave]);

  /**
   * Cancel pending save operation
   */
  const cancelSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = undefined;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = undefined;
    }
    setPendingChanges(false);
    setSaveStatus('idle');
  }, []);

  /**
   * Reset save status and counters
   */
  const resetStatus = useCallback(() => {
    setSaveStatus('idle');
    setRetryCount(0);
    setPendingChanges(false);
  }, []);

  /**
   * Effect to trigger auto-save when data changes
   */
  useEffect(() => {
    // Skip initial render to avoid saving empty/default data
    if (isInitialRender.current) {
      isInitialRender.current = false;
      previousDataRef.current = data;
      return;
    }

    // Only save if data has actually changed
    if (data && JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      debouncedSave(data);
      previousDataRef.current = data;
    }
  }, [data, debouncedSave]);

  /**
   * Cleanup effect
   */
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    pendingChanges,
    retryCount,
    forceSave,
    cancelSave,
    resetStatus
  };
};

/**
 * Hook for managing auto-save configuration and preferences
 */
export interface AutoSavePreferences {
  enabled: boolean;
  delay: number;
  showNotifications: boolean;
  maxRetries: number;
}

const DEFAULT_PREFERENCES: AutoSavePreferences = {
  enabled: true,
  delay: 2000,
  showNotifications: true,
  maxRetries: 3
};

export const useAutoSavePreferences = () => {
  const [preferences, setPreferences] = useState<AutoSavePreferences>(() => {
    try {
      const saved = localStorage.getItem('autoSavePreferences');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const updatePreferences = useCallback((updates: Partial<AutoSavePreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      try {
        localStorage.setItem('autoSavePreferences', JSON.stringify(newPreferences));
      } catch (error) {
        console.warn('Failed to save auto-save preferences:', error);
      }
      return newPreferences;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem('autoSavePreferences');
    } catch (error) {
      console.warn('Failed to reset auto-save preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences
  };
};