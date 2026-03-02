/**
 * Resume API Service Tests
 * Tests the resume API service with unified authentication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resumeApi, ResumeData } from './resumeApi';

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
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('ResumeApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Headers', () => {
    it('should include authorization header when token is present', async () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { data: [], total: 0 } }),
      });

      await resumeApi.getUserResumes();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resumes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should not include authorization header when token is missing', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: { data: [], total: 0 } }),
      });

      await resumeApi.getUserResumes();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resumes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty('Authorization');
    });
  });

  describe('getUserResumes', () => {
    it('should return user resumes with correct format', async () => {
      const mockResumes = [
        { id: '1', title: 'Resume 1', status: 'draft' },
        { id: '2', title: 'Resume 2', status: 'published' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { data: mockResumes, total: 2 }
        }),
      });

      const result = await resumeApi.getUserResumes();

      expect(result).toEqual({
        success: true,
        data: mockResumes,
        total: 2,
      });
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const result = await resumeApi.getUserResumes();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.error).toBeDefined();
    }, 10000);
  });

  describe('getResume', () => {
    it('should return specific resume', async () => {
      const mockResume: ResumeData = {
        id: '1',
        title: 'Test Resume',
        slug: 'test-resume',
        status: 'draft',
        isPublic: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        summary: 'Test summary',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockResume
        }),
      });

      const result = await resumeApi.getResume('1');

      expect(result).toEqual({
        success: true,
        data: mockResume,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resume/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('createResume', () => {
    it('should create new resume', async () => {
      const newResumeData = {
        title: 'New Resume',
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
      };

      const createdResume: ResumeData = {
        id: '3',
        title: 'New Resume',
        slug: 'new-resume',
        status: 'draft' as const,
        isPublic: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        personalInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        summary: '',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: createdResume
        }),
      });

      const result = await resumeApi.createResume(newResumeData);

      expect(result).toEqual({
        success: true,
        data: createdResume,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resume',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newResumeData),
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('updateResume', () => {
    it('should update existing resume', async () => {
      const updateData = {
        title: 'Updated Resume',
        personalInfo: {
          firstName: 'John',
          lastName: 'Updated',
        },
      };

      const updatedResume: ResumeData = {
        id: '1',
        title: 'Updated Resume',
        slug: 'updated-resume',
        status: 'draft' as const,
        isPublic: false,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        personalInfo: {
          firstName: 'John',
          lastName: 'Updated',
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        summary: '',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: updatedResume
        }),
      });

      const result = await resumeApi.updateResume('1', updateData);

      expect(result).toEqual({
        success: true,
        data: updatedResume,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resume/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle 401 responses and attempt token refresh', async () => {
      // First call returns 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        // Token refresh call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            token: 'new-token',
            user: { id: 1, email: 'test@example.com' }
          }),
        })
        // Retry call succeeds
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { data: [], total: 0 }
          }),
        });

      const result = await resumeApi.getUserResumes();

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('authToken', 'new-token');
      expect(mockFetch).toHaveBeenCalledTimes(3); // Original call, refresh, retry
    });

    it('should redirect to login when token refresh fails', async () => {
      // First call returns 401
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Unauthorized' }),
        })
        // Token refresh call fails
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Refresh failed' }),
        });

      const result = await resumeApi.getUserResumes();

      expect(result).toEqual({
        success: false,
        data: [],
        total: 0,
        error: 'Authentication required',
        message: 'Please log in again'
      });

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('Network Error Handling', () => {
    it('should retry on network errors', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { data: [], total: 0 }
          }),
        });

      const result = await resumeApi.getUserResumes();

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const result = await resumeApi.getUserResumes();

      expect(result).toEqual({
        success: false,
        data: [],
        total: 0,
        error: 'Persistent network error',
        message: 'Please check your connection and try again'
      });

      expect(mockFetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    }, 15000);
  });
});