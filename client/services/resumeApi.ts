/**
 * Resume API Service
 * Handles all resume-related API calls using unified authentication
 */

import { BaseApiClient, ApiResponse } from './baseApiClient';

export interface ResumeData {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  personalInfo: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  experience: any[];
  education: any[];
  skills: any[];
  projects: any[];
  summary: string;
}

class ResumeApiService extends BaseApiClient {
  constructor() {
    super('/api'); // Use /api as base URL for resume endpoints
  }

  // Get all user resumes
  async getUserResumes(): Promise<ApiResponse<{ data: ResumeData[]; total: number }>> {
    try {
      const response = await this.get<{ data: ResumeData[]; total: number }>("/resumes");
      
      // Handle the response format from the server
      if (response.success && response.data) {
        // If response.data is already an array (direct from server)
        if (Array.isArray(response.data)) {
          return {
            success: true,
            data: response.data,
            total: response.data.length
          } as any;
        }
        
        // If response.data has nested data property
        return {
          success: true,
          data: response.data.data || response.data,
          total: response.data.total || (Array.isArray(response.data.data) ? response.data.data.length : 0)
        } as any;
      }
      
      return {
        success: false,
        data: [],
        total: 0,
        error: response.error,
        message: response.message || 'Failed to fetch resumes'
      } as any;
    } catch (error) {
      return {
        success: false,
        data: [],
        total: 0,
        error: error.message || 'Network error',
        message: 'Failed to fetch resumes'
      } as any;
    }
  }

  // Get specific resume
  async getResume(id: string): Promise<ApiResponse<ResumeData>> {
    const response = await this.get<ResumeData>(`/resume/${id}`);
    
    // Ensure backward compatibility with existing code expecting { success, data }
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      } as any;
    }
    
    return {
      success: false,
      data: null,
      error: response.error,
      message: response.message
    } as any;
  }

  // Create new resume
  async createResume(resumeData: Partial<ResumeData>): Promise<ApiResponse<ResumeData>> {
    const response = await this.post<ResumeData>("/resume", resumeData);
    
    // Ensure backward compatibility with existing code expecting { success, data }
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      } as any;
    }
    
    return {
      success: false,
      data: null,
      error: response.error,
      message: response.message
    } as any;
  }

  // Update resume
  async updateResume(id: string, resumeData: Partial<ResumeData>): Promise<ApiResponse<ResumeData>> {
    const response = await this.put<ResumeData>(`/resume/${id}`, resumeData);
    
    // Ensure backward compatibility with existing code expecting { success, data }
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data
      } as any;
    }
    
    return {
      success: false,
      data: null,
      error: response.error,
      message: response.message
    } as any;
  }
}

export const resumeApi = new ResumeApiService();