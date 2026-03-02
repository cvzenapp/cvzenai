/**
 * Resume API Token Refresh Integration Tests
 * Tests token refresh integration with resume API calls
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resumeApi } from './resumeApi';

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

describe('Resume API Token Refresh Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should automatically refresh token when getting user resumes', async () => {
    // Create an expired token
    const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    const expiredToken = createMockJWT({ exp: expiredTime });
    const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
    
    mockLocalStorage.getItem.mockReturnValue(expiredToken);

    // Mock token refresh success, then successful resume API call
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
        json: () => Promise.resolve({ 
          success: true, 
          data: { data: [{ id: '1', title: 'Test Resume' }], total: 1 }
        }),
      });

    const result = await resumeApi.getUserResumes();
    
    // Should refresh token first, then make resume API call
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/refresh', expect.objectContaining({
      method: 'POST',
    }));
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/resumes', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: expect.stringContaining('Bearer '),
      }),
    }));
    
    expect(result.success).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
  });

  it('should handle 401 response with automatic token refresh', async () => {
    const validToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    const newToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 7200 });
    
    mockLocalStorage.getItem.mockReturnValue(validToken);

    // Mock 401 response, successful refresh, then successful retry
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
        json: () => Promise.resolve({ 
          success: true, 
          data: { data: [{ id: '1', title: 'Test Resume' }], total: 1 }
        }),
      });

    const result = await resumeApi.getUserResumes();
    
    // Should make original request, refresh token, then retry
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', newToken);
  });

  it('should handle token refresh failure gracefully', async () => {
    const expiredToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) - 3600 });
    mockLocalStorage.getItem.mockReturnValue(expiredToken);

    // Mock failed token refresh
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid refresh token' }),
    });

    const result = await resumeApi.getUserResumes();
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Authentication required');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('should work with getResume endpoint', async () => {
    const validToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    mockLocalStorage.getItem.mockReturnValue(validToken);

    // Mock successful API response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        data: { id: '123', title: 'Test Resume', status: 'draft' }
      }),
    });

    const result = await resumeApi.getResume('123');
    
    expect(fetch).toHaveBeenCalledWith('/api/resume/123', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({
        Authorization: `Bearer ${validToken}`,
      }),
    }));
    
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('123');
  });

  it('should work with createResume endpoint', async () => {
    const validToken = createMockJWT({ exp: Math.floor(Date.now() / 1000) + 3600 });
    mockLocalStorage.getItem.mockReturnValue(validToken);

    const resumeData = {
      title: 'New Resume',
      personalInfo: { name: 'Alex Morgan' }
    };

    // Mock successful API response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        success: true, 
        data: { id: '456', ...resumeData, status: 'draft' }
      }),
    });

    const result = await resumeApi.createResume(resumeData);
    
    expect(fetch).toHaveBeenCalledWith('/api/resume', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: `Bearer ${validToken}`,
      }),
      body: JSON.stringify(resumeData),
    }));
    
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('New Resume');
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