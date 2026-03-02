import { skillsExtractor } from './skillsExtractor.js';
import { educationExtractor } from './educationExtractor.js';
import { experienceExtractor } from './experienceExtractor.js';
import { projectsExtractor } from './projectsExtractor.js';
import { groqService } from '../groqService.js';
import { jsonrepair } from 'jsonrepair';

/**
 * Resume Extraction Orchestrator - Coordinates all extractors for optimal parsing
 */
export class ResumeExtractionOrchestrator {
  private initialized = false;

  /**
   * Initialize all extractors
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🚀 Initializing Resume Extraction Orchestrator...');
    
    await Promise.all([
      skillsExtractor.initialize(),
      educationExtractor.initialize(),
      experienceExtractor.initialize(),
      projectsExtractor.initialize()
    ]);

    this.initialized = true;
    console.log('✅ Resume Extraction Orchestrator ready');
  }

  /**
   * Generate comprehensive extraction prompt
   * Note: Personal info is extracted locally, so AI receives redacted text
   */
  private generateComprehensivePrompt(resumeText: string): string {
    return `Extract resume data as JSON. Return ONLY valid JSON, no text before/after.

CRITICAL: Extract ONLY information that exists in the resume text below. DO NOT use example data. DO NOT invent or hallucinate information.

PRIVACY NOTE: Personal information (name, email, phone) has been redacted for privacy. Focus on extracting:
- Professional summary/objective
- Skills and technologies
- Work experience (company, position, dates, achievements)
- Education (institution, degree, dates)
- Projects (name, description, technologies)
- Certifications and languages

SCHEMA:
{
  "personalInfo": {"fullName":"","email":"","phone":"","location":"","linkedin":"","github":"","website":""},
  "summary": "",
  "objective": "",
  "skills": [],
  "experience": [{"company":"","position":"","location":"","startDate":"","endDate":"","current":false,"description":"","achievements":[],"technologies":[]}],
  "education": [{"institution":"","degree":"","field":"","location":"","startDate":"","endDate":"","gpa":"","achievements":[]}],
  "projects": [{"name":"","description":"","technologies":[],"link":"","github":"","url":"","startDate":"","endDate":""}],
  "certifications": [{"name":"","issuer":"","date":"","expiryDate":""}],
  "languages": [{"language":"","proficiency":""}]
}

EXTRACTION RULES:
- Extract ALL sections completely from the resume text
- Use YYYY-MM for dates, "Present" for current positions
- Keep experience/project descriptions under 150 chars
- Return [] for missing arrays, "" for missing strings
- Start response with { and end with }
- Extract technologies from experience descriptions
- DO NOT include any information from the examples below
- DO NOT invent projects, skills, or experience that don't exist in the resume
- IGNORE redacted placeholders like [EMAIL_REDACTED], [PHONE_REDACTED], [NAME_REDACTED]
- Leave personalInfo fields empty (they will be filled separately)

SUMMARY GENERATION RULES:
- If a "Professional Summary" or "Career Objective" section exists, extract it as-is
- If NO summary exists in the resume, generate a professional 3-4 sentence summary based on:
  * Years of experience and seniority level
  * Key technical skills and expertise areas
  * Notable achievements or specializations
  * Career focus or professional identity
- Summary should be 50-100 words, professional tone
- Example: "Experienced Software Engineer with 5+ years developing scalable web applications using React, Node.js, and AWS. Proven track record of leading cross-functional teams and delivering high-impact features. Specialized in building microservices architectures and optimizing application performance."

FORMAT EXAMPLES (for reference only - DO NOT extract these):

Education format: {"institution":"University Name","degree":"Degree Type","field":"Field of Study","startDate":"YYYY","endDate":"YYYY","gpa":"X.X"}

Experience format: {"company":"Company Name","position":"Job Title","startDate":"YYYY-MM","endDate":"YYYY-MM or Present","current":true/false,"description":"Brief description","achievements":["Achievement 1"],"technologies":["Tech1","Tech2"]}

Project format: {"name":"Project Name","description":"Project description","technologies":["Tech1","Tech2"],"github":"github.com/user/repo"}

Skills format: ["Skill1","Skill2","Skill3"]

RESUME TEXT TO EXTRACT FROM:
${resumeText}

Return JSON only (extract from resume text above, not from examples):`;
  }

