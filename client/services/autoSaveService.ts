import { Resume } from "@shared/api";
import { resumeApi } from "./resumeApi";

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'retrying' | 'offline';

export interface SaveResult {
  success: boolean;
  timestamp: string;
  error?: string;
  source: 'localStorage' | 'api' | 'both';
  retryCount?: number;
  queuedForRetry?: boolean;
}

export interface SaveQueueItem {
  id: string;
  resumeData: Resume;
  timestamp: string;
  retryCount: number;
  lastAttempt: string;
  priority: 'normal' | 'high';
}

export interface AutoSaveOptions {
  debounceMs?: number;
  enableLocalStorage?: boolean;
  enableApi?: boolean;
  resumeId?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  maxRetryDelayMs?: number;
  enableOfflineQueue?: boolean;
}

export class AutoSaveService {
  private debounceTimer: NodeJS.Timeout | null = null;
  private saveStatus: SaveStatus = 'idle';
  private lastSaveTime: Date | null = null;
  private isEnabled = false;
  private options: Required<AutoSaveOptions>;
  private statusCallbacks: ((status: SaveStatus) => void)[] = [];
  private saveCallbacks: ((result: SaveResult) => void)[] = [];
  private saveQueue: SaveQueueItem[] = [];
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private isOnline = navigator.onLine;

  constructor(options: AutoSaveOptions = {}) {
    this.options = {
      debounceMs: options.debounceMs ?? 2000,
      enableLocalStorage: options.enableLocalStorage ?? true,
      enableApi: options.enableApi ?? true,
      resumeId: options.resumeId ?? '1',
      maxRetries: options.maxRetries ?? 3,
      retryDelayMs: options.retryDelayMs ?? 1000,
      maxRetryDelayMs: options.maxRetryDelayMs ?? 30000,
      enableOfflineQueue: options.enableOfflineQueue ?? true,
    };

    // Listen for online/offline events
    this.setupNetworkListeners();
    
    // Process any existing queue items on startup
    this.processQueueOnStartup();
  }

  /**
   * Enable auto-save functionality
   */
  enable(): void {
    this.isEnabled = true;
    this.updateStatus('idle');
  }

  /**
   * Disable auto-save functionality and clear any pending saves
   */
  disable(): void {
    this.isEnabled = false;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.updateStatus('idle');
  }

  /**
   * Trigger auto-save with debouncing
   */
  triggerSave(resumeData: Resume): void {
    if (!this.isEnabled) {
      return;
    }

    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(async () => {
      await this.performSave(resumeData);
    }, this.options.debounceMs);
  }

