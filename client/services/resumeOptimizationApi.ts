import { BaseApiClient } from './baseApiClient';

export interface ResumeOptimizationRequest {
  resumeId: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements?: string[];
  companyName: string;
}

export interface OptimizedResume {
  id: string;
  title: string;
  summary: string;
  skills: string[];
  experience: any[];
  projects: any[];
  updatedAt: string;
}

export interface ResumeOptimizationResponse {
  success: boolean;
  data: {
    optimizedResume: OptimizedResume;
    message: string;
  };
}

class ResumeOptimizationApiService extends BaseApiClient {
  constructor() {
    super('/api/resume-optimization');
  }

  async optimizeResume(data: ResumeOptimizationRequest): Promise<ResumeOptimizationResponse> {
    const response = await this.post<ResumeOptimizationResponse>('/optimize', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to optimize resume');
  }
}

export const resumeOptimizationApi = new ResumeOptimizationApiService();