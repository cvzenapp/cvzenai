import { BaseApiClient } from './baseApiClient';

export interface CoverLetterRequest {
  jobId: string;
  resumeId: string;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
}

export interface CoverLetterResponse {
  success: boolean;
  data: {
    coverLetter: string;
  };
  error?: string;
  message?: string;
}

class CoverLetterApiService extends BaseApiClient {
  constructor() {
    super('/api/cover-letter');
  }

  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    const response = await this.post<any>('/generate', data);
    if (response.success && response.data) {
      return {
        success: response.success,
        data: response.data,
        error: response.error,
        message: response.message
      };
    }
    throw new Error(response.error as string || 'Failed to generate cover letter');
  }
}

export const coverLetterApi = new CoverLetterApiService();