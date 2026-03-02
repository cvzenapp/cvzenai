import { BaseApiClient } from './baseApiClient';

export interface Candidate {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  title?: string;
  experience?: string;
  skills: string[];
  education?: string;
  availability?: 'immediate' | 'two-weeks' | 'one-month' | 'flexible';
  resumeId?: string;
  resumeShareUrl?: string;
  profilePicture?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  registeredAt: string;
  lastActive?: string;
}

export interface CandidateFilters {
  search?: string;
  location?: string;
  experience?: string;
  availability?: string;
  skills?: string[];
}

class CandidatesApiService extends BaseApiClient {
  constructor() {
    super('/api/recruiter/candidates');
  }

  async getCandidates(filters?: CandidateFilters): Promise<{ success: boolean; candidates: Candidate[] }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.experience) params.append('experience', filters.experience);
    if (filters?.availability) params.append('availability', filters.availability);
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
    
    const queryString = params.toString();
    const response = await this.get<{ success: boolean; candidates: Candidate[] }>(
      queryString ? `?${queryString}` : ''
    );
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to fetch candidates');
  }

  async getCandidateById(id: string): Promise<{ success: boolean; candidate: Candidate }> {
    const response = await this.get<{ success: boolean; candidate: Candidate }>(`/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to fetch candidate');
  }
}

export const candidatesApi = new CandidatesApiService();
