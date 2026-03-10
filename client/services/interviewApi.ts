import type { 
  InterviewInvitation,
  CreateInterviewRequest,
  RespondToInterviewRequest,
  RescheduleInterviewRequest,
  InterviewRescheduleRequest,
  InterviewFeedback
} from '@shared/api';

/**
 * Interview API Client
 * Handles interview scheduling and management for both recruiters and candidates
 */
export class InterviewApiClient {
  private baseUrl = '/api/interviews';

  /**
   * Get authentication headers - supports both recruiter and job seeker tokens
   */
  private getAuthHeaders(): Record<string, string> {
    // Check for recruiter token first
    const recruiterToken = localStorage.getItem('recruiter_token');
    if (recruiterToken) {
      console.log('🔐 Using recruiter token for interview API');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${recruiterToken}`
      };
    }

    // Fall back to job seeker token
    const jobSeekerToken = localStorage.getItem('authToken');
    if (jobSeekerToken) {
      console.log('🔐 Using job seeker token for interview API');
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jobSeekerToken}`
      };
    }

    console.warn('⚠️ No authentication token found');
    return {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make authenticated request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    console.log('📡 Interview API Request:', {
      url,
      method: options.method || 'GET',
      hasAuth: !!headers.Authorization
    });

    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Interview API Error:', {
        status: response.status,
        data
      });
      throw new Error(data.message || data.error || 'Request failed');
    }

    console.log('✅ Interview API Response:', data);
    return data.data || data;
  }

  /**
   * Create a new interview invitation (recruiter only)
   */
  async createInterview(request: CreateInterviewRequest): Promise<{ interviewId: number; createdAt: string }> {
    console.log('📤 Creating interview via API:', request);
    return this.request('/create', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Respond to an interview invitation (candidate only)
   */
  async respondToInterview(request: RespondToInterviewRequest): Promise<{ status: string }> {
    return this.request('/respond', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Request to reschedule an interview
   */
  async requestReschedule(request: RescheduleInterviewRequest): Promise<{ rescheduleRequestId: number; createdAt: string }> {
    return this.request('/reschedule', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  }

  /**
   * Get all interviews for the current user
   */
  async getMyInterviews(): Promise<InterviewInvitation[]> {
    try {
      console.log('🔄 InterviewApiClient - Getting my interviews');
      const data = await this.request<InterviewInvitation[]>('/my-interviews');
      console.log('✅ InterviewApiClient - Got interviews:', data);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('❌ InterviewApiClient - Error getting interviews:', error);
      
      // Don't clear localStorage on API errors - just return empty array
      if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        console.log('🔐 Authentication error in interview API - returning empty array');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Get specific interview details
   */
  async getInterview(interviewId: number): Promise<InterviewInvitation> {
    return this.request(`/${interviewId}`);
  }

  /**
   * Cancel an interview
   */
  async cancelInterview(interviewId: number, reason?: string): Promise<void> {
    await this.request(`/${interviewId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  /**
   * Get pending reschedule requests for an interview
   */
  async getRescheduleRequests(interviewId: number): Promise<InterviewRescheduleRequest[]> {
    return this.request(`/${interviewId}/reschedule-requests`);
  }

  /**
   * Respond to a reschedule request
   */
  async respondToReschedule(rescheduleId: number, status: 'accepted' | 'declined', responseMessage?: string): Promise<void> {
    await this.request(`/reschedule/${rescheduleId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ status, responseMessage })
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
    await this.request(`/${interviewId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ decision, feedback, evaluationMetrics })
    });
  }

  /**
   * Submit interview feedback
   */
  async submitFeedback(interviewId: number, feedback: Partial<InterviewFeedback>): Promise<void> {
    await this.request(`/${interviewId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback)
    });
  }

  /**
   * Get interview feedback
   */
  async getFeedback(interviewId: number): Promise<InterviewFeedback[]> {
    return this.request(`/${interviewId}/feedback`);
  }
}

// Export singleton instance
export const interviewApi = new InterviewApiClient();