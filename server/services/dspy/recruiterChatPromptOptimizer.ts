import { groqService } from '../groqService.js';

/**
 * Simplified Recruiter Chat Response Generator
 * Uses groqService for reliable, natural responses with audit logging
 */

interface RecruiterChatContext {
  recruiterName?: string;
  query: string;
  candidatesFound: number;
  searchSource: 'cvzen' | 'web' | 'both';
  hasResults: boolean;
}

class RecruiterChatPromptOptimizer {
  constructor() {
    // No longer needs direct Groq instance - uses groqService
  }

  /**
   * Generate optimized response using direct Groq API
   */
  async generateOptimizedResponse(context: RecruiterChatContext): Promise<string> {
    const { recruiterName, query, candidatesFound, searchSource, hasResults } = context;
    
    try {
      const greeting = recruiterName ? `Hey ${recruiterName}!` : 'Hey!';
      
      // Build a simple, direct prompt
      let userPrompt = '';
      
      if (candidatesFound > 0) {
        userPrompt = `Generate a brief, casual 1-2 sentence response for a recruiter who just searched for candidates.
Context:
- Recruiter name: ${recruiterName || 'there'}
- Search query: "${query}"
- Found: ${candidatesFound} candidates
- Source: ${searchSource === 'both' ? 'CVZen database and web search' : searchSource === 'cvzen' ? 'CVZen database' : 'web search'}
- AI screened: ${searchSource === 'cvzen' || searchSource === 'both' ? 'yes' : 'no'}

Write a friendly response that:
1. Starts with "${greeting}"
2. Mentions the number found and that they were AI screened (if applicable)
3. Encourages them to check the results
4. Keep it to 1-2 sentences max
5. Use casual language with contractions`;
      } else {
        userPrompt = `Generate a brief, casual 1-2 sentence response for a recruiter who searched but found no candidates.
Context:
- Recruiter name: ${recruiterName || 'there'}
- Search query: "${query}"
- Found: 0 candidates
- Database has candidates: ${hasResults}

Write a friendly response that:
1. Starts with "${greeting}"
2. Acknowledges no matches found
3. ${hasResults ? 'Suggests trying a broader search' : 'Mentions the database is growing and offers to help with job description or hiring strategy'}
4. Keep it to 1-2 sentences max
5. Use casual language with contractions`;
      }

      const response = await groqService.generateResponse(
        'You are a friendly recruiting assistant. Generate SHORT, casual responses (1-2 sentences max). Use contractions. Be conversational like talking to a coworker.',
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 100,
          auditContext: {
            serviceName: 'recruiterChatPromptOptimizer',
            operationType: 'chat_response_generation',
            userContext: {
              recruiterName: recruiterName || 'anonymous',
              candidatesFound,
              searchSource,
              hasResults
            }
          }
        }
      );
      
      if (response) {
        return response;
      }

      // Fallback response
      return this.getFallbackResponse(context);
    } catch (error) {
      console.error('❌ [GROQ RESPONSE GENERATOR] Error:', error);
      return this.getFallbackResponse(context);
    }
  }

  /**
   * Fallback response when AX fails
   */
  private getFallbackResponse(context: RecruiterChatContext): string {
    const { recruiterName, candidatesFound, hasResults } = context;
    const greeting = recruiterName ? `Hey ${recruiterName}!` : 'Hey!';

    if (candidatesFound > 0) {
      return `${greeting} I found ${candidatesFound} candidates and screened them with AI. Check out the results below!`;
    }

    if (!hasResults) {
      return `${greeting} I searched our database but didn't find any matches yet. Our candidate pool is growing! Want me to help you create a job description or suggest sourcing strategies instead?`;
    }

    return `${greeting} I searched but didn't find exact matches. Want to try a broader search or let me help with your hiring strategy?`;
  }

  /**
   * Detect if query needs clarification
   */
  async isQueryVague(query: string): Promise<{ isVague: boolean; missingDetails: string[] }> {
    const lowerQuery = query.toLowerCase();
    const missingDetails: string[] = [];

    // Check for search intent
    const hasSearchIntent = /\b(find|search|looking for|need|hire|recruit)\b/i.test(query);
    const hasRoleKeyword = /\b(candidate|developer|engineer|designer|manager|analyst|architect|programmer|specialist)\b/i.test(query);

    if (!hasSearchIntent || !hasRoleKeyword) {
      return { isVague: false, missingDetails: [] };
    }

    // Check for specific details
    const hasSpecificSkills = /\b(react|node|python|java|typescript|javascript|vue|angular|aws|docker|kubernetes|\.net|c\+\+|c#|ruby|go|rust|swift|kotlin|php)\b/i.test(query);
    const hasExperienceLevel = /\b(\d+\+?\s*years?|entry|junior|mid|senior|lead|principal)\b/i.test(query);
    const hasLocation = /\b(in|at|near|location|remote|hybrid|on-?site)\s+([a-z\s,]+)/i.test(query);

    if (!hasSpecificSkills) {
      missingDetails.push('specific technical skills');
    }
    if (!hasExperienceLevel) {
      missingDetails.push('experience level');
    }
    if (!hasLocation) {
      missingDetails.push('location or remote preference');
    }

    const isVague = missingDetails.length >= 2;
    return { isVague, missingDetails };
  }

  /**
   * Generate clarifying questions
   */
  async generateClarifyingQuestions(missingDetails: string[], recruiterName?: string): Promise<string> {
    const greeting = recruiterName ? `Hey ${recruiterName}!` : 'Hey!';
    
    const questions: string[] = [];
    
    if (missingDetails.includes('specific technical skills')) {
      questions.push('What specific skills or tech stack? (like React, Python, AWS)');
    }
    if (missingDetails.includes('experience level')) {
      questions.push('What experience level? (junior, mid, senior, etc.)');
    }
    if (missingDetails.includes('location or remote preference')) {
      questions.push('Location preference or remote OK?');
    }

    const intro = `${greeting} I'd love to help you find great candidates! Just need a few more details:\n\n`;
    const questionsList = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    const outro = '\n\nGive me these details and I\'ll find you some perfect matches! 🎯';

    return intro + questionsList + outro;
  }
}

export const recruiterChatPromptOptimizer = new RecruiterChatPromptOptimizer();
