import { getAuthToken } from './unifiedAuthService';

export interface OptimizationProgress {
  type: 'connected' | 'progress' | 'section_completed' | 'section_skipped' | 'section_error' | 'completed' | 'final_result' | 'error';
  stage?: string;
  message: string;
  currentSection?: string;
  sectionName?: string;
  sectionsTotal?: number;
  sectionsCompleted?: number;
  progress?: number;
  improvements?: string[];
  originalScore?: number;
  newScore?: number;
  improvement?: number;
  changesApplied?: string[];
  totalImprovements?: number;
  error?: string;
  success?: boolean;
  data?: any;
}

export class ResumeOptimizationStreamService {
  private eventSource: EventSource | null = null;

  async optimizeResumeWithProgress(
    resumeId: string,
    jobTitle: string,
    jobDescription: string,
    companyName: string,
    onProgress: (progress: OptimizationProgress) => void,
    onComplete: (result: any) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Close any existing connection
      this.disconnect();

      const requestBody = {
        resumeId,
        jobTitle,
        jobDescription,
        companyName,
        jobRequirements: []
      };

      // Create EventSource for Server-Sent Events
      const url = new URL('/api/resume-optimization/optimize-stream', window.location.origin);
      
      // Since EventSource doesn't support POST with body, we'll use fetch with streaming
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'final_result') {
                  onComplete(data);
                } else if (data.type === 'error') {
                  onError(data.message);
                } else {
                  onProgress(data);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Resume optimization stream error:', error);
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const resumeOptimizationStreamService = new ResumeOptimizationStreamService();