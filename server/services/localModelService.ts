import axios from 'axios';
import * as dotenv from 'dotenv';
import { groqService } from './groqService.js';

dotenv.config();

export interface LocalModelRequest {
  type: 'resume_analysis' | 'career_advice' | 'job_search' | 'interview_prep' | 'general_chat';
  content: string;
  context?: {
    userProfile?: any;
    resumeData?: any;
    jobPreferences?: any;
  };
}

export interface LocalModelResponse {
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

class LocalModelService {
  private ollamaUrl: string;
  private defaultModel: string;
  private isAvailable: boolean = false;

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.LOCAL_MODEL_NAME || 'phi3:mini';
    // Don't call checkAvailability in constructor - it's async
    // It will be called when isServiceAvailable() is first called
  }

  private async checkAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      this.isAvailable = response.status === 200;
      console.log('🤖 Local model service available:', this.isAvailable);
      
      if (this.isAvailable) {
        const models = response.data.models || [];
        console.log('📋 Available models:', models.map((m: any) => m.name));
        
        // Check if our default model is available
        const hasDefaultModel = models.some((m: any) => m.name.includes(this.defaultModel.split(':')[0]));
        if (!hasDefaultModel && models.length > 0) {
          this.defaultModel = models[0].name;
          console.log('🔄 Using available model:', this.defaultModel);
        }
      }
    } catch (error) {
      this.isAvailable = false;
      console.log('⚠️ Local model service not available, will use fallback responses');
    }
  }

  public async isServiceAvailable(): Promise<boolean> {
    if (!this.isAvailable) {
      await this.checkAvailability();
    }
    return this.isAvailable;
  }

  private getSystemPrompt(type: string): string {
    const basePrompt = `You are CVZen AI, a specialized career advisor for the CVZen resume builder and job matching platform. You help job seekers create better resumes, find jobs, and advance their careers. You also assist recruiters in finding the right candidates. 

IMPORTANT FORMATTING RULES:
- Use clear paragraphs separated by double line breaks
- Use bullet points with • for lists
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Keep responses well-structured and easy to read
- Be concise but comprehensive in your advice
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
3. [Final recommendation]

Score: [60-100]/100

CRITICAL FORMATTING RULES:
- ALWAYS write the score as "X/100" where X is between 60-100
- NEVER write "X/1" or any other denominator
- Example: "Score: 85/100" (CORRECT)
- Example: "Score: 85/1" (WRONG - DO NOT DO THIS)
- NO markdown formatting - use plain text only

Keep responses detailed but well-organized.`;
        
      case 'career_advice':
        return `${basePrompt}

TASK: Provide strategic career guidance for professionals.
FOCUS: Skill development, career paths, industry trends, growth strategies.

RESPONSE FORMAT:
Career Guidance

[Main advice paragraph]

Key Recommendations:
• [Specific recommendation]
• [Another recommendation]
• [Third recommendation]

Next Steps:
1. [Immediate action]
2. [Short-term goal]
3. [Long-term strategy]

NO markdown formatting - use plain text only. Provide actionable, personalized advice.`;
        
      case 'job_search':
        return `${basePrompt}

TASK: Help with job search strategies and tactics.
FOCUS: Platform recommendations, application optimization, networking, interview prep.

RESPONSE FORMAT:
Job Search Strategy

[Overview paragraph]

Recommended Platforms:
• [Platform 1 with brief description]
• [Platform 2 with brief description]
• [Platform 3 with brief description]

Action Plan:
1. [First step]
2. [Second step]
3. [Third step]

NO markdown formatting - use plain text only. Provide practical, immediately actionable steps.`;
        
      case 'interview_prep':
        return `${basePrompt}

TASK: Prepare candidates for job interviews.
FOCUS: Common questions, behavioral examples, company research, follow-up.

RESPONSE FORMAT:
Interview Preparation Guide

[Introduction paragraph]

Key Areas to Focus On:
• [Area 1]
• [Area 2]
• [Area 3]

Sample Questions to Practice:
1. [Question 1]
2. [Question 2]
3. [Question 3]

Preparation Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

NO markdown formatting - use plain text only. Provide specific, actionable interview preparation advice.`;
        
      default:
        return `${basePrompt} 

Provide helpful, well-formatted career advice. Use clear paragraphs, bullet points, and numbered lists to make your response easy to read and actionable. NO markdown formatting - use plain text only.`;
    }
  }

  async generateResponse(request: LocalModelRequest): Promise<LocalModelResponse> {
    console.log('🔄 Local model service generateResponse called with type:', request.type);
    
    try {
      // PRIORITY 1: Try Groq first (fast and reliable)
      console.log('🚀 Attempting Groq service first...');
      try {
        const groqResponse = await groqService.generateResponse({
          type: request.type,
          content: request.content,
          context: request.context
        });
        
        if (groqResponse.success) {
          console.log('✅ Groq service succeeded:', {
            responseLength: groqResponse.response?.length || 0,
            hasSuggestions: !!groqResponse.suggestions?.length,
            hasActionItems: !!groqResponse.actionItems?.length
          });
          
          // Convert Groq response to LocalModelResponse format
          return {
            success: true,
            response: groqResponse.response,
            suggestions: groqResponse.suggestions,
            actionItems: groqResponse.actionItems,
            analysis: groqResponse.analysis
          };
        }
      } catch (groqError) {
        console.warn('⚠️ Groq service failed, falling back to Ollama:', groqError.message);
      }
      
      // PRIORITY 2: Try Ollama as fallback
      console.log('🔄 Attempting Ollama as fallback...');
      const isAvailable = await this.isServiceAvailable();
      console.log('🔍 Ollama service availability check result:', isAvailable);

      if (!isAvailable) {
        console.log('⚠️ Ollama service not available, using fallback responses');
        return this.getFallbackResponse(request);
      }

      console.log('🤖 Proceeding with Ollama generation...');
      const systemPrompt = this.getSystemPrompt(request.type);
      
      // Build context-aware user message
      let userMessage = request.content;
      
      if (request.context?.userProfile) {
        const profile = request.context.userProfile;
        userMessage += `\n\nUser Context: ${profile.jobTitle || 'Professional'} with skills: ${(profile.skills || []).join(', ')} located in ${profile.location || 'Unknown'}`;
      }

      const ollamaRequest = {
        model: this.defaultModel,
        prompt: `${systemPrompt}\n\nUser: ${userMessage}\n\nAssistant:`,
        stream: false,
        options: {
          temperature: 0.3,  // Slightly more creative
          top_p: 0.8,        // More diverse responses
          max_tokens: 800,   // Much longer responses
          num_predict: 800,  // Ollama-specific parameter - increased
          repeat_penalty: 1.1, // Reduced to allow more natural repetition
          stop: ["User:", "Human:", "\n\nUser:", "\n\nHuman:"] // Better stop tokens
        }
      };

      console.log('📤 Sending request to Ollama:', {
        model: this.defaultModel,
        promptLength: ollamaRequest.prompt.length,
        url: `${this.ollamaUrl}/api/generate`
      });

      const response = await axios.post(`${this.ollamaUrl}/api/generate`, ollamaRequest, {
        timeout: 60000, // 60 second timeout for complex requests like job descriptions
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.response || '';
      console.log('✅ Received response from Ollama:', {
        responseLength: aiResponse.length,
        preview: aiResponse.substring(0, 100) + '...'
      });
      
      // Apply formatting to ALL responses, not just resume analysis
      const formattedResponse = this.formatResponse(aiResponse, request.type);
      
      // Parse structured response if it's a resume analysis
      if (request.type === 'resume_analysis') {
        return this.parseResumeAnalysis(formattedResponse);
      }
      
      return {
        success: true,
        response: formattedResponse,
        suggestions: this.extractSuggestions(formattedResponse),
        actionItems: this.extractActionItems(formattedResponse)
      };

    } catch (error) {
      console.error('Local model service error:', error.message);
      return this.getFallbackResponse(request);
    }
  }

  private formatResponse(response: string, type: string): string {
    let formatted = response;
    
    // Remove all markdown headers (# ## ### etc.)
    formatted = formatted.replace(/^#{1,6}\s+/gm, '');
    
    // Remove markdown bold (**text** or __text__)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');
    formatted = formatted.replace(/__(.*?)__/g, '$1');
    
    // Remove markdown italic (*text* or _text_)
    formatted = formatted.replace(/\*(.*?)\*/g, '$1');
    formatted = formatted.replace(/_(.*?)_/g, '$1');
    
    // Fix score formats for any response type
    const score = this.extractScore(formatted);
    if (score > 0) {
      // Replace any incorrect score formats with the correct one
      formatted = formatted.replace(
        /(?:ATS\s*Score|Score|Rating)[:\s]*\d+\/\d+(?:\s*end)?/gi,
        `Score: ${score}/100`
      );
      // Also fix any standalone score mentions
      formatted = formatted.replace(
        /Score\s*\(\d+\/\d+(?:\s*end)?\)/gi,
        `Score (${score}/100)`
      );
    }
    
    // Ensure proper paragraph spacing
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Clean up extra whitespace
    formatted = formatted.trim();
    
    return formatted;
  }

  private parseResumeAnalysis(response: string): LocalModelResponse {
    // Response is already formatted by formatResponse()
    const strengths = this.extractSection(response, 'strengths');
    const improvements = this.extractSection(response, 'improvements');
    const score = this.extractScore(response);
    
    return {
      success: true,
      response: response, // Already formatted
      analysis: {
        strengths: strengths,
        improvements: improvements,
        score: score
      },
      suggestions: this.extractSuggestions(response),
      actionItems: this.extractActionItems(response)
    };
  }

  private extractSection(text: string, section: string): string[] {
    const patterns = [
      new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n\\n|improvements:|suggestions:|action items:|score:|$)`, 'i'),
      new RegExp(`\\b${section}\\b[:\\s]*([\\s\\S]*?)(?=\\n\\n|\\b(?:improvements|suggestions|action items|score)\\b|$)`, 'i')
    ];
    
    for (const regex of patterns) {
      const match = text.match(regex);
      if (match) {
        return match[1]
          .split('\n')
          .map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
          .filter(line => line.length > 10); // Filter out very short lines
      }
    }
    return [];
  }

  private extractScore(text: string): number {
    // Try multiple score patterns
    const scorePatterns = [
      /(?:ATS\s*Score|Score|Rating)[:\s]*(\d+)\/100/i, // Exact 75/100 format
      /(?:ATS\s*Score|Score|Rating)[:\s]*(\d+)%/i, // Percentage format
      /(?:ATS\s*Score|Score|Rating)[:\s]*(\d+)\/\d+/i, // Any fraction format (75/1, 75/10, etc.)
      /(\d+)\/100/i, // Direct 75/100 format anywhere in text
      /(\d+)%/i, // Percentage format anywhere
      /(?:scored?|rating?)[:\s]*(\d+)/i // Simple score format
    ];
    
    for (const pattern of scorePatterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        // Ensure score is in valid range
        if (score >= 0 && score <= 100) {
          console.log(`📊 Extracted score: ${score} from pattern: ${pattern}`);
          return score;
        }
      }
    }
    
    // Try to find standalone numbers that might be scores
    const numberRegex = /\b([6-9]\d|100)\b/g;
    const numbers = text.match(numberRegex);
    if (numbers) {
      // Return the highest reasonable score found
      const scores = numbers.map(n => parseInt(n)).filter(n => n >= 60 && n <= 100);
      if (scores.length > 0) {
        const score = Math.max(...scores);
        console.log(`📊 Extracted fallback score: ${score}`);
        return score;
      }
    }
    
    console.log('📊 No score found, returning 0');
    return 0;
  }

  private extractSuggestions(text: string): string[] {
    return this.extractSection(text, 'suggestions');
  }

  private extractActionItems(text: string): string[] {
    return this.extractSection(text, 'action items');
  }

  private getFallbackResponse(request: LocalModelRequest): LocalModelResponse {
    const fallbackResponses = {
      resume_analysis: {
        response: "I'd be happy to help analyze your resume! Here are some general tips: Ensure your resume is ATS-friendly with clear formatting, include quantifiable achievements, use relevant keywords from job descriptions, and keep it concise (1-2 pages). Consider adding a professional summary and ensuring your contact information is up-to-date.",
        suggestions: [
          "Use a clean, professional format",
          "Include quantifiable achievements with numbers and percentages",
          "Add relevant keywords from target job descriptions",
          "Keep it to 1-2 pages maximum",
          "Include a compelling professional summary"
        ],
        analysis: {
          strengths: ["Professional presentation", "Clear structure"],
          improvements: ["Add more specific metrics", "Include relevant keywords", "Enhance professional summary"],
          score: 75
        }
      },
      career_advice: {
        response: "For career growth, focus on continuous learning, building a strong professional network, and staying updated with industry trends. Set clear career goals, seek mentorship, and don't be afraid to take calculated risks. Consider developing both technical and soft skills relevant to your field.",
        suggestions: [
          "Set specific, measurable career goals",
          "Build and maintain a professional network",
          "Continuously learn new skills relevant to your industry",
          "Seek mentorship opportunities",
          "Stay updated with industry trends and technologies"
        ]
      },
      job_search: {
        response: "Effective job searching involves multiple strategies: optimize your LinkedIn profile, use job boards strategically, network actively, tailor your applications, and follow up professionally. Don't rely on just one method - diversify your approach for better results.",
        suggestions: [
          "Optimize your LinkedIn profile with keywords",
          "Use multiple job search platforms",
          "Network actively in your industry",
          "Tailor each application to the specific role",
          "Follow up professionally after applications"
        ]
      },
      interview_prep: {
        response: "Interview preparation is key to success. Research the company thoroughly, practice common questions, prepare specific examples using the STAR method, dress appropriately, and prepare thoughtful questions to ask. Remember, interviews are conversations - show your personality and enthusiasm!",
        suggestions: [
          "Research the company and role thoroughly",
          "Practice common interview questions",
          "Prepare STAR method examples",
          "Dress professionally and appropriately",
          "Prepare thoughtful questions to ask the interviewer"
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
  async analyzeResume(resumeContent: string, userProfile?: any): Promise<LocalModelResponse> {
    return this.generateResponse({
      type: 'resume_analysis',
      content: `Please analyze this resume and provide detailed feedback:\n\n${resumeContent}`,
      context: { userProfile }
    });
  }

  // Method to provide career advice
  async provideCareerAdvice(query: string, userProfile?: any): Promise<LocalModelResponse> {
    return this.generateResponse({
      type: 'career_advice',
      content: query,
      context: { userProfile }
    });
  }

  // Method to help with job search
  async helpWithJobSearch(query: string, jobPreferences?: any): Promise<LocalModelResponse> {
    return this.generateResponse({
      type: 'job_search',
      content: query,
      context: { jobPreferences }
    });
  }

  // Method to prepare for interviews
  async prepareForInterview(query: string, jobDetails?: any): Promise<LocalModelResponse> {
    return this.generateResponse({
      type: 'interview_prep',
      content: query,
      context: { jobPreferences: jobDetails }
    });
  }
}

export const localModelService = new LocalModelService();