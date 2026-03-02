/**
 * Job API Service
 * Handles all job-related API calls
 */

export interface JobData {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  postedDate: string;
  status: 'active' | 'filled' | 'expired';
  matchScore?: number;
  matchReasons?: string[];
  skillsMatched?: string[];
  skillsMissing?: string[];
}

export interface JobSearchFilters {
  keywords?: string;
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: string[];
  experienceLevel?: string[];
  industry?: string[];
  companySize?: string[];
  postedWithin?: number;
  page?: number;
  limit?: number;
}

class JobApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Job API error (${endpoint}):`, error);
      throw error;
    }
  }

  // Get personalized job recommendations
  async getJobRecommendations(limit: number = 20): Promise<{ success: boolean; data: { jobs: JobData[]; total: number } }> {
    return this.makeRequest<{ success: boolean; data: { jobs: JobData[]; total: number } }>(`/jobs/recommendations?limit=${limit}`);
  }

  // Search jobs
  async searchJobs(filters: JobSearchFilters): Promise<{ success: boolean; data: { jobs: JobData[]; total: number; page: number; totalPages: number } }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v.toString()));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    return this.makeRequest<{ success: boolean; data: { jobs: JobData[]; total: number; page: number; totalPages: number } }>(`/jobs/search?${queryParams.toString()}`);
  }

  // Get job details
  async getJobDetails(jobId: string): Promise<{ success: boolean; data: JobData }> {
    return this.makeRequest<{ success: boolean; data: JobData }>(`/jobs/${jobId}`);
  }

  // Get job match score
  async getJobMatchScore(jobId: string): Promise<{ success: boolean; data: { matchScore: number; matchReasons: string[]; skillsMatched: string[]; skillsMissing: string[] } }> {
    return this.makeRequest<{ success: boolean; data: { matchScore: number; matchReasons: string[]; skillsMatched: string[]; skillsMissing: string[] } }>(`/jobs/${jobId}/match`);
  }

  // Submit job application
  async submitJobApplication(jobId: string, applicationData: { resumeVersion?: string; coverLetter?: string; customizations?: any[] }): Promise<{ success: boolean; data: any; message: string }> {
    return this.makeRequest<{ success: boolean; data: any; message: string }>("/jobs/applications", {
      method: "POST",
      body: JSON.stringify({ jobId, ...applicationData }),
    });
  }

  // Get user's job applications
  async getUserApplications(filters: { page?: number; limit?: number; status?: string } = {}): Promise<{ success: boolean; data: any }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return this.makeRequest<{ success: boolean; data: any }>(`/jobs/applications?${queryParams.toString()}`);
  }
}

export const jobApi = new JobApiService();