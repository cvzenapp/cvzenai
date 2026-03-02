/**
 * Authentication Error Handling Integration Tests
 * Tests the complete error handling system working together
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unifiedAuthService } from './unifiedAuthService';
import { AuthErrorHandler, AuthErrorType } from './authErrorHandler';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock window.location
const mockLocation = {
  href: '',
  pathname: '/dashboard',
  search: '',
};
Object.defineProperty(window, 'location', { value: mockLocation });

describe('Authentication Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocation.href = '';
    
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Error Scenarios', () => {
    it('should handle invalid credentials with proper error messaging', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          success: false,
          error: 'Invalid credentials provided'
        })
      });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        type: AuthErrorType.INVALID_CREDENTIALS,
        userMessage: 'The email or password you entered is incorrect. Please try again.'
      });
    });

    it('should handle network errors with retry mechanism', async () => {
      // First two attempts fail with network error
      mockFetch
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              user: { id: 1, email: 'test@example.com', name: 'Test User' },
              token: 'valid-token'
            }
          })
        });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('test@example.com');
    });

    it('should handle server errors with appropriate messaging', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          success: false,
          error: 'Database connection failed'
        })
      });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        type: AuthErrorType.SERVER_ERROR,
        userMessage: 'Something went wrong on our end. Please try again in a few moments.'
      });
    });

    it('should handle rate limiting with proper error type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          success: false,
          error: 'Too many login attempts'
        })
      });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        type: AuthErrorType.RATE_LIMITED,
        userMessage: 'Too many attempts. Please wait a few minutes before trying again.'
      });
    });
  });

  describe('Registration Error Scenarios', () => {
    it('should handle email already exists error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: 'Conflict',
        json: async () => ({
          success: false,
          error: 'Email already exists'
        })
      });

      const result = await unifiedAuthService.register({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        acceptTerms: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        type: AuthErrorType.EMAIL_ALREADY_EXISTS,
        userMessage: 'An account with this email address already exists. Please use a different email or try logging in.'
      });
    });

    it('should handle validation errors with field details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          success: false,
          error: 'Validation failed',
          errors: {
            email: 'Invalid email format',
            password: 'Password too weak'
          }
        })
      });

      const result = await unifiedAuthService.register({
        name: 'Test User',
        email: 'invalid-email',
        password: '123',
        confirmPassword: '123',
        acceptTerms: true
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        type: AuthErrorType.VALIDATION_ERROR
      });
      expect(result.errors).toEqual({
        email: 'Invalid email format',
        password: 'Password too weak'
      });
    });
  });

  describe('Token Refresh Error Scenarios', () => {
    it('should handle token refresh failure and clear auth state', async () => {
      // Mock expired token in localStorage
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') {
          // Create an expired JWT token (simplified)
          const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // Expired 1 hour ago
          return `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
        }
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          success: false,
          error: 'Token refresh failed'
        })
      });

      const result = await unifiedAuthService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.error).toMatchObject({
        type: AuthErrorType.TOKEN_REFRESH_FAILED
      });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });

    it('should handle successful token refresh after network retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              user: { id: 1, email: 'test@example.com', name: 'Test User' },
              token: 'new-valid-token'
            }
          })
        });

      const result = await unifiedAuthService.refreshToken();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.token).toBe('new-valid-token');
    });
  });

  describe('Error Logging and Monitoring', () => {
    it('should log authentication errors with proper context', async () => {
      const logSpy = vi.spyOn(AuthErrorHandler, 'logError');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          success: false,
          error: 'Invalid credentials'
        })
      });

      await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuthErrorType.INVALID_CREDENTIALS,
          context: 'login'
        })
      );
    });

    it('should log network errors with retry information', async () => {
      const logSpy = vi.spyOn(AuthErrorHandler, 'logError');

      mockFetch.mockRejectedValue(new Error('Network error'));

      await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AuthErrorType.NETWORK_ERROR,
          context: 'login'
        })
      );
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from temporary network issues', async () => {
      // Simulate temporary network issue followed by success
      mockFetch
        .mockRejectedValueOnce(new Error('Network temporarily unavailable'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              user: { id: 1, email: 'test@example.com', name: 'Test User' },
              token: 'valid-token'
            }
          })
        });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed error types during retry', async () => {
      // First attempt: network error (retryable)
      // Second attempt: server error (retryable)
      // Third attempt: success
      mockFetch
        .mockRejectedValueOnce(new Error('fetch failed'))
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: 'Server error' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              user: { id: 1, email: 'test@example.com', name: 'Test User' },
              token: 'valid-token'
            }
          })
        });

      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Context and Details', () => {
    it('should provide detailed error context for debugging', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        url: '/api/jobseeker/auth/login',
        json: async () => ({
          success: false,
          error: 'Validation failed',
          errors: { email: 'Required field' }
        })
      });

      const result = await unifiedAuthService.login({
        email: '',
        password: 'password'
      });

      expect(result.error).toMatchObject({
        type: AuthErrorType.VALIDATION_ERROR,
        context: 'login',
        details: expect.objectContaining({
          status: 400,
          statusText: 'Bad Request',
          url: '/api/jobseeker/auth/login',
          responseData: expect.objectContaining({
            errors: { email: 'Required field' }
          })
        })
      });
    });

    it('should track error timestamps for monitoring', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const beforeTime = new Date();
      const result = await unifiedAuthService.login({
        email: 'test@example.com',
        password: 'password'
      });
      const afterTime = new Date();

      expect(result.error).toMatchObject({
        timestamp: expect.any(Date)
      });

      const errorTimestamp = (result.error as any).timestamp;
      expect(errorTimestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(errorTimestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});