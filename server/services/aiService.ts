import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import { localModelService } from './localModelService.js';
import { aiMemoryService } from './aiMemoryService.js';
import { tavilyService, JobSearchParams } from './tavilyService.js';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export interface AIAnalysisRequest {
  type: 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep' | 'general_chat';
  content: string;
  usePremium?: boolean; // Flag to use OpenAI instead of local model
  context?: {
    userProfile?: any;
    resumeData?: any;
    jobPreferences?: any;
    userId?: string; // Add userId for memory integration (changed to string for UUID)
  };
}

export interface AIAnalysisResponse {
  success: boolean;
  response: string;
  suggestions?: string[];
  actionItems?: string[];
  analysis?: {
    strengths?: string[];
    improvements?: string[];
    score?: number;
    skillsExtracted?: string[];
    careerLevel?: string;
    industryFocus?: string[];
    roleTargets?: string[];
  };
  memoryUpdated?: boolean; // Indicates if memory was updated
  contextUsed?: string[]; // List of memory contexts used
}

export interface AIStreamChunk {
  content: string;
  isComplete: boolean;
  suggestions?: string[];
  actionItems?: string[];
  analysis?: any;
  memoryUpdated?: boolean;
  contextUsed?: string[];
}

export type StreamCallback = (chunk: AIStreamChunk) => void;