  /**
   * Parse resume with dataset-optimized extraction
   */
  async parseResume(resumeText: string): Promise<any> {
    await this.initialize();

    console.log('🤖 Parsing resume with dataset-optimized prompts...');

    try {
      const prompt = this.generateComprehensivePrompt(resumeText);
      
      const response = await groqService.generateResponse(
        'You are a resume parser. Extract information from resumes and return ONLY valid JSON with no additional text or explanations.',
        prompt,
        {
          temperature: 0.3,
          maxTokens: 4000,
          auditContext: {
            serviceName: 'resumeExtractionOrchestrator',
            operationType: 'resume_parsing',
            userContext: {
              resumeLength: resumeText.length
            }
          }
        }
      );

      if (!response.success || !response.response) {
        throw new Error('Groq AI failed to parse resume');
      }

      // Parse JSON
      let jsonText = response.response.trim();
      console.log('🔍 Raw Groq response (first 1000 chars):', jsonText.substring(0, 1000));
      console.log('🔍 Raw Groq response (last 500 chars):', jsonText.substring(Math.max(0, jsonText.length - 500)));
      
      // Check if response starts with explanatory text instead of JSON
      if (!jsonText.startsWith('{') && !jsonText.startsWith('[')) {
        console.warn('⚠️ Response does not start with JSON - attempting to extract...');
      }
      
      jsonText = this.sanitizeJSON(jsonText);
      console.log('🔍 Sanitized JSON (first 500 chars):', jsonText.substring(0, 500));

      let parsedData: any;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.warn('⚠️ First parse failed, attempting jsonrepair...');
        console.log('🔍 Parse error:', parseError.message);
        try {
          const repairedJSON = jsonrepair(jsonText);
          console.log('🔍 Repaired JSON (first 500 chars):', repairedJSON.substring(0, 500));
          parsedData = JSON.parse(repairedJSON);
        } catch (repairError) {
          console.error('❌ JSON repair failed:', repairError);
          console.log('🔧 Attempting aggressive JSON extraction...');
          
          // Aggressive fallback: try to extract JSON object manually
          parsedData = this.extractJSONFallback(jsonText);
          
          if (!parsedData) {
            console.error('❌ All JSON extraction attempts failed');
            console.log('📝 Problematic text (first 2000 chars):', jsonText.substring(0, 2000));
            throw new Error('Failed to parse resume: Invalid JSON response from AI. The AI may have returned explanatory text instead of pure JSON.');
          }
        }
      }

      console.log('🔍 Parsed data before enhancement:', {
        hasPersonalInfo: !!parsedData.personalInfo,
        personalInfoName: parsedData.personalInfo?.fullName,
        hasEducation: !!parsedData.education,
        educationCount: parsedData.education?.length || 0,
        educationData: parsedData.education,
        hasProjects: !!parsedData.projects,
        projectsCount: parsedData.projects?.length || 0,
        projectsData: parsedData.projects?.slice(0, 2), // First 2 projects
        hasExperience: !!parsedData.experience,
        experienceCount: parsedData.experience?.length || 0,
        hasSkills: !!parsedData.skills,
        skillsCount: parsedData.skills?.length || 0
      });

      // Validate and enhance with extractors
      parsedData = await this.enhanceExtractedData(parsedData);

      console.log('🔍 Parsed data after enhancement:', {
        hasEducation: !!parsedData.education,
        educationCount: parsedData.education?.length || 0,
        educationData: parsedData.education,
        hasProjects: !!parsedData.projects,
        projectsCount: parsedData.projects?.length || 0
      });

      console.log('✅ Resume parsed successfully with dataset optimization');
      
      return parsedData;

    } catch (error) {
      console.error('❌ Resume parsing failed:', error);
      throw error;
    }
  }

  /**
   * Enhance extracted data using validators
   */
  private async enhanceExtractedData(data: any): Promise<any> {
    // Validate and enhance skills
    if (data.skills && Array.isArray(data.skills)) {
      data.skills = skillsExtractor.validateSkills(data.skills);
    }

    // Validate and enhance education
    if (data.education && Array.isArray(data.education)) {
      data.education = educationExtractor.validateEducation(data.education);
    }

    // Validate and enhance experience
    if (data.experience && Array.isArray(data.experience)) {
      data.experience = experienceExtractor.validateExperience(data.experience);
      
      // Extract additional technologies from descriptions
      data.experience = data.experience.map((exp: any) => {
        if (exp.description) {
          exp.technologies = experienceExtractor.extractTechnologies(
            exp.description,
            exp.technologies || []
          );
        }
        return exp;
      });
    }

    // Validate and enhance projects
    if (data.projects && Array.isArray(data.projects)) {
      console.log('🔍 Projects BEFORE validation:', JSON.stringify(data.projects, null, 2));
      data.projects = projectsExtractor.validateProjects(data.projects);
      console.log('🔍 Projects AFTER validation:', JSON.stringify(data.projects, null, 2));
    }

    // FALLBACK: If no projects but has experience with technical work, create project entries
    if ((!data.projects || data.projects.length === 0) && data.experience && data.experience.length > 0) {
      console.log('⚠️ No projects found, attempting to extract from experience...');
      data.projects = this.extractProjectsFromExperience(data.experience);
      
      if (data.projects.length > 0) {
        console.log(`✅ Created ${data.projects.length} project(s) from experience`);
      }
    }

    // FALLBACK: If still no projects and has GitHub/portfolio in personal info, create entry
    if ((!data.projects || data.projects.length === 0) && data.personalInfo) {
      if (data.personalInfo.github || data.personalInfo.website) {
        console.log('⚠️ No projects found, creating entry from GitHub/portfolio link...');
        data.projects = [{
          name: 'Portfolio Projects',
          description: 'View my projects and contributions',
          technologies: [],
          link: data.personalInfo.github || data.personalInfo.website,
          github: data.personalInfo.github || ''
        }];
        console.log('✅ Created portfolio project entry');
      }
    }

    // Ensure all required fields exist with defaults
    // CRITICAL: Modify data object in place to preserve reference
    data.personalInfo = {
      fullName: data.personalInfo?.fullName || '',
      email: data.personalInfo?.email || '',
      phone: data.personalInfo?.phone || '',
      location: data.personalInfo?.location || '',
      linkedin: data.personalInfo?.linkedin || '',
      github: data.personalInfo?.github || '',
      website: data.personalInfo?.website || ''
    };
    data.summary = data.summary || '';
    data.objective = data.objective || '';
    data.skills = Array.isArray(data.skills) ? data.skills : [];
    data.experience = Array.isArray(data.experience) ? data.experience : [];
    data.education = Array.isArray(data.education) ? data.education : [];
    data.projects = Array.isArray(data.projects) ? data.projects : [];
    data.certifications = Array.isArray(data.certifications) ? data.certifications : [];
    data.languages = Array.isArray(data.languages) ? data.languages : [];
    
    // Return the same object reference (not a new object)
    return data;
  }

  /**
   * Extract projects from experience entries (fallback)
   */
  private extractProjectsFromExperience(experience: any[]): any[] {
    const projects: any[] = [];
    
    experience.forEach((exp: any) => {
      // Look for project-related keywords in description or achievements
      const description = (exp.description || '').toLowerCase();
      const achievements = (exp.achievements || []).join(' ').toLowerCase();
      const combinedText = description + ' ' + achievements;
      
      const projectKeywords = [
        'built', 'developed', 'created', 'designed', 'implemented',
        'project', 'application', 'system', 'platform', 'tool',
        'dashboard', 'website', 'app', 'api', 'service'
      ];
      
      const hasProjectKeywords = projectKeywords.some(keyword => 
        combinedText.includes(keyword)
      );
      
      if (hasProjectKeywords && exp.technologies && exp.technologies.length > 0) {
        // Create a project from this experience
        projects.push({
          name: `${exp.position} Project at ${exp.company}`,
          description: exp.description?.substring(0, 150) || 'Professional project',
          technologies: exp.technologies || [],
          link: '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || ''
        });
      }
    });
    
    return projects;
  }

  /**
   * Aggressive JSON extraction fallback
   */
  private extractJSONFallback(text: string): any | null {
    try {
      // Try to find the largest valid JSON object
      let bestMatch: any = null;
      let maxLength = 0;
      
      // Find all potential JSON objects
      const matches = text.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      
      for (const match of matches) {
        try {
          const obj = JSON.parse(match[0]);
          if (match[0].length > maxLength) {
            bestMatch = obj;
            maxLength = match[0].length;
          }
        } catch {
          // Skip invalid matches
        }
      }
      
      if (bestMatch) {
        console.log('✅ Extracted JSON object via fallback');
        return bestMatch;
      }
      
      // Last resort: return minimal structure
      console.warn('⚠️ Using minimal fallback structure');
      return {
        personalInfo: {
          fullName: '',
          email: '',
          phone: '',
          location: ''
        },
        skills: [],
        experience: [],
        education: [],
        projects: []
      };
    } catch (error) {
      console.error('❌ Fallback extraction failed:', error);
      return null;
    }
  }

  /**
   * Sanitize JSON text
   */
  private sanitizeJSON(jsonText: string): string {
    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Strategy 1: Look for the main JSON object structure with personalInfo
    // The response should have a root object with personalInfo, skills, etc.
    const personalInfoIndex = jsonText.indexOf('"personalInfo"');
    
    if (personalInfoIndex > 0) {
      // Work backwards to find the opening brace of the root object
      let braceIndex = personalInfoIndex;
      while (braceIndex > 0 && jsonText[braceIndex] !== '{') {
        braceIndex--;
      }
      
      if (braceIndex >= 0) {
        jsonText = jsonText.substring(braceIndex);
      }
    } else {
      // Strategy 2: Look for any of the main keys that should be in the root object
      const mainKeys = ['"skills"', '"experience"', '"education"', '"projects"', '"summary"', '"objective"'];
      let earliestIndex = -1;
      
      for (const key of mainKeys) {
        const keyIndex = jsonText.indexOf(key);
        if (keyIndex > 0 && (earliestIndex === -1 || keyIndex < earliestIndex)) {
          earliestIndex = keyIndex;
        }
      }
      
      if (earliestIndex > 0) {
        // Work backwards to find the opening brace
        let braceIndex = earliestIndex;
        while (braceIndex > 0 && jsonText[braceIndex] !== '{') {
          braceIndex--;
        }
        
        if (braceIndex >= 0) {
          jsonText = jsonText.substring(braceIndex);
        }
      } else {
        // Strategy 3: Fallback - Remove text before first {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace > 0) {
          console.warn('⚠️ Using fallback: removing text before first {');
          jsonText = jsonText.substring(firstBrace);
        }
      }
    }

    // Remove text after last }
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }

    return jsonText.trim();
  }
}

export const resumeExtractionOrchestrator = new ResumeExtractionOrchestrator();
