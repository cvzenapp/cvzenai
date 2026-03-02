/**
 * Token Refresh Tests
 * Tests for automatic token refresh mechanism
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BaseApiClient } from './baseApiClient';

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

describe('Token Refresh Mechanism', () => {
  let apiClient: BaseApiClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient = new BaseApiClient('/api');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Expiration Checking', () => {
    it('should detect expired tokens', async () => {
      // Create an expired JWT token (expired 1 hour ago)
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredToken = createMockJWT({ exp: expiredTime });
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // Mock failed refresh (token is expired)
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Token expired' }),
      });

      const response = await apiClient.makeRequest('/test');
      
      // Should attempt token refresh due to expired token
      expect(fetch).toHaveBeenCalledWith('/api/refresh', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${expiredToken}`,
        }),
      }));
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Authentication required');
    });

    it('should detect tokens expiring soon', async () => {
      // Create a token expiring in 2 minutes (within 5 minute buffer)
      const soonExpiredTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
      const soonExpiredToken = createMockJWT({ exp: soonExpiredTime });
      const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
      
      mockLocalStorage.getItem.mockReturnValue(soonExpiredToken);

      // Mock successful refresh, then successful API call
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { token: newToken, user: { id: 1 } } 
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: 'test' }),
        });

      const response = await apiClient.makeRequest('/test');
      
      // Should attempt proactive token refresh
      expect(fetch).toHaveBeenCalledWith('/api/refresh', expect.objectContaining({
        method: 'POST',
      }));
      
      expect(response.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
    });

    it('should not refresh valid tokens', async () => {
      // Create a token expiring in 1 hour (outside 5 minute buffer)
      const validTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validToken = createMockJWT({ exp: validTime });
      
      mockLocalStorage.getItem.mockReturnValue(validToken);
      
      // Mock successful API response
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: 'test' }),
      });

      const response = await apiClient.makeRequest('/test');
      
      // Should make the original request without refresh
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${validToken}`,
        }),
      }));
      
      expect(response.success).toBe(true);
    });
  });

  describe('Automatic Token Refresh on 401', () => {
    it('should refresh token on 401 response and retry', async () => {
      const validToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
      const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
      
      mockLocalStorage.getItem.mockReturnValue(validToken);

      // Mock 401 response, then successful refresh, then successful retry
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { token: newToken, user: { id: 1 } } 
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: 'test' }),
        });

      const response = await apiClient.makeRequest('/test');
      
      // Should make original request, refresh request, and retry request
      expect(fetch).toHaveBeenCalledTimes(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
      expect(response.success).toBe(true);
    });

    it('should redirect to login when refresh fails', async () => {
      const expiredToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 3600 });
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // Mock window.location
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      // Mock 401 response and failed refresh
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Invalid refresh token' }),
        });

      const response = await apiClient.makeRequest('/test');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Authentication required');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('Concurrent Refresh Handling', () => {
    it('should handle concurrent refresh requests', async () => {
      const expiredToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 3600 });
      const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
      
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // Mock successful refresh
      (fetch as any).mockImplementation((url: string) => {
        if (url.includes('/refresh')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              success: true, 
              data: { token: newToken, user: { id: 1 } } 
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: 'test' }),
        });
      });

      // Make multiple concurrent requests
      const promises = [
        apiClient.makeRequest('/test1'),
        apiClient.makeRequest('/test2'),
        apiClient.makeRequest('/test3'),
      ];

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Should only refresh once despite multiple concurrent requests
      const refreshCalls = (fetch as any).mock.calls.filter((call: any) => 
        call[0].includes('/refresh')
      );
      expect(refreshCalls.length).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during refresh', async () => {
      const expiredToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 3600 });
      mockLocalStorage.getItem.mockReturnValue(expiredToken);

      // Mock network error during refresh
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const response = await apiClient.makeRequest('/test');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Authentication required');
    });

    it('should handle malformed tokens gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid.token.format');

      // Mock failed refresh (malformed token)
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid token' }),
      });

      const response = await apiClient.makeRequest('/test');
      
      // Should treat malformed token as expired and attempt refresh
      expect(fetch).toHaveBeenCalledWith('/api/refresh', expect.any(Object));
      expect(response.success).toBe(false);
    });
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