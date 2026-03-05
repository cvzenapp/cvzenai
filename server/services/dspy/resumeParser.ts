import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { groqService } from '../groqService.js';

/**
 * Resume Parser using DSPy-trained patterns
 * Trained on 4.1M+ resume records from 8 datasets
 * Replaces the old sample-based approach with production-grade parsing
 */

interface ParsedResume {
  personalInfo: {
    name: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    location?: string;
  };
  summary?: string;
  education: Array<{
    degree?: string;
    institution?: string;
    field?: string;
    year?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    responsibilities?: string[];
    description?: string;
  }>;
  skills: string[]; // Flat array for backward compatibility
  skillCategories?: {
    programmingLanguages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    cloudPlatforms?: string[];
    testing?: string[];
    other?: string[];
  };
  certifications?: string[];
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
  languages?: string[];
  achievements?: string[];
}

interface CompiledPatterns {
  systemPrompt: string;
  metrics: {
    avgQualityScore: number;
    trainSetSize: number;
    testSetSize: number;
  };
  datasetInfo: {
    totalRecords: number;
    trainingRecords: number;
    testRecords: number;
    sources: {
      people: number;
      abilities: number;
      education: number;
      experience: number;
      skills: number;
      completeResumes: number;
      skillsResumes: number;
    };
  };
  examples: number;
  trainedAt: string;
  model: string;
  trainingDataSize: number;
  note: string;
}

