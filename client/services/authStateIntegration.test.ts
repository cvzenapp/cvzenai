/**
 * Authentication State Integration Test
 * Tests the complete authentication state management flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { unifiedAuthService } from './unifiedAuthService';

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

// Mock window events
Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
});

describe('Authentication State Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with empty state when no stored data', () => {
    const authState = unifiedAuthService.getAuthState();
    
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBe(null);
    expect(authState.token).toBe(null);
  });

  it('should handle state change subscriptions', () => {
    const callback = vi.fn();
    
    const unsubscribe = unifiedAuthService.onAuthStateChange(callback);
    
    // Should call immediately with current state
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        isAuthenticated: false,
        user: null,
        token: null,
      })
    );
    
    // Should return unsubscribe function
    expect(typeof unsubscribe).toBe('function');
    
    unsubscribe();
  });

  it('should ensure auth state correctly', async () => {
    // Mock no stored auth
    localStorageMock.getItem.mockReturnValue(null);
    
    const isAuth = await unifiedAuthService.ensureAuthState();
    
    expect(isAuth).toBe(false);
  });

  it('should handle stored authentication data', async () => {
    const mockUser = { id: 1, name: 'Test User', email: 'test@example.com' };
    const mockToken = 'test-token';
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'authToken') return mockToken;
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
    
    // Create a new instance to test initialization
    const testService = new (unifiedAuthService.constructor as any)();
    
    // Wait a bit for async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const authState = testService.getAuthState();
    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user).toEqual(mockUser);
    expect(authState.token).toBe(mockToken);
  });

  it('should handle authentication methods', () => {
    expect(typeof unifiedAuthService.login).toBe('function');
    expect(typeof unifiedAuthService.logout).toBe('function');
    expect(typeof unifiedAuthService.getCurrentUser).toBe('function');
    expect(typeof unifiedAuthService.refreshToken).toBe('function');
  });

  it('should provide utility methods', () => {
    expect(typeof unifiedAuthService.isAuthenticated).toBe('function');
    expect(typeof unifiedAuthService.getStoredUser).toBe('function');
    expect(typeof unifiedAuthService.ensureAuthState).toBe('function');
  });
});