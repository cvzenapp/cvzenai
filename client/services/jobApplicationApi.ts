import { BaseApiClient } from './baseApiClient';
import type { 
  JobApplication, 
  CreateJobApplicationRequest, 
  JobApplicationResponse,
  UserResume 
} from '@shared/jobApplication';

class JobApplicationApi extends BaseApiClient {
  async submitApplication(data: CreateJobApplicationRequest): Promise<JobApplicationResponse> {
    return this.post<JobApplicationResponse>('/job-applications', data);
  }

  async getMyApplications(): Promise<{ success: boolean; data: any[] }> {
    return this.get('/job-applications/my-applications');
  }

  async checkApplicationStatus(jobId: number): Promise<{ 
    success: boolean; 
    data: { hasApplied: boolean; application: any | null } 
  }> {
    return this.get(`/job-applications/check/${jobId}`);
  }

  async getUserResumes(): Promise<{ success: boolean; data: UserResume[] }> {
    return this.get('/resumes');
  }
}

export const jobApplicationApi = new JobApplicationApi();
