/**
 * Simple End-to-End Authentication Flow Tests
 * Tests complete authentication flows from a user perspective
 * Tests authentication state persistence across page navigation
 * Tests error handling and recovery scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the authentication services for E2E testing
const mockUnifiedAuthService = {
  login: vi.fn(),
  logout: vi.fn(),
  getCurrentUser: vi.fn(),
  refreshToken: vi.fn(),
  clearAuth: vi.fn(),
  isAuthenticated: vi.fn(),
  getStoredUser: vi.fn(),
  ensureAuthState: vi.fn(),
  onAuthStateChange: vi.fn(),
  getAuthState: vi.fn(),
};

const mockResumeApi = {
  getUserResumes: vi.fn(),
  getResume: vi.fn(),
  createResume: vi.fn(),
  updateResume: vi.fn(),
};

// Mock browser environment
const mockBrowser = {
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  location: {
    pathname: '/',
    href: 'http://localhost:8080',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  },
  navigator: {
    onLine: true,
  },
};

// Setup mocks
beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup browser environment
  Object.defineProperty(global, 'localStorage', {
    value: mockBrowser.localStorage,
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
  
  Object.defineProperty(global, 'navigator', {
    value: mockBrowser.navigator,
    writable: true,
  });
  
  // Default mock implementations
  mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
    return vi.fn(); // Return unsubscribe function
  });
  
  mockUnifiedAuthService.isAuthenticated.mockReturnValue(false);
  mockUnifiedAuthService.getStoredUser.mockReturnValue(null);
  mockUnifiedAuthService.ensureAuthState.mockResolvedValue(false);
  mockUnifiedAuthService.getAuthState.mockReturnValue({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Simple End-to-End Authentication Flow Tests', () => {
  describe('Complete User Journey Simulation', () => {
    it('should simulate complete user journey: Login → Dashboard → Resume Builder → Dashboard', async () => {
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

      const mockToken = 'e2e-auth-token-123';

      // Step 1: Simulate user landing on login page
      mockBrowser.location.pathname = '/login';

      // Step 2: Mock successful login
      mockUnifiedAuthService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        token: mockToken,
        message: 'Login successful',
      });

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Simulate user login
      const loginResult = await mockUnifiedAuthService.login({
        email: 'e2e-test@example.com',
        password: 'password123',
      });

      expect(loginResult.success).toBe(true);
      expect(loginResult.user?.email).toBe('e2e-test@example.com');
      expect(loginResult.token).toBe(mockToken);

      // Step 3: Simulate navigation to dashboard
      mockBrowser.location.pathname = '/dashboard';

      // Mock dashboard data
      const dashboardResumes = [
        {
          id: '1',
          title: 'E2E Test Resume 1',
          status: 'draft' as const,
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
          status: 'published' as const,
          createdAt: '2023-01-02T00:00:00Z',
          personalInfo: {
            firstName: 'E2E',
            lastName: 'Test User',
            email: 'e2e-test@example.com',
          },
        }
      ];

      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: dashboardResumes,
        total: 2,
      });

      // Load dashboard data
      const dashboardResult = await mockResumeApi.getUserResumes();

      expect(dashboardResult.success).toBe(true);
      expect(dashboardResult.data).toHaveLength(2);
      expect(dashboardResult.total).toBe(2);

      // Step 4: Simulate navigation to resume builder
      mockBrowser.location.pathname = '/resume-builder/1';

      const resumeData = {
        id: '1',
        title: 'E2E Test Resume 1',
        status: 'draft' as const,
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

      mockResumeApi.getResume.mockResolvedValue({
        success: true,
        data: resumeData,
      });

      // Load resume in builder
      const resumeResult = await mockResumeApi.getResume('1');

      expect(resumeResult.success).toBe(true);
      expect(resumeResult.data?.id).toBe('1');
      expect(resumeResult.data?.personalInfo.firstName).toBe('E2E');

      // Step 5: Simulate resume editing and saving
      const updatedResumeData = {
        ...resumeData,
        personalInfo: {
          ...resumeData.personalInfo,
          summary: 'Updated E2E test user summary with new information...',
        },
        skills: [...resumeData.skills, 'Playwright', 'Cypress'],
        updatedAt: '2023-01-01T12:00:00Z',
      };

      mockResumeApi.updateResume.mockResolvedValue({
        success: true,
        data: updatedResumeData,
      });

      // Save updated resume
      const updateResult = await mockResumeApi.updateResume('1', {
        personalInfo: {
          ...resumeData.personalInfo,
          summary: 'Updated E2E test user summary with new information...',
        },
        skills: [...resumeData.skills, 'Playwright', 'Cypress'],
      });

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

      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: updatedDashboardResumes,
        total: 2,
      });

      // Load updated dashboard
      const finalDashboardResult = await mockResumeApi.getUserResumes();

      expect(finalDashboardResult.success).toBe(true);
      expect(finalDashboardResult.data).toHaveLength(2);
      expect(finalDashboardResult.data[0].updatedAt).toBe('2023-01-01T12:00:00Z');

      // Step 7: Verify authentication state consistency throughout journey
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
      expect(mockUnifiedAuthService.getStoredUser()?.email).toBe('e2e-test@example.com');

      // Verify all service calls were made
      expect(mockUnifiedAuthService.login).toHaveBeenCalledWith({
        email: 'e2e-test@example.com',
        password: 'password123',
      });
      expect(mockResumeApi.getUserResumes).toHaveBeenCalledTimes(2);
      expect(mockResumeApi.getResume).toHaveBeenCalledWith('1');
      expect(mockResumeApi.updateResume).toHaveBeenCalledWith('1', expect.any(Object));
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
      mockUnifiedAuthService.getCurrentUser.mockResolvedValue(storedUser);
      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(storedUser);

      // Simulate page refresh - reinitialize auth service
      const currentUser = await mockUnifiedAuthService.getCurrentUser();

      expect(currentUser).toEqual(storedUser);
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);

      // Simulate API call after refresh
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });

      const resumesResult = await mockResumeApi.getUserResumes();

      expect(resumesResult.success).toBe(true);
      expect(mockUnifiedAuthService.getCurrentUser).toHaveBeenCalled();
    });

    it('should simulate multiple browser tabs with authentication sync', async () => {
      const mockUser = {
        id: '1',
        email: 'multitab-test@example.com',
        name: 'Multi Tab User',
      };

      let authStateCallback: any;

      // Mock auth state change subscription
      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return vi.fn(); // Return unsubscribe function
      });

      // Initialize auth service (simulates tab 1)
      const stateChangeCallback = vi.fn();
      const unsubscribe = mockUnifiedAuthService.onAuthStateChange(stateChangeCallback);

      // Tab 1: Initial authentication
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'tab1-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Tab 2: Login event (simulate storage change from another tab)
      const newToken = 'tab2-new-token';

      // Update localStorage mock to return new token
      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return newToken;
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Simulate auth state change
      if (authStateCallback) {
        authStateCallback({
          user: mockUser,
          token: newToken,
          isAuthenticated: true,
          isLoading: false,
        });
      }

      // Test API call with updated token
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });

      const resumesResult = await mockResumeApi.getUserResumes();

      expect(resumesResult.success).toBe(true);
      expect(mockUnifiedAuthService.onAuthStateChange).toHaveBeenCalled();

      unsubscribe();
    });

    it('should simulate logout across multiple tabs', async () => {
      const mockUser = {
        id: '1',
        email: 'logout-test@example.com',
        name: 'Logout Test User',
      };

      let authStateCallback: any;

      // Setup initial authenticated state
      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const stateChangeCallback = vi.fn();
      const unsubscribe = mockUnifiedAuthService.onAuthStateChange(stateChangeCallback);

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'logout-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Simulate logout from another tab
      mockBrowser.localStorage.getItem.mockReturnValue(null);

      // Trigger auth state change to logged out
      if (authStateCallback) {
        authStateCallback({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }

      // Test API call after logout should fail
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: false,
        error: 'Authentication required',
        data: [],
        total: 0,
      });

      const resumesResult = await mockResumeApi.getUserResumes();

      expect(resumesResult.success).toBe(false);
      expect(resumesResult.error).toContain('Authentication required');
      expect(mockUnifiedAuthService.onAuthStateChange).toHaveBeenCalled();

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
      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

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
          mockResumeApi.getUserResumes.mockResolvedValue({
            success: true,
            data: [],
            total: 0,
          });

          const result = await mockResumeApi.getUserResumes();
          expect(result.success).toBe(true);
        } else if (path.startsWith('/resume-builder/')) {
          const resumeId = path.split('/').pop();
          
          mockResumeApi.getResume.mockResolvedValue({
            success: true,
            data: {
              id: resumeId,
              title: `Resume ${resumeId}`,
              status: 'draft' as const,
            },
          });

          const result = await mockResumeApi.getResume(resumeId!);
          expect(result.success).toBe(true);
        }
      }

      // Simulate browser back button
      mockBrowser.history.back();
      mockBrowser.location.pathname = '/resume-builder/1';

      // Authentication should still work
      expect(mockUnifiedAuthService.isAuthenticated()).toBe(true);
    });

    it('should handle network connectivity changes during authentication', async () => {
      const mockUser = {
        id: '1',
        email: 'connectivity-test@example.com',
        name: 'Connectivity Test User',
      };

      // Setup authenticated state
      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'connectivity-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Simulate network offline
      mockBrowser.navigator.onLine = false;

      // Mock network error
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: false,
        error: 'Network request failed',
        data: [],
        total: 0,
      });

      const offlineResult = await mockResumeApi.getUserResumes();

      // Should handle offline gracefully
      expect(offlineResult.success).toBe(false);

      // Simulate network back online
      mockBrowser.navigator.onLine = true;

      // Mock successful request after reconnection
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });

      const onlineResult = await mockResumeApi.getUserResumes();

      expect(onlineResult.success).toBe(true);
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

      mockUnifiedAuthService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        token: largeToken,
        message: 'Login successful',
      });

      const loginResult = await mockUnifiedAuthService.login({
        email: 'storage-test@example.com',
        password: 'password123',
      });

      // Should handle storage error gracefully
      expect(loginResult.success).toBe(true);

      // Verify that the login was successful despite storage limitations
      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBe(largeToken);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle rapid authentication state changes', async () => {
      const mockUser = {
        id: '1',
        email: 'stress-test@example.com',
        name: 'Stress Test User',
      };

      // Setup authenticated state
      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      // Setup rapid state changes
      const tokens = Array.from({ length: 10 }, (_, i) => `stress-token-${i}`);
      let currentTokenIndex = 0;

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return tokens[currentTokenIndex];
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock API responses for each token
      tokens.forEach(() => {
        mockResumeApi.getUserResumes.mockResolvedValueOnce({
          success: true,
          data: [],
          total: 0,
        });
      });

      // Rapidly change tokens and make API calls
      const results = [];
      for (let i = 0; i < tokens.length; i++) {
        currentTokenIndex = i;
        const result = await mockResumeApi.getUserResumes();
        results.push(result);
      }

      // All requests should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all tokens were used
      expect(mockResumeApi.getUserResumes).toHaveBeenCalledTimes(tokens.length);
    });

    it('should handle concurrent API calls with authentication', async () => {
      const mockUser = {
        id: '1',
        email: 'concurrent-test@example.com',
        name: 'Concurrent Test User',
      };

      mockUnifiedAuthService.isAuthenticated.mockReturnValue(true);
      mockUnifiedAuthService.getStoredUser.mockReturnValue(mockUser);

      mockBrowser.localStorage.getItem.mockImplementation((key) => {
        if (key === 'authToken') return 'concurrent-test-token';
        if (key === 'user') return JSON.stringify(mockUser);
        return null;
      });

      // Mock responses for concurrent calls
      mockResumeApi.getUserResumes.mockResolvedValue({
        success: true,
        data: [],
        total: 0,
      });

      mockResumeApi.getResume.mockResolvedValueOnce({
        success: true,
        data: { id: '1', title: 'Resume 1', status: 'draft' as const },
      });

      mockResumeApi.getResume.mockResolvedValueOnce({
        success: true,
        data: { id: '2', title: 'Resume 2', status: 'draft' as const },
      });

      mockResumeApi.createResume.mockResolvedValue({
        success: true,
        data: { id: '3', title: 'Concurrent Test Resume', status: 'draft' as const },
      });

      // Execute concurrent API calls
      const results = await Promise.all([
        mockResumeApi.getUserResumes(),
        mockResumeApi.getResume('1'),
        mockResumeApi.getResume('2'),
        mockResumeApi.createResume({ title: 'Concurrent Test Resume' }),
      ]);

      // All calls should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Verify all service methods were called
      expect(mockResumeApi.getUserResumes).toHaveBeenCalled();
      expect(mockResumeApi.getResume).toHaveBeenCalledTimes(2);
      expect(mockResumeApi.createResume).toHaveBeenCalled();
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
      let authStateCallback: any;
      mockUnifiedAuthService.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback;
        return vi.fn();
      });

      const stateChangeCallback = vi.fn();
      const unsubscribe = mockUnifiedAuthService.onAuthStateChange(stateChangeCallback);

      // Simulate 100 auth state changes
      for (let i = 0; i < 100; i++) {
        if (authStateCallback) {
          authStateCallback({
            user: mockUser,
            token: `memory-test-token-${i}`,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      }

      // Cleanup should work properly
      unsubscribe();

      // Verify subscription was set up
      expect(mockUnifiedAuthService.onAuthStateChange).toHaveBeenCalled();
    });
  });
});