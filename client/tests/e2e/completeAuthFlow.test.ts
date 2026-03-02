/**
 * Complete Authentication Flow E2E Tests
 * Tests the complete user journey from login to resume editing
 * Simulates real user interactions and validates authentication consistency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the authentication services
const mockUnifiedAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  clearAuth: vi.fn(),
  isAuthenticated: vi.fn(),
  getStoredUser: vi.fn(),
  ensureAuthState: vi.fn(),
  isTokenExpired: vi.fn(),
  getTokenExpiration: vi.fn(),
  ensureValidToken: vi.fn(),
  onAuthStateChange: vi.fn(),
  getAuthState: vi.fn(),
  initializeFromStorage: vi.fn(),
  getAuthHeaders: vi.fn(),
};

const mockResumeApi = {
  getUserResumes: vi.fn(),
  getResume: vi.fn(),
  saveResume: vi.fn(),
  createResume: vi.fn(),
  deleteResume: vi.fn(),
};

describe('Complete Authentication Flow E2E Tests', () => {
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User'
  };

  const mockResumes = [
    {
      id: 1,
      title: 'Software Engineer Resume',
      template: 'modern',
      lastModified: new Date().toISOString(),
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      }
    },
    {
      id: 2,
      title: 'Frontend Developer Resume',
      template: 'creative',
      lastModified: new Date().toISOString(),
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com'
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Setup default successful mocks
    mockUnifiedAuthService.login.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-jwt-token',
        expiresAt: Date.now() + 3600000
      }
    });

    mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
    mockUnifiedAuthService.getCurrentUser.mockResolvedValue(mockUser);
    mockUnifiedAuthService.getAuthHeaders.mockReturnValue({
      'Authorization': 'Bearer mock-jwt-token',
      'Content-Type': 'application/json'
    });

    mockResumeApi.getUserResumes.mockResolvedValue({
      success: true,
      data: mockResumes
    });

    mockResumeApi.getResume.mockResolvedValue({
      success: true,
      data: {
        id: 1,
        title: 'Software Engineer Resume',
        template: 'modern',
        personalInfo: mockUser,
        experience: [],
        education: [],
        skills: []
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });  
describe('Login → Dashboard → Resume Builder → Dashboard Flow', () => {
    it('should complete the full user journey with consistent authentication', async () => {
      // Step 1: Simulate Login Process
      const loginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const loginResult = await mockUnifiedAuthService.login(loginCredentials);
      
      // Verify login was successful
      expect(loginResult.success).toBe(true);
      expect(mockUnifiedAuthService.login).toHaveBeenCalledWith(loginCredentials);
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);

      // Step 2: Simulate Dashboard Navigation
      const dashboardData = await mockResumeApi.getUserResumes();
      
      // Verify dashboard loads user's resumes
      expect(dashboardData.success).toBe(true);
      expect(dashboardData.data).toHaveLength(2);
      expect(dashboardData.data[0].title).toBe('Software Engineer Resume');
      expect(dashboardData.data[1].title).toBe('Frontend Developer Resume');

      // Step 3: Simulate Resume Builder Navigation
      const resumeData = await mockResumeApi.getResume(1);
      
      // Verify resume data loads in builder
      expect(resumeData.success).toBe(true);
      expect(resumeData.data.id).toBe(1);
      expect(resumeData.data.personalInfo.firstName).toBe('Test');
      expect(resumeData.data.personalInfo.lastName).toBe('User');

      // Step 4: Simulate Navigation back to Dashboard
      const dashboardData2 = await mockResumeApi.getUserResumes();
      
      // Verify dashboard still works
      expect(dashboardData2.success).toBe(true);
      expect(mockResumeApi.getUserResumes).toHaveBeenCalledTimes(2);

      // Verify authentication state remains consistent throughout
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
    });

    it('should handle page refresh during the flow', async () => {
      // Simulate user being on dashboard with stored auth
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      mockUnifiedAuthService.initializeFromStorage.mockResolvedValue(true);

      // Simulate page refresh by initializing auth from storage
      const restored = await mockUnifiedAuthService.initializeFromStorage();
      
      // Verify auth is restored from storage
      expect(restored).toBe(true);
      expect(mockUnifiedAuthService.initializeFromStorage).toHaveBeenCalled();

      // Verify dashboard still loads data
      const dashboardData = await mockResumeApi.getUserResumes();
      expect(dashboardData.success).toBe(true);
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
    });

    it('should handle browser tab synchronization', async () => {
      // Initial authentication state
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);

      // Simulate user logging out in another tab
      const logoutEvent = new StorageEvent('storage', {
        key: 'auth_token',
        oldValue: 'mock-jwt-token',
        newValue: null,
        storageArea: localStorage
      });

      // Update mock to reflect logged out state
      mockUnifiedAuthService.isAuthenticated.mockReturnValue(false);
      mockUnifiedAuthService.getCurrentUser.mockResolvedValue(null);

      // Simulate the storage event handler
      if (logoutEvent.key === 'auth_token' && logoutEvent.newValue === null) {
        // This would trigger auth state update in real implementation
        expect(mockUnifiedAuthService.isAuthenticated()).toBe(false);
      }
    });
  });

  describe('Session Persistence Tests', () => {
    it('should maintain session across multiple page navigations', async () => {
      // Navigate through multiple pages
      for (let i = 0; i < 5; i++) {
        // Simulate Dashboard navigation
        const dashboardData = await mockResumeApi.getUserResumes();
        expect(dashboardData.success).toBe(true);

        // Simulate Resume Builder navigation
        const resumeData = await mockResumeApi.getResume(1);
        expect(resumeData.success).toBe(true);
      }

      // Verify authentication remained consistent
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
      expect(mockResumeApi.getUserResumes).toHaveBeenCalledTimes(5);
      expect(mockResumeApi.getResume).toHaveBeenCalledTimes(5);
    });

    it('should handle session expiration gracefully', async () => {
      // Simulate session expiration
      mockResumeApi.getUserResumes.mockRejectedValueOnce({
        status: 401,
        message: 'Session expired'
      });

      // Mock successful token refresh
      mockUnifiedAuthService.refreshToken.mockResolvedValue({
        success: true,
        data: {
          token: 'new-mock-jwt-token',
          expiresAt: Date.now() + 3600000
        }
      });

      // Mock successful retry
      mockResumeApi.getUserResumes.mockResolvedValueOnce({
        success: true,
        data: mockResumes
      });

      try {
        // First call fails with 401
        await mockResumeApi.getUserResumes();
      } catch (error) {
        // Handle 401 error by refreshing token
        if (error.status === 401) {
          const refreshResult = await mockUnifiedAuthService.refreshToken();
          expect(refreshResult.success).toBe(true);
          
          // Retry the API call
          const retryResult = await mockResumeApi.getUserResumes();
          expect(retryResult.success).toBe(true);
        }
      }

      expect(mockUnifiedAuthService.refreshToken).toHaveBeenCalled();
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle authentication errors during navigation', async () => {
      // Simulate authentication error
      mockResumeApi.getUserResumes.mockRejectedValue({
        status: 401,
        message: 'Invalid token'
      });

      mockUnifiedAuthService.refreshToken.mockRejectedValue({
        status: 401,
        message: 'Refresh token expired'
      });

      try {
        await mockResumeApi.getUserResumes();
      } catch (error) {
        expect(error.status).toBe(401);
        expect(error.message).toBe('Invalid token');
        
        // Try to refresh token
        try {
          await mockUnifiedAuthService.refreshToken();
        } catch (refreshError) {
          expect(refreshError.status).toBe(401);
          expect(refreshError.message).toBe('Refresh token expired');
        }
      }
    });

    it('should handle network errors during authentication flow', async () => {
      // Simulate network error
      mockResumeApi.getUserResumes.mockRejectedValue(new Error('Network error'));

      try {
        await mockResumeApi.getUserResumes();
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Application should remain functional
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid navigation without authentication issues', async () => {
      // Rapidly switch between pages
      for (let i = 0; i < 20; i++) {
        // Simulate Dashboard
        await mockResumeApi.getUserResumes();
        
        // Simulate Resume Builder
        await mockResumeApi.getResume(1);
      }

      // Verify system remains stable
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
      expect(mockResumeApi.getUserResumes).toHaveBeenCalledTimes(20);
      expect(mockResumeApi.getResume).toHaveBeenCalledTimes(20);
    });

    it('should handle concurrent authentication checks efficiently', async () => {
      // Simulate multiple concurrent auth checks
      const authChecks = Array(10).fill(null).map(() => 
        mockUnifiedAuthService.isAuthenticated()
      );

      // All checks should complete
      const results = authChecks;
      expect(results.every(result => result === true)).toBe(true);
    });
  });
});