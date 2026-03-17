import { BaseApiClient } from './baseApiClient';

export interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  description: string;
  requirements: string[];
  matchScore: number;
  postedDate: string;
  url?: string;
  source?: string;
}

export interface ResumeAdvice {
  type: 'improvement' | 'template' | 'section' | 'general';
  title: string;
  suggestions: string[];
  actionItems?: string[];
}

export interface AIAnalysis {
  strengths?: string[];
  improvements?: string[];
  score?: number;
}

export interface ChatMessage {
  message: string;
  type?: 'general_chat' | 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep';
  context?: {
    userProfile?: {
      skills?: string[];
      experience?: any[];
      location?: string;
      jobTitle?: string;
    };
    resumeData?: any;
    jobPreferences?: any;
  };
}

export interface ChatResponse {
  success: boolean;
  response: {
    type: 'text' | 'jobs' | 'resume_advice' | 'analysis';
    content: string;
    jobResults?: JobResult[];
    resumeAdvice?: ResumeAdvice;
    analysis?: AIAnalysis;
    suggestions?: string[];
    actionItems?: string[];
  };
}

export interface QuickActionSuggestion {
  icon: string;
  label: string;
  query: string;
  category: string;
}

export interface SuggestionsResponse {
  success: boolean;
  suggestions: QuickActionSuggestion[];
}

class AiChatApiService extends BaseApiClient {
  constructor() {
    super('/api/ai-chat');
  }

  /**
   * Send a message to the AI chat service
   */
  async sendMessage(messageData: ChatMessage): Promise<ChatResponse> {
    try {
      const response = await this.post<ChatResponse>('/message', messageData);
      if (response.success && response.data) {
        return response.data;
      }
      
      // Handle different error formats
      const errorMessage = typeof response.error === 'string' 
        ? response.error 
        : response.message || 'Failed to send message';
      
      throw new Error(errorMessage);
    } catch (error) {
      console.error('AI Chat API Error:', error);
      
      // Handle different error types
      if (error instanceof Error) {
        throw error;
      }
      
      // Handle object errors
      if (typeof error === 'object' && error !== null) {
        const errorObj = error as any;
        const message = errorObj.message || errorObj.error || 'Unknown error occurred';
        throw new Error(message);
      }
      
      // Fallback
      throw new Error('Failed to send message to AI service');
    }
  }

  /**
   * Get personalized quick action suggestions
   */
  async getSuggestions(): Promise<SuggestionsResponse> {
    const response = await this.get<SuggestionsResponse>('/suggestions');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to get suggestions');
  }

  /**
   * Get user context for personalized responses
   */
  private getUserContext() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return {
          userProfile: {
            skills: user.skills || [],
            experience: user.experience || [],
            location: user.location || '',
            jobTitle: user.profile?.jobTitle || user.title || ''
          }
        };
      }
    } catch (error) {
      console.warn('Failed to get user context:', error);
    }
    return {};
  }

  /**
   * Analyze resume content using AI
   */
  async analyzeResume(resumeContent: string, resumeData?: any): Promise<ChatResponse> {
    const response = await this.post<ChatResponse>('/analyze-resume', {
      resumeContent,
      resumeData
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to analyze resume');
  }

  /**
   * Send a message with specific type for better AI responses
   */
  async sendTypedMessage(
    message: string, 
    type: 'general_chat' | 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep',
    context?: ChatMessage['context']
  ): Promise<ChatResponse> {
    return this.sendMessage({ message, type, context });
  }

  /**
   * Send a message with automatic user context
   */
  async sendMessageWithContext(message: string): Promise<ChatResponse> {
    const context = this.getUserContext();
    return this.sendMessage({ message, context });
  }

  /**
   * Get chat history from the server
   */
  async getChatHistory(limit: number = 20): Promise<{
    success: boolean;
    activeSession: {
      id: number;
      sessionName: string;
      createdAt: string;
      updatedAt: string;
    };
    recentMessages: Array<{
      id: number;
      messageType: string;
      content: string;
      response: string;
      createdAt: string;
    }>;
  }> {
    const response = await this.get(`/memory/sessions?limit=${limit}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to load chat history');
  }

  async getSessions() {
    const response = await this.get('/sessions');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to load sessions');
  }

  async createSession(name: string) {
    const response = await this.post('/sessions', { name });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to create session');
  }

  async switchSession(sessionId: number) {
    const response = await this.put(`/sessions/${sessionId}/activate`, {});
    if (response.success) {
      return response;
    }
    throw new Error(response.error as string || 'Failed to switch session');
  }

  async deleteSession(sessionId: number) {
    const response = await this.delete(`/sessions/${sessionId}`);
    if (response.success) {
      return response;
    }
    throw new Error(response.error as string || 'Failed to delete session');
  }

  async updateSessionName(sessionId: number, name: string) {
    const response = await this.put(`/sessions/${sessionId}/name`, { name });
    if (response.success) {
      return response;
    }
    throw new Error(response.error as string || 'Failed to update session name');
  }

  /**
   * Get initial job recommendations based on user profile
   */
  async getInitialJobs(skills?: string[], location?: string): Promise<ChatResponse> {
    try {
      console.log('🚀 Calling initial-jobs API with:', { skills, location });
      const response = await this.post('/initial-jobs', { skills, location });
      console.log('📨 API response:', response);
      
      if (response.success) {
        return response;
      }
      
      throw new Error(response.message || 'Failed to load initial jobs');
    } catch (error) {
      console.error('Initial Jobs API Error:', error);
      throw error instanceof Error ? error : new Error('Failed to load initial job recommendations');
    }
  }
}

export const aiChatApi = new AiChatApiService();