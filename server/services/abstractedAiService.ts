import * as dotenv from 'dotenv';
import { groqService } from './groqService.js';
import { openaiService } from './groqService.js'; // OpenAI service is exported from groqService.ts

dotenv.config();

export interface AIServiceRequest {
  systemPrompt: string;
  userPrompt: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
    auditContext?: {
      serviceName?: string;
      operationType?: string;
      userContext?: any;
    };
  };
}

export interface AIServiceResponse {
  success: boolean;
  response: string;
}

/**
 * Model mapping for different AI services
 */
const MODEL_MAPPING = {
  GROQ: {
    'llama-3.1-8b-instant': 'llama-3.1-8b-instant',
    'llama-3.1-70b-versatile': 'llama-3.1-70b-versatile',
    'default': 'llama-3.1-8b-instant'
  },
  OPENAI: {
    'llama-3.1-8b-instant': 'gpt-4o-mini',
    'llama-3.1-70b-versatile': 'gpt-4o-mini',
    'default': 'gpt-4o-mini'
  }
};

/**
 * Abstracted AI Service that switches between Groq and OpenAI based on environment configuration
 * Configured via AI_SERVICE environment variable: 'GROQ' or 'OPENAI'
 */
class AbstractedAiService {
  private currentService: 'GROQ' | 'OPENAI';

  constructor() {
    // Default to GROQ if not specified
    this.currentService = (process.env.AI_SERVICE?.toUpperCase() as 'GROQ' | 'OPENAI') || 'GROQ';
    console.log(`🤖 [ABSTRACTED AI] Initialized with service: ${this.currentService}`);
  }

  /**
   * Map model names between services
   */
  private mapModel(requestedModel?: string): string {
    if (!requestedModel) {
      return MODEL_MAPPING[this.currentService].default;
    }
    
    return MODEL_MAPPING[this.currentService][requestedModel] || MODEL_MAPPING[this.currentService].default;
  }

  /**
   * Generate AI response using the configured service
   */
  async generateResponse(request: AIServiceRequest): Promise<AIServiceResponse> {
    const { systemPrompt, userPrompt, options } = request;

    try {
      console.log(`🔄 [ABSTRACTED AI] Using ${this.currentService} service for request`);

      // Map the model to the appropriate service model
      const mappedModel = this.mapModel(options?.model);
      const mappedOptions = {
        ...options,
        model: mappedModel,
        auditContext: {
          ...options?.auditContext,
          serviceName: 'resume_parsing'
        }
      };

      if (this.currentService === 'GROQ') {
        return await groqService.generateResponse(systemPrompt, userPrompt, mappedOptions);
      } else if (this.currentService === 'OPENAI') {
        return await openaiService.generateResponse(systemPrompt, userPrompt, mappedOptions);
      } else {
        throw new Error(`Unsupported AI service: ${this.currentService}`);
      }
    } catch (error) {
      console.error(`❌ [ABSTRACTED AI] Error with ${this.currentService} service:`, error);
      
      // Fallback to the other service if current one fails
      const fallbackService = this.currentService === 'GROQ' ? 'OPENAI' : 'GROQ';
      console.log(`🔄 [ABSTRACTED AI] Attempting fallback to ${fallbackService}`);
      
      try {
        const fallbackModel = MODEL_MAPPING[fallbackService][options?.model || 'default'] || MODEL_MAPPING[fallbackService].default;
        const fallbackOptions = {
          ...options,
          model: fallbackModel,
          auditContext: {
            ...options?.auditContext,
            serviceName: 'resume_parsing'
          }
        };

        if (fallbackService === 'GROQ') {
          return await groqService.generateResponse(systemPrompt, userPrompt, fallbackOptions);
        } else {
          return await openaiService.generateResponse(systemPrompt, userPrompt, fallbackOptions);
        }
      } catch (fallbackError) {
        console.error(`❌ [ABSTRACTED AI] Fallback to ${fallbackService} also failed:`, fallbackError);
        return {
          success: false,
          response: 'I apologize, but I encountered an error processing your request. Please try again.'
        };
      }
    }
  }

  /**
   * Get the currently configured AI service
   */
  getCurrentService(): 'GROQ' | 'OPENAI' {
    return this.currentService;
  }

  /**
   * Switch to a different AI service at runtime (for testing purposes)
   */
  switchService(service: 'GROQ' | 'OPENAI'): void {
    console.log(`🔄 [ABSTRACTED AI] Switching from ${this.currentService} to ${service}`);
    this.currentService = service;
  }

  /**
   * Check if the current service is available
   */
  async isCurrentServiceAvailable(): Promise<boolean> {
    try {
      if (this.currentService === 'GROQ') {
        return await groqService.isServiceAvailable();
      } else {
        // For OpenAI, we can do a simple test call or check API key
        return !!process.env.OPENAI_API_KEY;
      }
    } catch (error) {
      console.error(`❌ [ABSTRACTED AI] Service availability check failed:`, error);
      return false;
    }
  }
}

export const abstractedAiService = new AbstractedAiService();