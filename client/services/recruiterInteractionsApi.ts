import { BaseApiClient } from './baseApiClient';

export interface RecruiterInteraction {
  id: string;
  actionType: 'upvote' | 'shortlist' | 'view' | 'download';
  timestamp: string;
  resumeId: number;
  resumeTitle: string;
  recruiter: {
    name: string;
    email: string;
    position: string;
    company: string;
    logo: string;
  };
  notes?: string;
  viewCount?: number;
}

export interface RecruiterInteractionsResponse {
  success: boolean;
  data: RecruiterInteraction[];
}

class RecruiterInteractionsApiClient extends BaseApiClient {
  constructor() {
    super('');
  }

  async getInteractions(userId: number): Promise<RecruiterInteractionsResponse> {
    const response = await this.get<RecruiterInteraction[]>(`/api/dashboard/recruiter-interactions/${userId}`);
    return {
      success: response.success,
      data: response.data || []
    };
  }
}

export const recruiterInteractionsApi = new RecruiterInteractionsApiClient();