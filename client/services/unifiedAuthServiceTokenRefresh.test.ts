/**
 * Unified Auth Service Token Refresh Tests
 * Tests token refresh functionality in the unified auth service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { unifiedAuthService } from './unifiedAuthService';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = vi.fn();

// Mock window.addEventListener
const mockAddEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
});

describe('Unified Auth Service Token Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Expiration Checking', () => {
    it('should detect expired tokens', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJWT({ exp: expiredTime });
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      const isExpired = unifiedAuthService.isTokenExpired();
      expect(isExpired).toBe(true);
    });

    it('should detect tokens expiring soon', () => {
      const soonExpiredTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
      const soonExpiredToken = createMockJWT({ exp: soonExpiredTime });
      
      mockLocalStorage.getItem.mockReturnValue(soonExpiredToken);

      const isExpired = unifiedAuthService.isTokenExpired();
      expect(isExpired).toBe(true); // Should be true because it's within 5-minute buffer
    });

    it('should not detect valid tokens as expired', () => {
      const validTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = createMockJWT({ exp: validTime });
      
      mockLocalStorage.getItem.mockReturnValue(validToken);

      const isExpired = unifiedAuthService.isTokenExpired();
      expect(isExpired).toBe(false);
    });

    it('should handle malformed tokens', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid.token.format');

      const isExpired = unifiedAuthService.isTokenExpired();
      expect(isExpired).toBe(true); // Should treat malformed tokens as expired
    });
  });

  describe('Token Expiration Date', () => {
    it('should return correct expiration date', () => {
      const expTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const token = createMockJWT({ exp: expTime });
      
      mockLocalStorage.getItem.mockReturnValue(token);

      const expiration = unifiedAuthService.getTokenExpiration();
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration?.getTime()).toBe(expTime * 1000);
    });

    it('should return null for invalid tokens', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid.token');

      const expiration = unifiedAuthService.getTokenExpiration();
      expect(expiration).toBeNull();
    });

    it('should return null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const expiration = unifiedAuthService.getTokenExpiration();
      expect(expiration).toBeNull();
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token successfully', async () => {
      const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };

      // Mock successful refresh response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { token: newToken, user }
        }),
      });

      const result = await unifiedAuthService.refreshToken();

      expect(result.success).toBe(true);
      expect(result.token).toBe(newToken);
      expect(result.user).toEqual(user);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
    });

    it('should handle refresh failure', async () => {
      // Mock failed refresh response
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid refresh token'
        }),
      });

      const result = await unifiedAuthService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Token refresh failed');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    }, 10000); // Increase timeout

    it('should handle network errors during refresh', async () => {
      // Mock network error for all retry attempts
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const result = await unifiedAuthService.refreshToken();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Token refresh failed');
    }, 10000); // Increase timeout
  });

  describe('Ensure Valid Token', () => {
    it('should return true for valid tokens', async () => {
      const validTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = createMockJWT({ exp: validTime });
      
      mockLocalStorage.getItem.mockReturnValue(validToken);

      // Mock auth state as authenticated
      const authService = unifiedAuthService as any;
      authService.currentState = {
        user: { id: '1', email: 'test@example.com' },
        token: validToken,
        isAuthenticated: true,
        isLoading: false
      };

      const isValid = await unifiedAuthService.ensureValidToken();
      expect(isValid).toBe(true);
    });

    it('should refresh expired tokens and return true on success', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJWT({ exp: expiredTime });
      const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // Mock auth state as authenticated but with expired token
      const authService = unifiedAuthService as any;
      authService.currentState = {
        user,
        token: expiredToken,
        isAuthenticated: true,
        isLoading: false
      };

      // Mock successful refresh
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { token: newToken, user }
        }),
      });

      const isValid = await unifiedAuthService.ensureValidToken();
      expect(isValid).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
    });

    it('should return false when not authenticated', async () => {
      // Mock auth state as not authenticated
      const authService = unifiedAuthService as any;
      authService.currentState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      };

      const isValid = await unifiedAuthService.ensureValidToken();
      expect(isValid).toBe(false);
    });

    it('should return false when refresh fails', async () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJWT({ exp: expiredTime });
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // Mock auth state as authenticated but with expired token
      const authService = unifiedAuthService as any;
      authService.currentState = {
        user: { id: '1', email: 'test@example.com' },
        token: expiredToken,
        isAuthenticated: true,
        isLoading: false
      };

      // Mock failed refresh
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid refresh token'
        }),
      });

      const isValid = await unifiedAuthService.ensureValidToken();
      expect(isValid).toBe(false);
    }, 10000); // Increase timeout
  });
});

/**
 * Create a mock JWT token for testing
 */
function createMockJWT(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}