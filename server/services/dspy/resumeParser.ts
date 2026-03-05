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
      const systemPrompt = `You are an expert resume parser trained on 4.1M+ resume records. Extract ALL information accurately.

🚨 CRITICAL REQUIREMENTS 🚨
1. DISTINGUISH between Professional Experience (jobs at companies) and Projects (personal/academic work)
2. Extract COMPLETE job titles for every experience entry
3. Extract COMPLETE job descriptions and responsibilities
4. Extract career objectives and professional summaries when present
5. Never leave title fields empty
6. Separate projects from work experience correctly

CAREER OBJECTIVE & SUMMARY EXTRACTION:
- Look for sections: "Objective", "Career Objective", "Professional Objective", "Goal", "Aim"
- Look for sections: "Summary", "Professional Summary", "Profile", "About", "Overview"
- Extract the COMPLETE text from these sections, not just the first sentence
- Objectives often start with phrases like "To obtain", "Seeking", "Looking for", "Aspiring to"
- Summaries describe current experience and skills

PROFESSIONAL EXPERIENCE vs PROJECTS:
- EXPERIENCE: Jobs at companies with titles like "Software Engineer at Google", "Manager - Microsoft"
- PROJECTS: Personal work, academic projects, portfolio items like "Built a chatbot", "Developed an app"
- If it says "Engineered", "Built", "Developed", "Created" without a company context, it's likely a PROJECT
- If it mentions a company name with employment dates, it's EXPERIENCE
- Projects often have technology stacks mentioned (React, TensorFlow, etc.)

EXPERIENCE EXTRACTION RULES:
- For each job, extract: title, company, dates, location, description, responsibilities
- Look for employment patterns: "Software Engineer at Google", "Manager - Microsoft", "Developer, Amazon"
- Extract the complete job description paragraph AND all bullet points
- Include achievements, metrics, and quantifiable results
- NEVER leave job titles empty - if unclear, infer from context
- DO NOT include personal projects in experience section

PROJECT EXTRACTION RULES:
- Look for sections: "Projects", "Portfolio", "Personal Projects", "Academic Projects"
- Extract items that describe building/creating something: "Built X", "Developed Y", "Created Z"
- Include complete project descriptions and all technologies used
- Projects typically don't have company names (unless it's a company project)
- Extract project URLs, GitHub links, demo links

OUTPUT FORMAT (return ONLY valid JSON):
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "COMPLETE professional summary text if present",
  "objective": "COMPLETE career objective text if present",
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string"}],
  "experience": [{"title": "REQUIRED job title at company", "company": "company name", "startDate": "string", "endDate": "string", "location": "string", "description": "complete job description", "responsibilities": ["responsibility 1", "responsibility 2"]}],
  "skills": ["skill1", "skill2"],
  "certifications": ["cert1"],
  "projects": [{"name": "project name", "description": "complete project description with technologies", "technologies": ["tech1", "tech2"], "url": "string"}],
  "languages": ["lang1"],
  "achievements": ["achievement1"]
}

CRITICAL: Return ONLY valid JSON. Extract complete objective and summary sections. Separate projects from work experience correctly. Every experience entry MUST have a company and job title.`;
      
      const userPrompt = `Parse this resume and extract all information:\n\n${resumeText}\n\nReturn ONLY valid JSON.`;

      const groqResponse = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.3, // Lower for more consistent extraction
          maxTokens: 6000, // Increased for complete content extraction
          model: 'llama-3.3-70b-versatile', // Use versatile model for 12k token limit
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
      console.log('🔍 [RESUME PARSER] Raw response preview:', response.substring(0, 500));

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
      
      // If we got very little data, this might indicate parsing failure
      const totalItems = (result.skills?.length || 0) + (result.experience?.length || 0) + 
                        (result.education?.length || 0) + (result.projects?.length || 0);
      
      if (totalItems === 0) {
        console.warn('⚠️ [RESUME PARSER] AI parsing returned no data - this indicates parsing failure');
        console.log('🔄 [RESUME PARSER] Falling back to regex-based extraction');
        
        // Use fallback parsing for everything
        const fallbackResult = this.generateFallbackParsing(resumeText);
        
        // Merge AI personal info (which worked) with fallback data
        result.skills = fallbackResult.skills || [];
        result.experience = fallbackResult.experience || [];
        result.education = fallbackResult.education || [];
        result.projects = fallbackResult.projects || [];
        result.certifications = fallbackResult.certifications || [];
        
        console.log('🔄 [RESUME PARSER] Fallback extraction completed:', {
          skills: result.skills.length,
          experience: result.experience.length,
          education: result.education.length,
          projects: result.projects.length
        });
      }
      
      // Validate and fix experience entries with missing titles
      if (result.experience && result.experience.length > 0) {
        const validExperience: any[] = [];
        const misclassifiedProjects: any[] = [];
        
        result.experience.forEach((exp, index) => {
          // Check if this is actually a project misclassified as experience
          const isProject = this.isProjectMisclassifiedAsExperience(exp);
          
          if (isProject) {
            console.warn(`⚠️ [RESUME PARSER] Experience entry ${index + 1} appears to be a project, moving to projects section`);
            
            // Convert experience entry to project format
            const project = {
              name: exp.title || exp.company || 'Unnamed Project',
              description: exp.description || (exp.responsibilities || []).join('. '),
              technologies: this.extractTechnologiesFromText(exp.description || ''),
              url: ''
            };
            misclassifiedProjects.push(project);
            console.log(`✅ [RESUME PARSER] Moved "${project.name}" to projects section`);
          } else {
            // This is a valid experience entry, but check for missing title
            if (!exp.title || exp.title.trim() === '') {
              console.warn(`⚠️ [RESUME PARSER] Experience entry ${index + 1} missing title, attempting to extract from description`);
              
              // Try to extract title from description or responsibilities
              let extractedTitle = 'Position';
              if (exp.description) {
                const titleMatch = exp.description.match(/^([A-Z][A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist|Coordinator|Director|Lead|Senior|Junior))/);
                if (titleMatch) {
                  extractedTitle = titleMatch[1].trim();
                }
              } else if (exp.responsibilities && exp.responsibilities.length > 0) {
                // Look for action verbs that might indicate the role
                const firstResp = exp.responsibilities[0];
                if (firstResp.includes('develop') || firstResp.includes('code')) {
                  extractedTitle = 'Software Developer';
                } else if (firstResp.includes('manage') || firstResp.includes('lead')) {
                  extractedTitle = 'Manager';
                } else if (firstResp.includes('design') || firstResp.includes('architect')) {
                  extractedTitle = 'Designer';
                }
              }
              
              exp.title = extractedTitle;
              console.log(`✅ [RESUME PARSER] Fixed missing title for ${exp.company}: ${extractedTitle}`);
            }
            validExperience.push(exp);
          }
        });
        
        result.experience = validExperience;
        
        // Add misclassified projects to projects array
        if (misclassifiedProjects.length > 0) {
          result.projects = (result.projects || []).concat(misclassifiedProjects);
          console.log(`✅ [RESUME PARSER] Moved ${misclassifiedProjects.length} misclassified items from experience to projects`);
        }
      }
      
      // Categorize skills if not already categorized
      if (!result.skillCategories && result.skills.length > 0) {
        result.skillCategories = this.categorizeSkills(result.skills);
      }
      
      // Generate career objective if not present
      if (!result.objective || result.objective.trim() === '') {
        console.log('🎯 [RESUME PARSER] No career objective found, generating one based on profile...');
        result.objective = await this.generateCareerObjective(result);
        console.log(`✅ [RESUME PARSER] Generated career objective: ${result.objective.substring(0, 100)}...`);
      }
      
      // Generate professional summary if not present
      if (!result.summary || result.summary.trim() === '') {
        console.log('📝 [RESUME PARSER] No professional summary found, generating one based on profile...');
        result.summary = await this.generateProfessionalSummary(result);
        console.log(`✅ [RESUME PARSER] Generated professional summary: ${result.summary.substring(0, 100)}...`);
      }
      
      console.log('✅ [RESUME PARSER] Successfully parsed resume');
      console.log(`   Personal Info: ${result.personalInfo?.name || 'N/A'}`);
      console.log(`   Summary: ${result.summary ? 'Found (' + result.summary.substring(0, 50) + '...)' : 'Not found'}`);
      console.log(`   Objective: ${result.objective ? 'Found (' + result.objective.substring(0, 50) + '...)' : 'Not found'}`);
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
        console.log(`   Experience titles: ${result.experience.map(e => e.title || 'MISSING_TITLE').join(', ')}`);
        console.log(`   Experience descriptions: ${result.experience.map(e => (e.description || '').substring(0, 50) + '...').join(' | ')}`);
        console.log(`   Experience responsibilities: ${result.experience.map(e => (e.responsibilities || []).length).join(', ')} items each`);
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

