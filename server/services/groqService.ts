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
  private groq: Groq | null = null;
  private defaultModel: string;
  private isAvailable: boolean = true;

  constructor() {
    this.defaultModel = 'llama-3.3-70b-versatile'; // Faster model with higher rate limits
  }

  private initialize() {
    if (this.groq) return; // Already initialized

    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GROQ_API_KEY is not set in environment variables');
      throw new Error('GROQ_API_KEY environment variable is required');
    }
    
    this.groq = new Groq({ apiKey });
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

      case 'interview_preparation':
        return `${basePrompt}

TASK: Generate contextual interview content for recruiters to send to job seekers.
FOCUS: Create specific interview description, candidate instructions, and internal notes based on job requirements and candidate profile.
PERSPECTIVE: Write Interview Description and Instructions in SECOND PERSON (addressing the candidate directly with "you", "your"). Write Internal Notes in first person for the recruiter.
PERSONALIZATION: Always use the candidate's actual name when provided. Replace generic terms like "Candidate" with their real name.

RESPONSE FORMAT:
Interview Description:
[2-3 paragraphs written directly to the candidate using "you" and "your". If candidate name is provided, start with "Hello [CandidateName]," or use their name naturally in the text. Explain what you will discuss together, what areas you'll explore, and what the candidate can expect. Use language like "We will discuss your experience with...", "You'll have the opportunity to...", "I'm looking forward to learning about your..."]

Instructions for Candidate:
• [Direct instructions using "you" and the candidate's name when appropriate - "Please prepare...", "You should review...", "Bring your..."]
• [What you need to set up or prepare]
• [Technical requirements if applicable]
• [Timeline and expectations for you]
• [Encourage honesty and authenticity - mention this is a collaborative discussion, not an interrogation]
• [Remind you to be genuine and avoid any form of misrepresentation or cheating]
• [Emphasize that the interview is designed to be a comfortable conversation to assess mutual fit]

Internal Notes:
[Write from recruiter's perspective using "I should focus on...", "I need to evaluate...", "My approach will be..."]
• [Key areas for me to evaluate about this specific candidate]
• [Potential concerns for me to address]
• [My strategic interview focus points]
• [My evaluation criteria specific to this role]
• [Remind myself to create a welcoming, non-intimidating atmosphere]
• [Focus on collaborative discussion rather than authoritative questioning]

IMPORTANT: Never use generic terms like "Candidate", "the candidate", or "Hello Candidate". Always use the person's actual name when provided. Make the content personal and direct.`;

      case 'company_extraction':
        return `You are a company data extraction specialist that outputs ONLY valid JSON.

🚨 ABSOLUTE REQUIREMENTS 🚨
1. Your FIRST character must be {
2. Your LAST character must be }
3. ZERO text before the JSON object
4. ZERO text after the JSON object
5. NO explanations or commentary
6. NO markdown formatting

TASK: Extract structured company information from website content.
FOCUS: Company name, industry, size, location, description, values, specialties, benefits.

Extract only factual information from the provided content. If information is not clearly available, use reasonable defaults or null values. Ensure all extracted data is accurate and professional.`;
        
      default:
        return `${basePrompt}

Provide helpful career and professional development advice. Be conversational and friendly.`;
    }
  }

  async formatJobDescription(rawContent: string): Promise<string> {
    try {
      this.initialize();
      
      const prompt = `Convert this raw job description into a clean, readable 2-3 sentence summary. Remove all URLs, markdown, and special characters. Focus on key responsibilities and requirements only:

${rawContent}

Return ONLY the clean summary, no extra text.`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.defaultModel,
        temperature: 0.3,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content?.trim() || rawContent.substring(0, 250);
    } catch (error) {
      console.error('Failed to format job description:', error);
      return rawContent.substring(0, 250);
    }
  }

  // New signature with separate parameters and audit context
  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
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
      model?: string;
      auditContext?: {
        serviceName?: string;
        operationType?: string;
        userContext?: any;
      };
    }
  ): Promise<GroqResponse | { success: boolean; response: string }> {
    this.initialize(); // Ensure groq client is initialized
    
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
      let temperature = 0;
      let maxTokens = 6000;
      let modelToUse = this.defaultModel;
      let request: GroqRequest | undefined;
      
      if (isNewAPI) {
        // New API: separate parameters
        systemPrompt = requestOrSystemPrompt;
        userMessage = userPrompt!;
        auditContext = options?.auditContext || {};
        temperature = options?.temperature ?? 0.3;
        maxTokens = options?.maxTokens ?? 2048;
        modelToUse = options?.model ?? this.defaultModel;
        requestType = auditContext.serviceName || 'other';
        console.log('🤖 [GROQ] Generating response for type:', auditContext.serviceName || 'unknown', 'with model:', modelToUse);
      } else {
        // Old API: request object
        request = requestOrSystemPrompt as GroqRequest;
        console.log('🤖 [GROQ] Generating response for type:', request.type, 'with model:', this.defaultModel);
        systemPrompt = this.getSystemPrompt(request.type);
        requestType = request.type;
        auditContext = request.auditContext || {};
        modelToUse = this.defaultModel;
        
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
        model: modelToUse,
        temperature,
        max_tokens: maxTokens,
        top_p: 1,
        stream: false
      });

      responseText = completion.choices[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;
      
      console.log('✅ [GROQ] Response generated:', {
        responseLength: responseText.length,
        model: modelToUse,
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

  // New method for interview preparation
  async generateInterviewPreparation(
    jobDescription: string,
    jobTitle: string,
    candidateResume: string,
    candidateSkills: string[],
    interviewType: string = 'technical',
    interviewMode: string = 'video_call',
    interviewDateTime?: string,
    interviewDuration?: number
  ): Promise<{
    description: string;
    instructions: string;
    internalNotes: string;
  }> {
    try {
      const modeDescription = {
        'video_call': 'Video Call (Online)',
        'phone': 'Phone Call',
        'in_person': 'In-Person Meeting'
      }[interviewMode] || interviewMode;

      const dateTimeInfo = interviewDateTime ? 
        `\nSCHEDULED: ${new Date(interviewDateTime).toLocaleString()} (${interviewDuration || 60} minutes)` : '';

      const prompt = `Generate interview preparation content for:

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME SUMMARY:
${candidateResume}

CANDIDATE SKILLS:
${candidateSkills.join(', ')}

INTERVIEW TYPE: ${interviewType}
INTERVIEW MODE: ${modeDescription}${dateTimeInfo}

Please provide contextual content that matches this specific role, candidate background, and interview format. Consider the interview mode when providing instructions. Use the candidate's actual name when addressing them directly.`;

      const systemPrompt = this.getSystemPrompt('interview_preparation');
      
      const response = await this.generateResponse(systemPrompt, prompt, {
        temperature: 0.7,
        maxTokens: 1500,
        auditContext: {
          serviceName: 'interview_preparation',
          operationType: 'generate_content'
        }
      });

      if (!response.success || !response.response) {
        throw new Error('Failed to generate interview preparation content');
      }

      // Parse the response to extract the three sections
      const content = response.response;
      const sections = this.parseInterviewPreparationResponse(content);

      return sections;
    } catch (error) {
      console.error('❌ Error generating interview preparation:', error);
      throw error;
    }
  }

  private parseInterviewPreparationResponse(content: string): {
    description: string;
    instructions: string;
    internalNotes: string;
  } {
    const sections = {
      description: '',
      instructions: '',
      internalNotes: ''
    };

    if (!content || typeof content !== 'string') {
      console.warn('⚠️ Invalid content provided to parseInterviewPreparationResponse');
      return sections;
    }

    const lines = content.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.toLowerCase().includes('interview description:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
        }
        currentSection = 'description';
        currentContent = [];
      } else if (trimmed.toLowerCase().includes('instructions for candidate:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
        }
        currentSection = 'instructions';
        currentContent = [];
      } else if (trimmed.toLowerCase().includes('internal notes:')) {
        if (currentSection && currentContent.length > 0) {
          sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
        }
        currentSection = 'internalNotes';
        currentContent = [];
      } else if (currentSection && trimmed) {
        currentContent.push(line);
      }
    }

    // Don't forget the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection as keyof typeof sections] = currentContent.join('\n').trim();
    }

    // Provide fallback content if sections are empty
    if (!sections.description) {
      sections.description = 'This interview will assess the candidate\'s qualifications and fit for the role.';
    }
    if (!sections.instructions) {
      sections.instructions = 'Please review the job description and prepare examples of relevant experience.';
    }
    if (!sections.internalNotes) {
      sections.internalNotes = 'Focus on technical skills, cultural fit, and communication abilities.';
    }

    return sections;
  }
}

