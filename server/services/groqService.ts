import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
import { aiAuditService } from './aiAuditService.js';

dotenv.config();

export interface GroqRequest {
  type: 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep' | 'general_chat' | 'resume_parsing' | 'resume_optimization';
  content: string;
  context?: {
    userProfile?: any;
    resumeData?: any;
    jobPreferences?: any;
  };
  // Audit context
  auditContext?: {
    userId?: string;
    userType?: 'job_seeker' | 'recruiter' | 'guest';
    operationType?: string;
    resumeId?: string;
    jobPostingId?: string;
    applicationId?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface GroqResponse {
  success: boolean;
  response: string;
  suggestions?: string[];
  actionItems?: string[];
  analysis?: {
    strengths?: string[];
    improvements?: string[];
    score?: number;
  };
}

class GroqService {
  private groq: Groq;
  private defaultModel: string;
  private isAvailable: boolean = true;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY is not set in environment variables');
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.groq = new Groq({ apiKey });
    this.defaultModel = 'llama-3.1-8b-instant'; // Faster model with higher rate limits
    console.log('🚀 Groq service initialized with model:', this.defaultModel);
  }

  public async isServiceAvailable(): Promise<boolean> {
    return this.isAvailable;
  }

  private getSystemPrompt(type: string): string {
    // Special handling for resume parsing - must return pure JSON
    if (type === 'resume_parsing') {
      return `You are a JSON-only resume data extraction system.

🚨 ABSOLUTE REQUIREMENTS 🚨
1. Your FIRST character must be {
2. Your LAST character must be }
3. ZERO text before the JSON object
4. ZERO text after the JSON object
5. NO counting ("There are X projects...")
6. NO explanations ("Here are the extracted...")
7. NO markdown (no \`\`\`json)
8. NO commentary of any kind

You are a machine that outputs ONLY valid JSON. Nothing else exists for you.

Follow the exact JSON schema in the user message. Extract ALL information. Use [] for missing arrays, "" for missing strings.`;
    }

    // Special handling for resume optimization - must return pure JSON
    if (type === 'resume_optimization') {
      return `You are an ATS resume optimization system that outputs ONLY valid JSON.

🚨 ABSOLUTE REQUIREMENTS 🚨
1. Your FIRST character must be {
2. Your LAST character must be }
3. ZERO text before the JSON object
4. ZERO text after the JSON object
5. NO explanations or commentary
6. NO markdown formatting
7. Return ONLY the optimized JSON structure

Your task: Enhance resume content for better ATS scores while maintaining truthfulness.
- Add action verbs and quantifiable metrics
- Expand skills with relevant keywords
- Improve descriptions to be ATS-friendly
- DO NOT fabricate information
- DO NOT change dates, companies, or institutions`;
    }

    const basePrompt = `You are CVZen AI, a specialized career advisor for the CVZen resume builder and job matching platform. You help job seekers create better resumes, find jobs, and advance their careers. You also assist recruiters in finding the right candidates.

IMPORTANT TONE GUIDELINES:
- Be casual, conversational, and friendly
- Use contractions (I'll, you're, let's) to sound natural
- NO formal greetings like "Dear Recruiter" or formal signatures
- Be direct and helpful, like chatting with a colleague
- Keep responses concise and actionable

FORMATTING RULES:
- Use clear paragraphs separated by double line breaks
- Use bullet points with • for lists
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Keep responses well-structured and easy to read
- NEVER use markdown headers (# ## ###) - use plain text section titles
- NEVER use markdown bold (**text**) or italic (*text*) - use plain text`;
    
    switch (type) {
      case 'resume_analysis':
        return `${basePrompt}

TASK: Analyze resumes and provide specific feedback.
FOCUS: ATS optimization, keyword usage, formatting, content quality.

RESPONSE FORMAT:
Resume Analysis Summary

Strengths:
• [List 2-3 key strengths]

Areas for Improvement:
• [List 2-3 specific improvements needed]

Recommendations:
1. [Specific actionable step]
2. [Another specific step]

Overall Score: [X/100]`;
        
      case 'career_advice':
        return `${basePrompt}

TASK: Provide strategic career guidance.
FOCUS: Career paths, skill development, industry insights, professional growth.

Be specific and actionable in your advice.`;
        
      case 'job_search':
        return `${basePrompt}

TASK: Help with job search strategies.
FOCUS: Job search tactics, networking, application optimization, company research.

Provide practical, actionable job search advice.`;
        
      case 'interview_prep':
        return `${basePrompt}

TASK: Prepare users for interviews.
FOCUS: Common questions, technical prep, behavioral strategies, follow-up.

Help users feel confident and prepared.`;
        
      default:
        return `${basePrompt}

Provide helpful career and professional development advice. Be conversational and friendly.`;
    }
  }

  // New signature with separate parameters and audit context
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      auditContext?: {
        serviceName?: string;
        operationType?: string;
        userContext?: any;
      };
    }
  ): Promise<{ success: boolean; response: string }>;
  
  // Old signature for backward compatibility
  async generateResponse(request: GroqRequest): Promise<GroqResponse>;
  
  // Implementation
  async generateResponse(
    requestOrSystemPrompt: GroqRequest | string,
    userPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      auditContext?: {
        serviceName?: string;
        operationType?: string;
        userContext?: any;
      };
    }
  ): Promise<GroqResponse | { success: boolean; response: string }> {
    const startTime = Date.now();
    let responseText = '';
    let responseStatus: 'success' | 'error' | 'timeout' | 'rate_limited' = 'success';
    let errorMessage: string | undefined;
    
    // Determine which API is being used
    const isNewAPI = typeof requestOrSystemPrompt === 'string';
    
    try {
      let systemPrompt: string;
      let userMessage: string;
      let auditContext: any = {};
      let requestType: string;
      let temperature = 0.3;
      let maxTokens = 2048;
      let request: GroqRequest | undefined;
      
      if (isNewAPI) {
        // New API: separate parameters
        systemPrompt = requestOrSystemPrompt;
        userMessage = userPrompt!;
        auditContext = options?.auditContext || {};
        temperature = options?.temperature ?? 0.3;
        maxTokens = options?.maxTokens ?? 2048;
        requestType = auditContext.serviceName || 'other';
        console.log('🤖 [GROQ] Generating response for type:', auditContext.serviceName || 'unknown');
      } else {
        // Old API: request object
        request = requestOrSystemPrompt as GroqRequest;
        console.log('🤖 [GROQ] Generating response for type:', request.type);
        systemPrompt = this.getSystemPrompt(request.type);
        requestType = request.type;
        auditContext = request.auditContext || {};
        
        // Build user message with context
        userMessage = request.content;
        if (request.context?.userProfile) {
          userMessage += `\n\nUser Context: ${JSON.stringify(request.context.userProfile, null, 2)}`;
        }
        if (request.context?.resumeData) {
          userMessage += `\n\nResume Data: ${JSON.stringify(request.context.resumeData, null, 2)}`;
        }
      }

      // Detect PII in prompt
      const containsPii = aiAuditService.detectPii(userMessage);
      const piiRedacted = userMessage.includes('[EMAIL_REDACTED]') || 
                         userMessage.includes('[PHONE_REDACTED]') || 
                         userMessage.includes('[NAME_REDACTED]');

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: this.defaultModel,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false
      });

      responseText = completion.choices[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;
      
      console.log('✅ [GROQ] Response generated:', {
        responseLength: responseText.length,
        model: this.defaultModel,
        latency: latencyMs + 'ms'
      });

      // Log audit entry
      await aiAuditService.logInteraction({
        serviceName: 'groq',
        operationType: this.mapRequestTypeToOperation(requestType, auditContext.operationType),
        userId: auditContext.userId,
        userType: auditContext.userType,
        requestType: requestType,
        promptLength: userMessage.length,
        promptHash: aiAuditService.hashPrompt(userMessage),
        containsPii,
        piiRedacted,
        responseLength: responseText.length,
        responseStatus: 'success',
        latencyMs,
        tokensUsed: completion.usage?.total_tokens,
        costEstimate: this.estimateCost(completion.usage?.total_tokens || 0),
        dataCategories: aiAuditService.extractDataCategories(userMessage),
        redactedFields: this.extractRedactedFields(userMessage),
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        sessionId: auditContext.sessionId,
        resumeId: auditContext.resumeId,
        jobPostingId: auditContext.jobPostingId,
        applicationId: auditContext.applicationId
      });

      // Return format based on API type
      if (isNewAPI) {
        return {
          success: true,
          response: responseText
        };
      } else {
        // Parse response for structured data (old API)
        const suggestions = this.extractSuggestions(responseText);
        const actionItems = this.extractActionItems(responseText);
        const analysis = requestType === 'resume_analysis' ? this.parseAnalysis(responseText) : undefined;

        return {
          success: true,
          response: responseText,
          suggestions,
          actionItems,
          analysis
        };
      }
      
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      console.error('❌ [GROQ] Error generating response:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        fullError: JSON.stringify(error, null, 2)
      });
      
      // Determine error type
      if (error.message?.includes('rate limit')) {
        responseStatus = 'rate_limited';
        errorMessage = 'Rate limit exceeded';
      } else if (error.message?.includes('timeout')) {
        responseStatus = 'timeout';
        errorMessage = 'Request timeout';
      } else {
        responseStatus = 'error';
        errorMessage = error.message || 'Unknown error';
      }

      // Reconstruct audit context for error logging
      let auditContext: any = {};
      let requestType: string = 'other';
      let userMessage: string = '';
      
      if (typeof requestOrSystemPrompt === 'string') {
        // New API
        auditContext = options?.auditContext || {};
        requestType = auditContext.serviceName || 'other';
        userMessage = userPrompt || '';
      } else {
        // Old API
        const request = requestOrSystemPrompt as GroqRequest;
        auditContext = request.auditContext || {};
        requestType = request.type;
        userMessage = request.content;
      }

      // Log failed audit entry
      await aiAuditService.logInteraction({
        serviceName: 'groq',
        operationType: this.mapRequestTypeToOperation(requestType, auditContext.operationType),
        userId: auditContext.userId,
        userType: auditContext.userType,
        requestType: requestType,
        promptLength: userMessage.length,
        promptHash: aiAuditService.hashPrompt(userMessage),
        containsPii: aiAuditService.detectPii(userMessage),
        piiRedacted: userMessage.includes('[EMAIL_REDACTED]'),
        responseStatus,
        errorMessage,
        latencyMs,
        dataCategories: aiAuditService.extractDataCategories(userMessage),
        redactedFields: this.extractRedactedFields(userMessage),
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        sessionId: auditContext.sessionId,
        resumeId: auditContext.resumeId,
        jobPostingId: auditContext.jobPostingId,
        applicationId: auditContext.applicationId
      });
      
      return {
        success: false,
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        suggestions: [],
        actionItems: []
      };
    }
  }

  /**
   * Map request type to operation type for audit logging
   */
  private mapRequestTypeToOperation(
    requestType: string, 
    explicitOperation?: string
  ): 'resume_parsing' | 'ats_scoring' | 'ats_improvement' | 'section_improvement' | 'resume_optimization' | 'job_description' | 'job_search' | 'ai_chat' | 'ai_screening' | 'candidate_search' | 'query_to_sql' | 'other' {
    if (explicitOperation) {
      return explicitOperation as any;
    }
    
    const mapping: Record<string, any> = {
      'resume_parsing': 'resume_parsing',
      'resume_optimization': 'resume_optimization',
      'resume_analysis': 'ats_scoring',
      'job_search': 'job_search',
      'general_chat': 'ai_chat',
      'career_advice': 'ai_chat',
      'interview_prep': 'ai_chat'
    };
    
    return mapping[requestType] || 'other';
  }

  /**
   * Extract redacted fields from prompt
   */
  private extractRedactedFields(prompt: string): string[] {
    const redactedFields: string[] = [];
    
    if (prompt.includes('[EMAIL_REDACTED]')) redactedFields.push('email');
    if (prompt.includes('[PHONE_REDACTED]')) redactedFields.push('phone');
    if (prompt.includes('[NAME_REDACTED]')) redactedFields.push('name');
    if (prompt.includes('[LINKEDIN_REDACTED]')) redactedFields.push('linkedin');
    if (prompt.includes('[GITHUB_REDACTED]')) redactedFields.push('github');
    if (prompt.includes('[WEBSITE_REDACTED]')) redactedFields.push('website');
    
    return redactedFields;
  }

  /**
   * Estimate cost based on tokens used
   * Groq pricing: ~$0.10 per 1M tokens (approximate)
   */
  private estimateCost(tokens: number): number {
    const costPerMillionTokens = 0.10;
    return (tokens / 1000000) * costPerMillionTokens;
  }

  private extractSuggestions(text: string): string[] {
    const suggestions: string[] = [];
    const lines = text.split('\n');
    
    let inSuggestionsSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('suggestion') || line.toLowerCase().includes('recommend')) {
        inSuggestionsSection = true;
        continue;
      }
      
      if (inSuggestionsSection && (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line))) {
        const cleaned = line.replace(/^[•\-\d.]\s*/, '').trim();
        if (cleaned.length > 10) {
          suggestions.push(cleaned);
        }
      }
      
      if (inSuggestionsSection && line.trim() === '') {
        break;
      }
    }
    
    return suggestions.slice(0, 5);
  }

  private extractActionItems(text: string): string[] {
    const actionItems: string[] = [];
    const lines = text.split('\n');
    
    let inActionSection = false;
    for (const line of lines) {
      if (line.toLowerCase().includes('action') || line.toLowerCase().includes('next step')) {
        inActionSection = true;
        continue;
      }
      
      if (inActionSection && (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line))) {
        const cleaned = line.replace(/^[•\-\d.]\s*/, '').trim();
        if (cleaned.length > 10) {
          actionItems.push(cleaned);
        }
      }
      
      if (inActionSection && line.trim() === '') {
        break;
      }
    }
    
    return actionItems.slice(0, 5);
  }

  private parseAnalysis(text: string): { strengths?: string[]; improvements?: string[]; score?: number } {
    const analysis: { strengths?: string[]; improvements?: string[]; score?: number } = {};
    
    // Extract strengths
    const strengthsMatch = text.match(/Strengths?:?\s*([\s\S]*?)(?=Areas for Improvement|Recommendations|$)/i);
    if (strengthsMatch) {
      analysis.strengths = strengthsMatch[1]
        .split('\n')
        .map(line => line.replace(/^[•\-\d.]\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }
    
    // Extract improvements
    const improvementsMatch = text.match(/(?:Areas for Improvement|Improvements?):?\s*([\s\S]*?)(?=Recommendations|Overall Score|$)/i);
    if (improvementsMatch) {
      analysis.improvements = improvementsMatch[1]
        .split('\n')
        .map(line => line.replace(/^[•\-\d.]\s*/, '').trim())
        .filter(line => line.length > 10)
        .slice(0, 5);
    }
    
    // Extract score
    const scoreMatch = text.match(/(?:Overall Score|Score):?\s*(\d+)(?:\/100)?/i);
    if (scoreMatch) {
      analysis.score = parseInt(scoreMatch[1]);
    }
    
    return analysis;
  }
}

export const groqService = new GroqService();
