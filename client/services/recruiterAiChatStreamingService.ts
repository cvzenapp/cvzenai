export interface RecruiterStreamingChatMessage {
  type: 'connected' | 'typing' | 'chunk' | 'complete' | 'error' | 'candidates' | 'job_description' | 'hr_advice' | 'screening_progress';
  content?: string;
  message?: string;
  isComplete?: boolean;
  suggestions?: string[];
  actionItems?: string[];
  candidateResults?: any[];
  jobDescription?: any;
  hrAdvice?: any;
  progress?: number;
  batchNumber?: number;
  totalBatches?: number;
}

export interface RecruiterStreamingChatRequest {
  message: string;
  searchSource?: 'cvzen' | 'web' | 'both';
  context?: {
    recruiterProfile?: any;
  };
}

export interface RecruiterStreamingCallbacks {
  onConnect?: () => void;
  onTyping?: (message: string) => void;
  onChunk?: (content: string) => void;
  onCandidates?: (candidates: any[]) => void;
  onJobDescription?: (jobDescription: any) => void;
  onHRAdvice?: (hrAdvice: any) => void;
  onScreeningProgress?: (progress: number, batchNumber: number, totalBatches: number) => void;
  onComplete?: (data: {
    suggestions?: string[];
    actionItems?: string[];
  }) => void;
  onError?: (error: string) => void;
}

class RecruiterAIChatStreamingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  async streamChat(
    request: RecruiterStreamingChatRequest,
    callbacks: RecruiterStreamingCallbacks
  ): Promise<void> {
    // Try both token keys for backwards compatibility
    const token = localStorage.getItem('recruiter_token') || localStorage.getItem('recruiterAuthToken');
    
    console.log('🔐 RecruiterAIChatStreamingService - Getting token:', {
      hasRecruiterToken: !!localStorage.getItem('recruiter_token'),
      hasRecruiterAuthToken: !!localStorage.getItem('recruiterAuthToken'),
      tokenUsed: token ? token.substring(0, 20) + '...' : 'none'
    });
    
    if (!token) {
      console.error('❌ No recruiter token found in localStorage');
      callbacks.onError?.('Authentication required');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/recruiter-ai-chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            // Parse Server-Sent Events format
            if (line.startsWith('data: ')) {
              try {
                const data: RecruiterStreamingChatMessage = JSON.parse(line.slice(6));
                this.handleStreamMessage(data, callbacks);
              } catch (parseError) {
                console.error('Error parsing stream data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Streaming error:', error);
      callbacks.onError?.(error instanceof Error ? error.message : 'Unknown streaming error');
    }
  }

  private handleStreamMessage(data: RecruiterStreamingChatMessage, callbacks: RecruiterStreamingCallbacks): void {
    switch (data.type) {
      case 'connected':
        callbacks.onConnect?.();
        break;
        
      case 'typing':
        callbacks.onTyping?.(data.message || 'AI is thinking...');
        break;
        
      case 'chunk':
        if (data.content) {
          callbacks.onChunk?.(data.content);
        }
        break;
        
      case 'candidates':
        console.log('📦 Recruiter streaming service received candidates:', {
          hasCandidates: !!data.candidateResults,
          count: data.candidateResults?.length
        });
        if (data.candidateResults) {
          console.log('🎯 Calling onCandidates callback with', data.candidateResults.length, 'candidates');
          callbacks.onCandidates?.(data.candidateResults);
        }
        if (data.content) {
          callbacks.onChunk?.(data.content);
        }
        break;
        
      case 'screening_progress':
        if (data.progress !== undefined && data.batchNumber !== undefined && data.totalBatches !== undefined) {
          callbacks.onScreeningProgress?.(data.progress, data.batchNumber, data.totalBatches);
        }
        break;
        
      case 'job_description':
        if (data.jobDescription) {
          callbacks.onJobDescription?.(data.jobDescription);
        }
        break;
        
      case 'hr_advice':
        if (data.hrAdvice) {
          callbacks.onHRAdvice?.(data.hrAdvice);
        }
        break;
        
      case 'complete':
        callbacks.onComplete?.({
          suggestions: data.suggestions,
          actionItems: data.actionItems
        });
        break;
        
      case 'error':
        callbacks.onError?.(data.message || 'Unknown error occurred');
        break;
        
      default:
        console.warn('Unknown stream message type:', data.type);
    }
  }

  // Fallback method for non-streaming chat (backwards compatibility)
  async sendMessage(request: RecruiterStreamingChatRequest): Promise<any> {
    // Try both token keys for backwards compatibility
    const token = localStorage.getItem('recruiter_token') || localStorage.getItem('recruiterAuthToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/api/recruiter-ai-chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Upload file for recruiter AI chat
  async uploadFile(file: File): Promise<any> {
    // Try both token keys for backwards compatibility
    const token = localStorage.getItem('recruiter_token') || localStorage.getItem('recruiterAuthToken');
    
    console.log('🔐 RecruiterAIChatStreamingService - Upload file with token:', {
      hasRecruiterToken: !!localStorage.getItem('recruiter_token'),
      hasRecruiterAuthToken: !!localStorage.getItem('recruiterAuthToken'),
      tokenUsed: token ? token.substring(0, 20) + '...' : 'none',
      fileName: file.name,
      fileSize: file.size
    });
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/api/recruiter-ai-chat/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    return response.json();
  }
}

export const recruiterAiChatStreamingService = new RecruiterAIChatStreamingService();