export const groqService = new GroqService();

// OpenAI Service for Resume Parsing
class OpenAIService {
  private openai: any;
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    try {
      const { default: OpenAI } = await import('openai');
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
      this.initialized = true;
      console.log('✅ [OPENAI] Service initialized');
    } catch (error) {
      console.error('❌ [OPENAI] Failed to initialize:', error);
    }
  }

  async generateResponse(
    systemPrompt: string,
    userPrompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
      auditContext?: {
        serviceName?: string;
        operationType?: string;
        userContext?: any;
      };
    }
  ): Promise<{ success: boolean; response: string }> {
    await this.initialize();
    
    const startTime = Date.now();
    
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: options?.model || 'gpt-4o-mini',
        temperature: options?.temperature || 0,
        max_tokens: options?.maxTokens || 16000,
        top_p: 1,
        stream: false
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const latencyMs = Date.now() - startTime;
      
      console.log('✅ [OPENAI] Response generated:', {
        responseLength: responseText.length,
        model: options?.model || 'gpt-4o-mini',
        latency: latencyMs + 'ms'
      });

      return {
        success: true,
        response: responseText
      };
      
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      console.error('❌ [OPENAI] Error generating response:', {
        message: error.message,
        latency: latencyMs + 'ms'
      });
      
      return {
        success: false,
        response: 'I apologize, but I encountered an error processing your request. Please try again.'
      };
    }
  }
}

const openaiService = new OpenAIService();
export { openaiService };