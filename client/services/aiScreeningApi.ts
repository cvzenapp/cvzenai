/**
 * AI Screening API Service
 * Handles AI-powered candidate screening for recruiters
 */

export interface ScreeningResult {
  id: string | number;
  name: string;
  score: number;
  recommendation: 'Highly Recommended' | 'Recommended' | 'Maybe' | 'Not Recommended';
  strengths?: string[];
  concerns?: string[];
  reasoning: string;
  resumeUrl?: string | null;
}

export interface ScreeningResponse {
  success: boolean;
  results: ScreeningResult[];
  totalCandidates: number;
  screenedCandidates: number;
  patterns?: string;
  error?: string;
}

export interface ScreeningStats {
  totalExamples: number;
  shortlistedCount: number;
  notShortlistedCount: number;
  shortlistRate: string;
}

export interface StreamingEvent {
  type: 'progress' | 'batch' | 'batch_error' | 'complete' | 'error';
  data: any;
}

export type StreamingCallback = (event: StreamingEvent) => void;

class AIScreeningAPI {
  private baseUrl = '/api/ai-screening';

  /**
   * Screen candidates using AI with streaming results
   */
  async screenCandidatesStreaming(
    candidates: any[],
    jobRequirements: string | undefined,
    onEvent: StreamingCallback
  ): Promise<void> {
    const token = localStorage.getItem('recruiter_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/screen-candidates-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        candidates,
        jobRequirements
      })
    });

    if (!response.ok) {
      throw new Error('Failed to start screening stream');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream not available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return;
            }

            try {
              const event: StreamingEvent = JSON.parse(data);
              onEvent(event);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Screen candidates using AI (non-streaming)
   */
  async screenCandidates(
    candidates: any[],
    jobRequirements?: string
  ): Promise<ScreeningResponse> {
    const token = localStorage.getItem('recruiter_token');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/screen-candidates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        candidates,
        jobRequirements
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to screen candidates');
    }

    return response.json();
  }

  /**
   * Get screening statistics
   */
  async getStats(): Promise<{ success: boolean; stats: ScreeningStats }> {
    const token = localStorage.getItem('recruiterToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get screening stats');
    }

    return response.json();
  }
}

export const aiScreeningApi = new AIScreeningAPI();
