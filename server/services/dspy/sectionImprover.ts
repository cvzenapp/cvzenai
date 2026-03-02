import { groqService } from '../groqService.js';

/**
 * Section-specific ATS Improver
 * Improves individual resume sections to avoid token limits
 */
export class SectionImprover {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    console.log('🚀 Initializing Section Improver...');
    this.initialized = true;
    console.log('✅ Section Improver ready');
  }

  /**
   * Improve a specific section of the resume
   */
  async improveSection(
    sectionType: 'summary' | 'objective' | 'experience' | 'education' | 'project' | 'skills',
    sectionData: any,
    context?: {
      personalInfo?: any;
      allSkills?: string[];
      jobTitle?: string;
    }
  ): Promise<{
    improved: any;
    changes: string[];
  }> {
    await this.initialize();

    console.log(`🎯 Improving ${sectionType} section...`);

    const prompt = this.generateSectionPrompt(sectionType, sectionData, context);
    
    const response = await groqService.generateResponse({
      type: 'resume_optimization',
      content: prompt
    });

    if (!response.success || !response.response) {
      throw new Error(`Failed to improve ${sectionType} section`);
    }

    let improved: any;
    
    // For summary and objective, handle both plain text and object responses
    if (sectionType === 'summary' || sectionType === 'objective') {
      try {
        const parsed = JSON.parse(this.sanitizeJSON(response.response));
        improved = this.extractTextFromResponse(parsed);
      } catch (error) {
        // If JSON parsing fails, treat as plain text
        improved = response.response.trim();
      }
    } else {
      // For other sections, parse as JSON
      improved = JSON.parse(this.sanitizeJSON(response.response));
    }

    const changes = this.identifyChanges(sectionType, sectionData, improved);

    console.log(`✅ ${sectionType} section improved with ${changes.length} changes`);

    return { improved, changes };
  }

  /**
   * Generate section-specific improvement prompt
   */
  private generateSectionPrompt(
    sectionType: string,
    sectionData: any,
    context?: any
  ): string {
    // Handle skills - can be array of strings or array of objects
    let skillsText = '';
    if (context?.allSkills) {
      if (Array.isArray(context.allSkills)) {
        // Check if it's an array of objects or strings
        if (context.allSkills.length > 0 && typeof context.allSkills[0] === 'object') {
          // Array of skill objects - extract names
          skillsText = context.allSkills.map((s: any) => s.name).filter(Boolean).join(', ');
        } else {
          // Array of strings
          skillsText = context.allSkills.join(', ');
        }
      }
    }
    
    const baseContext = context ? `
CONTEXT:
${context.personalInfo ? `Name: ${context.personalInfo.name}` : ''}
${context.jobTitle ? `Job Title: ${context.jobTitle}` : ''}
${skillsText ? `Skills: ${skillsText}` : ''}
` : '';

    switch (sectionType) {
      case 'summary':
        return this.getSummaryPrompt(sectionData, context);
      case 'objective':
        return this.getObjectivePrompt(sectionData, context);
      case 'experience':
        return this.getExperiencePrompt(sectionData, context);
      case 'education':
        return this.getEducationPrompt(sectionData, context);
      case 'project':
        return this.getProjectPrompt(sectionData, context);
      case 'skills':
        return this.getSkillsPrompt(sectionData, context);
      default:
        throw new Error(`Unknown section type: ${sectionType}`);
    }
  }

  private getSummaryPrompt(summary: string, context?: any): string {
    return `You are an ATS optimization expert. Improve this professional summary for maximum ATS score.

${context ? `CONTEXT:\nJob Title: ${context.jobTitle || 'Professional'}\nKey Skills: ${context.allSkills?.slice(0, 5).join(', ') || 'N/A'}` : ''}

CURRENT SUMMARY:
"${summary}"

IMPROVEMENT REQUIREMENTS:
1. Include 5+ technical keywords from the person's skill set
2. Add quantifiable achievements or years of experience
3. Include industry buzzwords (scalability, optimization, automation, etc.)
4. Keep it 150-200 characters
5. Start with job title or role
6. Make it ATS-friendly with action-oriented language

EXAMPLE TRANSFORMATION:
Before: "Software developer with experience in web development"
After: "Senior Full-Stack Developer with 5+ years building scalable web applications using React, Node.js, and AWS. Specialized in microservices architecture, CI/CD automation, and cloud infrastructure. Proven track record delivering high-performance solutions serving 1M+ users."

Return ONLY the improved summary text (no JSON, no explanations, just the text).`;
  }

  private getObjectivePrompt(objective: string, context?: any): string {
    return `You are an ATS optimization expert. Improve this career objective for maximum ATS score.

${context ? `CONTEXT:\nJob Title: ${context.jobTitle || 'Professional'}\nKey Skills: ${context.allSkills?.slice(0, 5).join(', ') || 'N/A'}` : ''}

CURRENT OBJECTIVE:
"${objective}"

IMPROVEMENT REQUIREMENTS:
1. Make it specific and goal-oriented
2. Include 2-3 technical keywords
3. Mention desired role or industry
4. Keep it concise (50-100 characters)
5. Focus on value you bring, not what you want

EXAMPLE TRANSFORMATION:
Before: "Looking for a challenging position"
After: "Seeking Senior Software Engineer role to leverage expertise in React, Node.js, and cloud architecture to build scalable enterprise solutions"

Return ONLY the improved objective text (no JSON, no explanations, just the text).`;
  }

  private getExperiencePrompt(experience: any, context?: any): string {
    return `You are an ATS optimization expert. Improve this work experience entry for maximum ATS score.

CURRENT EXPERIENCE:
${JSON.stringify(experience, null, 2)}

IMPROVEMENT REQUIREMENTS:
1. Start description with a powerful action verb (Led, Architected, Developed, Optimized, etc.)
2. Add 3-5 technical keywords (technologies, frameworks, methodologies)
3. Include quantifiable metrics (%, $, numbers, timeframes)
4. Add industry buzzwords (scalability, performance, automation, etc.)
5. Expand achievements to 100-200 characters each
6. DO NOT change: company name, position, dates
7. DO NOT fabricate metrics - only enhance wording

EXAMPLE TRANSFORMATION:
Before: {
  "company": "Tech Corp",
  "position": "Developer",
  "description": "Worked on website",
  "achievements": ["Built features"]
}

After: {
  "company": "Tech Corp",
  "position": "Developer",
  "description": "Architected and developed responsive web applications using React, Node.js, and PostgreSQL, implementing RESTful APIs and optimizing performance to serve 10,000+ concurrent users",
  "achievements": [
    "Engineered microservices architecture reducing system latency by 45% and improving scalability to handle 1M+ daily requests",
    "Implemented CI/CD pipelines with Jenkins and Docker, accelerating deployment cycles by 60% and reducing production issues by 40%",
    "Led code reviews and mentored 3 junior developers in best practices, improving team code quality score from 75% to 95%"
  ],
  "technologies": ["React", "Node.js", "PostgreSQL", "Docker", "Jenkins", "AWS", "REST API", "Microservices"]
}

Return ONLY valid JSON (no markdown, no explanations).`;
  }

  private getEducationPrompt(education: any, context?: any): string {
    return `You are an ATS optimization expert. Improve this education entry for maximum ATS score.

CURRENT EDUCATION:
${JSON.stringify(education, null, 2)}

IMPROVEMENT REQUIREMENTS:
1. Add GPA if 3.0+ (if not present, don't add)
2. Include relevant coursework (3-5 courses)
3. Add academic achievements (Dean's List, honors, scholarships)
4. DO NOT change: institution, degree, field, dates

EXAMPLE TRANSFORMATION:
Before: {
  "institution": "State University",
  "degree": "Bachelor of Science",
  "field": "Computer Science"
}

After: {
  "institution": "State University",
  "degree": "Bachelor of Science",
  "field": "Computer Science",
  "gpa": "3.7",
  "coursework": ["Data Structures", "Algorithms", "Database Systems", "Software Engineering", "Cloud Computing"],
  "achievements": ["Dean's List (4 semesters)", "Computer Science Department Scholarship", "Senior Project Award"]
}

Return ONLY valid JSON (no markdown, no explanations).`;
  }

  private getProjectPrompt(project: any, context?: any): string {
    return `You are an ATS optimization expert. Improve this project entry for maximum ATS score.

CURRENT PROJECT:
${JSON.stringify(project, null, 2)}

IMPROVEMENT REQUIREMENTS:
1. Start description with action verb (Developed, Built, Created, Designed)
2. Add 3-5 technical keywords (technologies used)
3. Include quantifiable results (users, performance, metrics)
4. Expand description to 100-150 characters
5. DO NOT change: project name, dates
6. DO NOT fabricate metrics

EXAMPLE TRANSFORMATION:
Before: {
  "title": "E-commerce Website",
  "description": "Built online store"
}

After: {
  "title": "E-commerce Website",
  "description": "Developed full-stack e-commerce platform using React, Node.js, MongoDB, and Stripe API, implementing secure payment processing, real-time inventory management, and responsive design serving 5,000+ monthly users",
  "technologies": ["React", "Node.js", "MongoDB", "Express", "Stripe API", "JWT", "REST API"],
  "highlights": [
    "Implemented secure authentication and payment processing handling $50K+ monthly transactions",
    "Optimized database queries reducing page load time by 60%",
    "Built responsive UI with 95+ Lighthouse performance score"
  ]
}

Return ONLY valid JSON (no markdown, no explanations).`;
  }

  private getSkillsPrompt(skills: string[], context?: any): string {
    return `You are an ATS optimization expert. Expand this skills list for maximum ATS score.

CURRENT SKILLS:
${JSON.stringify(skills)}

IMPROVEMENT REQUIREMENTS:
1. KEEP ALL existing skills EXACTLY as they are
2. ADD 5-10 related skills based on existing ones
3. DO NOT replace specific skills with generic categories
4. DO NOT change "Python" to "Programming Languages"
5. Add complementary technologies and tools
6. Include both technical and soft skills

EXAMPLE TRANSFORMATION:
Before: ["Python", "JavaScript", "React"]

After: ["Python", "JavaScript", "React", "Node.js", "TypeScript", "Django", "Flask", "PostgreSQL", "MongoDB", "Docker", "Kubernetes", "AWS", "Git", "CI/CD", "REST API", "GraphQL", "Agile/Scrum", "Problem Solving", "Team Leadership"]

Return ONLY a JSON array of strings (no markdown, no explanations).`;
  }

  /**
   * Identify what changed
   */
  private identifyChanges(sectionType: string, original: any, improved: any): string[] {
    const changes: string[] = [];

    switch (sectionType) {
      case 'summary':
      case 'objective':
        if (improved.length > original.length + 20) {
          changes.push('Enhanced with keywords and metrics');
        }
        break;

      case 'experience':
        if (improved.description && improved.description.length > (original.description?.length || 0) + 30) {
          changes.push('Expanded description with action verbs and keywords');
        }
        if (improved.achievements && improved.achievements.length > (original.achievements?.length || 0)) {
          changes.push(`Added ${improved.achievements.length - (original.achievements?.length || 0)} achievements`);
        }
        if (improved.technologies && improved.technologies.length > (original.technologies?.length || 0)) {
          changes.push(`Added ${improved.technologies.length - (original.technologies?.length || 0)} technologies`);
        }
        break;

      case 'education':
        if (improved.gpa && !original.gpa) {
          changes.push('Added GPA');
        }
        if (improved.coursework && !original.coursework) {
          changes.push('Added relevant coursework');
        }
        if (improved.achievements && !original.achievements) {
          changes.push('Added academic achievements');
        }
        break;

      case 'project':
        if (improved.description && improved.description.length > (original.description?.length || 0) + 30) {
          changes.push('Enhanced description with technical details');
        }
        if (improved.technologies && improved.technologies.length > (original.technologies?.length || 0)) {
          changes.push(`Added ${improved.technologies.length - (original.technologies?.length || 0)} technologies`);
        }
        break;

      case 'skills':
        const added = improved.length - original.length;
        if (added > 0) {
          changes.push(`Added ${added} related skills`);
        }
        break;
    }

    return changes.length > 0 ? changes : ['Optimized for ATS compatibility'];
  }

  /**
   * Sanitize JSON response
   */
  private sanitizeJSON(jsonText: string): string {
    // Remove markdown code blocks
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // For plain text responses (summary/objective), wrap in quotes
    if (!jsonText.trim().startsWith('{') && !jsonText.trim().startsWith('[')) {
      return JSON.stringify(jsonText.trim());
    }

    // Remove text before first { or [
    const firstBrace = Math.min(
      jsonText.indexOf('{') >= 0 ? jsonText.indexOf('{') : Infinity,
      jsonText.indexOf('[') >= 0 ? jsonText.indexOf('[') : Infinity
    );
    if (firstBrace > 0 && firstBrace !== Infinity) {
      jsonText = jsonText.substring(firstBrace);
    }

    // Remove text after last } or ]
    const lastBrace = Math.max(
      jsonText.lastIndexOf('}'),
      jsonText.lastIndexOf(']')
    );
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }

    return jsonText.trim();
  }

  /**
   * Extract plain text from AI response (handles both plain text and object responses)
   */
  private extractTextFromResponse(response: any): string {
    // If it's already a string, return it
    if (typeof response === 'string') {
      return response;
    }

    // If it's an object, try to extract the text value
    if (typeof response === 'object' && response !== null) {
      // Common keys that might contain the actual text
      const possibleKeys = [
        'Professional Summary',
        'Career Objective',
        'summary',
        'objective',
        'text',
        'content',
        'value'
      ];

      for (const key of possibleKeys) {
        if (response[key] && typeof response[key] === 'string') {
          return response[key];
        }
      }

      // If no known key found, try to get the first string value
      const firstStringValue = Object.values(response).find(
        val => typeof val === 'string' && val.length > 10
      );
      
      if (firstStringValue) {
        return firstStringValue as string;
      }
    }

    // Fallback: stringify the response
    return JSON.stringify(response);
  }
}

export const sectionImprover = new SectionImprover();
