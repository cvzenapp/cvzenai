import { BaseApiClient } from './baseApiClient';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  level: 'entry' | 'mid' | 'senior' | 'executive';
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobPostingCreateRequest {
  title: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  isActive?: boolean;
}

class JobPostingsApiService extends BaseApiClient {
  constructor() {
    super('/api/recruiter/jobs');
  }

  async getJobPostings(): Promise<{ success: boolean; jobPostings: JobPosting[] }> {
    const response = await this.get<{ success: boolean; jobs: JobPosting[] }>('');
    if (response.success && response.data) {
      return {
        success: response.data.success,
        jobPostings: response.data.jobs
      };
    }
    throw new Error(response.error as string || 'Failed to fetch job postings');
  }

  async createJobPosting(
    data: JobPostingCreateRequest
  ): Promise<{ success: boolean; job: JobPosting; message: string }> {
    const response = await this.post<{ success: boolean; job: JobPosting; message: string }>('', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to create job posting');
  }

  async updateJobPosting(
    id: string,
    data: JobPostingCreateRequest
  ): Promise<{ success: boolean; job: JobPosting; message: string }> {
    const response = await this.put<{ success: boolean; job: JobPosting; message: string }>(`/${id}`, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to update job posting');
  }

  async deleteJobPosting(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.delete<{ success: boolean; message: string }>(`/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to delete job posting');
  }

  async toggleJobStatus(
    id: string,
    isActive: boolean
  ): Promise<{ success: boolean; job: JobPosting; message: string }> {
    const response = await this.makeRequest<{ success: boolean; job: JobPosting; message: string }>(
      `/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to toggle job status');
  }

  // Public endpoint - no auth required
  async getPublicCompanyJobs(companyId: string): Promise<{ success: boolean; jobs: JobPosting[] }> {
    const response = await this.get<{ success: boolean; jobs: JobPosting[] }>(
      `/public/company/${companyId}`,
      { skipAuth: true }
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to fetch public jobs');
  }
}

export const jobPostingsApi = new JobPostingsApiService();
