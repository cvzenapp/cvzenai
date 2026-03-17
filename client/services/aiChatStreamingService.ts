export interface StreamingChatMessage {
  type: 'connected' | 'typing' | 'chunk' | 'complete' | 'error' | 'jobs' | 'job';
  content?: string;
  message?: string;
  isComplete?: boolean;
  suggestions?: string[];
  actionItems?: string[];
  analysis?: any;
  memoryUpdated?: boolean;
  contextUsed?: string[];
  jobResults?: any[];
  job?: any; // Single job for streaming
}

export interface StreamingChatRequest {
  message: string;
  type?: 'general_chat' | 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep';
  usePremium?: boolean;
  context?: {
    userProfile?: any;
    resumeData?: any;
    jobPreferences?: any;
  };
}

export interface StreamingCallbacks {
  onConnect?: () => void;
  onTyping?: (message: string) => void;
  onChunk?: (content: string) => void;
  onJobs?: (jobs: any[]) => void;
  onJob?: (job: any) => void; // Single job callback
  onComplete?: (data: {
    suggestions?: string[];
    actionItems?: string[];
    analysis?: any;
    memoryUpdated?: boolean;
    contextUsed?: string[];
  }) => void;
  onError?: (error: string) => void;
}

class AIChatStreamingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '';
  }

  async streamChat(
    request: StreamingChatRequest,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      callbacks.onError?.('Authentication required');
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/ai-chat/stream`, {
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
                const data: StreamingChatMessage = JSON.parse(line.slice(6));
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

  private handleStreamMessage(data: StreamingChatMessage, callbacks: StreamingCallbacks): void {
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
        
      case 'jobs':
        console.log('📦 Streaming service received jobs message:', {
          hasJobResults: !!data.jobResults,
          jobCount: data.jobResults?.length,
          hasContent: !!data.content,
          jobResults: data.jobResults
        });
        if (data.jobResults) {
          console.log('🎯 Calling onJobs callback with', data.jobResults.length, 'jobs');
          callbacks.onJobs?.(data.jobResults);
        }
        if (data.content) {
          callbacks.onChunk?.(data.content);
        }
        break;
        
      case 'job':
        console.log('💼 Streaming service received single job:', data.job);
        if (data.job && callbacks.onJob) {
          callbacks.onJob(data.job);
        }
        break;
        
      case 'complete':
        callbacks.onComplete?.({
          suggestions: data.suggestions,
          actionItems: data.actionItems,
          analysis: data.analysis,
          memoryUpdated: data.memoryUpdated,
          contextUsed: data.contextUsed
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
  async sendMessage(request: StreamingChatRequest): Promise<any> {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseUrl}/api/ai-chat/message`, {
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
}

export const aiChatStreamingService = new AIChatStreamingService();