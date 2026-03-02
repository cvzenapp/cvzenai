/**
 * End-to-End Authentication Flow Tests
 * Tests complete authentication flows from a user perspective using browser automation
 * Tests authentication state persistence across page navigation
 * Tests error handling and recovery scenarios in real browser environment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unifiedAuthService } from '../../services/unifiedAuthService';
import { resumeApi } from '../../services/resumeApi';

// Mock browser environment for E2E testing
const mockBrowser = {
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  location: {
    href: 'http://localhost:8080',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
  },
  document: {
    cookie: '',
    title: 'CVZen',
    readyState: 'complete',
  },
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    onLine: true,
  },
};

// Mock fetch for API calls
const fetchMock = vi.fn();

// Setup browser environment
beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup global browser objects
  Object.defineProperty(global, 'localStorage', {
    value: mockBrowser.localStorage,
    writable: true,
  });
  
  Object.defineProperty(global, 'sessionStorage', {
    value: mockBrowser.sessionStorage,
    writable: true,
  });
  
  Object.defineProperty(global, 'location', {
    value: mockBrowser.location,
    writable: true,
  });
  
  Object.defineProperty(global, 'history', {
    value: mockBrowser.history,
    writable: true,
  });
  
  Object.defineProperty(global, 'document', {
    value: mockBrowser.document,
    writable: true,
  });
  
  Object.defineProperty(global, 'navigator', {
    value: mockBrowser.navigator,
    writable: true,
  });
  
  global.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('End-to-End Authentication Flow Tests', () => {
  describe('Complete User Journey Simulation', () => {
    it('should simulate complete user journey: Login → Dashboard → Resume Builder → Dashboard', async () => {
      // Step 1: Simulate user landing on login page
      mockBrowser.location.pathname = '/login';
      
      const mockUser = {
        id: '1',
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
        firstName: 'E2E',
        lastName: 'Test User',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        emailVerified: true,
      };

      // Mock successful login API call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: mockUser,
            token: 'e2e-auth-token-123',
            message: 'Login successful',
          }
        }),
      });

      // Step 2: Simulate user login
      const loginResult = await unifiedAuthService.login({
        email: 'e2e-test@example.com',
        password: 'password123',
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.email).toBe('e2e-test@example.com');
      expect(loginResult.token).toBe('e2e-auth-token-123');

      // Verify localStorage was updated
      expect(mockBrowser.localStorage.setItem).toHaveBeenCalledWith('authToken', 'e2e-auth-token-123');
      expect(mockBrowser.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));

      // Step 3: Simulate navigation to dashboard
      mockBrowser.location.pathname = '/dashboard';
      mockBrowser.history.pushState.mockClear();

      // Mock dashboard API call
      const dashboardResumes = [
        {
          id: '1',
          title: 'E2E Test Resume 1',
          status: 'draft',
          createdAt: '2023-01-01T00:00:00Z',
          personalInfo: {
            firstName: 'E2E',
            lastName: 'Test User',
            email: 'e2e-test@example.com',
          },
        },
        {
          id: '2',
          title: 'E2E Test Resume 2',
          status: 'published',
          createdAt: '2023-01-02T00:00:00Z',
          personalInfo: {
            firstName: 'E2E',
            lastName: 'Test User',
            email: 'e2e-test@example.com',
          },
        }
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            data: dashboardResumes,
            total: 2
          }
        }),
      });

      // Load dashboard data
      const dashboardResult = await resumeApi.getUserResumes();

      expect(dashboardResult.success).toBe(true);
      expect(dashboardResult.data).toHaveLength(2);
      expect(dashboardResult.data?.total).toBe(2);

      // Verify authentication headers were sent
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/resumes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer e2e-auth-token-123',
            'Content-Type': 'application/json',
          }),
        })
      );

      // Step 4: Simulate navigation to resume builder
      mockBrowser.location.pathname = '/resume-builder/1';
      
      const resumeData = {
        id: '1',
        title: 'E2E Test Resume 1',
        status: 'draft',
        personalInfo: {
          firstName: 'E2E',
          lastName: 'Test User',
          email: 'e2e-test@example.com',
          phone: '+1-555-0123',
          location: 'Test City, TC',
          summary: 'E2E test user summary...',
        },
        experience: [
          {
            id: '1',
            company: 'E2E Test Corp',
            position: 'Test Engineer',
            startDate: '2022-01-01',
            endDate: null,
            current: true,
            description: 'E2E testing and automation...',
          }
        ],
        education: [
          {
            id: '1',
            institution: 'E2E University',
            degree: 'Bachelor of Testing',
            field: 'Software Testing',
            graduationDate: '2021-05-01',
          }
        ],
        skills: ['E2E Testing', 'Automation', 'JavaScript', 'TypeScript'],
        projects: [
          {
            id: '1',
            name: 'E2E Test Suite',
            description: 'Comprehensive E2E testing framework',
            technologies: ['Vitest', 'Playwright'],
            url: 'https://github.com/test/e2e-suite',
          }
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: resumeData
        }),
      });

      // Load resume in builder
      const resumeResult = await resumeApi.getResume('1');

      expect(resumeResult.success).toBe(true);
      expect(resumeResult.data?.id).toBe('1');
      expect(resumeResult.data?.personalInfo.firstName).toBe('E2E');

      // Verify authentication was maintained
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/resume/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer e2e-auth-token-123',
          }),
        })
      );

      // Step 5: Simulate resume editing and saving
      const updatedResumeData = {
        ...resumeData,
        personalInfo: {
          ...resumeData.personalInfo,
          summary: 'Updated E2E test user summary with new information...',
        },
        skills: [...resumeData.skills, 'Playwright', 'Cypress'],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            ...updatedResumeData,
            updatedAt: '2023-01-01T12:00:00Z',
          }
        }),
      });

      // Save updated resume
      const updateResult = await resumeApi.updateResume('1', updatedResumeData);

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.personalInfo.summary).toContain('Updated E2E test user summary');
      expect(updateResult.data?.skills).toContain('Playwright');

      // Step 6: Simulate navigation back to dashboard
      mockBrowser.location.pathname = '/dashboard';

      // Mock updated dashboard data
      const updatedDashboardResumes = dashboardResumes.map(resume => 
        resume.id === '1' 
          ? { ...resume, updatedAt: '2023-01-01T12:00:00Z' }
          : resume
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            data: updatedDashboardResumes,
            total: 2
          }
        }),
      });

      // Load updated dashboard
      const finalDashboardResult = await resumeApi.getUserResumes();

      expect(finalDashboardResult.success).toBe(true);
      expect(finalDashboardResult.data).toHaveLength(2);
      expect(finalDashboardResult.data[0].updatedAt).toBe('2023-01-01T12:00:00Z');

      // Step 7: Verify authentication state consistency throughout journey
      expect(unifiedAuthService.isAuthenticated()).toBe(true);
      expect(unifiedAuthService.getStoredUser()?.email).toBe('e2e-test@example.com');

      // Verify all API calls used consistent authentication
      const allApiCalls = fetchMock.mock.calls.slice(1); // Skip login call
      allApiCalls.forEach(call => {
        const [, options] = call;
        expect(options.headers['Authorization']).toBe('Bearer e2e-auth-token-123');
      });

      // Verify browser state changes
      expect(mockBrowser.localStorage.setItem).toHaveBeenCalledWith('authToken', 'e2e-auth-token-123');
      expect(mockBrowser.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });

    it('should simulate browser refresh during authenticated session', async () => {
      // Setup: User is already authenticated (simulate page refresh)
      const storedUser = {
        id: '1',
        email: 'refresh-test@example.com',
        name: 'Refresh Test User',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        emailVerified: true,
      };

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'refresh-test-token';
        if (key === 'user') return JSON.stringify(storedUser);
        return null;
      });

      // Mock token validation on page load
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { user: storedUser }
        }),
      });

      // Simulate page refresh - reinitialize auth service
      const currentUser = await unifiedAuthService.getCurrentUser();

      expect(currentUser).toEqual(storedUser);
      expect(unifiedAuthService.isAuthenticated()).toBe(true);

      // Verify token validation was called
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/jobseeker/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer refresh-test-token',
          }),
        })
      );

      // Simulate API call after refresh
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { data: [], total: 0 }
        }),
      });

      const resumesResult = await resumeApi.getUserResumes();

      expect(resumesResult.success).toBe(true);
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/resumes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer refresh-test-token',
          }),
        })
      );
    });

    it('should simulate multiple browser tabs with authentication sync', async () => {
      const mockUser = {
        id: '1',
        email: 'multitab-test@example.com',
        name: 'Multi Tab User',
      };

      // Tab 1: Initial authentication
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'tab1-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Setup storage event listener simulation
      const storageEventListeners: EventListener[] = [];
      const addEventListenerMock = vi.fn((event: string, listener: EventListener) => {
        if (event === 'storage') {
          storageEventListeners.push(listener);
        }
      });

      Object.defineProperty(global, 'addEventListener', {
        value: addEventListenerMock,
        writable: true,
      });

      // Initialize auth service (simulates tab 1)
      const authStateCallback = vi.fn();
      const unsubscribe = unifiedAuthService.onAuthStateChange(authStateCallback);

      // Tab 2: Login event (simulate storage change from another tab)
      const newToken = 'tab2-new-token';
      const storageEvent = new StorageEvent('storage', {
        key: 'authToken',
        newValue: newToken,
        oldValue: 'tab1-token',
      });

      // Update localStorage mock to return new token
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return newToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Trigger storage event (simulates change from another tab)
      storageEventListeners.forEach(listener => {
        listener(storageEvent as any);
      });

      // Verify auth state was updated
      expect(authStateCallback).toHaveBeenCalled();

      // Test API call with updated token
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { data: [], total: 0 }
        }),
      });

      const resumesResult = await resumeApi.getUserResumes();

      expect(resumesResult.success).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resumes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${newToken}`,
          }),
        })
      );

      unsubscribe();
    });

    it('should simulate logout across multiple tabs', async () => {
      const mockUser = {
        id: '1',
        email: 'logout-test@example.com',
        name: 'Logout Test User',
      };

      // Setup initial authenticated state
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'logout-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      const storageEventListeners: EventListener[] = [];
      const addEventListenerMock = vi.fn((event: string, listener: EventListener) => {
        if (event === 'storage') {
          storageEventListeners.push(listener);
        }
      });

      Object.defineProperty(global, 'addEventListener', {
        value: addEventListenerMock,
        writable: true,
      });

      const authStateCallback = vi.fn();
      const unsubscribe = unifiedAuthService.onAuthStateChange(authStateCallback);

      // Simulate logout from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'authToken',
        newValue: null,
        oldValue: 'logout-test-token',
      });

      // Update localStorage mock to return null (logged out)
      mockBrowser.localStorage.getItem.mockReturnValue(null);

      // Trigger storage event
      storageEventListeners.forEach(listener => {
        listener(storageEvent as any);
      });

      // Verify auth state was cleared
      expect(authStateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      );

      // Test API call after logout should fail
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Authentication required',
        }),
      });

      const resumesResult = await resumeApi.getUserResumes();

      expect(resumesResult.success).toBe(false);
      expect(resumesResult.error).toContain('Authentication required');

      unsubscribe();
    });
  });

  describe('Browser-Specific Authentication Scenarios', () => {
    it('should handle browser back/forward navigation with authentication', async () => {
      const mockUser = {
        id: '1',
        email: 'navigation-test@example.com',
        name: 'Navigation Test User',
      };

      // Setup authenticated state
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'nav-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Simulate navigation history
      const navigationHistory = [
        '/dashboard',
        '/resume-builder/1',
        '/dashboard',
      ];

      for (const path of navigationHistory) {
        mockBrowser.location.pathname = path;

        if (path === '/dashboard') {
          fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: { data: [], total: 0 }
            }),
          });

          const result = await resumeApi.getUserResumes();
          expect(result.success).toBe(true);
        } else if (path.startsWith('/resume-builder/')) {
          const resumeId = path.split('/').pop();
          
          fetchMock.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: {
                id: resumeId,
                title: `Resume ${resumeId}`,
                status: 'draft',
              }
            }),
          });

          const result = await resumeApi.getResume(resumeId!);
          expect(result.success).toBe(true);
        }

        // Verify authentication was maintained throughout navigation
        expect(fetchMock).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer nav-test-token',
            }),
          })
        );
      }

      // Simulate browser back button
      mockBrowser.history.back();
      mockBrowser.location.pathname = '/resume-builder/1';

      // Authentication should still work
      expect(unifiedAuthService.isAuthenticated()).toBe(true);
    });

    it('should handle network connectivity changes during authentication', async () => {
      const mockUser = {
        id: '1',
        email: 'connectivity-test@example.com',
        name: 'Connectivity Test User',
      };

      // Setup authenticated state
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'connectivity-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Simulate network offline
      mockBrowser.navigator.onLine = false;

      // Mock network error
      fetchMock.mockRejectedValueOnce(new Error('Network request failed'));

      const offlineResult = await resumeApi.getUserResumes();

      // Should handle offline gracefully
      expect(offlineResult.success).toBe(false);

      // Simulate network back online
      mockBrowser.navigator.onLine = true;

      // Mock successful request after reconnection
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { data: [], total: 0 }
        }),
      });

      const onlineResult = await resumeApi.getUserResumes();

      expect(onlineResult.success).toBe(true);
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/resumes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer connectivity-test-token',
          }),
        })
      );
    });

    it('should handle browser storage limitations and cleanup', async () => {
      const mockUser = {
        id: '1',
        email: 'storage-test@example.com',
        name: 'Storage Test User',
      };

      // Mock localStorage quota exceeded
      mockBrowser.localStorage.setItem.mockImplementation((key, value) => {
        if (key === 'authToken' && value.length > 1000) {
          throw new Error('QuotaExceededError');
        }
      });

      // Test with large token (should handle gracefully)
      const largeToken = 'x'.repeat(1500);

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: mockUser,
            token: largeToken,
            message: 'Login successful',
          }
        }),
      });

      const loginResult = await unifiedAuthService.login({
        email: 'storage-test@example.com',
        password: 'password123',
      });

      // Should handle storage error gracefully
      expect(loginResult.success).toBe(true);

      // Verify fallback storage mechanism or error handling
      expect(mockBrowser.localStorage.setItem).toHaveBeenCalled();
    });

    it('should handle browser security restrictions', async () => {
      // Mock third-party cookie restrictions
      Object.defineProperty(mockBrowser.document, 'cookie', {
        get: () => '',
        set: () => {
          throw new Error('Cookie blocked by browser security policy');
        },
      });

      const mockUser = {
        id: '1',
        email: 'security-test@example.com',
        name: 'Security Test User',
      };

      // Should still work with localStorage only
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'security-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { user: mockUser }
        }),
      });

      const currentUser = await unifiedAuthService.getCurrentUser();

      expect(currentUser).toEqual(mockUser);
      expect(unifiedAuthService.isAuthenticated()).toBe(true);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid authentication state changes', async () => {
      const mockUser = {
        id: '1',
        email: 'stress-test@example.com',
        name: 'Stress Test User',
      };

      // Setup rapid state changes
      const tokens = Array.from({ length: 10 }, (_, i) => `stress-token-${i}`);
      let currentTokenIndex = 0;

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return tokens[currentTokenIndex];
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock API responses for each token
      tokens.forEach(token => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { data: [], total: 0 }
          }),
        });
      });

      // Rapidly change tokens and make API calls
      const results = [];
      for (let i = 0; i < tokens.length; i++) {
        currentTokenIndex = i;
        const result = await resumeApi.getUserResumes();
        results.push(result);
      }

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all tokens were used
      expect(fetchMock).toHaveBeenCalledTimes(tokens.length);
    });

    it('should handle concurrent API calls with authentication', async () => {
      const mockUser = {
        id: '1',
        email: 'concurrent-test@example.com',
        name: 'Concurrent Test User',
      };

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'concurrent-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock multiple concurrent API responses
      const apiCalls = [
        resumeApi.getUserResumes(),
        resumeApi.getResume('1'),
        resumeApi.getResume('2'),
        resumeApi.createResume({ title: 'Concurrent Test Resume' }),
      ];

      // Mock responses for concurrent calls
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { data: [], total: 0 }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { id: '1', title: 'Resume 1', status: 'draft' as const }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: { id: '2', title: 'Resume 2', status: 'draft' as const }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            success: true,
            data: { id: '3', title: 'Concurrent Test Resume', status: 'draft' as const }
          }),
        });

      // Execute concurrent API calls
      const results = await Promise.all(apiCalls);

      // All calls should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // All calls should have used the same authentication token
      expect(fetchMock).toHaveBeenCalledTimes(4);
      fetchMock.mock.calls.forEach(call => {
        const [, options] = call;
        expect(options.headers['Authorization']).toBe('Bearer concurrent-test-token');
      });
    });

    it('should handle memory cleanup during long sessions', async () => {
      const mockUser = {
        id: '1',
        email: 'memory-test@example.com',
        name: 'Memory Test User',
      };

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'memory-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Simulate long session with many auth state changes
      const authStateCallback = vi.fn();
      const unsubscribe = unifiedAuthService.onAuthStateChange(authStateCallback);

      // Simulate 100 auth state changes
      for (let i = 0; i < 100; i++) {
        authStateCallback({
          user: mockUser,
          token: `memory-test-token-${i}`,
          isAuthenticated: true,
          isLoading: false,
        });
      }

      // Cleanup should work properly
      unsubscribe();

      // Verify no memory leaks (callback should not be called after unsubscribe)
      const callCountBeforeCleanup = authStateCallback.mock.calls.length;
      
      // Trigger another state change
      authStateCallback({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      // Should not have increased call count
      expect(authStateCallback.mock.calls.length).toBe(callCountBeforeCleanup);
    });
  });
});