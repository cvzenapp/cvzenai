/**
 * Authentication Integration Tests
 * Tests the integration between unified auth service and other API services
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unifiedAuthService } from './unifiedAuthService';
import { resumeApi } from './resumeApi';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock fetch
const fetchMock = vi.fn();

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  global.fetch = fetchMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Authentication Integration', () => {
  describe('Resume API with Unified Auth', () => {
    it('should use consistent authentication headers across services', async () => {
      // Mock successful login
      const loginResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            emailVerified: true,
          },
          token: 'test-auth-token',
          message: 'Login successful',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(loginResponse),
      });

      // Login user
      await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Mock resume API response
      const resumeResponse = {
        success: true,
        data: {
          data: [
            {
              id: '1',
              title: 'My Resume',
              status: 'draft',
              createdAt: '2023-01-01T00:00:00Z',
            }
          ],
          total: 1
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(resumeResponse),
      });

      // Call resume API
      const result = await resumeApi.getUserResumes();

      // Verify the resume API call was made with correct auth headers
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/resumes',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-auth-token',
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should handle 401 responses consistently across services', async () => {
      // Set up initial auth state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'expired-token';
        if (key === 'user') return JSON.stringify({ id: '1', email: 'test@example.com' });
        return null;
      });

      // Mock 401 response for resume API
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Unauthorized',
        }),
      });

      // Mock failed token refresh
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Token refresh failed',
        }),
      });

      // Call resume API
      const result = await resumeApi.getUserResumes();

      // Should handle 401 and clear auth
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication required');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should automatically refresh tokens on 401 and retry requests', async () => {
      // Set up initial auth state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'expired-token';
        if (key === 'user') return JSON.stringify({ id: '1', email: 'test@example.com' });
        return null;
      });

      // Mock 401 response for initial request
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Unauthorized',
        }),
      });

      // Mock successful token refresh
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            token: 'new-token',
            user: { id: '1', email: 'test@example.com' },
          }
        }),
      });

      // Mock successful retry with new token
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            data: [{ id: '1', title: 'My Resume' }],
            total: 1
          }
        }),
      });

      // Call resume API
      const result = await resumeApi.getUserResumes();

      // Should have made 3 calls: initial request, token refresh, retry
      expect(fetchMock).toHaveBeenCalledTimes(3);
      
      // Should have stored new token
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      
      // Should return successful result
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should provide consistent error messages across services', async () => {
      // Mock network error
      fetchMock.mockRejectedValue(new Error('Network error'));

      // Test auth service error
      const authResult = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(authResult.success).toBe(false);
      expect(authResult.message).toContain('Login failed');

      // Test resume API error
      const resumeResult = await resumeApi.getUserResumes();

      expect(resumeResult.success).toBe(false);
      expect(resumeResult.error).toContain('Network error');
    });
  });

  describe('State Management Integration', () => {
    it('should maintain consistent authentication state across page navigation', () => {
      const stateCallback = vi.fn();
      
      // Subscribe to auth state changes
      const unsubscribe = unifiedAuthService.onAuthStateChange(stateCallback);
      
      // Initial state should be called
      expect(stateCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      );

      // Cleanup
      unsubscribe();
    });
  });
});