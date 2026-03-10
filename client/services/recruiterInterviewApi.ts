import type { 
  InterviewInvitation,
  CreateInterviewRequest,
  RespondToInterviewRequest,
  RescheduleInterviewRequest,
  InterviewRescheduleRequest,
  InterviewFeedback
} from '@shared/api';

export class RecruiterInterviewApiClient {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("recruiter_token");
    console.log('🔐 RecruiterInterviewApi - Getting auth headers:', {
      hasToken: !!token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api${endpoint}`;
    const headers = this.getAuthHeaders();
    
    console.log('🌐 RecruiterInterviewApi Request:', { 
      endpoint, 
      url,
      hasToken: !!localStorage.getItem('recruiter_token'),
      tokenPreview: localStorage.getItem('recruiter_token')?.substring(0, 30) + '...',
      headers: Object.keys(headers)
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    console.log('📡 RecruiterInterviewApi Response:', {
      status: response.status,
      statusText: response.statusText,
      url
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ RecruiterInterviewApi Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestHeaders: headers
      });
      
      const error = new Error(errorData?.message || errorData?.error || `HTTP ${response.status}`);
      (error as any).status = response.status;
      (error as any).type = response.status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
      throw error;
    }

    const data = await response.json();
    console.log('✅ RecruiterInterviewApi Success:', data);
    return data;
  }

  /**
   * Create a new interview invitation (recruiter only)
   */
  async createInterview(request: CreateInterviewRequest): Promise<{ interviewId: number; createdAt: string }> {
    const response = await this.request<any>('/interviews/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data || response;
  }

  /**
   * Update an existing interview invitation (recruiter only)
   */
  async updateInterview(interviewId: string, request: Partial<CreateInterviewRequest>): Promise<{ interviewId: string; updatedAt: string }> {
    const response = await this.request<any>(`/interviews/${interviewId}/update`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    return response.data || response;
  }

  /**
   * Get all interviews for the current recruiter
   */
  async getMyInterviews(): Promise<InterviewInvitation[]> {
    try {
      console.log('🔄 RecruiterInterviewApiClient - Getting my interviews');
      const response = await this.request<any>('/interviews/my-interviews');
      console.log('✅ RecruiterInterviewApiClient - Got response:', response);
      return response.data || response;
    } catch (error: any) {
      console.error('❌ RecruiterInterviewApiClient - Error getting interviews:', error);
      
      // Don't clear localStorage on API errors - just return empty array
      // This prevents the interview tab from logging out users
      if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        console.log('🔐 Authentication error in recruiter interview API - returning empty array instead of clearing auth');
        return [];
      }
      
      // For other errors, still throw to show error message
      throw error;
    }
  }

  /**
   * Get specific interview details
   */
  async getInterview(interviewId: number): Promise<InterviewInvitation> {
    const response = await this.request<any>(`/interviews/${interviewId}`);
    return response.data || response;
  }

  /**
   * Cancel an interview
   */
  async cancelInterview(interviewId: number, reason?: string): Promise<void> {
    await this.request(`/interviews/${interviewId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Request to reschedule an interview
   */
  async requestReschedule(request: RescheduleInterviewRequest): Promise<{ rescheduleRequestId: number; createdAt: string }> {
    const response = await this.request<any>('/interviews/reschedule', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data || response;
  }

  /**
   * Get pending reschedule requests for an interview
   */
  async getRescheduleRequests(interviewId: number): Promise<InterviewRescheduleRequest[]> {
    const response = await this.request<any>(`/interviews/${interviewId}/reschedule-requests`);
    return response.data || response;
  }

  /**
   * Respond to a reschedule request
   */
  async respondToReschedule(rescheduleId: number, status: 'accepted' | 'declined', responseMessage?: string): Promise<void> {
    await this.request(`/interviews/reschedule/${rescheduleId}/respond`, {
      method: 'POST',
      body: JSON.stringify({
        status,
        responseMessage
      }),
    });
  }

  /**
   * Mark interview as completed
   */
  async markCompleted(
    interviewId: number, 
    decision?: 'hired' | 'rejected' | 'hold', 
    feedback?: string, 
    evaluationMetrics?: any[]
  ): Promise<void> {
    await this.request(`/interviews/${interviewId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ decision, feedback, evaluationMetrics }),
    });
  }

  /**
   * Submit interview feedback
   */
  async submitFeedback(interviewId: number, feedback: Partial<InterviewFeedback>): Promise<void> {
    await this.request(`/interviews/${interviewId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  /**
   * Get interview feedback
   */
  async getFeedback(interviewId: number): Promise<InterviewFeedback[]> {
    const response = await this.request<any>(`/interviews/${interviewId}/feedback`);
    return response.data || response;
  }

  /**
   * Generate AI-powered interview preparation content
   */
  async generateAIPreparation(
    jobPostingId: number,
    candidateId?: number,
    resumeId?: number,
    interviewType: string = 'technical',
    interviewMode: string = 'video_call',
    interviewDateTime?: string,
    durationMinutes?: number
  ): Promise<{
    description: string;
    instructions: string;
    internalNotes: string;
    jobTitle: string;
    candidateName: string;
  }> {
    const response = await this.request<any>('/interviews/prepare-ai', {
      method: 'POST',
      body: JSON.stringify({
        jobPostingId,
        candidateId,
        resumeId,
        interviewType,
        interviewMode,
        interviewDateTime,
        durationMinutes
      }),
    });
    return response.data || response;
  }
}

// Export singleton instance
export const recruiterInterviewApi = new RecruiterInterviewApiClient();