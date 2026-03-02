/**
 * Authentication Flow Integration Tests
 * Tests complete authentication flows including login → dashboard → resume builder → dashboard
 * Tests authentication state persistence across page navigation
 * Tests error handling and recovery scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unifiedAuthService } from '../../services/unifiedAuthService';
import { resumeApi } from '../../services/resumeApi';
import { AuthErrorType } from '../../services/authErrorHandler';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock fetch
const fetchMock = vi.fn();

// Mock window events
const windowEventListeners: { [key: string]: EventListener[] } = {};
const windowMock = {
  addEventListener: vi.fn((event: string, listener: EventListener) => {
    if (!windowEventListeners[event]) {
      windowEventListeners[event] = [];
    }
    windowEventListeners[event].push(listener);
  }),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
};

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset window event listeners
  Object.keys(windowEventListeners).forEach(key => {
    windowEventListeners[key] = [];
  });
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  
  Object.defineProperty(window, 'addEventListener', {
    value: windowMock.addEventListener,
    writable: true,
  });
  
  global.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Authentication Flow Integration Tests', () => {
  describe('Complete User Journey: Login → Dashboard → Resume Builder → Dashboard', () => {
    it('should maintain authentication state throughout complete user journey', async () => {
      // Step 1: User logs in
      const loginResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            firstName: 'Test',
            lastName: 'User',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            emailVerified: true,
          },
          token: 'test-auth-token-123',
          message: 'Login successful',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginResponse),
      });

      const loginResult = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.email).toBe('test@example.com');
      expect(loginResult.token).toBe('test-auth-token-123');
      
      // Verify auth state is stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'test-auth-token-123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', expect.any(String));

      // Step 2: Navigate to Dashboard - Load user resumes
      const dashboardResumesResponse = {
        success: true,
        data: {
          data: [
            {
              id: '1',
              title: 'Software Engineer Resume',
              status: 'draft',
              createdAt: '2023-01-01T00:00:00Z',
              personalInfo: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
              },
            },
            {
              id: '2',
              title: 'Senior Developer Resume',
              status: 'published',
              createdAt: '2023-01-02T00:00:00Z',
              personalInfo: {
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
              },
            }
          ],
          total: 2
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dashboardResumesResponse),
      });

      const dashboardResult = await resumeApi.getUserResumes();

      expect(dashboardResult.success).toBe(true);
      expect(dashboardResult.data).toHaveLength(2);
      expect(dashboardResult.total).toBe(2);

      // Verify correct authentication headers were sent
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resumes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-auth-token-123',
            'Content-Type': 'application/json',
          }),
        })
      );

      // Step 3: Navigate to Resume Builder - Load specific resume
      const resumeBuilderResponse = {
        success: true,
        data: {
          id: '1',
          title: 'Software Engineer Resume',
          status: 'draft',
          personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            phone: '+1-555-0123',
            location: 'San Francisco, CA',
            summary: 'Experienced software engineer...',
          },
          experience: [
            {
              id: '1',
              company: 'Tech Corp',
              position: 'Software Engineer',
              startDate: '2022-01-01',
              endDate: null,
              current: true,
              description: 'Developed web applications...',
            }
          ],
          education: [
            {
              id: '1',
              institution: 'University of Technology',
              degree: 'Bachelor of Science',
              field: 'Computer Science',
              graduationDate: '2021-05-01',
            }
          ],
          skills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          projects: [],
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(resumeBuilderResponse),
      });

      const resumeBuilderResult = await resumeApi.getResume('1');

      expect(resumeBuilderResult.success).toBe(true);
      expect(resumeBuilderResult.data?.id).toBe('1');
      expect(resumeBuilderResult.data?.personalInfo.firstName).toBe('Test');

      // Verify correct authentication headers were sent
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resume/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-auth-token-123',
          }),
        })
      );

      // Step 4: Update resume in Resume Builder
      const updateData = {
        personalInfo: {
          ...resumeBuilderResponse.data.personalInfo,
          summary: 'Updated summary: Experienced software engineer with 3+ years...',
        }
      };

      const updateResponse = {
        success: true,
        data: {
          ...resumeBuilderResponse.data,
          ...updateData,
          updatedAt: '2023-01-01T12:00:00Z',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updateResponse),
      });

      const updateResult = await resumeApi.updateResume('1', updateData);

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.personalInfo.summary).toContain('Updated summary');

      // Step 5: Navigate back to Dashboard - Verify updated data
      const updatedDashboardResponse = {
        success: true,
        data: {
          data: [
            {
              ...dashboardResumesResponse.data.data[0],
              updatedAt: '2023-01-01T12:00:00Z',
            },
            dashboardResumesResponse.data.data[1]
          ],
          total: 2
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedDashboardResponse),
      });

      const finalDashboardResult = await resumeApi.getUserResumes();

      expect(finalDashboardResult.success).toBe(true);
      expect(finalDashboardResult.data).toHaveLength(2);
      expect(finalDashboardResult.data[0].updatedAt).toBe('2023-01-01T12:00:00Z');

      // Verify authentication state is still consistent
      expect(unifiedAuthService.isAuthenticated()).toBe(true);
      expect(unifiedAuthService.getStoredUser()?.email).toBe('test@example.com');

      // Verify all API calls used the same authentication token
      const allCalls = fetchMock.mock.calls;
      const apiCalls = allCalls.slice(1); // Skip login call
      
      apiCalls.forEach(call => {
        const [, options] = call;
        expect(options.headers['Authorization']).toBe('Bearer test-auth-token-123');
      });
    });

    it('should handle resume creation flow with authentication', async () => {
      // Setup authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'test-token-create';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      const newResumeData = {
        title: 'New Resume',
        personalInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      };

      const createResponse = {
        success: true,
        data: {
          id: '3',
          ...newResumeData,
          status: 'draft',
          createdAt: '2023-01-01T15:00:00Z',
          updatedAt: '2023-01-01T15:00:00Z',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createResponse),
      });

      const createResult = await resumeApi.createResume(newResumeData);

      expect(createResult.success).toBe(true);
      expect(createResult.data?.id).toBe('3');
      expect(createResult.data?.title).toBe('New Resume');

      // Verify authentication was used
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resume',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-create',
          }),
          body: JSON.stringify(newResumeData),
        })
      );
    });
  });

  describe('Authentication State Persistence Across Page Navigation', () => {
    it('should persist authentication state across page refreshes', async () => {
      // Simulate stored authentication data
      const storedUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        emailVerified: true,
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'stored-token-123';
        if (key === 'user') return JSON.stringify(storedUser);
        return null;
      });

      // Mock successful token validation
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { user: storedUser }
        }),
      });

      // Initialize auth service (simulating page refresh)
      const currentUser = await unifiedAuthService.getCurrentUser();

      expect(currentUser).toEqual(storedUser);
      expect(unifiedAuthService.isAuthenticated()).toBe(true);

      // Verify token validation was called
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/jobseeker/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer stored-token-123',
          }),
        })
      );
    });

    it('should handle cross-tab authentication synchronization', async () => {
      const authStateCallback = vi.fn();
      
      // Subscribe to auth state changes
      const unsubscribe = unifiedAuthService.onAuthStateChange(authStateCallback);

      // Simulate storage event from another tab (login)
      const storageEvent = new StorageEvent('storage', {
        key: 'authToken',
        newValue: 'new-tab-token',
        oldValue: null,
      });

      // Mock the initialization that would happen
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'new-tab-token';
        if (key === 'user') return JSON.stringify({
          id: '2',
          email: 'newtab@example.com',
          name: 'New Tab User'
        });
        return null;
      });

      // Trigger storage event
      const storageListeners = windowEventListeners['storage'] || [];
      storageListeners.forEach(listener => {
        listener(storageEvent as any);
      });

      // Verify auth state change was triggered
      expect(authStateCallback).toHaveBeenCalled();

      unsubscribe();
    });

    it('should handle cross-tab logout synchronization', async () => {
      // Setup initial authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'initial-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      const authStateCallback = vi.fn();
      const unsubscribe = unifiedAuthService.onAuthStateChange(authStateCallback);

      // Simulate storage event from another tab (logout)
      const storageEvent = new StorageEvent('storage', {
        key: 'authToken',
        newValue: null,
        oldValue: 'initial-token',
      });

      // Update mock to return null (logged out)
      localStorageMock.getItem.mockReturnValue(null);

      // Trigger storage event
      const storageListeners = windowEventListeners['storage'] || [];
      storageListeners.forEach(listener => {
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

      unsubscribe();
    });

    it('should validate token on window focus', async () => {
      // Setup authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'focus-test-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock successful validation
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        }),
      });

      // Simulate window focus event
      const focusEvent = new Event('focus');
      const focusListeners = windowEventListeners['focus'] || [];
      focusListeners.forEach(listener => {
        listener(focusEvent);
      });

      // Allow async validation to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify token validation was called
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/jobseeker/auth/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer focus-test-token',
          }),
        })
      );
    });
  });

  describe('Error Handling and Recovery Scenarios', () => {
    it('should handle 401 errors and attempt token refresh', async () => {
      // Setup initial authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'expired-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock 401 response for initial request
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: 'Token expired',
          }),
        })
        // Mock successful token refresh
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              user: {
                id: '1',
                email: 'test@example.com',
                name: 'Test User'
              },
              token: 'refreshed-token',
              message: 'Token refreshed'
            }
          }),
        })
        // Mock successful retry with new token
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  title: 'My Resume',
                  status: 'draft',
                }
              ],
              total: 1
            }
          }),
        });

      const result = await resumeApi.getUserResumes();

      // Should have made 3 calls: initial request, token refresh, retry
      expect(fetchMock).toHaveBeenCalledTimes(3);

      // Should have stored new token
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'refreshed-token');

      // Should return successful result
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle failed token refresh and clear auth state', async () => {
      // Setup initial authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'expired-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock 401 response for initial request
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: 'Token expired',
          }),
        })
        // Mock failed token refresh
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            success: false,
            error: 'Refresh token expired',
          }),
        });

      const result = await resumeApi.getUserResumes();

      // Should have cleared auth state
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');

      // Should return authentication error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
    });

    it('should handle network errors with retry logic', async () => {
      // Setup authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'valid-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock network error followed by success
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              data: [
                {
                  id: '1',
                  title: 'My Resume',
                  status: 'draft',
                }
              ],
              total: 1
            }
          }),
        });

      const result = await resumeApi.getUserResumes();

      // Should have retried and succeeded
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle corrupted localStorage data gracefully', async () => {
      // Mock corrupted user data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'valid-token';
        if (key === 'user') return 'invalid-json-data';
        return null;
      });

      // Should handle corrupted data and clear auth state
      const authState = unifiedAuthService.getAuthState();
      
      // Should not be authenticated with corrupted data
      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBe(null);
    });

    it('should handle authentication state recovery after error', async () => {
      const authStateCallback = vi.fn();
      const unsubscribe = unifiedAuthService.onAuthStateChange(authStateCallback);

      // Start with error state
      localStorageMock.getItem.mockReturnValue(null);

      // Simulate successful login after error
      const loginResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'recovered@example.com',
            name: 'Recovered User',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            emailVerified: true,
          },
          token: 'recovery-token',
          message: 'Login successful',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginResponse),
      });

      const loginResult = await unifiedAuthService.login({
        email: 'recovered@example.com',
        password: 'password123',
      });

      expect(loginResult.success).toBe(true);
      expect(unifiedAuthService.isAuthenticated()).toBe(true);

      // Verify state change was notified
      expect(authStateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isAuthenticated: true,
          user: expect.objectContaining({
            email: 'recovered@example.com'
          }),
          token: 'recovery-token',
        })
      );

      unsubscribe();
    });

    it('should handle multiple concurrent API calls with authentication', async () => {
      // Setup authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'concurrent-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock responses for concurrent calls
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { data: [], total: 0 }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              id: '1',
              title: 'Test Resume',
              status: 'draft',
            }
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              id: '2',
              title: 'Created Resume',
              status: 'draft',
            }
          }),
        });

      // Make concurrent API calls
      const [resumesResult, resumeResult, createResult] = await Promise.all([
        resumeApi.getUserResumes(),
        resumeApi.getResume('1'),
        resumeApi.createResume({ title: 'New Resume' }),
      ]);

      // All calls should succeed
      expect(resumesResult.success).toBe(true);
      expect(resumeResult.success).toBe(true);
      expect(createResult.success).toBe(true);

      // All calls should have used the same token
      expect(fetchMock).toHaveBeenCalledTimes(3);
      fetchMock.mock.calls.forEach(call => {
        const [, options] = call;
        expect(options.headers['Authorization']).toBe('Bearer concurrent-token');
      });
    });
  });

  describe('Authentication Flow Edge Cases', () => {
    it('should handle rapid navigation between authenticated pages', async () => {
      // Setup authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'rapid-nav-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock rapid API calls simulating fast navigation
      const mockResponses = [
        { success: true, data: { data: [], total: 0 } },
        { success: true, data: { id: '1', title: 'Resume 1' } },
        { success: true, data: { data: [], total: 0 } },
        { success: true, data: { id: '2', title: 'Resume 2' } },
      ];

      mockResponses.forEach(response => {
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response),
        });
      });

      // Simulate rapid navigation: Dashboard → Resume 1 → Dashboard → Resume 2
      const results = await Promise.all([
        resumeApi.getUserResumes(),
        resumeApi.getResume('1'),
        resumeApi.getUserResumes(),
        resumeApi.getResume('2'),
      ]);

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Authentication should remain consistent
      expect(unifiedAuthService.isAuthenticated()).toBe(true);
    });

    it('should handle authentication during app initialization', async () => {
      // Mock stored auth data
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'init-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'init@example.com',
          name: 'Init User'
        });
        return null;
      });

      // Mock token validation during initialization
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'init@example.com',
              name: 'Init User'
            }
          }
        }),
      });

      // Ensure auth state is properly initialized
      const isAuthenticated = await unifiedAuthService.ensureAuthState();

      expect(isAuthenticated).toBe(true);
      expect(unifiedAuthService.getStoredUser()?.email).toBe('init@example.com');
    });

    it('should handle logout during active API calls', async () => {
      // Setup authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'logout-test-token';
        if (key === 'user') return JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        });
        return null;
      });

      // Mock slow API response
      const slowApiCall = new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { data: [], total: 0 }
            }),
          });
        }, 100);
      });

      fetchMock.mockImplementationOnce(() => slowApiCall);

      // Start API call
      const apiCallPromise = resumeApi.getUserResumes();

      // Logout while API call is in progress
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await unifiedAuthService.logout();

      // Wait for API call to complete
      const result = await apiCallPromise;

      // Auth state should be cleared
      expect(unifiedAuthService.isAuthenticated()).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });
});