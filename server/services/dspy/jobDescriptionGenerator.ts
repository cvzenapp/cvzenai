import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { groqService } from '../groqService.js';

/**
 * Job Description Generator using DSPy-trained patterns
 * Uses compiled patterns from offline training with job_descriptions.csv dataset
 * Follows the same pattern as fake job detector
 */

interface JobDescriptionRequest {
  jobTitle: string;
  role?: string;
  experience?: string;
  location?: string;
  workType?: string;
  companySize?: string;
  skills?: string[];
  additionalContext?: string;
}

interface JobDescriptionResult {
  jobTitle: string;
  role: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  qualifications: string;
  benefits: string[];
  experience: string;
  workType: string;
  salaryRange?: string; // Optional - not in training data, set from request or default
}

interface CompiledPatterns {
  systemPrompt: string;
  metrics: {
    avgQualityScore: number;
    minScore: number;
    maxScore: number;
    testSetSize: number;
    evaluatedSamples?: number;
  };
  datasetInfo?: {
    totalLinesProcessed: number;
    qualityRecords: number;
    trainingRecords: number;
    testRecords: number;
  };
  examples: number;
  trainedAt: string;
  model: string;
  trainingDataSize: number;
  note?: string;
}

class JobDescriptionGenerator {
  private compiledPatterns: CompiledPatterns | null = null;
  private patternsPath: string;

  constructor() {
    // Get compiled patterns path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.patternsPath = path.join(__dirname, '../../data_sets/jd_compiled_patterns.json');
  }

