import { ApiResponse } from './baseApiClient';

export interface JobApplication {
  id: number;
  job_id: number;
  user_id: number | null;
  resume_id: number | null;
  cover_letter: string | null;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
  applied_at: string;
  updated_at: string;
  shared_token?: string;
  job_title?: string;
  company_name?: string;
  applicant_name?: string;
  applicant_email?: string;
  applicant_phone?: string;
  resume_title?: string;
  resume_content?: any;
  is_guest?: boolean;
  resume_file_url?: string;
  guest_name?: string;
  guest_email?: string;
  // AI Screening fields
  ai_score?: number;
  ai_recommendation?: string;
  ai_reasoning?: string;
  ai_strengths?: string[];
  ai_concerns?: string[];
  ai_screened_at?: string;
}

export interface ApplicationFilters {
  jobId?: number;
  status?: string;
}

class RecruiterApplicationsApi {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("recruiter_token");
    console.log('[RecruiterApplicationsApi] Getting auth headers:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20)
    });
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get all applications for recruiter's job postings
   */
  async getApplications(filters?: ApplicationFilters): Promise<ApiResponse<JobApplication[]>> {
    const params = new URLSearchParams();
    if (filters?.jobId) params.append('jobId', filters.jobId.toString());
    if (filters?.status) params.append('status', filters.status);

    const queryString = params.toString();
    const url = `/api/recruiter/applications${queryString ? `?${queryString}` : ''}`;

    const headers = this.getAuthHeaders();
    console.log('[RecruiterApplicationsApi] Making request to:', url);
    console.log('[RecruiterApplicationsApi] Headers:', headers);

    const response = await fetch(url, {
      headers,
    });

    console.log('[RecruiterApplicationsApi] Response status:', response.status);
    const data = await response.json();
    console.log('[RecruiterApplicationsApi] Response data:', data);
    
    return data;
  }

  /**
   * Get single application details
   */
  async getApplication(id: number): Promise<ApiResponse<JobApplication>> {
    const response = await fetch(`/api/recruiter/applications/${id}`, {
      headers: this.getAuthHeaders(),
    });

    return response.json();
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(id: number, status: JobApplication['status']): Promise<ApiResponse<JobApplication>> {
    const response = await fetch(`/api/recruiter/applications/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    return response.json();
  }

  /**
   * Screen application with AI
   */
  async screenApplication(applicationId: number, jobRequirements?: string): Promise<ApiResponse<JobApplication>> {
    const response = await fetch(`/api/recruiter/applications/screen/${applicationId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ jobRequirements }),
    });

    return response.json();
  }
}

export const recruiterApplicationsApi = new RecruiterApplicationsApi();
