import { BaseApiClient } from './baseApiClient';

export interface JobMatchingRequest {
  jobId: string; // Only jobId is required - job details are fetched from database
}

export interface JobMatchingResponse {
  success: boolean;
  data: {
    score: number;
    reasons: string[];
    missing: string[];
    jobDetails: {
      title: string;
      company: string;
      location: string;
      experienceLevel: string;
      jobType: string;
      salaryRange: string;
    };
  };
  error?: string;
  message?: string;
}

class JobMatchingApiService extends BaseApiClient {
  constructor() {
    super('/api/job-matching');
  }

  async calculateMatchScore(data: JobMatchingRequest): Promise<JobMatchingResponse> {
    const response = await this.post<any>('/calculate-score', data);
    if (response.success && response.data) {
      return {
        success: response.success,
        data: response.data,
        error: response.error as string,
        message: response.message
      };
    }
    throw new Error(response.error as string || 'Failed to calculate match score');
  }
}

export const jobMatchingApi = new JobMatchingApiService();