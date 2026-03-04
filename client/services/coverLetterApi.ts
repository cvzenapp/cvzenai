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
}

class CoverLetterApiService extends BaseApiClient {
  constructor() {
    super('/api/cover-letter');
  }

  async generateCoverLetter(data: CoverLetterRequest): Promise<CoverLetterResponse> {
    const response = await this.post<CoverLetterResponse>('/generate', data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to generate cover letter');
  }
}

export const coverLetterApi = new CoverLetterApiService();