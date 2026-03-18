import { BaseApiClient } from './baseApiClient';

export interface ResumeOptimizationRequest {
  resumeId: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements?: string[];
  companyName: string;
  sectionName?: string; // Optional: specific section to optimize
}

export interface OptimizedResume {
  id: string;
  title: string;
  summary: string;
  skills: string[];
  experience: any[];
  projects: any[];
  updatedAt: string;
}

export interface ResumeOptimizationResponse {
  success: boolean;
  data: {
    optimizedResume: OptimizedResume;
    message: string;
  };
  error?: string;
  message?: string;
}

class ResumeOptimizationApiService extends BaseApiClient {
  constructor() {
    super('/api/resume-optimization');
  }

  async optimizeResume(data: ResumeOptimizationRequest): Promise<ResumeOptimizationResponse> {
    const response = await this.post<any>('/optimize', data);
    if (response.success && response.data) {
      return {
        success: response.success,
        data: response.data,
        error: response.error as string,
        message: response.message
      };
    }
    throw new Error(response.error as string || 'Failed to optimize resume');
  }

  async optimizeResumeStream(
    resumeId: string,
    jobTitle: string,
    jobDescription: string,
    jobRequirements: string[],
    companyName: string,
    sectionName?: string,
    onProgress?: (update: any) => void,
    onComplete?: (result: any) => void,
    onError?: (error: any) => void
  ): Promise<void> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const requestData: ResumeOptimizationRequest = {
        resumeId,
        jobTitle,
        jobDescription,
        jobRequirements,
        companyName,
        sectionName
      };

      const response = await fetch(`${this.baseUrl}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress' || data.type === 'section_completed' || data.type === 'section_skipped') {
                onProgress?.(data);
              } else if (data.type === 'completed' || data.type === 'final_result') {
                onComplete?.(data);
                break;
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Optimization failed');
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Resume optimization stream error:', error);
      onError?.(error);
    }
  }

  private getAuthToken(): string | null {
    // Use the same pattern as BaseApiClient
    return localStorage.getItem("authToken") || localStorage.getItem("recruiter_token");
  }
}

export const resumeOptimizationApi = new ResumeOptimizationApiService();