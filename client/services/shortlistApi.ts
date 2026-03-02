export interface ShortlistStatusResponse {
  success: boolean;
  data: {
    isShortlisted: boolean;
    notes?: string;
    requiresAuth?: boolean;
  };
}

export interface ShortlistActionResponse {
  success: boolean;
  message: string;
  data: {
    isShortlisted: boolean;
  };
}

export interface ShortlistedResume {
  shortlistId: number;
  resumeId: number;
  title: string;
  personalInfo: any;
  summary: string;
  upvotes: number;
  candidate: {
    id: number;
    name: string;
    email: string;
  };
  notes: string;
  shortlistedAt: string;
  shareToken: string;
}

class ShortlistApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("recruiter_token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Get fresh token on each request
    const token = this.getToken();
    console.log('🔍 Shortlist API - Token check:', {
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
      endpoint
    });

    // Add recruiter authentication
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      console.log('✅ Shortlist API - Added Authorization header');
    } else {
      console.warn('⚠️ Shortlist API - No recruiter token found in localStorage');
    }

    console.log('📡 Shortlist API - Making request:', {
      endpoint,
      method: options.method || 'GET',
      headers,
      hasAuthHeader: !!headers.Authorization
    });

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      console.log('📡 Shortlist API - Response:', {
        status: response.status,
        ok: response.ok,
        endpoint
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          message: data.message || data.error || `Request failed with status ${response.status}`
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('Shortlist API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: 'Failed to connect to server'
      };
    }
  }

  // Check if a resume is shortlisted
  async checkStatus(resumeId: number, shareToken: string): Promise<ShortlistStatusResponse> {
    // Add cache busting parameter to ensure fresh data
    const cacheBuster = Date.now();
    const response = await this.request<{ isShortlisted: boolean; notes?: string; requiresAuth?: boolean }>(`/api/recruiter/shortlist/status/${resumeId}/${shareToken}?_t=${cacheBuster}`);
    return {
      success: response.success,
      data: response.data || { isShortlisted: false, requiresAuth: true }
    };
  }

  // Add resume to shortlist
  async add(resumeId: number, shareToken: string, notes?: string): Promise<ShortlistActionResponse> {
    const response = await this.request<{ isShortlisted: boolean }>('/api/recruiter/shortlist/add', {
      method: 'POST',
      body: JSON.stringify({
        resumeId,
        shareToken,
        notes: notes || ''
      })
    });
    return {
      success: response.success,
      message: response.message || 'Added to shortlist',
      data: response.data || { isShortlisted: true }
    };
  }

  // Remove resume from shortlist
  async remove(resumeId: number, shareToken: string): Promise<ShortlistActionResponse> {
    const response = await this.request<{ isShortlisted: boolean }>('/api/recruiter/shortlist/remove', {
      method: 'POST',
      body: JSON.stringify({
        resumeId,
        shareToken
      })
    });
    return {
      success: response.success,
      message: response.message || 'Removed from shortlist',
      data: response.data || { isShortlisted: false }
    };
  }

  // Get all shortlisted resumes for the logged-in recruiter
  async getMyShortlist(): Promise<{ success: boolean; data: ShortlistedResume[] }> {
    console.log('🔍 [getMyShortlist] Starting request...');
    console.log('🔍 [getMyShortlist] Checking localStorage for recruiter_token');
    console.log('🔍 [getMyShortlist] All localStorage keys:', Object.keys(localStorage));
    
    const token = this.getToken();
    console.log('🔍 [getMyShortlist] Token found:', !!token);
    if (token) {
      console.log('🔍 [getMyShortlist] Token preview:', token.substring(0, 30) + '...');
      console.log('🔍 [getMyShortlist] Token length:', token.length);
    } else {
      console.error('❌ [getMyShortlist] NO TOKEN FOUND IN LOCALSTORAGE!');
      console.log('🔍 [getMyShortlist] recruiter_token value:', localStorage.getItem('recruiter_token'));
      console.log('🔍 [getMyShortlist] recruiterAuthToken value:', localStorage.getItem('recruiterAuthToken'));
    }
    
    const response = await this.request<ShortlistedResume[]>('/api/recruiter/shortlist/my-shortlist');
    console.log('🔍 [getMyShortlist] Response:', response);
    return {
      success: response.success,
      data: response.data || []
    };
  }
}

export const shortlistApi = new ShortlistApiClient();
