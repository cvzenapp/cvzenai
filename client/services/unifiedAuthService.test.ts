/**
 * Unified Authentication Service Tests
 * Tests the unified authentication system functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { unifiedAuthService } from './unifiedAuthService';

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

describe('UnifiedAuthService', () => {
  describe('Authentication State Management', () => {
    it('should initialize with empty state when no stored data', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const state = unifiedAuthService.getAuthState();
      
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
    });

    it('should notify subscribers of state changes', () => {
      const callback = vi.fn();
      
      const unsubscribe = unifiedAuthService.onAuthStateChange(callback);
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          isAuthenticated: false,
          user: null,
          token: null,
        })
      );
      
      unsubscribe();
    });
  });

  describe('Login', () => {
    it('should successfully login and update state', async () => {
      const mockResponse = {
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
          token: 'test-token',
          message: 'Login successful',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
      expect(result.token).toBe('test-token');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'test-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('user', expect.any(String));
    });

    it('should handle login failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials',
        }),
      });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid credentials');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
          token: 'new-token',
          message: 'Token refreshed',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await unifiedAuthService.refreshToken();

      expect(result.success).toBe(true);
      expect(result.token).toBe('new-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-token');
    });

    it('should clear auth state on refresh failure', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Token expired',
        }),
      });

      const result = await unifiedAuthService.refreshToken();

      expect(result.success).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Logout', () => {
    it('should logout and clear state', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await unifiedAuthService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    });

    it('should clear state even if logout request fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await unifiedAuthService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('authToken');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('Registration', () => {
    it('should successfully register and update state', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'newuser@example.com',
            name: 'New User',
            firstName: 'New',
            lastName: 'User',
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            emailVerified: false,
          },
          token: 'new-user-token',
          message: 'Registration successful',
        }
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await unifiedAuthService.register({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true,
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('newuser@example.com');
      expect(result.token).toBe('new-user-token');
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'new-user-token');
    });

    it('should handle registration validation errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Validation failed',
          errors: {
            email: 'Email already exists',
          },
        }),
      });

      const result = await unifiedAuthService.register({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors?.email).toBe('Email already exists');
    });
  });

  describe('Utility Methods', () => {
    it('should check authentication status from storage', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      
      // Test the localStorage-based method
      expect(unifiedAuthService.isAuthenticatedFromStorage()).toBe(true);
      
      localStorageMock.getItem.mockReturnValue(null);
      expect(unifiedAuthService.isAuthenticatedFromStorage()).toBe(false);
    });

    it('should get stored user data from storage', () => {
      const userData = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(userData));
      
      const result = unifiedAuthService.getStoredUserFromStorage();
      expect(result).toEqual(userData);
    });

    it('should handle invalid stored user data', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const result = unifiedAuthService.getStoredUserFromStorage();
      expect(result).toBe(null);
    });

    it('should check authentication status from state', () => {
      const state = unifiedAuthService.getAuthState();
      expect(unifiedAuthService.isAuthenticated()).toBe(state.isAuthenticated);
    });

    it('should get user from state', () => {
      const state = unifiedAuthService.getAuthState();
      expect(unifiedAuthService.getStoredUser()).toBe(state.user);
    });
  });
});