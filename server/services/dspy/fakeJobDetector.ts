import { groqService } from '../groqService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface JobPosting {
  title: string;
  location: string;
  department: string;
  salary_range: string;
  company_profile: string;
  description: string;
  requirements: string;
  benefits: string;
  employment_type: string;
  required_experience: string;
  required_education: string;
  industry: string;
  function: string;
  fraudulent: string;
}

interface DetectionResult {
  isFake: boolean;
  confidence: number;
  reasoning: string;
  redFlags: string[];
}

/**
 * JD Trust Score using DSPy-style prompt optimization
 * Trained on fake_real_job_postings dataset with pre-compiled prompt
 */
class FakeJobDetector {
  private compiledPrompt: string | null = null;
  private readonly promptPath = path.join(__dirname, '../../data_sets/fake_job_detector_prompt.json');

  constructor() {
    this.loadCompiledPrompt();
  }

  /**
   * Load pre-compiled optimized prompt from disk
   */
  private loadCompiledPrompt(): void {
    try {
      if (fs.existsSync(this.promptPath)) {
        const data = JSON.parse(fs.readFileSync(this.promptPath, 'utf-8'));
        this.compiledPrompt = data.systemPrompt;
        console.log('✅ Loaded pre-compiled JD Trust Score prompt');
      } else {
        console.log('⚠️ No compiled prompt found, will use default');
      }
    } catch (error) {
      console.error('❌ Error loading compiled prompt:', error);
    }
  }

  /**
   * Get the system prompt (compiled or default)
   */
  private getSystemPrompt(): string {
    if (this.compiledPrompt) {
      return this.compiledPrompt;
    }

    // Default prompt (will be replaced after training)
    return `You are an expert at detecting fraudulent job postings based on text content only. Analyze job postings and identify red flags that indicate a fake or scam job.

Key indicators of fake jobs (text-based only):
1. Vague or generic job descriptions lacking specific details
2. Unrealistic salary promises or "get rich quick" language
3. Poor grammar, spelling errors, or unprofessional writing
4. Requests for personal financial information or upfront payments
5. Missing or vague company information (no verifiable company name/details)
6. Excessive urgency or pressure to act immediately ("Limited spots!", "Apply now!")
7. Work-from-home with minimal requirements or qualifications
8. Unprofessional email addresses (e.g., Gmail, Yahoo for corporate jobs)
9. No clear job responsibilities or duties listed
10. Promises of easy money with little work or experience
11. Suspicious contact methods (only WhatsApp, Telegram, etc.)
12. Too-good-to-be-true benefits or compensation
13. Requests for personal documents before interview
14. Vague job titles or responsibilities
15. Social media engagement tactics ("Comment 'interested'", "DM for details", "Tag a friend")
16. Requires sharing/liking posts to apply
17. Uses excessive emojis or informal language for professional roles
18. Asks to contact via social media DMs instead of proper application
19. "No experience needed" for high-paying professional roles
20. Pyramid scheme or MLM language ("Be your own boss", "Unlimited earning potential")

Note: Focus only on text content. Do not consider visual elements like logos.

Analyze the job posting and respond with:
- isFake: true/false
- confidence: 0-100
- reasoning: brief explanation
- redFlags: list of specific red flags found

Be thorough but concise.`;
  }

  /**
   * Detect if a job posting is fake
   */
  async detect(jobData: Partial<JobPosting>): Promise<DetectionResult> {
    const systemPrompt = this.getSystemPrompt();
    
    const userPrompt = `Analyze this job posting for fraud indicators:

Title: ${jobData.title || 'N/A'}
Location: ${jobData.location || 'N/A'}
Department: ${jobData.department || 'N/A'}
Salary Range: ${jobData.salary_range || 'N/A'}
Company Profile: ${jobData.company_profile || 'N/A'}
Description: ${jobData.description || 'N/A'}
Requirements: ${jobData.requirements || 'N/A'}
Benefits: ${jobData.benefits || 'N/A'}
Employment Type: ${jobData.employment_type || 'N/A'}
Required Experience: ${jobData.required_experience || 'N/A'}
Required Education: ${jobData.required_education || 'N/A'}
Industry: ${jobData.industry || 'N/A'}
Function: ${jobData.function || 'N/A'}

Respond in JSON format:
{
  "isFake": boolean,
  "confidence": number (0-100),
  "reasoning": "brief explanation",
  "redFlags": ["flag1", "flag2", ...]
}`;

    try {
      console.log('🔍 Calling Groq API for fake job detection...');
      const result = await groqService.generateResponse(systemPrompt, userPrompt, {
        temperature: 0.1, // Low temperature for consistent detection
        maxTokens: 500,
        auditContext: {
          serviceName: 'fake_job_detection',
          operationType: 'other',
          userContext: { jobTitle: jobData.title }
        }
      });
      
      console.log('📊 Groq API result:', { success: result.success, responseLength: result.response?.length });
      
      if (!result.success) {
        console.error('❌ Groq API returned success: false');
        throw new Error('Failed to generate response from Groq');
      }
      
      const response = result.response;

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isFake: result.isFake || false,
          confidence: result.confidence || 0,
          reasoning: result.reasoning || '',
          redFlags: result.redFlags || []
        };
      }

      // Fallback parsing
      return {
        isFake: response.toLowerCase().includes('fake') || response.toLowerCase().includes('fraudulent'),
        confidence: 50,
        reasoning: response.substring(0, 200),
        redFlags: []
      };
    } catch (error) {
      console.error('❌ Error detecting fake job:', error);
      throw error;
    }
  }

  /**
   * Batch detect multiple job postings
   */
  async detectBatch(jobs: Partial<JobPosting>[]): Promise<DetectionResult[]> {
    const results: DetectionResult[] = [];
    
    for (const job of jobs) {
      try {
        const result = await this.detect(job);
        results.push(result);
      } catch (error) {
        console.error('Error detecting job:', error);
        results.push({
          isFake: false,
          confidence: 0,
          reasoning: 'Error during detection',
          redFlags: []
        });
      }
    }
    
    return results;
  }
}

export const fakeJobDetector = new FakeJobDetector();
export type { JobPosting, DetectionResult };