  /**
   * Force immediate save without debouncing
   */
  async forceSave(resumeData: Resume): Promise<SaveResult> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    
    return await this.performSave(resumeData);
  }

  /**
   * Get current save status
   */
  getSaveStatus(): SaveStatus {
    return this.saveStatus;
  }

  /**
   * Get last save time
   */
  getLastSaveTime(): Date | null {
    return this.lastSaveTime;
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(callback: (status: SaveStatus) => void): () => void {
    this.statusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to save results
   */
  onSaveComplete(callback: (result: SaveResult) => void): () => void {
    this.saveCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.saveCallbacks.indexOf(callback);
      if (index > -1) {
        this.saveCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration options
   */
  updateOptions(newOptions: Partial<AutoSaveOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Perform the actual save operation with retry logic
   */
  private async performSave(resumeData: Resume, retryCount = 0): Promise<SaveResult> {
    this.updateStatus(retryCount > 0 ? 'retrying' : 'saving');
    
    const timestamp = new Date().toISOString();
    let localStorageSuccess = false;
    let apiSuccess = false;
    let error: string | undefined;

    try {
      // Save to localStorage if enabled
      if (this.options.enableLocalStorage) {
        try {
          await this.saveToLocalStorage(resumeData);
          localStorageSuccess = true;
        } catch (localError) {
          console.warn('Failed to save to localStorage:', localError);
          if (!this.options.enableApi) {
            // If localStorage is the only option and it fails, that's an error
            throw localError;
          }
        }
      }

      // Save to API if enabled
      if (this.options.enableApi) {
        try {
          await this.saveToApiWithRetry(resumeData, retryCount);
          apiSuccess = true;
        } catch (apiError) {
          console.warn('Failed to save to API:', apiError);
          
          // Check if we should retry first (before queueing for offline)
          if (this.shouldRetry(apiError, retryCount)) {
            return await this.scheduleRetry(resumeData, retryCount + 1);
          }
          
          // If we can't retry and this is a network error, queue for offline
          if (this.isNetworkError(apiError) && this.options.enableOfflineQueue) {
            return await this.queueForOfflineRetry(resumeData, retryCount);
          }
          
          // If we can't retry and localStorage didn't succeed, throw error
          if (!localStorageSuccess) {
            throw apiError;
          }
          error = apiError instanceof Error ? apiError.message : 'API save failed';
        }
      }

      // Determine result
      const success = localStorageSuccess || apiSuccess;
      let source: SaveResult['source'];
      
      if (localStorageSuccess && apiSuccess) {
        source = 'both';
      } else if (localStorageSuccess) {
        source = 'localStorage';
      } else if (apiSuccess) {
        source = 'api';
      } else {
        source = 'localStorage'; // fallback, though this shouldn't happen if success is true
      }

      const result: SaveResult = {
        success,
        timestamp,
        source,
        error,
        retryCount,
      };

      if (success) {
        this.lastSaveTime = new Date();
        this.updateStatus('saved');
      } else {
        this.updateStatus('error');
      }

      // Notify callbacks
      this.saveCallbacks.forEach(callback => callback(result));

      return result;

    } catch (saveError) {
      const errorMessage = saveError instanceof Error ? saveError.message : 'Unknown save error';
      
      // Check if we should retry for general errors
      if (this.shouldRetry(saveError, retryCount)) {
        return await this.scheduleRetry(resumeData, retryCount + 1);
      }
      
      const result: SaveResult = {
        success: false,
        timestamp,
        source: 'localStorage', // doesn't matter for failed saves
        error: errorMessage,
        retryCount,
      };

      this.updateStatus('error');
      
      // Notify callbacks
      this.saveCallbacks.forEach(callback => callback(result));

      return result;
    }
  }

  /**
   * Save resume data to localStorage
   */
  private async saveToLocalStorage(resumeData: Resume): Promise<void> {
    try {
      const dataToSave = {
        ...resumeData,
        lastSaved: new Date().toISOString(),
      };
      
      const serializedData = JSON.stringify(dataToSave);
      localStorage.setItem(`resume_${this.options.resumeId}`, serializedData);
      localStorage.setItem(`resume_${this.options.resumeId}_backup`, serializedData);
      
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Local storage quota exceeded. Please clear some data.');
      }
      throw new Error(`Failed to save to local storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save resume data to API
   */
  private async saveToApi(resumeData: Resume): Promise<void> {
    try {
      await resumeApi.updateResume(this.options.resumeId, resumeData);
    } catch (error) {
      throw new Error(`Failed to save to API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update save status and notify callbacks
   */
  private updateStatus(status: SaveStatus): void {
    if (this.saveStatus !== status) {
      this.saveStatus = status;
      this.statusCallbacks.forEach(callback => callback(status));
    }
  }

  /**
   * Load resume data from localStorage
   */
  async loadFromLocalStorage(): Promise<Resume | null> {
    try {
      const data = localStorage.getItem(`resume_${this.options.resumeId}`);
      if (!data) {
        return null;
      }
      
      return JSON.parse(data) as Resume;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      
      // Try backup
      try {
        const backupData = localStorage.getItem(`resume_${this.options.resumeId}_backup`);
        if (backupData) {
          return JSON.parse(backupData) as Resume;
        }
      } catch (backupError) {
        console.warn('Failed to load from localStorage backup:', backupError);
      }
      
      return null;
    }
  }

  /**
   * Clear localStorage data
   */
  clearLocalStorage(): void {
    localStorage.removeItem(`resume_${this.options.resumeId}`);
    localStorage.removeItem(`resume_${this.options.resumeId}_backup`);
  }

  /**
   * Check if there are unsaved changes by comparing with localStorage
   */
  async hasUnsavedChanges(currentData: Resume): Promise<boolean> {
    const savedData = await this.loadFromLocalStorage();
    if (!savedData) {
      return true; // No saved data means there are unsaved changes
    }
    
    // Compare relevant fields (excluding timestamps)
    const { updatedAt: currentUpdated, ...currentRelevant } = currentData;
    const { updatedAt: savedUpdated, lastSaved, ...savedRelevant } = savedData as Resume & { lastSaved?: string };
    
    return JSON.stringify(currentRelevant) !== JSON.stringify(savedRelevant);
  }

  /**
   * Setup network event listeners for online/offline detection
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatus('idle');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus('offline');
    });
  }

  /**
   * Process any existing queue items on startup
   */
  private async processQueueOnStartup(): Promise<void> {
    try {
      const queueData = localStorage.getItem(`save_queue_${this.options.resumeId}`);
      if (queueData) {
        this.saveQueue = JSON.parse(queueData);
        if (this.isOnline && this.saveQueue.length > 0) {
          await this.processOfflineQueue();
        }
      }
    } catch (error) {
      console.warn('Failed to load save queue from localStorage:', error);
      this.saveQueue = [];
    }
  }

  /**
   * Save to API with retry logic (used internally by performSave)
   */
  private async saveToApiWithRetry(resumeData: Resume, retryCount: number): Promise<void> {
    try {
      await resumeApi.updateResume(this.options.resumeId, resumeData);
    } catch (error) {
      // Add retry count to error for tracking
      const enhancedError = error instanceof Error ? error : new Error('Unknown API error');
      (enhancedError as any).retryCount = retryCount;
      throw enhancedError;
    }
  }

  /**
   * Determine if an error should trigger a retry
   */
  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= this.options.maxRetries) {
      return false;
    }

    // Don't retry if we're offline - queue instead
    if (!this.isOnline) {
      return false;
    }

    // Retry on network errors (but only if we're online)
    if (this.isNetworkError(error)) {
      return true;
    }

    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }

    if (error?.status === 429) { // Rate limiting
      return true;
    }

    // Retry on timeout errors
    if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Check if an error is network-related
   */
  private isNetworkError(error: any): boolean {
    // Always consider network error if we're offline
    if (!this.isOnline) {
      return true;
    }

    // Common network error indicators
    const networkErrorCodes = ['NETWORK_ERROR', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];
    const networkErrorMessages = ['network error', 'fetch failed', 'failed to fetch', 'connection refused'];

    if (error?.code && networkErrorCodes.includes(error.code)) {
      return true;
    }

    if (error?.message) {
      const message = error.message.toLowerCase();
      return networkErrorMessages.some(msg => message.includes(msg));
    }

    return false;
  }

  /**
   * Schedule a retry with exponential backoff
   */
  private async scheduleRetry(resumeData: Resume, retryCount: number): Promise<SaveResult> {
    const delay = this.calculateRetryDelay(retryCount);
    
    return new Promise((resolve) => {
      const timerId = setTimeout(async () => {
        this.retryTimers.delete(`retry_${retryCount}`);
        const result = await this.performSave(resumeData, retryCount);
        resolve(result);
      }, delay);

      this.retryTimers.set(`retry_${retryCount}`, timerId);
    });
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = this.options.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitteredDelay = exponentialDelay + (Math.random() * 1000); // Add jitter
    
    return Math.min(jitteredDelay, this.options.maxRetryDelayMs);
  }

  /**
   * Queue save for offline retry
   */
  private async queueForOfflineRetry(resumeData: Resume, retryCount: number): Promise<SaveResult> {
    const queueItem: SaveQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      resumeData,
      timestamp: new Date().toISOString(),
      retryCount,
      lastAttempt: new Date().toISOString(),
      priority: 'normal'
    };

    this.saveQueue.push(queueItem);
    await this.persistQueue();

    // Save to localStorage as fallback
    let localStorageSuccess = false;
    try {
      await this.saveToLocalStorage(resumeData);
      localStorageSuccess = true;
    } catch (error) {
      console.warn('Failed to save to localStorage while queueing:', error);
    }

    this.updateStatus('offline');

    const result: SaveResult = {
      success: localStorageSuccess,
      timestamp: queueItem.timestamp,
      source: 'localStorage',
      retryCount,
      queuedForRetry: true,
      error: localStorageSuccess ? undefined : 'Failed to save locally while offline'
    };

    this.saveCallbacks.forEach(callback => callback(result));
    return result;
  }

  /**
   * Process offline queue when connection is restored
   */
  private async processOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.saveQueue.length === 0) {
      return;
    }

    // Sort by priority and timestamp
    this.saveQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority === 'high' ? -1 : 1;
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    const itemsToProcess = [...this.saveQueue];
    this.saveQueue = [];

    for (const item of itemsToProcess) {
      try {
        await this.saveToApi(item.resumeData);
        console.log(`Successfully processed queued save: ${item.id}`);
      } catch (error) {
        console.warn(`Failed to process queued save: ${item.id}`, error);
        
        // Re-queue if we haven't exceeded max retries
        if (item.retryCount < this.options.maxRetries) {
          item.retryCount++;
          item.lastAttempt = new Date().toISOString();
          this.saveQueue.push(item);
        }
      }
    }

    await this.persistQueue();
  }

  /**
   * Persist save queue to localStorage
   */
  private async persistQueue(): Promise<void> {
    try {
      const queueData = JSON.stringify(this.saveQueue);
      localStorage.setItem(`save_queue_${this.options.resumeId}`, queueData);
    } catch (error) {
      console.warn('Failed to persist save queue:', error);
    }
  }

  /**
   * Get current save queue status
   */
  getSaveQueueStatus(): { count: number; items: SaveQueueItem[] } {
    return {
      count: this.saveQueue.length,
      items: [...this.saveQueue]
    };
  }

  /**
   * Clear save queue (useful for testing or manual cleanup)
   */
  clearSaveQueue(): void {
    this.saveQueue = [];
    localStorage.removeItem(`save_queue_${this.options.resumeId}`);
  }

  /**
   * Force process offline queue (useful for manual retry)
   */
  async forceProcessQueue(): Promise<void> {
    if (this.isOnline) {
      await this.processOfflineQueue();
    }
  }

  /**
   * Cleanup method to be called when component unmounts
   */
  cleanup(): void {
    this.disable();
    
    // Clear all retry timers
    this.retryTimers.forEach((timer) => clearTimeout(timer));
    this.retryTimers.clear();
    
    // Remove network listeners
    window.removeEventListener('online', this.processOfflineQueue);
    window.removeEventListener('offline', () => {});
    
    this.statusCallbacks.length = 0;
    this.saveCallbacks.length = 0;
  }
}

// Export a default instance for convenience
export const autoSaveService = new AutoSaveService();