  /**
   * Load compiled patterns from training
   */
  private loadCompiledPatterns(): void {
    if (this.compiledPatterns) {
      return; // Already loaded
    }

    try {
      console.log('📚 [JOB DESC GENERATOR] Loading compiled patterns...');
      
      if (!fs.existsSync(this.patternsPath)) {
        console.warn('⚠️ [JOB DESC GENERATOR] Compiled patterns not found, using fallback');
        return;
      }

      const patternsContent = fs.readFileSync(this.patternsPath, 'utf-8');
      this.compiledPatterns = JSON.parse(patternsContent);
      
      console.log(`✅ [JOB DESC GENERATOR] Loaded patterns from ${this.compiledPatterns?.datasetInfo?.trainingRecords?.toLocaleString() || 'N/A'} training records`);
      console.log(`   Quality Score: ${((this.compiledPatterns?.metrics?.avgQualityScore || 0) * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('❌ [JOB DESC GENERATOR] Error loading compiled patterns:', error);
      console.warn('⚠️ [JOB DESC GENERATOR] Falling back to default prompt');
    }
  }

  /**
   * Clean markdown formatting from text
   */
  private cleanMarkdown(text: string): string {
    if (!text) return text;
    
    return text
      // Remove bold (**text** or __text__) - global, handles inline formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic (*text* or _text_) - but not asterisks used for lists
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
      .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1')
      // Remove bullet points and list markers at start of lines
      .replace(/^\s*[\*\-\+]\s+/gm, '')
      // Remove numbered lists
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove any remaining standalone asterisks
      .replace(/\*\*/g, '')
      // Clean up extra whitespace
      .trim();
  }



  /**
   * Generate job description using compiled patterns from training
   */
  async generateJobDescription(request: JobDescriptionRequest): Promise<JobDescriptionResult> {
    this.loadCompiledPatterns();
    
    try {
      console.log('🎯 [JOB DESC GENERATOR] Generating job description for:', request.jobTitle);
      
      // Use compiled system prompt if available, otherwise use default
      const systemPrompt = this.compiledPatterns?.systemPrompt || this.getDefaultSystemPrompt();
      
      const userPrompt = `Generate a job description for:
Job Title: ${request.jobTitle}
${request.role ? `Role: ${request.role}` : ''}
${request.experience ? `Experience: ${request.experience}` : ''}
${request.location ? `Location: ${request.location}` : ''}
${request.workType ? `Work Type: ${request.workType}` : ''}
${request.companySize ? `Company Size: ${request.companySize}` : ''}
${request.skills && request.skills.length > 0 ? `Required Skills: ${request.skills.join(', ')}` : ''}
${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ''}

Generate a comprehensive job description following the training examples. Return ONLY valid JSON.`;

      const groqResponse = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 2000,
          auditContext: {
            serviceName: 'jobDescriptionGenerator',
            operationType: 'job_description_generation',
            userContext: {
              jobTitle: request.jobTitle,
              role: request.role,
              workType: request.workType,
              trainingDataSize: this.compiledPatterns?.datasetInfo?.trainingRecords || 0
            }
          }
        }
      );
      
      if (!groqResponse || !groqResponse.response) {
        throw new Error('No response from LLM');
      }

      const response = groqResponse.response;

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ [JOB DESC GENERATOR] No JSON found in response');
        return this.generateFallbackDescription(request);
      }

      const result: JobDescriptionResult = JSON.parse(jsonMatch[0]);
      
      console.log('📋 [JOB DESC GENERATOR] Raw LLM response parsed:', {
        hasDescription: !!result.description,
        responsibilitiesCount: result.responsibilities?.length || 0,
        skillsCount: result.skills?.length || 0,
        hasBenefits: !!result.benefits
      });
      
      // CRITICAL: Always ensure job title and role are set from request
      // The LLM training data doesn't include jobTitle/role in output - we use request values
      result.jobTitle = request.jobTitle;
      result.role = request.role || request.jobTitle;
      
      console.log('✅ [JOB DESC GENERATOR] Set job title and role:', {
        jobTitle: result.jobTitle,
        role: result.role
      });
      
      // Validate other fields
      if (!result.description) {
        result.description = `We are seeking a talented ${request.jobTitle} to join our team.`;
      }
      if (!result.responsibilities || result.responsibilities.length === 0) {
        result.responsibilities = [`Perform core duties related to ${request.jobTitle} role`];
      }
      if (!result.skills || result.skills.length === 0) {
        result.skills = request.skills || ['Relevant technical skills'];
      }
      if (!result.qualifications) {
        result.qualifications = request.experience || 'Bachelor\'s degree or equivalent experience';
      }
      if (!result.benefits || result.benefits.length === 0) {
        result.benefits = ['Competitive salary', 'Health insurance'];
      }
      if (!result.experience) {
        result.experience = request.experience || '2-5 years';
      }
      if (!result.workType) {
        result.workType = request.workType || 'Full-Time';
      }
      
      // Clean markdown formatting from all string fields
      result.jobTitle = this.cleanMarkdown(result.jobTitle);
      result.role = this.cleanMarkdown(result.role);
      result.description = this.cleanMarkdown(result.description);
      result.qualifications = this.cleanMarkdown(result.qualifications);
      result.experience = this.cleanMarkdown(result.experience || '');
      result.workType = this.cleanMarkdown(result.workType || '');
      
      // Salary range is not in training data - set to undefined or 'Competitive'
      result.salaryRange = undefined;
      
      // Clean arrays
      if (Array.isArray(result.responsibilities)) {
        result.responsibilities = result.responsibilities.map(r => this.cleanMarkdown(r));
      }
      if (Array.isArray(result.skills)) {
        result.skills = result.skills.map(s => this.cleanMarkdown(s));
      }
      if (Array.isArray(result.benefits)) {
        result.benefits = result.benefits.map(b => this.cleanMarkdown(b));
      }
      
      console.log('✅ [JOB DESC GENERATOR] Generated job description successfully');
      
      return result;
    } catch (error) {
      console.error('❌ [JOB DESC GENERATOR] Error:', error);
      return this.generateFallbackDescription(request);
    }
  }

  /**
   * Get default system prompt if compiled patterns not available
   */
  private getDefaultSystemPrompt(): string {
    return `You are an expert HR professional and job description writer. Generate comprehensive, professional job descriptions.

IMPORTANT GUIDELINES:
1. Write clear, engaging job descriptions that attract top talent
2. Include specific responsibilities and requirements
3. List technical skills and qualifications
4. Mention benefits and work arrangements
5. Use professional but approachable language
6. Be specific about experience requirements
7. Format output as valid JSON - NO MARKDOWN, NO ASTERISKS, NO BULLET POINTS

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting, asterisks (*), or bullet points.

OUTPUT FORMAT (return ONLY valid JSON):
{
  "jobTitle": "exact job title",
  "role": "role category",
  "description": "2-3 paragraph job description",
  "responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"],
  "skills": ["skill 1", "skill 2", "skill 3"],
  "qualifications": "education and certification requirements",
  "benefits": ["benefit 1", "benefit 2", "benefit 3"],
  "experience": "experience requirement",
  "workType": "Full-Time/Remote/Hybrid/Contract",
  "salaryRange": "salary range if applicable"
}`;
  }



  /**
   * Generate fallback description if LLM fails
   */
  private generateFallbackDescription(request: JobDescriptionRequest): JobDescriptionResult {
    return {
      jobTitle: request.jobTitle,
      role: request.role || request.jobTitle,
      description: `We are seeking a talented ${request.jobTitle} to join our team. This role offers an exciting opportunity to work on challenging projects and grow your career in a dynamic environment.`,
      responsibilities: [
        `Perform core duties related to ${request.jobTitle} role`,
        'Collaborate with cross-functional teams',
        'Contribute to project planning and execution',
        'Maintain high quality standards in all deliverables'
      ],
      skills: request.skills || ['Relevant technical skills', 'Problem-solving', 'Communication', 'Teamwork'],
      qualifications: request.experience || 'Bachelor\'s degree or equivalent experience',
      benefits: ['Competitive salary', 'Health insurance', 'Professional development', 'Flexible work arrangements'],
      experience: request.experience || '2-5 years',
      workType: request.workType || 'Full-Time',
      salaryRange: undefined // Not in training data
    };
  }
}

export const jobDescriptionGenerator = new JobDescriptionGenerator();
