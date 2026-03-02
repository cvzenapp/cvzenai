import { BaseApiClient } from './baseApiClient';

export interface JobDetectionRequest {
  job_title?: string;
  location?: string;
  department?: string;
  salary_range?: string;
  company_profile?: string;
  job_description?: string;
  requirements?: string;
  benefits?: string;
  telecommuting?: string;
  has_logo?: string;
  has_questions?: string;
  employment_type?: string;
  required_experience_years?: string;
  required_education?: string;
  industry?: string;
  job_function?: string;
}

export interface JobDetectionResult {
  isFake: boolean;
  confidence: number;
  reasoning: string;
  redFlags: string[];
}

export interface JobDetectionResponse {
  success: boolean;
  data?: JobDetectionResult;
  error?: string;
}

class FakeJobDetectionApi extends BaseApiClient {
  /**
   * Analyze a single job posting for fraud indicators
   */
  async analyzeJob(jobData: JobDetectionRequest): Promise<JobDetectionResponse> {
    return this.post<JobDetectionResult>('/fake-job-detection/analyze', jobData);
  }

  /**
   * Check if the detector service is available
   */
  async checkHealth(): Promise<{ success: boolean; data?: { status: string; message: string } }> {
    return this.get<{ status: string; message: string }>('/fake-job-detection/health');
  }
}

export const fakeJobDetectionApi = new FakeJobDetectionApi();
