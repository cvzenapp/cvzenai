import { BaseApiClient, ApiResponse } from './baseApiClient';
import type { 
  CreateJobApplicationRequest, 
  JobApplicationResponse,
  UserResume 
} from '@shared/jobApplication';

class JobApplicationApi extends BaseApiClient {
  async submitApplication(data: CreateJobApplicationRequest): Promise<ApiResponse<JobApplicationResponse>> {
    return this.post<JobApplicationResponse>('/job-applications', data);
  }

  async getMyApplications(): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/job-applications/my-applications');
  }

  async checkApplicationStatus(jobId: string): Promise<ApiResponse<{ hasApplied: boolean; application: any | null }>> {
    return this.get<{ hasApplied: boolean; application: any | null }>(`/job-applications/check/${jobId}`);
  }

  async getUserResumes(): Promise<ApiResponse<UserResume[]>> {
    return this.get<UserResume[]>('/resumes');
  }
}

export const jobApplicationApi = new JobApplicationApi();
