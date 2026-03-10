import { BaseApiClient } from './baseApiClient';

export interface JobMatchingRequest {
  jobId: string;
  jobDescription: string;
  jobTitle: string;
  jobRequirements?: string[];
}

export interface JobMatchingResponse {
  success: boolean;
  data: {
    score: number;
    reasons: string[];
    missing: string[];
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