class ResumeParser {
  private compiledPatterns: CompiledPatterns | null = null;
  private patternsPath: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.patternsPath = path.join(__dirname, '../../data_sets/resume_parsing_compiled_patterns.json');
  }

  /**
   * Load compiled patterns from training (4.1M+ records)
   */
  private loadCompiledPatterns(): void {
    if (this.compiledPatterns) {
      return; // Already loaded
    }

    try {
      console.log('📚 [RESUME PARSER] Loading compiled patterns from 4.1M+ training records...');
      
      if (!fs.existsSync(this.patternsPath)) {
        console.warn('⚠️ [RESUME PARSER] Compiled patterns not found, using fallback');
        return;
      }

      const patternsContent = fs.readFileSync(this.patternsPath, 'utf-8');
      this.compiledPatterns = JSON.parse(patternsContent);
      
      console.log(`✅ [RESUME PARSER] Loaded patterns trained on ${this.compiledPatterns.datasetInfo?.trainingRecords?.toLocaleString() || 'N/A'} records`);
      console.log(`   Quality Score: ${((this.compiledPatterns.metrics?.avgQualityScore || 0) * 100).toFixed(1)}%`);
      console.log(`   Training Sources: ${Object.keys(this.compiledPatterns.datasetInfo?.sources || {}).length} datasets`);
    } catch (error) {
      console.error('❌ [RESUME PARSER] Error loading compiled patterns:', error);
      console.warn('⚠️ [RESUME PARSER] Falling back to default prompt');
    }
  }

  /**
   * Parse resume text using trained patterns
   */
  async parseResume(resumeText: string): Promise<ParsedResume> {
    this.loadCompiledPatterns();
    
    try {
      console.log('🎯 [RESUME PARSER] Parsing resume...');
      
      // CRITICAL: Don't use the full compiled system prompt (too large - causes 413 error)
      // Instead, use an optimized prompt that references the training
      const systemPrompt = this.getOptimizedSystemPrompt();
      
      const userPrompt = `Parse this resume and extract all information:\n\n${resumeText}\n\nReturn ONLY valid JSON.`;

      const groqResponse = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.3, // Lower for more consistent extraction
          maxTokens: 4000, // Increased for complete resumes
          auditContext: {
            serviceName: 'resumeParser',
            operationType: 'resume_parsing',
            userContext: {
              resumeLength: resumeText.length,
              trainingDataSize: this.compiledPatterns?.datasetInfo?.trainingRecords || 0
            }
          }
        }
      );
      
      if (!groqResponse || !groqResponse.response) {
        throw new Error('No response from LLM');
      }

      const response = groqResponse.response;
      console.log('🔍 [RESUME PARSER] Raw response length:', response.length);

      // Sanitize and extract JSON properly
      let jsonText = this.sanitizeJSON(response);
      console.log('🔍 [RESUME PARSER] Sanitized JSON length:', jsonText.length);
      
      let result: ParsedResume;
      try {
        result = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn('⚠️ [RESUME PARSER] JSON parse failed, attempting repair...');
        // Try jsonrepair as fallback
        const { jsonrepair } = await import('jsonrepair');
        const repairedJSON = jsonrepair(jsonText);
        result = JSON.parse(repairedJSON);
      }
      
      // Validate and ensure required fields
      if (!result.personalInfo || !result.personalInfo.name) {
        // Try to extract name from resume text
        const nameMatch = resumeText.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/m);
        if (nameMatch) {
          result.personalInfo = result.personalInfo || { name: '' };
          result.personalInfo.name = nameMatch[1];
        } else {
          result.personalInfo = result.personalInfo || { name: '' };
          result.personalInfo.name = 'Name not found';
        }
      }
      
      // Ensure arrays exist
      result.education = result.education || [];
      result.experience = result.experience || [];
      result.skills = result.skills || [];
      result.certifications = result.certifications || [];
      result.projects = result.projects || [];
      
      // Categorize skills if not already categorized
      if (!result.skillCategories && result.skills.length > 0) {
        result.skillCategories = this.categorizeSkills(result.skills);
      }
      
      console.log('✅ [RESUME PARSER] Successfully parsed resume');
      console.log(`   Personal Info: ${result.personalInfo.name}`);
      console.log(`   Education: ${result.education.length} entries`);
      console.log(`   Experience: ${result.experience.length} entries`);
      console.log(`   Skills: ${result.skills.length} items`);
      console.log(`   Skill Categories: ${Object.keys(result.skillCategories || {}).length} categories`);
      
      return result;
    } catch (error) {
      console.error('❌ [RESUME PARSER] Error:', error);
      return this.generateFallbackParsing(resumeText);
    }
  }

  /**
   * Sanitize JSON text - remove markdown, extract JSON object
   */
  private sanitizeJSON(jsonText: string): string {
    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Find the main JSON object
    const personalInfoIndex = jsonText.indexOf('"personalInfo"');
    
    if (personalInfoIndex > 0) {
      // Work backwards to find the opening brace
      let braceIndex = personalInfoIndex;
      while (braceIndex > 0 && jsonText[braceIndex] !== '{') {
        braceIndex--;
      }
      
      if (braceIndex >= 0) {
        jsonText = jsonText.substring(braceIndex);
      }
    } else {
      // Fallback: remove text before first {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace > 0) {
        jsonText = jsonText.substring(firstBrace);
      }
    }

    // Remove text after last }
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }

    return jsonText.trim();
  }

  /**
   * Get optimized system prompt using training insights (4.1M+ records)
   * Uses condensed patterns from training without full 25 examples to avoid 413 error
   */
  private getOptimizedSystemPrompt(): string {
    if (!this.compiledPatterns) {
      return this.getDefaultSystemPrompt();
    }

    // Extract key insights from training without including all examples
    const trainingRecords = this.compiledPatterns.datasetInfo?.trainingRecords?.toLocaleString() || '4.1M+';
    const qualityScore = ((this.compiledPatterns.metrics?.avgQualityScore || 0) * 100).toFixed(0);
    
    // Extract pattern insights from the full system prompt (first 2000 chars contain the core rules)
    const fullPrompt = this.compiledPatterns.systemPrompt || '';
    const keyPrinciples = fullPrompt.substring(0, 2000); // Get the KEY PRINCIPLES section
    
    return `You are an expert resume parser trained on ${trainingRecords} resume records (${qualityScore}% quality score).

${keyPrinciples}

CRITICAL: Extract ALL information thoroughly. Handle various resume formats. Return ONLY valid JSON.

OUTPUT FORMAT:
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "string",
  "objective": "string",
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string", "startDate": "string", "endDate": "string"}],
  "experience": [{"title": "string", "company": "string", "startDate": "string", "endDate": "string", "location": "string", "responsibilities": ["string"], "description": "string"}],
  "skills": ["individual skill name", "another skill", "separate skill"],
  "certifications": ["string"],
  "projects": [{"name": "string", "description": "string", "technologies": ["string"], "url": "string"}],
  "languages": ["string"],
  "achievements": ["string"]
}

IMPORTANT: 
- For skills, extract each skill as a separate item in the array. Do NOT group skills together with commas. Each skill should be its own array element.
- If no career objective is found in the resume, generate a professional one based on the person's experience and skills.
Example: ["JavaScript", "React", "Node.js", "Python", "Django"] NOT ["JavaScript, React, Node.js", "Python, Django"]`;
  }

  /**
   * Get default system prompt if compiled patterns not available
   */
  private getDefaultSystemPrompt(): string {
    return `You are an expert resume parser trained on 4.1M+ resume records. Extract structured information from resumes accurately and comprehensively.

KEY PRINCIPLES:
1. Extract personal information (name, email, phone, linkedin, location)
2. Parse education history (degree, institution, dates, field of study)
3. Extract work experience (title, company, dates, location, responsibilities)
4. Identify all skills (technical, soft skills, tools, technologies)
5. Find certifications and licenses
6. Extract projects and achievements
7. Maintain data accuracy and completeness
8. Handle various resume formats and structures

OUTPUT FORMAT (return ONLY valid JSON):
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "string",
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string"}],
  "experience": [{"title": "string", "company": "string", "startDate": "string", "endDate": "string", "location": "string", "responsibilities": ["string"]}],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{"name": "string", "description": "string", "technologies": ["string"]}],
  "languages": ["string"],
  "achievements": ["string"]
}

CRITICAL: Return ONLY valid JSON. Be thorough and accurate.`;
  }

  /**
   * Categorize skills into different categories
   */
  private categorizeSkills(skills: string[]): {
    programmingLanguages?: string[];
    frameworks?: string[];
    databases?: string[];
    tools?: string[];
    cloudPlatforms?: string[];
    testing?: string[];
    other?: string[];
  } {
    const categories = {
      programmingLanguages: [] as string[],
      frameworks: [] as string[],
      databases: [] as string[],
      tools: [] as string[],
      cloudPlatforms: [] as string[],
      testing: [] as string[],
      other: [] as string[]
    };

    const patterns = {
      programmingLanguages: /^(python|javascript|typescript|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab|perl|shell|bash)$/i,
      frameworks: /^(react|angular|vue|next\.js|nuxt|express|django|flask|spring|laravel|rails|asp\.net|fastapi|nest\.js|svelte)$/i,
      databases: /^(mysql|postgresql|mongodb|redis|elasticsearch|cassandra|dynamodb|oracle|sql server|sqlite|mariadb|neo4j|couchdb)$/i,
      tools: /^(git|docker|kubernetes|jenkins|gitlab|github|jira|confluence|postman|swagger|webpack|vite|npm|yarn|maven|gradle)$/i,
      cloudPlatforms: /^(aws|azure|gcp|google cloud|heroku|digitalocean|vercel|netlify|cloudflare)$/i,
      testing: /^(jest|mocha|chai|pytest|junit|selenium|cypress|playwright|jasmine|karma|testng|cucumber)$/i
    };

    skills.forEach(skill => {
      const skillLower = skill.trim().toLowerCase();
      let categorized = false;

      for (const [category, pattern] of Object.entries(patterns)) {
        if (pattern.test(skillLower)) {
          categories[category as keyof typeof categories].push(skill);
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        categories.other.push(skill);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key as keyof typeof categories].length === 0) {
        delete categories[key as keyof typeof categories];
      }
    });

    return categories;
  }

  /**
   * Generate fallback parsing if LLM fails
   */
  private generateFallbackParsing(resumeText: string): ParsedResume {
    console.log('⚠️ [RESUME PARSER] Using fallback parsing');
    
    // Basic extraction using regex
    const nameMatch = resumeText.match(/^([A-Z][a-z]+\s+[A-Z][a-z]+)/m);
    const emailMatch = resumeText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    
    // Extract skills (common tech keywords)
    const techKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Kubernetes'];
    const skills = techKeywords.filter(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(resumeText)
    );
    
    return {
      personalInfo: {
        name: nameMatch ? nameMatch[1] : 'Name not found',
        email: emailMatch ? emailMatch[1] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined
      },
      education: [],
      experience: [],
      skills: skills,
      certifications: [],
      projects: []
    };
  }

  /**
   * Parse multiple resumes in batch
   */
  async parseResumes(resumeTexts: string[]): Promise<ParsedResume[]> {
    console.log(`📦 [RESUME PARSER] Batch parsing ${resumeTexts.length} resumes...`);
    
    const results: ParsedResume[] = [];
    
    for (let i = 0; i < resumeTexts.length; i++) {
      console.log(`   Processing ${i + 1}/${resumeTexts.length}...`);
      const result = await this.parseResume(resumeTexts[i]);
      results.push(result);
    }
    
    console.log(`✅ [RESUME PARSER] Batch parsing complete`);
    return results;
  }
}

export const resumeParser = new ResumeParser();
export type { ParsedResume };
