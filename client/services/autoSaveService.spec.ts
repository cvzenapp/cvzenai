import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoSaveService, SaveStatus, SaveResult } from './autoSaveService';
import { Resume } from '@shared/api';
import { resumeApi } from './resumeApi';

// Mock the resumeApi
vi.mock('./resumeApi', () => ({
  resumeApi: {
    updateResume: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window event listeners
const eventListeners: { [key: string]: Function[] } = {};
window.addEventListener = vi.fn((event: string, callback: Function) => {
  if (!eventListeners[event]) {
    eventListeners[event] = [];
  }
  eventListeners[event].push(callback);
});

window.removeEventListener = vi.fn();

// Helper to trigger events
const triggerEvent = (event: string) => {
  if (eventListeners[event]) {
    eventListeners[event].forEach(callback => callback());
  }
};

describe('AutoSaveService - Basic Functionality', () => {
  let autoSaveService: AutoSaveService;
  let mockResume: Resume;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
    
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true });
    
    // Clear event listeners
    Object.keys(eventListeners).forEach(key => {
      eventListeners[key] = [];
    });

    mockResume = {
      id: '1',
      personalInfo: {
        name: 'Alex Morgan',
        title: 'Software Engineer',
        email: 'john@example.com',
        phone: '123-456-7890',
        location: 'Anytown, ST',
      },
      summary: 'Test summary',
      objective: 'Test objective',
      experiences: [],
      education: [],
      skills: [],
      projects: [],
      upvotes: 0,
      rating: 0,
      isShortlisted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    autoSaveService = new AutoSaveService({
      resumeId: '1',
      debounceMs: 2000,
      maxRetries: 3,
      retryDelayMs: 100,
      enableLocalStorage: true,
      enableApi: true,
    });
  });

  afterEach(() => {
    autoSaveService.cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with default options', () => {
      const service = new AutoSaveService();
      expect(service.getSaveStatus()).toBe('idle');
      expect(service.getLastSaveTime()).toBeNull();
    });

    it('should initialize with custom options', () => {
      const service = new AutoSaveService({
        debounceMs: 5000,
        resumeId: 'custom-id',
        maxRetries: 5,
      });
      expect(service.getSaveStatus()).toBe('idle');
    });

    it('should update options after initialization', () => {
      autoSaveService.updateOptions({ debounceMs: 3000 });
      // Options are updated internally, no direct way to test without accessing private properties
      expect(autoSaveService.getSaveStatus()).toBe('idle');
    });
  });

  describe('Enable/Disable Functionality', () => {
    it('should enable auto-save', () => {
      autoSaveService.enable();
      expect(autoSaveService.getSaveStatus()).toBe('idle');
    });

    it('should disable auto-save and clear pending saves', () => {
      autoSaveService.enable();
      autoSaveService.triggerSave(mockResume);
      
      autoSaveService.disable();
      expect(autoSaveService.getSaveStatus()).toBe('idle');
      
      // Fast-forward time to ensure no save occurs
      vi.advanceTimersByTime(3000);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should not trigger saves when disabled', () => {
      // Don't enable the service
      autoSaveService.triggerSave(mockResume);
      
      vi.advanceTimersByTime(3000);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Debounced Auto-Save', () => {
    beforeEach(() => {
      autoSaveService.enable();
      vi.mocked(resumeApi.updateResume).mockResolvedValue(mockResume);
    });

    it('should debounce saves with 2-second delay', async () => {
      autoSaveService.triggerSave(mockResume);
      
      // Should not save immediately
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Should not save after 1 second
      vi.advanceTimersByTime(1000);
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Should save after 2 seconds
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(resumeApi.updateResume).toHaveBeenCalledWith('1', mockResume);
    });

    it('should reset debounce timer on multiple rapid saves', async () => {
      autoSaveService.triggerSave(mockResume);
      
      // Trigger another save after 1 second
      vi.advanceTimersByTime(1000);
      autoSaveService.triggerSave({ ...mockResume, summary: 'Updated' });
      
      // Should not have saved yet
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      
      // Should save 2 seconds after the last trigger
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(resumeApi.updateResume).toHaveBeenCalledWith('1', expect.objectContaining({
        summary: 'Updated'
      }));
    });

    it('should handle multiple rapid saves correctly', async () => {
      // Trigger multiple saves rapidly
      autoSaveService.triggerSave(mockResume);
      autoSaveService.triggerSave({ ...mockResume, summary: 'Update 1' });
      autoSaveService.triggerSave({ ...mockResume, summary: 'Update 2' });
      autoSaveService.triggerSave({ ...mockResume, summary: 'Final Update' });
      
      // Should only save once after debounce period
      vi.advanceTimersByTime(2000);
      await vi.runAllTimersAsync();
      
      expect(resumeApi.updateResume).toHaveBeenCalledTimes(1);
      expect(resumeApi.updateResume).toHaveBeenCalledWith('1', expect.objectContaining({
        summary: 'Final Update'
      }));
    });
  });

  describe('Force Save', () => {
    beforeEach(() => {
      autoSaveService.enable();
      vi.mocked(resumeApi.updateResume).mockResolvedValue(mockResume);
    });

    it('should save immediately without debouncing', async () => {
      const result = await autoSaveService.forceSave(mockResume);
      
      expect(result.success).toBe(true);
      expect(result.source).toBe('both');
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(resumeApi.updateResume).toHaveBeenCalledWith('1', mockResume);
    });

    it('should clear pending debounced save when force saving', async () => {
      // Start a debounced save
      autoSaveService.triggerSave(mockResume);
      
      // Force save immediately
      const result = await autoSaveService.forceSave({ ...mockResume, summary: 'Force saved' });
      
      expect(result.success).toBe(true);
      expect(resumeApi.updateResume).toHaveBeenCalledWith('1', expect.objectContaining({
        summary: 'Force saved'
      }));
      
      // Advance time to ensure debounced save doesn't happen
      vi.advanceTimersByTime(3000);
      await vi.runAllTimersAsync();
      
      // Should only have been called once (from force save)
      expect(resumeApi.updateResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('Save Status Tracking', () => {
    beforeEach(() => {
      autoSaveService.enable();
    });

    it('should track save status correctly', async () => {
      const statusUpdates: SaveStatus[] = [];
      autoSaveService.onStatusChange((status) => {
        statusUpdates.push(status);
      });

      vi.mocked(resumeApi.updateResume).mockResolvedValue(mockResume);

      const savePromise = autoSaveService.forceSave(mockResume);
      
      // Should be saving
      expect(statusUpdates).toContain('saving');
      
      await savePromise;
      
      // Should be saved
      expect(statusUpdates).toContain('saved');
      expect(autoSaveService.getSaveStatus()).toBe('saved');
    });

    it('should track error status on save failure', async () => {
      const statusUpdates: SaveStatus[] = [];
      autoSaveService.onStatusChange((status) => {
        statusUpdates.push(status);
      });

      // Mock both localStorage and API to fail
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage failed');
      });
      vi.mocked(resumeApi.updateResume).mockRejectedValue(new Error('API failed'));

      const result = await autoSaveService.forceSave(mockResume);
      
      expect(result.success).toBe(false);
      expect(statusUpdates).toContain('error');
      expect(autoSaveService.getSaveStatus()).toBe('error');
    });

    it('should update last save time on successful save', async () => {
      vi.mocked(resumeApi.updateResume).mockResolvedValue(mockResume);
      
      expect(autoSaveService.getLastSaveTime()).toBeNull();
      
      await autoSaveService.forceSave(mockResume);
      
      expect(autoSaveService.getLastSaveTime()).toBeInstanceOf(Date);
    });
  });

  describe('Callback Management', () => {
    beforeEach(() => {
      autoSaveService.enable();
      vi.mocked(resumeApi.updateResume).mockResolvedValue(mockResume);
    });

    it('should notify status change callbacks', async () => {
      const statusCallback = vi.fn();
      const unsubscribe = autoSaveService.onStatusChange(statusCallback);
      
      await autoSaveService.forceSave(mockResume);
      
      expect(statusCallback).toHaveBeenCalledWith('saving');
      expect(statusCallback).toHaveBeenCalledWith('saved');
      
      unsubscribe();
      
      // Should not be called after unsubscribe
      statusCallback.mockClear();
      await autoSaveService.forceSave(mockResume);
      expect(statusCallback).not.toHaveBeenCalled();
    });

    it('should notify save complete callbacks', async () => {
      const saveCallback = vi.fn();
      const unsubscribe = autoSaveService.onSaveComplete(saveCallback);
      
      const result = await autoSaveService.forceSave(mockResume);
      
      expect(saveCallback).toHaveBeenCalledWith(result);
      
      unsubscribe();
      
      // Should not be called after unsubscribe
      saveCallback.mockClear();
      await autoSaveService.forceSave(mockResume);
      expect(saveCallback).not.toHaveBeenCalled();
    });
  });

  describe('LocalStorage Operations', () => {
    beforeEach(() => {
      autoSaveService.enable();
    });

    it('should save to localStorage with backup', async () => {
      vi.mocked(resumeApi.updateResume).mockResolvedValue(mockResume);
      
      await autoSaveService.forceSave(mockResume);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'resume_1',
        expect.stringContaining('"name":"Alex Morgan"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'resume_1_backup',
        expect.stringContaining('"name":"Alex Morgan"')
      );
    });

    it('should load from localStorage', async () => {
      const savedData = JSON.stringify({
        ...mockResume,
        lastSaved: new Date().toISOString(),
      });
      localStorageMock.getItem.mockReturnValue(savedData);
      
      const result = await autoSaveService.loadFromLocalStorage();
      
      expect(result).toEqual(expect.objectContaining({
        personalInfo: expect.objectContaining({
          name: 'Alex Morgan',
        }),
      }));
    });

    it('should load from backup when main storage fails', async () => {
      const backupData = JSON.stringify({
        ...mockResume,
        lastSaved: new Date().toISOString(),
      });
      
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'resume_1') {
          throw new Error('Corrupted data');
        }
        if (key === 'resume_1_backup') {
          return backupData;
        }
        return null;
      });
      
      const result = await autoSaveService.loadFromLocalStorage();
      
      expect(result).toEqual(expect.objectContaining({
        personalInfo: expect.objectContaining({
          name: 'Alex Morgan',
        }),
      }));
    });

    it('should detect unsaved changes', async () => {
      const savedData = JSON.stringify(mockResume);
      localStorageMock.getItem.mockReturnValue(savedData);
      
      // Same data - no unsaved changes
      let hasChanges = await autoSaveService.hasUnsavedChanges(mockResume);
      expect(hasChanges).toBe(false);
      
      // Different data - has unsaved changes
      const modifiedResume = { ...mockResume, summary: 'Modified summary' };
      hasChanges = await autoSaveService.hasUnsavedChanges(modifiedResume);
      expect(hasChanges).toBe(true);
    });

    it('should clear localStorage', () => {
      autoSaveService.clearLocalStorage();
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('resume_1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('resume_1_backup');
    });
  });
});

describe('AutoSaveService - Retry Logic and Conflict Resolution', () => {
  let autoSaveService: AutoSaveService;
  let mockResume: Resume;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true });
    
    // Clear event listeners
    Object.keys(eventListeners).forEach(key => {
      eventListeners[key] = [];
    });

    mockResume = {
      id: '1',
      personalInfo: {
        name: 'Alex Morgan',
        title: 'Software Engineer',
        email: 'john@example.com',
        phone: '123-456-7890',
        location: 'Anytown, ST',
      },
      summary: 'Test summary',
      objective: 'Test objective',
      experiences: [],
      education: [],
      skills: [],
      projects: [],
      upvotes: 0,
      rating: 0,
      isShortlisted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    autoSaveService = new AutoSaveService({
      resumeId: '1',
      maxRetries: 3,
      retryDelayMs: 100, // Short delay for tests
      maxRetryDelayMs: 1000,
      enableOfflineQueue: true,
    });
    
    autoSaveService.enable();
  });

  afterEach(() => {
    autoSaveService.cleanup();
    vi.clearAllTimers();
  });

  describe('Exponential Backoff Retry Logic', () => {
    it('should retry API saves with exponential backoff on network errors', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      
      // First two calls fail with network error, third succeeds
      mockUpdateResume
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(undefined);

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(2);
      expect(result.source).toBe('both'); // localStorage + API
      expect(mockUpdateResume).toHaveBeenCalledTimes(3);
    });

    it('should respect maxRetries limit', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      
      // All calls fail
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true); // localStorage should succeed
      expect(result.source).toBe('localStorage');
      expect(mockUpdateResume).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry on client errors (4xx)', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      
      const clientError = new Error('Bad Request');
      (clientError as any).status = 400;
      mockUpdateResume.mockRejectedValue(clientError);

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true); // localStorage should succeed
      expect(result.source).toBe('localStorage');
      expect(mockUpdateResume).toHaveBeenCalledTimes(1); // No retries
    });

    it('should retry on server errors (5xx)', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      
      const serverError = new Error('Internal Server Error');
      (serverError as any).status = 500;
      mockUpdateResume
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce(undefined);

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
      expect(mockUpdateResume).toHaveBeenCalledTimes(2);
    });

    it('should retry on rate limiting (429)', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      
      const rateLimitError = new Error('Too Many Requests');
      (rateLimitError as any).status = 429;
      mockUpdateResume
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(undefined);

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true);
      expect(result.retryCount).toBe(1);
      expect(mockUpdateResume).toHaveBeenCalledTimes(2);
    });

    it('should calculate exponential backoff delays correctly', async () => {
      const service = new AutoSaveService({
        retryDelayMs: 1000,
        maxRetryDelayMs: 10000,
      });

      // Access private method for testing
      const calculateRetryDelay = (service as any).calculateRetryDelay.bind(service);

      const delay1 = calculateRetryDelay(1);
      const delay2 = calculateRetryDelay(2);
      const delay3 = calculateRetryDelay(3);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(3000); // 1000 + jitter
      
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(4000); // 2000 + jitter
      
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(6000); // 4000 + jitter
    });
  });

  describe('LocalStorage Fallback', () => {
    it('should fall back to localStorage when API fails permanently', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('Permanent API failure'));

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true);
      expect(result.source).toBe('localStorage');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'resume_1',
        expect.stringContaining('"name":"Alex Morgan"')
      );
    });

    it('should save to both localStorage and API when both succeed', async () => {
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockResolvedValue(undefined);

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true);
      expect(result.source).toBe('both');
      expect(localStorageMock.setItem).toHaveBeenCalled();
      expect(mockUpdateResume).toHaveBeenCalled();
    });

    it('should handle localStorage quota exceeded error', async () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      localStorageMock.setItem.mockImplementation(() => {
        throw quotaError;
      });

      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockResolvedValue(undefined);

      const result = await autoSaveService.forceSave(mockResume);

      expect(result.success).toBe(true);
      expect(result.source).toBe('api');
      expect(result.error).toBeUndefined();
    });
  });

  describe('Offline Queue Management', () => {
    it('should queue saves when offline', async () => {
      // Create a new service instance with offline state
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set the service to offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      const result = await offlineService.forceSave(mockResume);

      expect(result.queuedForRetry).toBe(true);
      expect(result.source).toBe('localStorage');
      
      const queueStatus = offlineService.getSaveQueueStatus();
      expect(queueStatus.count).toBe(1);
      expect(queueStatus.items[0].resumeData).toEqual(mockResume);
      
      offlineService.cleanup();
    });

    it('should process queue when coming back online', async () => {
      // Create offline service
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      // Queue a save while offline
      await offlineService.forceSave(mockResume);
      
      expect(offlineService.getSaveQueueStatus().count).toBe(1);

      // Come back online
      (offlineService as any).isOnline = true;
      mockUpdateResume.mockResolvedValue(undefined);
      
      // Trigger online event processing
      await (offlineService as any).processOfflineQueue();
      
      expect(offlineService.getSaveQueueStatus().count).toBe(0);
      expect(mockUpdateResume).toHaveBeenCalledWith('1', mockResume);
      
      offlineService.cleanup();
    });

    it('should persist queue to localStorage', async () => {
      // Create offline service
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      await offlineService.forceSave(mockResume);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'save_queue_1',
        expect.stringContaining('"resumeData"')
      );
      
      offlineService.cleanup();
    });

    it('should load existing queue on startup', async () => {
      const queueData = JSON.stringify([{
        id: 'test-id',
        resumeData: mockResume,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        lastAttempt: new Date().toISOString(),
        priority: 'normal'
      }]);

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'save_queue_1') return queueData;
        return null;
      });

      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockResolvedValue(undefined);

      // Create new service instance to trigger startup processing
      const newService = new AutoSaveService({ resumeId: '1' });
      
      // Wait for startup processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockUpdateResume).toHaveBeenCalledWith('1', mockResume);
      
      newService.cleanup();
    });

    it('should prioritize high priority items in queue', async () => {
      // Create offline service
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      // Add normal priority item
      await offlineService.forceSave(mockResume);
      
      // Manually add high priority item to queue
      const highPriorityResume = { ...mockResume, summary: 'High Priority Summary' };
      const service = offlineService as any;
      service.saveQueue.push({
        id: 'high-priority',
        resumeData: highPriorityResume,
        timestamp: new Date().toISOString(),
        retryCount: 0,
        lastAttempt: new Date().toISOString(),
        priority: 'high'
      });

      // Come back online
      (offlineService as any).isOnline = true;
      mockUpdateResume.mockResolvedValue(undefined);
      
      const updateCalls: any[] = [];
      mockUpdateResume.mockImplementation((id, resume) => {
        updateCalls.push(resume);
        return Promise.resolve();
      });

      await service.processOfflineQueue();

      expect(updateCalls.length).toBe(2);
      expect(updateCalls[0].summary).toBe('High Priority Summary');
      expect(updateCalls[1].summary).toBe('Test summary');
      
      offlineService.cleanup();
    });
  });

  describe('Status Management', () => {
    it('should update status during retry attempts', async () => {
      const statusUpdates: SaveStatus[] = [];
      autoSaveService.onStatusChange((status) => {
        statusUpdates.push(status);
      });

      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(undefined);

      await autoSaveService.forceSave(mockResume);

      expect(statusUpdates).toContain('saving');
      expect(statusUpdates).toContain('retrying');
      expect(statusUpdates).toContain('saved');
    });

    it('should set status to offline when network is unavailable', async () => {
      // Create offline service
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const statusUpdates: SaveStatus[] = [];
      offlineService.onStatusChange((status) => {
        statusUpdates.push(status);
      });

      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      await offlineService.forceSave(mockResume);

      expect(statusUpdates).toContain('offline');
      
      offlineService.cleanup();
    });

    it('should notify save callbacks with retry information', async () => {
      const saveResults: SaveResult[] = [];
      autoSaveService.onSaveComplete((result) => {
        saveResults.push(result);
      });

      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValueOnce(undefined);

      await autoSaveService.forceSave(mockResume);

      const finalResult = saveResults[saveResults.length - 1];
      expect(finalResult.retryCount).toBe(1);
      expect(finalResult.success).toBe(true);
    });
  });

  describe('Queue Management Methods', () => {
    it('should clear save queue', async () => {
      // Create offline service
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      await offlineService.forceSave(mockResume);
      expect(offlineService.getSaveQueueStatus().count).toBe(1);

      offlineService.clearSaveQueue();
      expect(offlineService.getSaveQueueStatus().count).toBe(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('save_queue_1');
      
      offlineService.cleanup();
    });

    it('should force process queue manually', async () => {
      // Create offline service
      const offlineService = new AutoSaveService({
        resumeId: '1',
        maxRetries: 3,
        retryDelayMs: 100,
        enableOfflineQueue: true,
      });
      
      // Set offline state
      (offlineService as any).isOnline = false;
      offlineService.enable();
      
      const mockUpdateResume = vi.mocked(resumeApi.updateResume);
      mockUpdateResume.mockRejectedValue(new Error('network error'));

      await offlineService.forceSave(mockResume);
      expect(offlineService.getSaveQueueStatus().count).toBe(1);

      // Come back online but don't trigger event
      (offlineService as any).isOnline = true;
      mockUpdateResume.mockResolvedValue(undefined);

      await offlineService.forceProcessQueue();
      
      expect(offlineService.getSaveQueueStatus().count).toBe(0);
      expect(mockUpdateResume).toHaveBeenCalledWith('1', mockResume);
      
      offlineService.cleanup();
    });
  });

  describe('Cleanup and Memory Management', () => {
    it('should clear retry timers on cleanup', () => {
      const service = autoSaveService as any;
      
      // Add some mock timers
      service.retryTimers.set('test1', setTimeout(() => {}, 1000));
      service.retryTimers.set('test2', setTimeout(() => {}, 2000));

      expect(service.retryTimers.size).toBe(2);

      autoSaveService.cleanup();

      expect(service.retryTimers.size).toBe(0);
    });

    it('should remove event listeners on cleanup', () => {
      autoSaveService.cleanup();

      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });
  });
});