CRITICAL EXTRACTION RULES:
- Extract COMPLETE descriptions, not just titles or one-liners
- For projects: Include full project descriptions, all technologies, complete details
- For experience: Extract complete job descriptions AND all responsibilities/bullet points
- For summaries/objectives: Extract the ENTIRE paragraph/section, not just first sentence
- For education: Include complete degree information, achievements, coursework if mentioned
- DO NOT truncate or summarize content - extract everything as written
- Preserve all bullet points, achievements, and detailed information
- For each job: Extract both paragraph descriptions AND bullet point responsibilities

OUTPUT FORMAT (return ONLY valid JSON):
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "COMPLETE professional summary paragraph(s) - extract everything",
  "objective": "COMPLETE career objective paragraph(s) - extract everything", 
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string"}],
  "experience": [{"title": "string", "company": "string", "startDate": "string", "endDate": "string", "location": "string", "responsibilities": ["COMPLETE responsibility descriptions - extract all bullet points"]}],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{"name": "string", "description": "COMPLETE project description - extract everything, not just title", "technologies": ["string"], "url": "string"}],
  "languages": ["string"],
  "achievements": ["string"]
}

CRITICAL: Return ONLY valid JSON. Extract ALL content completely - no truncation, no summarization. Be thorough and extract every detail.`;
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
2. Parse education history (degree, institution, dates, field of study)
3. Extract work experience (title, company, dates, location, responsibilities)
4. Identify all skills (technical, soft skills, tools, technologies)
5. Find certifications and licenses
6. Extract ALL projects and achievements - do not limit quantity
7. Maintain data accuracy and completeness
8. Handle various resume formats and structures

CRITICAL CONTENT EXTRACTION RULES:
- Extract COMPLETE text content, not summaries or truncated versions
- For professional summaries: Extract the ENTIRE summary section word-for-word
- For career objectives: Extract the COMPLETE objective statement
- For project descriptions: Extract FULL project details, not just titles
- For job responsibilities: Extract ALL bullet points and complete descriptions
- For achievements: Extract complete achievement statements
- DO NOT truncate, summarize, or shorten any content
- Preserve all formatting, bullet points, and detailed information

PROJECT EXTRACTION RULES:
- Look for sections: "Projects", "Portfolio", "Personal Projects", "Product", "Product Summary", "Key Projects", "Achievements"
- Extract ALL projects mentioned - if you see 5 projects, return 5 entries
- Project indicators: "Project #1:", "Project:", "Product:", bullet points under project sections
- Include COMPLETE project descriptions, all technologies used, and any links
- If project has no explicit name, use first few words of description as name
- Extract technologies from project descriptions (JavaScript, React, Python, etc.)
- Do NOT limit the number of projects - extract everything you find
- Extract FULL project descriptions, not just one-line summaries

EXPERIENCE EXTRACTION RULES:
- Extract COMPLETE job descriptions and ALL responsibility bullet points
- Include all achievements, metrics, and detailed accomplishments
- Do not truncate job descriptions or responsibilities
- Extract everything under each job position
- Look for both paragraph descriptions AND bullet point responsibilities
- Extract job summaries, key accomplishments, and detailed role descriptions
- Include quantifiable results, metrics, and specific achievements
- Capture both "description" (paragraph format) and "responsibilities" (bullet points)

OUTPUT FORMAT (return ONLY valid JSON):
{
  "personalInfo": {"name": "string", "email": "string", "phone": "string", "linkedin": "string", "location": "string"},
  "summary": "COMPLETE professional summary - extract entire section",
  "objective": "COMPLETE career objective - extract entire section",
  "education": [{"degree": "string", "institution": "string", "field": "string", "year": "string", "location": "string"}],
  "experience": [{"title": "string", "company": "string", "startDate": "string", "endDate": "string", "location": "string", "responsibilities": ["COMPLETE descriptions - all bullet points"], "description": "COMPLETE job description paragraph if present"}],
  "skills": ["string"],
  "certifications": ["string"],
  "projects": [{"name": "string", "description": "COMPLETE project description - full details", "technologies": ["string"], "url": "string"}],
  "languages": ["string"],
  "achievements": ["string"]
}

CRITICAL: Return ONLY valid JSON. Extract ALL content completely without truncation. Be thorough and extract every detail as written in the resume.`;
  }

  /**
   * Generate career objective based on resume content
   */
  private async generateCareerObjective(parsedResume: ParsedResume): Promise<string> {
    try {
      // Build context from parsed resume
      const context = this.buildResumeContext(parsedResume);
      
      const systemPrompt = `You are a professional career counselor. Generate a compelling career objective statement based on the provided resume information.

REQUIREMENTS:
- Write in first person ("To leverage", "Seeking to", "Aspiring to")
- Keep it concise (2-3 sentences, 50-80 words)
- Focus on career goals and value proposition
- Mention relevant skills and experience level
- Be specific to the person's background
- Sound professional and confident

AVOID:
- Generic statements
- Overly long objectives
- Mentioning specific company names
- Using clichés like "dynamic professional"`;

      const userPrompt = `Generate a career objective for this professional:

${context}

Return only the career objective statement, no additional text.`;

      const response = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 150,
          model: 'llama-3.3-70b-versatile',
          auditContext: {
            serviceName: 'resumeParser',
            operationType: 'objective_generation'
          }
        }
      );

      return response.response.trim();
    } catch (error) {
      console.error('❌ [RESUME PARSER] Failed to generate career objective:', error);
      return this.getDefaultCareerObjective(parsedResume);
    }
  }

  /**
   * Generate professional summary based on resume content
   */
  private async generateProfessionalSummary(parsedResume: ParsedResume): Promise<string> {
    try {
      // Build context from parsed resume
      const context = this.buildResumeContext(parsedResume);
      
      const systemPrompt = `You are a professional resume writer. Generate a compelling professional summary based on the provided resume information.

REQUIREMENTS:
- Write in third person or first person
- Keep it concise (3-4 sentences, 80-120 words)
- Highlight key skills, experience, and achievements
- Show years of experience if determinable
- Mention key technologies/skills
- Sound professional and impactful

AVOID:
- Generic statements
- Overly long summaries
- Repetitive information
- Weak language`;

      const userPrompt = `Generate a professional summary for this professional:

${context}

Return only the professional summary, no additional text.`;

      const response = await groqService.generateResponse(
        systemPrompt,
        userPrompt,
        {
          temperature: 0.7,
          maxTokens: 200,
          model: 'llama-3.3-70b-versatile',
          auditContext: {
            serviceName: 'resumeParser',
            operationType: 'summary_generation'
          }
        }
      );

      return response.response.trim();
    } catch (error) {
      console.error('❌ [RESUME PARSER] Failed to generate professional summary:', error);
      return this.getDefaultProfessionalSummary(parsedResume);
    }
  }

  /**
   * Build context string from parsed resume for AI generation
   */
  private buildResumeContext(parsedResume: ParsedResume): string {
    const context: string[] = [];
    
    // Personal info
    if (parsedResume.personalInfo?.name) {
      context.push(`Name: ${parsedResume.personalInfo.name}`);
    }
    
    // Skills
    if (parsedResume.skills && parsedResume.skills.length > 0) {
      context.push(`Key Skills: ${parsedResume.skills.slice(0, 10).join(', ')}`);
    }
    
    // Experience
    if (parsedResume.experience && parsedResume.experience.length > 0) {
      context.push(`\nRecent Experience:`);
      parsedResume.experience.slice(0, 3).forEach((exp, index) => {
        context.push(`${index + 1}. ${exp.title} at ${exp.company} (${exp.startDate || 'N/A'} - ${exp.endDate || 'Present'})`);
        if (exp.description) {
          context.push(`   ${exp.description.substring(0, 100)}...`);
        }
      });
    }
    
    // Education
    if (parsedResume.education && parsedResume.education.length > 0) {
      context.push(`\nEducation:`);
      parsedResume.education.slice(0, 2).forEach((edu, index) => {
        context.push(`${index + 1}. ${edu.degree} in ${edu.field} from ${edu.institution} (${edu.year || 'N/A'})`);
      });
    }
    
    // Projects
    if (parsedResume.projects && parsedResume.projects.length > 0) {
      context.push(`\nKey Projects:`);
      parsedResume.projects.slice(0, 3).forEach((proj, index) => {
        context.push(`${index + 1}. ${proj.name}: ${(proj.description || '').substring(0, 80)}...`);
      });
    }
    
    return context.join('\n');
  }

  /**
   * Get default career objective if AI generation fails
   */
  private getDefaultCareerObjective(parsedResume: ParsedResume): string {
    const skills = parsedResume.skills?.slice(0, 3).join(', ') || 'relevant technologies';
    const hasExperience = parsedResume.experience && parsedResume.experience.length > 0;
    
    if (hasExperience) {
      const latestJob = parsedResume.experience[0];
      return `To leverage my experience in ${latestJob.title || 'technology'} and expertise in ${skills} to contribute to innovative projects and drive organizational success in a challenging professional environment.`;
    } else {
      return `To obtain a challenging position where I can utilize my skills in ${skills} and contribute to meaningful projects while continuing to grow professionally and make a positive impact.`;
    }
  }

  /**
   * Get default professional summary if AI generation fails
   */
  private getDefaultProfessionalSummary(parsedResume: ParsedResume): string {
    const skills = parsedResume.skills?.slice(0, 5).join(', ') || 'various technologies';
    const hasExperience = parsedResume.experience && parsedResume.experience.length > 0;
    
    if (hasExperience) {
      const experienceYears = parsedResume.experience.length > 2 ? 'experienced' : 'skilled';
      const latestJob = parsedResume.experience[0];
      return `${experienceYears.charAt(0).toUpperCase() + experienceYears.slice(1)} ${latestJob.title || 'professional'} with expertise in ${skills}. Proven track record of delivering high-quality solutions and contributing to team success. Strong problem-solving abilities and commitment to continuous learning and professional development.`;
    } else {
      return `Motivated professional with strong foundation in ${skills}. Eager to apply technical skills and knowledge to contribute to innovative projects. Quick learner with excellent problem-solving abilities and strong commitment to delivering quality results.`;
    }
  }
  private isProjectMisclassifiedAsExperience(exp: any): boolean {
    const title = (exp.title || '').toLowerCase();
    const company = (exp.company || '').toLowerCase();
    const description = (exp.description || '').toLowerCase();
    
    // Project indicators in title
    const projectTitleIndicators = [
      'event management software',
      'chatbot',
      'web application',
      'mobile app',
      'website',
      'system',
      'platform',
      'tool',
      'application'
    ];
    
    // Project action words in description
    const projectActionWords = [
      'engineered',
      'built',
      'developed',
      'created',
      'designed',
      'implemented',
      'programmed'
    ];
    
    // Technology stack indicators
    const techStackIndicators = [
      'tensorflow',
      'react',
      'node.js',
      'python',
      'javascript',
      'html',
      'css',
      'mongodb',
      'mysql',
      'api'
    ];
    
    // Check if title contains project indicators
    const hasTitleIndicators = projectTitleIndicators.some(indicator => 
      title.includes(indicator)
    );
    
    // Check if description starts with project action words
    const hasProjectActions = projectActionWords.some(action => 
      description.startsWith(action) || description.includes(`${action} a`) || description.includes(`${action} an`)
    );
    
    // Check if description mentions technology stack
    const hasTechStack = techStackIndicators.some(tech => 
      description.includes(tech)
    );
    
    // Check if company name looks like a project name (not a real company)
    const companyLooksLikeProject = company.includes('.') && (
      company.includes('events') || 
      company.includes('app') || 
      company.includes('system') ||
      company.length < 5
    );
    
    // If multiple indicators suggest it's a project, classify as project
    const projectScore = 
      (hasTitleIndicators ? 2 : 0) +
      (hasProjectActions ? 2 : 0) +
      (hasTechStack ? 1 : 0) +
      (companyLooksLikeProject ? 2 : 0);
    
    return projectScore >= 3;
  }

  /**
   * Extract technologies from text description
   */
  private extractTechnologiesFromText(text: string): string[] {
    const technologies: string[] = [];
    const techKeywords = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel', 'Rails',
      'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'GitHub', 'GitLab',
      'HTML', 'CSS', 'SCSS', 'Bootstrap', 'Tailwind', 'jQuery', 'Ajax',
      'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy',
      'REST', 'GraphQL', 'API', 'JSON', 'XML', 'SOAP'
    ];
    
    techKeywords.forEach(tech => {
      if (new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)) {
        technologies.push(tech);
      }
    });
    
    return [...new Set(technologies)]; // Remove duplicates
  }
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
    
    // Extract career objective
    const objective = this.extractObjectiveFallback(resumeText);
    
    // Extract professional summary
    const summary = this.extractSummaryFallback(resumeText);
    
    // Extract skills (common tech keywords)
    const techKeywords = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 'Kubernetes'];
    const skills = techKeywords.filter(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(resumeText)
    );
    
    // Try to extract experience with descriptions
    const experience = this.extractExperienceFallback(resumeText);
    
    // Try to extract projects from fallback
    const projects = this.extractProjectsFallback(resumeText);
    
    return {
      personalInfo: {
        name: nameMatch ? nameMatch[1] : 'Name not found',
        email: emailMatch ? emailMatch[1] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined
      },
      summary: summary,
      objective: objective,
      education: [],
      experience: experience,
      skills: skills,
      certifications: [],
      projects: projects
    };
  }

  /**
   * Fallback objective extraction using regex patterns
   */
  private extractObjectiveFallback(resumeText: string): string | undefined {
    const lines = resumeText.split('\n');
    
    // Look for objective section headers
    const objectiveSectionRegex = /^(objective|career objective|professional objective|goal|aim)[\s:]*$/i;
    let inObjectiveSection = false;
    let objectiveText = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering objective section
      if (objectiveSectionRegex.test(line)) {
        inObjectiveSection = true;
        continue;
      }
      
      // Check if we're leaving objective section (new major section)
      if (inObjectiveSection && /^(summary|experience|education|skills|projects)[\s:]*$/i.test(line)) {
        break;
      }
      
      if (inObjectiveSection && line) {
        objectiveText += (objectiveText ? ' ' : '') + line;
      }
    }
    
    // Also look for inline objectives that start with common phrases
    if (!objectiveText) {
      const objectivePatterns = [
        /(?:^|\n)\s*(To obtain[^.]+\.)/i,
        /(?:^|\n)\s*(Seeking[^.]+\.)/i,
        /(?:^|\n)\s*(Looking for[^.]+\.)/i,
        /(?:^|\n)\s*(Aspiring to[^.]+\.)/i,
        /(?:^|\n)\s*(Goal[^.]+\.)/i
      ];
      
      for (const pattern of objectivePatterns) {
        const match = resumeText.match(pattern);
        if (match) {
          objectiveText = match[1].trim();
          break;
        }
      }
    }
    
    return objectiveText || undefined;
  }

  /**
   * Fallback summary extraction using regex patterns
   */
  private extractSummaryFallback(resumeText: string): string | undefined {
    const lines = resumeText.split('\n');
    
    // Look for summary section headers
    const summarySectionRegex = /^(summary|professional summary|profile|about|overview)[\s:]*$/i;
    let inSummarySection = false;
    let summaryText = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering summary section
      if (summarySectionRegex.test(line)) {
        inSummarySection = true;
        continue;
      }
      
      // Check if we're leaving summary section (new major section)
      if (inSummarySection && /^(objective|experience|education|skills|projects)[\s:]*$/i.test(line)) {
        break;
      }
      
      if (inSummarySection && line) {
        summaryText += (summaryText ? ' ' : '') + line;
      }
    }
    
    return summaryText || undefined;
  }

  /**
   * Fallback experience extraction using regex patterns
   */
  private extractExperienceFallback(resumeText: string): any[] {
    const experience: any[] = [];
    const lines = resumeText.split('\n');
    
    // Look for experience section headers
    const experienceSectionRegex = /^(experience|work experience|professional experience|employment|career history)[\s:]*$/i;
    let inExperienceSection = false;
    let currentJob: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering experience section
      if (experienceSectionRegex.test(line)) {
        inExperienceSection = true;
        continue;
      }
      
      // Check if we're leaving experience section
      if (inExperienceSection && /^(education|skills|projects|certifications?)[\s:]*$/i.test(line)) {
        inExperienceSection = false;
        if (currentJob) {
          experience.push(currentJob);
          currentJob = null;
        }
        continue;
      }
      
      if (inExperienceSection && line) {
        // Look for job title and company patterns
        const jobPatterns = [
          /^([A-Z][A-Za-z\s]+)\s+[-–—]\s+([A-Z][A-Za-z\s&.,]+)$/,  // "Job Title - Company Name"
          /^([A-Z][A-Za-z\s]+)\s+at\s+([A-Z][A-Za-z\s&.,]+)$/i,     // "Job Title at Company Name"
          /^([A-Z][A-Za-z\s]+),\s+([A-Z][A-Za-z\s&.,]+)$/,          // "Job Title, Company Name"
        ];
        
        let isNewJob = false;
        let jobTitle = '';
        let company = '';
        
        for (const regex of jobPatterns) {
          const match = line.match(regex);
          if (match) {
            isNewJob = true;
            jobTitle = match[1].trim();
            company = match[2].trim();
            break;
          }
        }
        
        if (isNewJob) {
          // Save previous job
          if (currentJob) {
            experience.push(currentJob);
          }
          
          // Start new job
          currentJob = {
            title: jobTitle,
            company: company,
            startDate: '',
            endDate: '',
            location: '',
            description: '',
            responsibilities: []
          };
        } else if (currentJob && line) {
          // Look for dates
          const dateMatch = line.match(/(\d{4})\s*[-–—]\s*(\d{4}|present)/i);
          if (dateMatch) {
            currentJob.startDate = dateMatch[1];
            currentJob.endDate = dateMatch[2];
          }
          
          // Look for location
          const locationMatch = line.match(/([A-Z][a-z]+,\s*[A-Z]{2})/);
          if (locationMatch) {
            currentJob.location = locationMatch[1];
          }
          
          // Look for bullet points (responsibilities)
          if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
            const responsibility = line.replace(/^[•\-*]\s*/, '').trim();
            if (responsibility.length > 10) {
              currentJob.responsibilities.push(responsibility);
            }
          } else if (line.length > 20 && !dateMatch && !locationMatch) {
            // Likely a description paragraph
            if (currentJob.description) {
              currentJob.description += ' ' + line;
            } else {
              currentJob.description = line;
            }
          }
        }
      }
    }
    
    // Don't forget the last job
    if (currentJob) {
      experience.push(currentJob);
    }
    
    return experience.filter(job => job.title && job.company);
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
