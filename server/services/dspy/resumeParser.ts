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
  objective?: string;
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
    description?: string; // Complete job description text
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
    description?: string; // Complete detailed project description
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
      
      // Use the original default system prompt instead of compiled patterns
      const systemPrompt = this.getDefaultSystemPrompt();
      
      const userPrompt = `Parse this resume completely and extract ALL details. Fill every field with complete information from the resume.

MANDATORY REQUIREMENTS:
- Extract FULL job descriptions and responsibilities for each experience
- Extract COMPLETE project descriptions with all details
- Extract Certification names,certification organizations, certification links, dates in any format
- Generate career objective if it is not found
- Extract ALL skills, certifications, languages, achievements
- Extract Project start date and end date in any format
- Extract ALL project technologies and details
- Extract ALL project names, descriptions, and technologies
- Diferrentiate professional experience with project portfolios seperately
- Include ALL bullet points and paragraphs exactly as written
- Fill responsibilities array with every bullet point from each job
- Fill description field with complete job/project text
- Extract ALL skills, certifications, languages, achievements from resume
- Do NOT leave any field empty if information exists in resume

Resume text:
${resumeText}

Extract EVERYTHING and return ONLY complete JSON with full details.`;

      const groqResponse = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.3, // Lower for more consistent extraction
          maxTokens: 50000, // Increased for complete resumes with all sections
          model: 'llama-3.1-8b-instant', // Use versatile model for 12k token limit
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

      let response = groqResponse.response;
      console.log("Resonse from LLM:", response);
      console.log('🔍 [RESUME PARSER] Raw response length:', response.length);
      console.log('🔍 [RESUME PARSER] Raw response preview:', response.substring(0, 500));
      console.log('🔍 [RESUME PARSER] Raw response ending:', response.substring(Math.max(0, response.length - 200)));

      // Check if response was truncated
      if (!response.trim().endsWith('}') && !response.trim().endsWith(']}')) {
        console.warn('⚠️ [RESUME PARSER] Response appears truncated - increasing token limit and retrying...');
        
        // Retry with higher token limit
        const retryResponse = await groqService.generateResponse(
          systemPrompt,
          userPrompt,
          {
            temperature: 0.3,
            maxTokens: 50000, // Maximum for versatile model
            model: 'llama-3.1-8b-instant',
            auditContext: {
              serviceName: 'resumeParser',
              operationType: 'resume_parsing_retry',
              userContext: {
                resumeLength: resumeText.length,
                trainingDataSize: this.compiledPatterns?.datasetInfo?.trainingRecords || 0,
                retryReason: 'truncated_response'
              }
            }
          }
        );
        
        if (retryResponse && retryResponse.response) {
          const retryResponseText = retryResponse.response;
          console.log('🔄 [RESUME PARSER] Retry response length:', retryResponseText.length);
          console.log('🔄 [RESUME PARSER] Retry response ending:', retryResponseText.substring(Math.max(0, retryResponseText.length - 200)));
          
          // Use retry response if it's more complete
          if (retryResponseText.length > response.length) {
            console.log('✅ [RESUME PARSER] Using retry response (longer)');
            response = retryResponseText;
          }
        }
      }

      // Sanitize and extract JSON properly
      let jsonText = this.sanitizeJSON(response);
      console.log('🔍 [RESUME PARSER] Sanitized JSON length:', jsonText.length);
      console.log('🔍 [RESUME PARSER] Sanitized JSON preview:', jsonText.substring(0, 500));
      
      let result: ParsedResume;
      try {
        result = JSON.parse(jsonText);
        console.log('✅ [RESUME PARSER] JSON parsed successfully');
      } catch (parseError) {
        console.warn('⚠️ [RESUME PARSER] JSON parse failed, attempting repair...');
        console.log('🔍 [RESUME PARSER] Parse error:', parseError.message);
        console.log('🔍 [RESUME PARSER] Failed JSON:', jsonText.substring(0, 1000));
        
        // Try jsonrepair as fallback
        const { jsonrepair } = await import('jsonrepair');
        const repairedJSON = jsonrepair(jsonText);
        console.log('🔧 [RESUME PARSER] Repaired JSON preview:', repairedJSON.substring(0, 500));
        result = JSON.parse(repairedJSON);
        console.log('✅ [RESUME PARSER] JSON repaired and parsed successfully');
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
      
      // Post-process experience entries to ensure they have descriptions and responsibilities
      if (result.experience && result.experience.length > 0) {
        for (let i = 0; i < result.experience.length; i++) {
          const exp = result.experience[i];
          
          // If experience is missing description or responsibilities, try to extract from resume text
          if ((!exp.description || exp.description.trim() === '') && 
              (!exp.responsibilities || exp.responsibilities.length === 0)) {
            
            console.log(`🔍 [RESUME PARSER] Enhancing experience entry for ${exp.company}...`);
            
            // Try to find the experience section in the resume text
            const companyRegex = new RegExp(`${exp.company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n\\n|\\n[A-Z]|$)`, 'i');
            const experienceMatch = resumeText.match(companyRegex);
            
            if (experienceMatch) {
              const experienceText = experienceMatch[0];
              console.log(`📝 [RESUME PARSER] Found experience text for ${exp.company}:`, experienceText.substring(0, 200));
              
              // Extract bullet points as responsibilities
              const bulletPoints = experienceText.match(/[•·▪▫◦‣⁃]\s*(.+)/g) || 
                                 experienceText.match(/^\s*[-*]\s*(.+)/gm) || 
                                 experienceText.match(/^\s*\d+\.\s*(.+)/gm);
              
              if (bulletPoints && bulletPoints.length > 0) {
                exp.responsibilities = bulletPoints.map(point => 
                  point.replace(/^[•·▪▫◦‣⁃\-*\d+\.\s]+/, '').trim()
                );
                console.log(`✅ [RESUME PARSER] Extracted ${exp.responsibilities.length} responsibilities for ${exp.company}`);
              }
              
              // Use the full experience text as description
              exp.description = experienceText.trim();
              console.log(`✅ [RESUME PARSER] Added description for ${exp.company} (${exp.description.length} chars)`);
            }
          }
        }
      }
      
      // Post-process projects to ensure they have complete descriptions
      if (result.projects && result.projects.length > 0) {
        for (let i = 0; i < result.projects.length; i++) {
          const project = result.projects[i];
          
          // If project description is missing or too short, try to extract more details
          if (!project.description || project.description.length < 50) {
            console.log(`🔍 [RESUME PARSER] Enhancing project description for ${project.name}...`);
            
            // Try to find the project section in the resume text
            const projectRegex = new RegExp(`${project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n\\n|\\nProject|\\n[A-Z]|$)`, 'i');
            const projectMatch = resumeText.match(projectRegex);
            
            if (projectMatch) {
              const projectText = projectMatch[0];
              console.log(`📝 [RESUME PARSER] Found project text for ${project.name}:`, projectText.substring(0, 200));
              
              // Use the full project text as description
              project.description = projectText.trim();
              console.log(`✅ [RESUME PARSER] Enhanced description for ${project.name} (${project.description.length} chars)`);
            }
          }
        }
      }
      
      console.log('✅ [RESUME PARSER] Successfully parsed resume');
      console.log(`   Personal Info: ${result.personalInfo?.name || 'N/A'}`);
      console.log(`   Education: ${result.education?.length || 0} entries`);
      console.log(`   Experience: ${result.experience?.length || 0} entries`);
      console.log(`   Skills: ${result.skills?.length || 0} items`);
      console.log(`   Projects: ${result.projects?.length || 0} projects`);
      console.log(`   Certifications: ${result.certifications?.length || 0} certifications`);
      console.log(`   Skill Categories: ${Object.keys(result.skillCategories || {}).length} categories`);
      
      // Log detailed content for debugging
      if (result.skills && result.skills.length > 0) {
        console.log(`   Skills list: ${result.skills.slice(0, 10).join(', ')}${result.skills.length > 10 ? '...' : ''}`);
      }
      if (result.experience && result.experience.length > 0) {
        console.log(`   Experience companies: ${result.experience.map(e => e.company).join(', ')}`);
      }
      if (result.education && result.education.length > 0) {
        console.log(`   Education institutions: ${result.education.map(e => e.institution).join(', ')}`);
      }
      
      if (result.projects && result.projects.length > 0) {
        console.log(`📋 Project details: ${result.projects.map(p => `"${p.name}" (${(p.technologies || []).join(', ')})`).join(', ')}`);
      } else {
        console.log('⚠️ No projects found - attempting fallback extraction...');
        // Try fallback extraction if no projects found
        const fallbackProjects = this.extractProjectsFallback(resumeText);
        if (fallbackProjects.length > 0) {
          result.projects = fallbackProjects;
          console.log(`✅ Fallback extraction found ${fallbackProjects.length} projects: ${fallbackProjects.map(p => p.name).join(', ')}`);
        } else {
          console.log('⚠️ No projects found even with fallback extraction - check if resume has projects section');
        }
      }
      
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
    console.log('🔧 [SANITIZE] Original text length:', jsonText.length);
    console.log('🔧 [SANITIZE] Original text preview:', jsonText.substring(0, 200));
    
    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      console.log('🔧 [SANITIZE] Removed ```json markers');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
      console.log('🔧 [SANITIZE] Removed ``` markers');
    }

    // Find the main JSON object - look for personalInfo as a key indicator
    const personalInfoIndex = jsonText.indexOf('"personalInfo"');
    
    if (personalInfoIndex > 0) {
      // Work backwards to find the opening brace
      let braceIndex = personalInfoIndex;
      while (braceIndex > 0 && jsonText[braceIndex] !== '{') {
        braceIndex--;
      }
      
      if (braceIndex >= 0) {
        jsonText = jsonText.substring(braceIndex);
        console.log('🔧 [SANITIZE] Found personalInfo, extracted from position:', braceIndex);
      }
    } else {
      // Fallback: remove text before first {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace > 0) {
        jsonText = jsonText.substring(firstBrace);
        console.log('🔧 [SANITIZE] Used fallback, extracted from first brace at:', firstBrace);
      }
    }

    // Remove text after last }
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
      console.log('🔧 [SANITIZE] Trimmed after last brace at:', lastBrace);
    }

    console.log('🔧 [SANITIZE] Final text length:', jsonText.length);
    console.log('🔧 [SANITIZE] Final text preview:', jsonText.substring(0, 300));
    
    return jsonText.trim();
  }

  /**
   * Get optimized system prompt using training insights (4.1M+ records)
   * Optimizes compiled patterns to fit within 12k token limit for versatile model
   */
  private getOptimizedSystemPrompt(): string {
    if (!this.compiledPatterns) {
      return this.getDefaultSystemPrompt();
    }

    // Use the compiled system prompt from the training data
    const fullSystemPrompt = this.compiledPatterns.systemPrompt;
    
    if (!fullSystemPrompt) {
      console.warn('⚠️ [RESUME PARSER] No system prompt found in compiled patterns, using default');
      return this.getDefaultSystemPrompt();
    }

    console.log('✅ [RESUME PARSER] Optimizing compiled patterns for versatile model (12k token limit)');
    console.log(`📊 Training data: ${this.compiledPatterns.datasetInfo?.trainingRecords?.toLocaleString() || 'Unknown'} records`);
    console.log(`📏 Original prompt length: ${fullSystemPrompt.length} characters`);

    // Extract the core principles and instructions (before examples)
    const exampleStartIndex = fullSystemPrompt.indexOf('TRAINING EXAMPLES');
    if (exampleStartIndex === -1) {
      // No examples section found, check if it fits within 12k tokens (~48k chars)
      if (fullSystemPrompt.length <= 48000) {
        return fullSystemPrompt;
      }
      // If too long, truncate to fit
      return fullSystemPrompt.substring(0, 48000) + '\n\nCRITICAL: Return ONLY valid JSON. Extract ALL projects and skills completely.';
    }

    // Get the core principles part
    const corePrinciples = fullSystemPrompt.substring(0, exampleStartIndex).trim();
    
    // Extract examples section
    const examplesSection = fullSystemPrompt.substring(exampleStartIndex);
    const examples = examplesSection.split('---\n\n');
    
    // Start with core principles + examples header
    let optimizedPrompt = corePrinciples + '\n\n' + examples[0]; // Header "TRAINING EXAMPLES (from 4.1M+ resume records):"
    
    // Add examples one by one until we approach 12k token limit (~48k chars)
    const targetLength = 45000; // Leave some buffer for user prompt
    
    for (let i = 1; i < examples.length && i <= 6; i++) { // Limit to first 6 examples
      const nextExample = '\n\n---\n\n' + examples[i];
      if ((optimizedPrompt + nextExample).length > targetLength) {
        break;
      }
      optimizedPrompt += nextExample;
    }
    
    // Add output format instruction if not already present
    if (!optimizedPrompt.includes('OUTPUT FORMAT')) {
      optimizedPrompt += `

OUTPUT FORMAT (return ONLY valid JSON):
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "string",
  "objective": "string", 
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string"}],
  "experience": [{"title": "string", "company": "string", "startDate": "string", "endDate": "string", "location": "string", "responsibilities": ["string"]}],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{"name": "string", "description": "string", "technologies": ["string"], "url": "string"}],
  "languages": ["string"],
  "achievements": ["string"]
}

CRITICAL: Return ONLY valid JSON. Extract ALL projects and skills completely. Be thorough and accurate.`;
    }
    
    console.log(`📏 Optimized prompt length: ${optimizedPrompt.length} characters (fits in 12k token limit)`);
    console.log('🚀 Using versatile model with optimized compiled patterns');
    
    return optimizedPrompt;
  }

  /**
   * Get default system prompt if compiled patterns not available
   */
  private getDefaultSystemPrompt(): string {
    return `You are an expert resume parser trained on 4.1M+ resume records. Extract structured information from resumes accurately and comprehensively.

KEY PRINCIPLES:
1. Extract personal information (name, email, phone, linkedin, location)
2. Parse education history (degree, institution, dates, field of study) - include both startDate/endDate AND year fields
3. Extract work experience with COMPLETE details (title, company, dates, location, responsibilities, description)
4. Identify all skills (technical, soft skills, tools, technologies)
5. Find certifications and licenses
6. Extract ALL projects with FULL descriptions - do not limit quantity
7. Extract career objective/summary statements completely
8. Maintain data accuracy and completeness
9. Handle various resume formats and structures

EDUCATION EXTRACTION:
- Extract degree, institution, field of study, dates, and location
- Handle various date formats: "2020-2024", "Jan 2020 - Dec 2024", "2020 to 2024"
- Include both startDate/endDate AND year fields for consistency
- Extract location information when available
- Capture honors, GPA, or relevant coursework if mentioned

CAREER OBJECTIVE EXTRACTION:
- Look for sections: "Objective", "Career Objective", "Professional Objective", "Goal", "Summary", "Professional Summary"
- Extract the complete text, not just keywords
- If both objective and summary exist, capture both separately
- Common locations: top of resume, after personal info, in header sections

PROFESSIONAL EXPERIENCE EXTRACTION:
- Extract BOTH responsibilities (as array) AND description (as single text) for each role
- Include complete job descriptions, not just bullet points
- Capture all dates in multiple formats: "Jan 2020 - Dec 2022", "2020-2022", "January 2020 to Present"
- Parse dates into startDate and endDate fields (use "Present" or "Current" for ongoing roles)
- Extract full location information (city, state, country if available)
- Include all achievements and accomplishments mentioned

PROJECT EXTRACTION RULES:
- Look for sections: "Projects", "Portfolio", "Personal Projects", "Product", "Product Summary", "Key Projects", "Achievements", "Notable Work"
- Extract ALL projects mentioned - if you see 5 projects, return 5 entries
- Project indicators: "Project #1:", "Project:", "Product:", bullet points under project sections
- Include COMPLETE project descriptions, not summaries
- Extract project names, full descriptions, technologies used, and any links/URLs
- If project has no explicit name, use first few words of description as name
- Extract ALL technologies from project descriptions (JavaScript, React, Python, AWS, etc.)
- Include project duration/dates if mentioned
- Do NOT limit the number of projects - extract everything you find

DATE EXTRACTION RULES:
- Parse various date formats: "Jan 2020", "January 2020", "01/2020", "2020-01", "2020"
- For ranges: "Jan 2020 - Dec 2022", "2020-2022", "January 2020 to December 2022"
- Handle ongoing positions: "Jan 2020 - Present", "2020 - Current", "Jan 2020 - Now"
- Extract both education and experience dates accurately
- Maintain original format when possible, but ensure consistency

OUTPUT FORMAT (return ONLY valid JSON):
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "complete professional summary text",
  "objective": "complete career objective text",
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string", "startDate": "string", "endDate": "string"}],
  "experience": [{"title": "string", "company": "string", "startDate": "string", "endDate": "string", "location": "string", "responsibilities": ["detailed responsibility 1", "detailed responsibility 2"], "description": "complete job description text"}],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{"name": "string", "description": "complete detailed project description", "technologies": ["string"], "url": "string"}],
  "languages": ["string"],
  "achievements": ["string"]
}

CRITICAL REQUIREMENTS:
- Return ONLY valid JSON
- Extract COMPLETE text for objectives, descriptions, and project details
- Include ALL dates found in the resume
- Be thorough and accurate - extract everything, not just summaries
- Ensure all arrays contain complete, detailed information
- Do not truncate or summarize content - extract the full text as written`;
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
    
    // Try to extract projects from fallback
    const projects = this.extractProjectsFallback(resumeText);
    
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
      projects: projects
    };
  }

  /**
   * Fallback project extraction using regex patterns
   */
  private extractProjectsFallback(resumeText: string): any[] {
    const projects: any[] = [];
    const lines = resumeText.split('\n');
    
    // Look for project section headers
    const projectSectionRegex = /^(projects?|portfolio|personal projects?|key projects?|product|product summary|achievements?)[\s:]*$/i;
    let inProjectSection = false;
    let currentProject: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering a project section
      if (projectSectionRegex.test(line)) {
        inProjectSection = true;
        continue;
      }
      
      // Check if we're leaving project section (new major section)
      if (inProjectSection && /^(experience|education|skills|certifications?|languages?)[\s:]*$/i.test(line)) {
        inProjectSection = false;
        if (currentProject) {
          projects.push(currentProject);
          currentProject = null;
        }
        continue;
      }
      
      if (inProjectSection && line) {
        // Look for project indicators - enhanced patterns
        const projectIndicators = [
          /^project\s*#?\d*[\s:]+(.+)/i,
          /^product[\s:]+(.+)/i,
          /^•\s*(.+)/,
          /^-\s*(.+)/,
          /^\d+\.\s*(.+)/,
          /^\*\s*(.+)/,
          /^>\s*(.+)/,
          /^([A-Z][A-Za-z\s]+):\s*(.+)/  // "Project Name: Description" format
        ];
        
        let isNewProject = false;
        let projectName = '';
        let projectDescription = '';
        
        for (const regex of projectIndicators) {
          const match = line.match(regex);
          if (match) {
            isNewProject = true;
            if (match.length > 2) {
              // Format like "Project Name: Description"
              projectName = match[1].trim();
              projectDescription = match[2].trim();
            } else {
              projectName = match[1].trim();
              projectDescription = '';
            }
            break;
          }
        }
        
        if (isNewProject) {
          // Save previous project
          if (currentProject) {
            projects.push(currentProject);
          }
          
          // Start new project
          currentProject = {
            name: projectName,
            description: projectDescription,
            technologies: [],
            url: ''
          };
        } else if (currentProject && line) {
          // Add to current project description
          if (currentProject.description) {
            currentProject.description += ' ' + line;
          } else {
            currentProject.description = line;
          }
        }
        
        // Extract technologies from any project line
        if (currentProject) {
          const techMatches = line.match(/\b(JavaScript|TypeScript|React|Angular|Vue|Node\.js|Python|Java|C\+\+|C#|PHP|Ruby|Go|Rust|Swift|Kotlin|SQL|MongoDB|PostgreSQL|MySQL|Redis|AWS|Azure|GCP|Docker|Kubernetes|Git|HTML|CSS|SCSS|SASS|Bootstrap|Tailwind|Express|Django|Flask|Spring|Laravel|Rails|ASP\.NET|GraphQL|REST|API|JSON|XML|AJAX|jQuery|Webpack|Vite|Babel|ESLint|Jest|Mocha|Cypress|Selenium|Jenkins|GitLab|GitHub|Jira|Figma|Sketch|Photoshop|Illustrator)\b/gi);
          if (techMatches) {
            currentProject.technologies.push(...techMatches);
          }
          
          // Extract links
          const linkMatch = line.match(/(https?:\/\/[^\s]+)/);
          if (linkMatch) {
            currentProject.url = linkMatch[1];
          }
        }
      }
    }
    
    // Don't forget the last project
    if (currentProject) {
      projects.push(currentProject);
    }
    
    // Clean up projects and remove duplicates
    return projects.map(project => ({
      ...project,
      description: project.description.substring(0, 200), // Increased from 150
      technologies: [...new Set(project.technologies)] // Remove duplicates
    })).filter(project => project.name && project.name.length > 2); // Filter out invalid projects
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
