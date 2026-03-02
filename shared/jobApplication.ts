export interface JobApplication {
  id: number;
  jobId: number;
  userId: number;
  resumeId: number;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'accepted';
  appliedAt: string;
  updatedAt: string;
}

export interface CreateJobApplicationRequest {
  jobId: number;
  resumeId: number;
  coverLetter?: string;
}

export interface JobApplicationResponse {
  success: boolean;
  data?: JobApplication;
  error?: string;
  message?: string;
}

export interface UserResume {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}