class AIService {
  private isOpenAIConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
  }

  async generateResponse(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const startTime = Date.now();
    let memoryContext = null;
    let contextUsed: string[] = [];
    
    try {
      // Build memory context if userId is provided (but don't fail if DB is down)
      if (request.context?.userId) {
        try {
          memoryContext = await aiMemoryService.buildContextForAI(
            request.context.userId,
            request.content
          );
          
          // Add resume data to memory context if provided
          if (request.context?.resumeData) {
            memoryContext.resumeData = request.context.resumeData;
          }
          
          // Track which contexts were used
          if (memoryContext.userMemory) contextUsed.push('user_profile');
          if (memoryContext.recentResumeAnalysis) contextUsed.push('resume_analysis');
          if (memoryContext.resumeData) contextUsed.push('active_resume');
          if (memoryContext.relevantContexts.length > 0) contextUsed.push('conversation_history');
          if (memoryContext.chatHistory.length > 0) contextUsed.push('chat_history');
        } catch (memoryError) {
          console.warn('⚠️ Memory service unavailable, continuing without context:', memoryError.message);
          memoryContext = null; // Continue without memory context
        }
      }
      
      // In serverless environments, prioritize OpenAI over local models
      // For local development, always try local model first
      const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const isLocalDevelopment = process.env.NODE_ENV === 'development';
      
      let aiResponse: AIAnalysisResponse;
      
      if (isLocalDevelopment && !request.usePremium) {
        // Local development - always use local model unless premium is requested
        console.log('🤖 Using Local Model (Free) for request');
        
        try {
          const localResponse = await localModelService.generateResponse({
            type: request.type,
            content: this.buildContextualPrompt(request.content, memoryContext),
            context: request.context
          });
          
          console.log('✅ Local model response received:', {
            success: localResponse.success,
            responseLength: localResponse.response?.length || 0,
            hasSuggestions: !!localResponse.suggestions?.length,
            hasActionItems: !!localResponse.actionItems?.length
          });
          
          // Convert local model response to AI service format
          aiResponse = {
            success: localResponse.success,
            response: localResponse.response,
            suggestions: localResponse.suggestions,
            actionItems: localResponse.actionItems,
            analysis: localResponse.analysis
          };
        } catch (localError) {
          console.error('❌ Local model service failed:', localError.message);
          console.log('🔄 Falling back to enhanced responses');
          aiResponse = this.getEnhancedFallbackResponse(request, memoryContext);
        }
      } else if (isServerless) {
        console.log('🌐 Serverless environment detected - using OpenAI or fallback');
        
        // Try OpenAI first in serverless
        if (this.isOpenAIConfigured()) {
          console.log('🚀 Using OpenAI in serverless environment');
          aiResponse = await this.generateOpenAIResponse(request, memoryContext);
        } else {
          console.log('📋 Using enhanced fallback responses in serverless');
          aiResponse = this.getEnhancedFallbackResponse(request, memoryContext);
        }
      } else {
        // Production or other environments - use OpenAI if premium requested or configured
        if (request.usePremium && this.isOpenAIConfigured()) {
          console.log('🚀 Using OpenAI (Premium) for request');
          aiResponse = await this.generateOpenAIResponse(request, memoryContext);
        } else if (this.isOpenAIConfigured()) {
          console.log('🚀 Using OpenAI for request');
          aiResponse = await this.generateOpenAIResponse(request, memoryContext);
        } else {
          console.log('📋 Using enhanced fallback responses');
          aiResponse = this.getEnhancedFallbackResponse(request, memoryContext);
        }
      }
      
      // Save interaction to memory if userId is provided (but don't fail if DB is down)
      if (request.context?.userId && aiResponse.success) {
        try {
          await this.saveInteractionToMemory(
            request,
            aiResponse,
            Date.now() - startTime,
            memoryContext
          );
          aiResponse.memoryUpdated = true;
        } catch (memoryError) {
          console.warn('⚠️ Failed to save interaction to memory:', memoryError.message);
          aiResponse.memoryUpdated = false;
        }
      }
      
      aiResponse.contextUsed = contextUsed;
      return aiResponse;
      
    } catch (error) {
      console.error('AI Service error:', error);
      return this.getFallbackResponse(request, memoryContext);
    }
  }

  async generateStreamingResponse(request: AIAnalysisRequest, onChunk: StreamCallback): Promise<void> {
    const startTime = Date.now();
    let memoryContext = null;
    let contextUsed: string[] = [];
    let fullResponse = '';
    
    try {
      // Build memory context if userId is provided (but don't fail if DB is down)
      if (request.context?.userId) {
        try {
          memoryContext = await aiMemoryService.buildContextForAI(
            request.context.userId,
            request.content
          );
          
          // Add resume data to memory context if provided
          if (request.context?.resumeData) {
            memoryContext.resumeData = request.context.resumeData;
          }
          
          // Track which contexts were used
          if (memoryContext.userMemory) contextUsed.push('user_profile');
          if (memoryContext.recentResumeAnalysis) contextUsed.push('resume_analysis');
          if (memoryContext.resumeData) contextUsed.push('active_resume');
          if (memoryContext.relevantContexts.length > 0) contextUsed.push('conversation_history');
          if (memoryContext.chatHistory.length > 0) contextUsed.push('chat_history');
        } catch (memoryError) {
          console.warn('⚠️ Memory service unavailable for streaming, continuing without context:', memoryError.message);
          memoryContext = null; // Continue without memory context
        }
      }
      
      // In serverless environments, prioritize OpenAI over local models
      // For local development, always try local model first
      const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const isLocalDevelopment = process.env.NODE_ENV === 'development';
      
      if (isLocalDevelopment && !request.usePremium) {
        // Local development - always use local model unless premium is requested
        console.log('🤖 Using Local Model streaming (Free) for request');
        
        try {
          // For local model, simulate streaming with the existing response
          const localResponse = await localModelService.generateResponse({
            type: request.type,
            content: this.buildContextualPrompt(request.content, memoryContext),
            context: request.context
          });
          
          fullResponse = await this.simulateStreamingResponse(localResponse.response, onChunk);
        } catch (localError) {
          console.error('❌ Local model service failed:', localError.message);
          fullResponse = await this.getStreamingFallbackResponse(request, memoryContext, onChunk);
        }
      } else if (isServerless) {
        console.log('🌐 Serverless environment detected - using OpenAI or fallback for streaming');
        
        // Try OpenAI streaming first in serverless
        if (this.isOpenAIConfigured()) {
          console.log('🚀 Using OpenAI streaming in serverless environment');
          fullResponse = await this.generateOpenAIStreamingResponse(request, memoryContext, onChunk);
        } else {
          console.log('📋 Using enhanced fallback streaming responses in serverless');
          fullResponse = await this.getStreamingFallbackResponse(request, memoryContext, onChunk);
        }
      } else {
        // Production or other environments - use OpenAI if premium requested or configured
        if (request.usePremium && this.isOpenAIConfigured()) {
          console.log('🚀 Using OpenAI streaming (Premium) for request');
          fullResponse = await this.generateOpenAIStreamingResponse(request, memoryContext, onChunk);
        } else if (this.isOpenAIConfigured()) {
          console.log('🚀 Using OpenAI streaming for request');
          fullResponse = await this.generateOpenAIStreamingResponse(request, memoryContext, onChunk);
        } else {
          console.log('📋 Using enhanced fallback streaming responses');
          fullResponse = await this.getStreamingFallbackResponse(request, memoryContext, onChunk);
        }
      }
      
      // Save interaction to memory if userId is provided (but don't fail if DB is down)
      if (request.context?.userId && fullResponse) {
        try {
          const aiResponse: AIAnalysisResponse = {
            success: true,
            response: fullResponse,
            suggestions: this.extractSuggestions(fullResponse),
            actionItems: this.extractActionItems(fullResponse),
            analysis: request.type === 'resume_analysis' ? this.parseResumeAnalysisFromText(fullResponse) : undefined
          };
          
          await this.saveInteractionToMemory(
            request,
            aiResponse,
            Date.now() - startTime,
            memoryContext
          );
          
          // Send final chunk with memory update info
          onChunk({
            content: '',
            isComplete: true,
            memoryUpdated: true,
            contextUsed: contextUsed,
            suggestions: aiResponse.suggestions,
            actionItems: aiResponse.actionItems,
            analysis: aiResponse.analysis
          });
        } catch (memoryError) {
          console.warn('⚠️ Failed to save streaming interaction to memory:', memoryError.message);
          // Send final chunk without memory update
          onChunk({
            content: '',
            isComplete: true,
            memoryUpdated: false,
            contextUsed: contextUsed,
            suggestions: this.extractSuggestions(fullResponse),
            actionItems: this.extractActionItems(fullResponse),
            analysis: request.type === 'resume_analysis' ? this.parseResumeAnalysisFromText(fullResponse) : undefined
          });
        }
      } else {
        // Send final completion chunk
        onChunk({
          content: '',
          isComplete: true,
          contextUsed: contextUsed
        });
      }
      
    } catch (error) {
      console.error('AI Streaming Service error:', error);
      
      // Send error through stream
      onChunk({
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        isComplete: true,
        contextUsed: contextUsed
      });
    }
  }

  private async generateOpenAIResponse(request: AIAnalysisRequest, memoryContext?: any): Promise<AIAnalysisResponse> {
    const systemPrompt = this.getSystemPrompt(request.type, memoryContext);
    
    // Build context-aware user message
    let userMessage = this.buildContextualPrompt(request.content, memoryContext);
    
    if (request.context?.userProfile) {
      userMessage += `\n\nUser Context: ${JSON.stringify(request.context.userProfile, null, 2)}`;
    }
    
    if (request.context?.resumeData) {
      userMessage += `\n\nResume Data: ${JSON.stringify(request.context.resumeData, null, 2)}`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1500, // Increased for more detailed responses
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Parse structured response if it's a resume analysis
    if (request.type === 'resume_analysis') {
      return this.parseResumeAnalysis(response);
    }
    
    return {
      success: true,
      response: response,
      suggestions: this.extractSuggestions(response),
      actionItems: this.extractActionItems(response)
    };
  }

  private getSystemPrompt(type: string, memoryContext?: any): string {
    const basePrompt = `You are CVZen AI, an expert career advisor and resume specialist. You provide helpful, actionable advice for job seekers and professionals.`;
    
    // Add memory context to system prompt
    let contextPrompt = '';
    if (memoryContext) {
      if (memoryContext.userMemory) {
        const user = memoryContext.userMemory;
        contextPrompt += `\n\nUser Profile Context:
- Career Stage: ${user.careerStage || 'Unknown'}
- Primary Skills: ${user.primarySkills?.join(', ') || 'Not specified'}
- Industries: ${user.industries?.join(', ') || 'Not specified'}
- Job Titles: ${user.jobTitles?.join(', ') || 'Not specified'}
- Career Goals: ${user.careerGoals || 'Not specified'}
- Job Search Status: ${user.jobSearchStatus || 'Unknown'}
- Interaction Count: ${user.interactionCount}`;
      }
      
      if (memoryContext.recentResumeAnalysis) {
        const resume = memoryContext.recentResumeAnalysis;
        contextPrompt += `\n\nRecent Resume Analysis:
- Career Level: ${resume.careerLevel || 'Unknown'}
- Overall Score: ${resume.overallScore || 'Not scored'}
- Key Strengths: ${resume.strengths?.slice(0, 3).join(', ') || 'None identified'}
- Top Improvements: ${resume.improvements?.slice(0, 3).join(', ') || 'None identified'}
- Skills: ${resume.skillsExtracted?.slice(0, 10).join(', ') || 'None extracted'}`;
      }
      
      if (memoryContext.relevantContexts?.length > 0) {
        contextPrompt += `\n\nRelevant Previous Conversations:`;
        memoryContext.relevantContexts.slice(0, 3).forEach((ctx: any, i: number) => {
          contextPrompt += `\n${i + 1}. ${ctx.contextType}: ${JSON.stringify(ctx.contextValue).substring(0, 100)}...`;
        });
      }
      
      if (memoryContext.chatHistory?.length > 0) {
        contextPrompt += `\n\nRecent Chat History:`;
        memoryContext.chatHistory.slice(-3).forEach((msg: any) => {
          const preview = msg.content.substring(0, 100);
          contextPrompt += `\n- ${msg.messageType}: ${preview}${msg.content.length > 100 ? '...' : ''}`;
        });
      }
    }
    
    switch (type) {
      case 'resume_analysis':
        return `${basePrompt}${contextPrompt}
        
        You specialize in analyzing resumes and providing detailed feedback. When analyzing a resume:
        1. Identify strengths and areas for improvement
        2. Suggest specific enhancements for better ATS compatibility
        3. Recommend formatting and content improvements
        4. Provide a score out of 100
        5. Give actionable next steps
        6. Extract key skills and technologies mentioned
        7. Determine career level (entry, mid, senior, executive)
        8. Identify target industries and roles
        
        Use the user's profile context and previous analysis to provide personalized, progressive advice.
        Be constructive, specific, and encouraging in your feedback.`;
        
      case 'career_advice':
        return `${basePrompt}${contextPrompt}
        
        You provide strategic career guidance including:
        1. Career path recommendations based on current skills and goals
        2. Skill development suggestions aligned with target roles
        3. Industry insights and trends relevant to their background
        4. Professional growth strategies
        5. Work-life balance advice
        
        Use the user's career stage, goals, and interaction history to provide personalized advice.
        Tailor your advice to their experience level and specific situation.`;
        
      case 'job_search':
        return `${basePrompt}${contextPrompt}
        
        You help with job search strategies:
        1. Job search tactics and platforms relevant to their industry
        2. Networking strategies based on their career level
        3. Application optimization for their target roles
        4. Company research techniques
        5. Salary negotiation guidance appropriate to their experience
        
        Consider their job search status, target roles, and previous conversations.
        Provide practical, actionable job search advice tailored to their situation.
        
        IMPORTANT: When job results are provided, DO NOT add generic "Job Search Insights" sections about competition, market trends, or general advice. Focus only on the specific jobs shown and provide brief, actionable recommendations for those opportunities.`;
        
      case 'interview_prep':
        return `${basePrompt}${contextPrompt}
        
        You specialize in interview preparation:
        1. Common interview questions relevant to their industry and level
        2. Technical interview preparation based on their skills
        3. Behavioral interview strategies
        4. Company-specific interview tips
        5. Post-interview follow-up advice
        
        Use their resume analysis, skills, and career goals to provide targeted preparation.
        Help users feel confident and prepared for interviews in their field.`;
        
      default:
        return `${basePrompt}${contextPrompt} 
        
        Provide helpful career and professional development advice based on the user's context and history.
        Reference previous conversations and their profile to give personalized guidance.`;
    }
  }

  private parseResumeAnalysis(response: string): AIAnalysisResponse {
    // Try to extract structured data from the response
    const strengths = this.extractSection(response, 'strengths');
    const improvements = this.extractSection(response, 'improvements');
    const score = this.extractScore(response);
    const skillsExtracted = this.extractSkills(response);
    const careerLevel = this.extractCareerLevel(response);
    const industryFocus = this.extractIndustries(response);
    const roleTargets = this.extractRoles(response);
    
    return {
      success: true,
      response: response,
      analysis: {
        strengths: strengths,
        improvements: improvements,
        score: score,
        skillsExtracted: skillsExtracted,
        careerLevel: careerLevel,
        industryFocus: industryFocus,
        roleTargets: roleTargets
      },
      suggestions: this.extractSuggestions(response),
      actionItems: this.extractActionItems(response)
    };
  }

  private extractSection(text: string, section: string): string[] {
    const regex = new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    return [];
  }

  private extractScore(text: string): number {
    const scoreRegex = /(\d+)\/100|(\d+)%|score:?\s*(\d+)/i;
    const match = text.match(scoreRegex);
    if (match) {
      return parseInt(match[1] || match[2] || match[3]) || 0;
    }
    return 0;
  }

  private extractSuggestions(text: string): string[] {
    return this.extractSection(text, 'suggestions');
  }

  private extractActionItems(text: string): string[] {
    return this.extractSection(text, 'action items');
  }

  // ===== NEW MEMORY INTEGRATION METHODS =====
  
  private buildContextualPrompt(originalContent: string, memoryContext?: any): string {
    if (!memoryContext) return originalContent;
    
    let contextualPrompt = originalContent;
    
    // Add relevant context from memory
    if (memoryContext.userMemory) {
      const user = memoryContext.userMemory;
      if (user.careerGoals) {
        contextualPrompt += `\n\nMy career goals: ${user.careerGoals}`;
      }
      if (user.jobSearchStatus && user.jobSearchStatus !== 'unknown') {
        contextualPrompt += `\nJob search status: ${user.jobSearchStatus}`;
      }
    }
    
    // Reference previous resume analysis if relevant
    if (memoryContext.recentResumeAnalysis && originalContent.toLowerCase().includes('resume')) {
      const resume = memoryContext.recentResumeAnalysis;
      contextualPrompt += `\n\nPrevious resume feedback: Score ${resume.overallScore}/100. 
      Strengths: ${resume.strengths?.slice(0, 2).join(', ')}. 
      Areas to improve: ${resume.improvements?.slice(0, 2).join(', ')}.`;
    }
    
    // Add active resume context for personalization
    if (memoryContext.resumeData) {
      const resume = memoryContext.resumeData;
      contextualPrompt += `\n\n[User's Active Resume Context]`;
      
      if (resume.summary) {
        contextualPrompt += `\nProfessional Summary: ${resume.summary}`;
      }
      
      if (resume.objective) {
        contextualPrompt += `\nCareer Objective: ${resume.objective}`;
      }
      
      if (resume.skills && resume.skills.length > 0) {
        const skillsList = Array.isArray(resume.skills) 
          ? resume.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean).join(', ')
          : resume.skills;
        contextualPrompt += `\nSkills: ${skillsList}`;
      }
      
      if (resume.experience && resume.experience.length > 0) {
        const recentExp = resume.experience[0];
        if (recentExp) {
          contextualPrompt += `\nCurrent/Recent Role: ${recentExp.position || recentExp.title || ''} at ${recentExp.company || ''}`;
          if (recentExp.duration || (recentExp.startDate && recentExp.endDate)) {
            const duration = recentExp.duration || `${recentExp.startDate} - ${recentExp.endDate}`;
            contextualPrompt += ` (${duration})`;
          }
        }
        contextualPrompt += `\nTotal Experience: ${resume.experience.length} position(s)`;
      }
      
      if (resume.education && resume.education.length > 0) {
        const recentEdu = resume.education[0];
        if (recentEdu) {
          contextualPrompt += `\nEducation: ${recentEdu.degree || ''} in ${recentEdu.field || recentEdu.fieldOfStudy || ''} from ${recentEdu.institution || recentEdu.school || ''}`;
        }
      }
      
      if (resume.projects && resume.projects.length > 0) {
        contextualPrompt += `\nProjects: ${resume.projects.length} project(s) listed`;
      }
      
      if (resume.certifications && resume.certifications.length > 0) {
        contextualPrompt += `\nCertifications: ${resume.certifications.map(c => c.name || c.title).filter(Boolean).join(', ')}`;
      }
    }
    
    return contextualPrompt;
  }
  
  private async saveInteractionToMemory(
    request: AIAnalysisRequest,
    response: AIAnalysisResponse,
    processingTime: number,
    memoryContext?: any
  ): Promise<void> {
    if (!request.context?.userId) return;
    
    try {
      const userId = request.context.userId;
      
      // Get or create active session
      const session = await aiMemoryService.getOrCreateActiveSession(userId);
      
      // Save user message
      await aiMemoryService.saveMessage(
        session.id,
        userId,
        'user',
        request.content,
        {
          aiType: request.type,
          usePremium: request.usePremium,
          contextData: request.context
        }
      );
      
      // Save AI response
      await aiMemoryService.saveMessage(
        session.id,
        userId,
        'assistant',
        response.response,
        {
          aiType: request.type,
          usePremium: request.usePremium,
          processingTimeMs: processingTime,
          contextData: {
            suggestions: response.suggestions,
            actionItems: response.actionItems,
            analysis: response.analysis
          }
        }
      );
      
      // Update user memory based on interaction
      await this.updateUserMemoryFromInteraction(userId, request, response);
      
      // Save resume analysis to memory if applicable
      if (request.type === 'resume_analysis' && response.analysis) {
        await this.saveResumeAnalysisToMemory(userId, request, response);
      }
      
      // Save conversation context
      await this.saveConversationContext(userId, session.id, request, response);
      
    } catch (error) {
      console.error('Error saving interaction to memory:', error);
      // Don't throw - memory errors shouldn't break the main flow
    }
  }
  
  private async updateUserMemoryFromInteraction(
    userId: string,
    request: AIAnalysisRequest,
    response: AIAnalysisResponse
  ): Promise<void> {
    const updates: any = {};
    
    // Extract and update skills from resume analysis
    if (request.type === 'resume_analysis' && response.analysis?.skillsExtracted) {
      updates.primarySkills = response.analysis.skillsExtracted.slice(0, 20);
    }
    
    // Update career level from resume analysis
    if (response.analysis?.careerLevel) {
      updates.careerStage = response.analysis.careerLevel;
    }
    
    // Update industries from resume analysis
    if (response.analysis?.industryFocus) {
      updates.industries = response.analysis.industryFocus;
    }
    
    // Update target roles from resume analysis
    if (response.analysis?.roleTargets) {
      updates.jobTitles = response.analysis.roleTargets;
    }
    
    // Track interaction type
    const now = new Date().toISOString();
    if (request.type === 'resume_analysis') {
      updates.lastResumeAnalysis = now;
    } else if (request.type === 'job_search') {
      updates.lastJobSearch = now;
    } else if (request.type === 'career_advice') {
      updates.lastCareerAdvice = now;
    }
    
    // Update preferred AI style based on premium usage
    if (request.usePremium) {
      updates.preferredAiStyle = 'detailed';
    }
    
    await aiMemoryService.updateUserMemory(userId, updates);
  }
  
  private async saveResumeAnalysisToMemory(
    userId: string,
    request: AIAnalysisRequest,
    response: AIAnalysisResponse
  ): Promise<void> {
    if (!response.analysis) return;
    
    const resumeContent = request.content;
    const analysis = response.analysis;
    
    await aiMemoryService.saveResumeAnalysis(userId, resumeContent, {
      analysisSummary: response.response.substring(0, 1000), // First 1000 chars
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      skillsExtracted: analysis.skillsExtracted,
      careerLevel: analysis.careerLevel,
      overallScore: analysis.score,
      industryFocus: analysis.industryFocus,
      roleTargets: analysis.roleTargets
    });
  }
  
  private async saveConversationContext(
    userId: string,
    sessionId: number,
    request: AIAnalysisRequest,
    response: AIAnalysisResponse
  ): Promise<void> {
    // Save different types of context based on the interaction
    
    if (request.type === 'career_advice') {
      // Extract career goals or advice given
      const careerGoals = this.extractCareerGoals(request.content);
      if (careerGoals) {
        await aiMemoryService.saveContext(
          userId,
          'career_goals',
          'user_stated_goals',
          { goals: careerGoals, timestamp: new Date().toISOString() },
          { sessionId, importanceScore: 80 }
        );
      }
    }
    
    if (request.type === 'job_search') {
      // Extract job search criteria
      const searchCriteria = this.extractJobSearchCriteria(request.content);
      if (searchCriteria) {
        await aiMemoryService.saveContext(
          userId,
          'job_search_criteria',
          'search_preferences',
          searchCriteria,
          { sessionId, importanceScore: 70 }
        );
      }
    }
    
    // Save key insights from AI response
    if (response.suggestions && response.suggestions.length > 0) {
      await aiMemoryService.saveContext(
        userId,
        'ai_suggestions',
        `${request.type}_suggestions_${Date.now()}`,
        {
          type: request.type,
          suggestions: response.suggestions,
          timestamp: new Date().toISOString()
        },
        { sessionId, importanceScore: 60 }
      );
    }
  }
  
  // Helper methods for extracting information
  private extractSkills(text: string): string[] {
    // Extract technical skills, programming languages, tools, etc.
    const skillPatterns = [
      /(?:skills?|technologies?|tools?):?\s*([^\n]+)/gi,
      /(?:proficient|experienced|familiar)\s+(?:in|with):?\s*([^\n]+)/gi,
      /(?:JavaScript|Python|Java|React|Node\.js|SQL|AWS|Docker|Kubernetes|Git|HTML|CSS|TypeScript|Angular|Vue|PHP|C\+\+|C#|Ruby|Go|Rust|Swift|Kotlin|Scala|R|MATLAB|Tableau|PowerBI|Excel|Salesforce|Adobe|Figma|Sketch|Photoshop|Illustrator|InDesign|AutoCAD|SolidWorks|JIRA|Confluence|Slack|Teams|Zoom|Linux|Windows|macOS|Android|iOS|Firebase|MongoDB|PostgreSQL|MySQL|Redis|Elasticsearch|GraphQL|REST|API|Microservices|DevOps|CI\/CD|Agile|Scrum|Kanban|Machine Learning|AI|Data Science|Analytics|Statistics|Marketing|Sales|Finance|Accounting|HR|Legal|Operations|Project Management|Product Management|UX|UI|Design|Research|Writing|Communication|Leadership|Management)/gi
    ];
    
    const skills = new Set<string>();
    
    skillPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up and split the match
          const cleanMatch = match.replace(/^(skills?|technologies?|tools?|proficient|experienced|familiar|in|with):?\s*/i, '');
          const skillList = cleanMatch.split(/[,;|&+\n]/).map(s => s.trim()).filter(s => s.length > 1);
          skillList.forEach(skill => skills.add(skill));
        });
      }
    });
    
    return Array.from(skills).slice(0, 30); // Limit to 30 skills
  }
  
  private extractCareerLevel(text: string): string {
    const levelPatterns = {
      'entry': /(?:entry.?level|junior|graduate|new grad|intern|trainee|associate|0-2 years?)/i,
      'mid': /(?:mid.?level|intermediate|experienced|3-7 years?|senior associate)/i,
      'senior': /(?:senior|lead|principal|8-15 years?|expert|specialist)/i,
      'executive': /(?:executive|director|vp|vice president|c-level|ceo|cto|cfo|15\+ years?|manager)/i
    };
    
    for (const [level, pattern] of Object.entries(levelPatterns)) {
      if (pattern.test(text)) {
        return level;
      }
    }
    
    return 'unknown';
  }
  
  private extractIndustries(text: string): string[] {
    const industries = [
      'Technology', 'Software', 'Healthcare', 'Finance', 'Banking', 'Insurance', 'Retail', 'E-commerce',
      'Manufacturing', 'Automotive', 'Aerospace', 'Defense', 'Energy', 'Oil & Gas', 'Renewable Energy',
      'Telecommunications', 'Media', 'Entertainment', 'Gaming', 'Education', 'EdTech', 'Government',
      'Non-profit', 'Consulting', 'Professional Services', 'Real Estate', 'Construction', 'Agriculture',
      'Food & Beverage', 'Hospitality', 'Travel', 'Transportation', 'Logistics', 'Supply Chain',
      'Pharmaceuticals', 'Biotechnology', 'Medical Devices', 'Legal', 'Marketing', 'Advertising',
      'Public Relations', 'Human Resources', 'Recruiting', 'Sales', 'Customer Service', 'Operations'
    ];
    
    const foundIndustries = industries.filter(industry => 
      new RegExp(industry, 'i').test(text)
    );
    
    return foundIndustries.slice(0, 5); // Limit to 5 industries
  }
  
  private extractRoles(text: string): string[] {
    const rolePatterns = [
      /(?:seeking|looking for|interested in|applying for|targeting):?\s*([^\n]+?)(?:position|role|job)/gi,
      /(?:software engineer|developer|programmer|analyst|manager|director|consultant|designer|architect|specialist|coordinator|administrator|executive|lead|senior|junior|associate|intern)/gi
    ];
    
    const roles = new Set<string>();
    
    rolePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/^(seeking|looking for|interested in|applying for|targeting):?\s*/i, '');
          roles.add(cleanMatch.trim());
        });
      }
    });
    
    return Array.from(roles).slice(0, 10); // Limit to 10 roles
  }
  
  private extractCareerGoals(text: string): string | null {
    const goalPatterns = [
      /(?:my goal|i want|i aim|i hope|i plan|i aspire|looking to|seeking to|trying to|goal is):?\s*([^\n.!?]+)/gi,
      /(?:career goal|professional goal|objective|ambition):?\s*([^\n.!?]+)/gi
    ];
    
    for (const pattern of goalPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  private extractJobSearchCriteria(text: string): any | null {
    const criteria: any = {};
    
    // Extract location preferences
    const locationMatch = text.match(/(?:in|at|near|around|location):?\s*([a-zA-Z\s,]+?)(?:\s|$|,|\.|!|\?)/i);
    if (locationMatch) {
      criteria.location = locationMatch[1].trim();
    }
    
    // Extract salary expectations
    const salaryMatch = text.match(/(?:\$|salary|pay|compensation):?\s*([0-9,k\-\s]+)/i);
    if (salaryMatch) {
      criteria.salary = salaryMatch[1].trim();
    }
    
    // Extract work preferences
    if (/remote|work from home|wfh/i.test(text)) {
      criteria.workType = 'remote';
    } else if (/hybrid/i.test(text)) {
      criteria.workType = 'hybrid';
    } else if (/on.?site|office/i.test(text)) {
      criteria.workType = 'onsite';
    }
    
    return Object.keys(criteria).length > 0 ? criteria : null;
  }

  private getEnhancedFallbackResponse(request: AIAnalysisRequest, memoryContext?: any): AIAnalysisResponse {
    // Enhanced fallback responses for serverless production environment
    // Use memory context to personalize responses
    
    let personalizedGreeting = '';
    if (memoryContext?.userMemory) {
      const user = memoryContext.userMemory;
      if (user.interactionCount > 1) {
        personalizedGreeting = `Welcome back! Based on our previous conversations, `;
      }
      if (user.careerStage) {
        personalizedGreeting += `As a ${user.careerStage}-level professional, `;
      }
    }
    
    const enhancedResponses = {
      resume_analysis: {
        response: `${personalizedGreeting}Based on current industry standards, here's my analysis of your resume: Focus on quantifiable achievements, use ATS-friendly formatting, and include relevant keywords from job descriptions. Your resume should tell a compelling story of your professional growth and impact.${memoryContext?.recentResumeAnalysis ? ` I notice improvements from your previous version - keep building on those strengths!` : ''}`,
        suggestions: [
          "Add specific metrics and numbers to demonstrate impact (e.g., 'Increased sales by 25%')",
          "Use action verbs to start each bullet point (Led, Developed, Implemented)",
          "Include relevant technical skills and certifications",
          "Tailor your resume for each job application",
          "Keep formatting clean and ATS-compatible"
        ],
        analysis: {
          strengths: ["Professional presentation", "Clear structure"],
          improvements: ["Add quantifiable achievements", "Include more relevant keywords", "Enhance technical skills section"],
          score: memoryContext?.recentResumeAnalysis?.overallScore ? Math.min(memoryContext.recentResumeAnalysis.overallScore + 5, 100) : 78,
          skillsExtracted: memoryContext?.recentResumeAnalysis?.skillsExtracted || [],
          careerLevel: memoryContext?.userMemory?.careerStage || 'unknown',
          industryFocus: memoryContext?.userMemory?.industries || [],
          roleTargets: memoryContext?.userMemory?.jobTitles || []
        }
      },
      career_advice: {
        response: `${personalizedGreeting}For career advancement in today's competitive market, focus on continuous learning and skill development. Build a strong professional network, stay updated with industry trends, and seek opportunities that challenge you to grow.${memoryContext?.userMemory?.careerGoals ? ` Given your goal of ${memoryContext.userMemory.careerGoals}, I recommend focusing on...` : ''}`,
        suggestions: [
          "Identify in-demand skills in your industry and create a learning plan",
          "Build a strong LinkedIn presence and engage with industry content",
          "Seek mentorship from senior professionals in your field",
          "Consider obtaining relevant certifications or additional training",
          "Network actively through professional events and online communities"
        ]
      },
      job_search: {
        response: `${personalizedGreeting}Effective job searching requires a multi-channel approach. Optimize your online presence, leverage your network, and tailor your applications to each opportunity.${memoryContext?.userMemory?.jobSearchStatus === 'active' ? ' Since you\'re actively searching, focus on quality applications over quantity.' : ''}`,
        suggestions: [
          "Optimize your LinkedIn profile with relevant keywords and a professional photo",
          "Use multiple job search platforms (LinkedIn, Indeed, company websites)",
          "Leverage your professional network for referrals and insider information",
          "Customize your resume and cover letter for each application",
          "Follow up professionally after submitting applications"
        ]
      },
      interview_prep: {
        response: `${personalizedGreeting}Interview success comes from thorough preparation and authentic presentation. Research the company and role extensively, prepare specific examples using the STAR method, and practice articulating your value proposition clearly.`,
        suggestions: [
          "Research the company's mission, values, recent news, and competitors",
          "Prepare 5-7 STAR method examples showcasing different skills",
          "Practice common interview questions and your elevator pitch",
          "Prepare thoughtful questions about the role and company culture",
          "Plan your interview day logistics and professional attire"
        ]
      },
      general_chat: {
        response: `${personalizedGreeting}I'm here to help you navigate your career journey! Whether you need resume feedback, career strategy advice, job search guidance, or interview preparation, I can provide personalized insights to help you achieve your professional goals.${memoryContext?.chatHistory?.length > 0 ? ' Feel free to continue our previous conversation or start something new.' : ''}`,
        suggestions: [
          "Ask about specific resume improvements",
          "Get strategic career development advice",
          "Learn effective job search techniques",
          "Prepare for upcoming interviews",
          "Explore career transition strategies"
        ]
      }
    };

    const response = enhancedResponses[request.type] || enhancedResponses.general_chat;
    
    return {
      success: true,
      ...response
    };
  }

  private getFallbackResponse(request: AIAnalysisRequest, memoryContext?: any): AIAnalysisResponse {
    const fallbackResponses = {
      resume_analysis: {
        response: "I'd be happy to help analyze your resume! Here are some general tips: Ensure your resume is ATS-friendly with clear formatting, include quantifiable achievements, use relevant keywords from job descriptions, and keep it concise (1-2 pages). Consider adding a professional summary and ensuring your contact information is up-to-date.",
        suggestions: [
          "Use a clean, professional format",
          "Include quantifiable achievements",
          "Add relevant keywords",
          "Keep it to 1-2 pages",
          "Include a professional summary"
        ],
        analysis: {
          strengths: ["Professional presentation"],
          improvements: ["Add more specific details", "Include metrics and numbers"],
          score: 75
        }
      },
      career_advice: {
        response: "For career growth, focus on continuous learning, building a strong professional network, and staying updated with industry trends. Set clear career goals, seek mentorship, and don't be afraid to take calculated risks. Consider developing both technical and soft skills relevant to your field.",
        suggestions: [
          "Set clear career goals",
          "Build a professional network",
          "Continuously learn new skills",
          "Seek mentorship opportunities",
          "Stay updated with industry trends"
        ]
      },
      job_search: {
        response: "Effective job searching involves multiple strategies: optimize your LinkedIn profile, use job boards strategically, network actively, tailor your applications, and follow up professionally. Don't rely on just one method - diversify your approach for better results.",
        suggestions: [
          "Optimize your LinkedIn profile",
          "Use multiple job search platforms",
          "Network actively in your industry",
          "Tailor each application",
          "Follow up professionally"
        ]
      },
      interview_prep: {
        response: "Interview preparation is key to success. Research the company thoroughly, practice common questions, prepare specific examples using the STAR method, dress appropriately, and prepare thoughtful questions to ask. Remember, interviews are conversations - show your personality and enthusiasm!",
        suggestions: [
          "Research the company thoroughly",
          "Practice common interview questions",
          "Prepare STAR method examples",
          "Dress professionally",
          "Prepare questions to ask"
        ]
      },
      general_chat: {
        response: "I'm here to help with your career development! I can assist with resume analysis, career advice, job search strategies, interview preparation, and general professional guidance. What specific area would you like to explore?",
        suggestions: [
          "Ask about resume improvement",
          "Get career development advice",
          "Learn job search strategies",
          "Prepare for interviews"
        ]
      }
    };

    const fallback = fallbackResponses[request.type] || fallbackResponses.general_chat;
    
    return {
      success: true,
      ...fallback
    };
  }

  // Method to analyze resume content
  async analyzeResume(resumeContent: string, userProfile?: any): Promise<AIAnalysisResponse> {
    return this.generateResponse({
      type: 'resume_analysis',
      content: `Please analyze this resume and provide detailed feedback:\n\n${resumeContent}`,
      context: { userProfile }
    });
  }

  // Method to provide career advice
  async provideCareerAdvice(query: string, userProfile?: any): Promise<AIAnalysisResponse> {
    return this.generateResponse({
      type: 'career_advice',
      content: query,
      context: { userProfile }
    });
  }

  // Method to help with job search
  async helpWithJobSearch(query: string, jobPreferences?: any): Promise<AIAnalysisResponse> {
    return this.generateResponse({
      type: 'job_search',
      content: query,
      context: { jobPreferences }
    });
  }

  // Method to prepare for interviews
  async prepareForInterview(query: string, jobDetails?: any): Promise<AIAnalysisResponse> {
    return this.generateResponse({
      type: 'interview_prep',
      content: query,
      context: { jobPreferences: jobDetails }
    });
  }

  // ===== STREAMING HELPER METHODS =====

  private async generateOpenAIStreamingResponse(
    request: AIAnalysisRequest, 
    memoryContext?: any, 
    onChunk?: StreamCallback
  ): Promise<string> {
    const systemPrompt = this.getSystemPrompt(request.type, memoryContext);
    
    // Build context-aware user message
    let userMessage = this.buildContextualPrompt(request.content, memoryContext);
    
    if (request.context?.userProfile) {
      userMessage += `\n\nUser Context: ${JSON.stringify(request.context.userProfile, null, 2)}`;
    }
    
    if (request.context?.resumeData) {
      userMessage += `\n\nResume Data: ${JSON.stringify(request.context.resumeData, null, 2)}`;
    }

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 1500,
      temperature: 0.7,
      stream: true, // Enable streaming
    });

    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        
        // Send chunk to callback
        if (onChunk) {
          onChunk({
            content: content,
            isComplete: false
          });
        }
      }
    }
    
    return fullResponse;
  }

  private async simulateStreamingResponse(response: string, onChunk: StreamCallback): Promise<string> {
    // Simulate human-like typing by streaming the response in chunks
    const words = response.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      currentText += (i > 0 ? ' ' : '') + word;
      
      // Send chunk
      onChunk({
        content: word + (i < words.length - 1 ? ' ' : ''),
        isComplete: false
      });
      
      // Add realistic typing delay
      const delay = Math.random() * 100 + 50; // 50-150ms delay
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return response;
  }

  private async getStreamingFallbackResponse(
    request: AIAnalysisRequest, 
    memoryContext?: any, 
    onChunk?: StreamCallback
  ): Promise<string> {
    // Get the fallback response
    const fallbackResponse = this.getEnhancedFallbackResponse(request, memoryContext);
    
    if (onChunk) {
      // Stream the fallback response
      return await this.simulateStreamingResponse(fallbackResponse.response, onChunk);
    }
    
    return fallbackResponse.response;
  }

  private parseResumeAnalysisFromText(text: string): any {
    // Extract analysis data from the full text response
    return {
      strengths: this.extractSection(text, 'strengths'),
      improvements: this.extractSection(text, 'improvements'),
      score: this.extractScore(text),
      skillsExtracted: this.extractSkills(text),
      careerLevel: this.extractCareerLevel(text),
      industryFocus: this.extractIndustries(text),
      roleTargets: this.extractRoles(text)
    };
  }

  /**
   * Search for jobs using Tavily API
   */
  async searchJobsWithTavily(params: JobSearchParams): Promise<any[]> {
    try {
      console.log('🔍 Searching jobs with Tavily:', params);
      const jobs = await tavilyService.searchAndCrawlJobs(params);
      console.log(`✅ Found ${jobs.length} jobs via Tavily`);
      return jobs;
    } catch (error) {
      console.error('❌ Tavily job search failed:', error);
      throw error;
    }
  }

  /**
   * Extract job search parameters from natural language query
   */
  extractJobSearchParams(query: string): JobSearchParams {
    const lowerQuery = query.toLowerCase();
    
    // Extract job title/role
    const jobTitlePatterns = [
      /(?:looking for|searching for|find|show me)\s+([a-z\s]+?)\s+(?:jobs?|positions?|roles?)/i,
      /([a-z\s]+?)\s+(?:jobs?|positions?|roles?)/i
    ];
    
    let jobTitle = '';
    for (const pattern of jobTitlePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        jobTitle = match[1].trim();
        break;
      }
    }
    
    // Extract location
    const locationPatterns = [
      /(?:in|at|near|around)\s+([a-z\s,]+?)(?:\s+(?:area|region|city|state))?(?:\s|$|,)/i,
      /location:?\s*([a-z\s,]+)/i
    ];
    
    let location = '';
    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        location = match[1].trim();
        break;
      }
    }
    
    // Extract job type
    let jobType = '';
    if (lowerQuery.includes('remote')) jobType = 'remote';
    else if (lowerQuery.includes('hybrid')) jobType = 'hybrid';
    else if (lowerQuery.includes('on-site') || lowerQuery.includes('onsite')) jobType = 'on-site';
    else if (lowerQuery.includes('full-time') || lowerQuery.includes('full time')) jobType = 'full-time';
    else if (lowerQuery.includes('part-time') || lowerQuery.includes('part time')) jobType = 'part-time';
    else if (lowerQuery.includes('contract')) jobType = 'contract';
    
    // Extract experience level
    let experienceLevel = '';
    if (lowerQuery.includes('entry') || lowerQuery.includes('junior')) experienceLevel = 'entry';
    else if (lowerQuery.includes('mid') || lowerQuery.includes('intermediate')) experienceLevel = 'mid';
    else if (lowerQuery.includes('senior')) experienceLevel = 'senior';
    else if (lowerQuery.includes('lead') || lowerQuery.includes('principal')) experienceLevel = 'lead';
    
    return {
      query: jobTitle || query,
      location: location || undefined,
      jobType: jobType || undefined,
      experienceLevel: experienceLevel || undefined,
      maxResults: 10
    };
  }
}

export const aiService = new AIService();