import { BaseApiClient } from './baseApiClient';

export interface CandidateResult {
  id: string;
  name: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  availability: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  email?: string;
  summary: string;
  // AI Screening fields
  aiScore?: number;
  aiRecommendation?: 'Highly Recommended' | 'Recommended' | 'Maybe' | 'Not Recommended';
  aiStrengths?: string[];
  aiConcerns?: string[];
  aiReasoning?: string;
}

export interface JobDescriptionTemplate {
  title: string;
  department: string;
  level: 'entry' | 'mid' | 'senior' | 'executive';
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  salaryRange?: string;
}

export interface HRAdvice {
  type: 'hiring' | 'interview' | 'onboarding' | 'retention' | 'policy';
  title: string;
  suggestions: string[];
  actionItems?: string[];
  templates?: string[];
}

export interface RecruiterChatMessage {
  message: string;
  context?: {
    recruiterProfile?: {
      company?: string;
      industry?: string;
      location?: string;
      jobTitle?: string;
    };
  };
}

export interface RecruiterChatResponse {
  success: boolean;
  response: {
    type: 'text' | 'candidates' | 'job_description' | 'hr_advice' | 'resume_analysis';
    content: string;
    candidateResults?: CandidateResult[];
    jobDescription?: JobDescriptionTemplate;
    hrAdvice?: HRAdvice;
    suggestions?: string[];
    actionItems?: string[];
  };
}

export interface RecruiterQuickActionSuggestion {
  icon: string;
  label: string;
  query: string;
  category: string;
}

export interface RecruiterSuggestionsResponse {
  success: boolean;
  suggestions: RecruiterQuickActionSuggestion[];
}

class RecruiterAiChatApiService extends BaseApiClient {
  constructor() {
    super('/api/recruiter-ai-chat');
  }

  /**
   * Send a message to the recruiter AI chat service
   */
  async sendMessage(messageData: RecruiterChatMessage): Promise<RecruiterChatResponse> {
    const response = await this.post<RecruiterChatResponse>('/message', messageData);
    if (response.success && response.data) {
      return response.data;
    }
    
    // Handle error properly - it might be an AuthError object or string
    let errorMessage = 'Failed to send message';
    if (response.error) {
      if (typeof response.error === 'string') {
        errorMessage = response.error;
      } else if (response.error.message) {
        errorMessage = response.error.message;
      }
    } else if (response.message) {
      errorMessage = response.message;
    }
    
    throw new Error(errorMessage);
  }

  /**
   * Get personalized quick action suggestions for recruiters
   */
  async getSuggestions(): Promise<RecruiterSuggestionsResponse> {
    const response = await this.get<RecruiterSuggestionsResponse>('/suggestions');
    if (response.success && response.data) {
      return response.data;
    }
    
    // Handle error properly - it might be an AuthError object or string
    let errorMessage = 'Failed to get suggestions';
    if (response.error) {
      if (typeof response.error === 'string') {
        errorMessage = response.error;
      } else if (response.error.message) {
        errorMessage = response.error.message;
      }
    } else if (response.message) {
      errorMessage = response.message;
    }
    
    throw new Error(errorMessage);
  }

  /**
   * Get recruiter context for personalized responses
   */
  private getRecruiterContext() {
    try {
      const recruiterData = localStorage.getItem('recruiterUser') || localStorage.getItem('recruiter_user');
      if (recruiterData) {
        const recruiter = JSON.parse(recruiterData);
        return {
          recruiterProfile: {
            company: recruiter.company?.name || '',
            industry: recruiter.company?.industry || '',
            location: recruiter.company?.location || '',
            jobTitle: recruiter.jobTitle || ''
          }
        };
      }
    } catch (error) {
      console.warn('Failed to get recruiter context:', error);
    }
    return {};
  }

  /**
   * Send a message with automatic recruiter context
   */
  async sendMessageWithContext(message: string): Promise<RecruiterChatResponse> {
    const context = this.getRecruiterContext();
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

  /**
   * Get all chat sessions
   */
  async getSessions(): Promise<{
    success: boolean;
    sessions: Array<{
      id: number;
      sessionName: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
    }>;
  }> {
    const response = await this.get('/sessions');
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to load sessions');
  }

  /**
   * Create a new chat session
   */
  async createSession(sessionName?: string): Promise<{
    success: boolean;
    session: {
      id: number;
      sessionName: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
    };
  }> {
    const response = await this.post('/sessions', { sessionName });
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to create session');
  }

  /**
   * Switch to a different session
   */
  async switchSession(sessionId: number): Promise<{
    success: boolean;
    session: {
      id: number;
      sessionName: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
    };
  }> {
    const response = await this.put(`/sessions/${sessionId}/activate`, {});
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error as string || 'Failed to switch session');
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: number): Promise<{ success: boolean; message: string }> {
    const response = await this.delete(`/sessions/${sessionId}`);
    if (response.success) {
      return response.data || { success: true, message: 'Session deleted' };
    }
    throw new Error(response.error as string || 'Failed to delete session');
  }

  /**
   * Update session name
   */
  async updateSessionName(sessionId: number, sessionName: string): Promise<{ success: boolean }> {
    const response = await this.put(`/sessions/${sessionId}/name`, { sessionName });
    if (response.success) {
      return { success: true };
    }
    throw new Error(response.error as string || 'Failed to update session name');
  }
}

export const recruiterAiChatApi = new RecruiterAiChatApiService();