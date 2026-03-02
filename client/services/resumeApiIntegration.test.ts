/**
 * Resume API Integration Tests
 * Tests the complete flow of resume data loading with unified authentication
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resumeApi } from './resumeApi';

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

describe('Resume API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('test-token');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should complete the full resume loading flow', async () => {
    // Mock successful API response
    const mockResumes = [
      {
        id: '1',
        title: 'Alex Morgan - Resume',
        status: 'published',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { data: mockResumes, total: 1 }
      }),
    });

    // Test the complete flow
    const result = await resumeApi.getUserResumes();

    // Verify the request was made with correct authentication
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resumes',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
      })
    );

    // Verify the response format
    expect(result).toEqual({
      success: true,
      data: mockResumes,
      total: 1,
    });
  });

  it('should handle authentication failure and redirect', async () => {
    // Mock 401 response
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })
      // Mock failed token refresh
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Refresh failed' }),
      });

    const result = await resumeApi.getUserResumes();

    // Verify authentication was cleared
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');

    // Verify error response
    expect(result).toEqual({
      success: false,
      data: [],
      total: 0,
      error: 'Authentication required',
      message: 'Please log in again'
    });
  });

  it('should handle create and update operations', async () => {
    const newResumeData = {
      title: 'New Resume',
      personalInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
    };

    const createdResume = {
      id: '2',
      ...newResumeData,
      status: 'draft',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    // Mock create response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: createdResume
      }),
    });

    const createResult = await resumeApi.createResume(newResumeData);

    expect(createResult.success).toBe(true);
    expect(createResult.data).toEqual(createdResume);

    // Verify create request
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resume',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newResumeData),
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );

    // Test update
    const updateData = { title: 'Updated Resume' };
    const updatedResume = { ...createdResume, ...updateData };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: updatedResume
      }),
    });

    const updateResult = await resumeApi.updateResume('2', updateData);

    expect(updateResult.success).toBe(true);
    expect(updateResult.data).toEqual(updatedResume);

    // Verify update request
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/resume/2',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
        }),
      })
    );
  });
});