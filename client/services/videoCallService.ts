interface GenerateTokenRequest {
  interviewId: number;
  userType: 'recruiter' | 'candidate';
  audioEnabled: boolean;
  videoEnabled: boolean;
}

interface GenerateTokenResponse {
  token: string;
  roomName: string;
  serverUrl: string;
}

export class VideoCallService {
  private getAuthHeaders(userType?: 'recruiter' | 'candidate'): Record<string, string> {
    // Determine which token to use based on userType or available tokens
    let token: string | null = null;
    
    if (userType === 'recruiter') {
      token = localStorage.getItem('recruiter_token');
    } else if (userType === 'candidate') {
      token = localStorage.getItem('authToken');
    } else {
      // Auto-detect based on available tokens
      token = localStorage.getItem('recruiter_token') || localStorage.getItem('authToken');
    }

    console.log('🔐 VideoCallService - Getting auth headers:', {
      userType,
      hasRecruiterToken: !!localStorage.getItem('recruiter_token'),
      hasAuthToken: !!localStorage.getItem('authToken'),
      selectedToken: token ? token.substring(0, 20) + '...' : 'none'
    });

    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, userType?: 'recruiter' | 'candidate'): Promise<T> {
    const url = `/api${endpoint}`;
    const headers = this.getAuthHeaders(userType);
    
    console.log('🌐 VideoCallService Request:', { 
      endpoint, 
      url,
      userType,
      hasToken: !!headers.Authorization
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    console.log('📡 VideoCallService Response:', {
      status: response.status,
      statusText: response.statusText,
      url
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ VideoCallService Error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      const error = new Error(errorData?.message || errorData?.error || `HTTP ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    const data = await response.json();
    console.log('✅ VideoCallService Success:', data);
    return data;
  }

  /**
   * Generate LiveKit token for interview video call
   */
  async generateToken(request: GenerateTokenRequest): Promise<string> {
    const response = await this.request<{ success: boolean; data: GenerateTokenResponse }>(
      '/video/generate-token', 
      {
        method: 'POST',
        body: JSON.stringify(request),
      },
      request.userType
    );
    return response.data.token;
  }

  /**
   * Mark interview as completed after video call ends
   */
  async markInterviewCompleted(interviewId: number, userType?: 'recruiter' | 'candidate'): Promise<void> {
    await this.request(`/video/${interviewId}/complete`, {
      method: 'POST',
    }, userType);
  }

  /**
   * Get video call history for an interview
   */
  async getCallHistory(interviewId: number, userType?: 'recruiter' | 'candidate'): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[] }>(`/video/history/${interviewId}`, {}, userType);
    return response.data || [];
  }

  /**
   * Save call recording metadata (if recording is enabled)
   */
  async saveCallRecording(interviewId: number, recordingData: any, userType?: 'recruiter' | 'candidate'): Promise<void> {
    await this.request(`/video/recording/${interviewId}`, {
      method: 'POST',
      body: JSON.stringify(recordingData),
    }, userType);
  }
}

export const videoCallService = new VideoCallService();