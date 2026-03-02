import { groqService } from '../groqService.js';

/**
 * Resume Optimizer - Enhances resume content for better ATS scores
 * Takes parsed resume data and returns optimized version
 */
export class ResumeOptimizer {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    console.log('🚀 Initializing Resume Optimizer...');
    this.initialized = true;
    console.log('✅ Resume Optimizer ready');
  }

  /**
   * Optimize entire resume for better ATS score
   */
  async optimizeResume(originalData: any): Promise<{
    optimizedData: any;
    improvements: string[];
    estimatedScoreIncrease: number;
  }> {
    await this.initialize();

    console.log('🎯 Optimizing resume for ATS...');

    const prompt = this.generateOptimizationPrompt(originalData);
    
    const response = await groqService.generateResponse({
      type: 'resume_optimization',
      content: prompt
    });

    if (!response.success || !response.response) {
      throw new Error('Failed to optimize resume');
    }

    // Parse the optimized data
    const optimizedData = JSON.parse(this.sanitizeJSON(response.response));
    
    // Calculate improvements made
    const improvements = this.identifyImprovements(originalData, optimizedData);
    const estimatedScoreIncrease = this.estimateScoreIncrease(improvements);

    console.log(`✅ Resume optimized - estimated score increase: +${estimatedScoreIncrease}`);

    return {
      optimizedData,
      improvements,
      estimatedScoreIncrease
    };
  }

  /**
   * Generate optimization prompt for Groq
   */
  private generateOptimizationPrompt(originalData: any): string {
    return `You are an expert ATS (Applicant Tracking System) resume optimizer. Your task is to enhance the following resume content to achieve a higher ATS score while maintaining accuracy and truthfulness.

ORIGINAL RESUME DATA:
${JSON.stringify(originalData, null, 2)}

OPTIMIZATION GUIDELINES:

1. EXPERIENCE OPTIMIZATION:
   - Add strong action verbs (developed, created, managed, led, implemented, designed, built, improved, optimized, increased, reduced, achieved)
   - Make achievements quantifiable with metrics (%, $, numbers, timeframes)
   - Example: "Worked on website" → "Developed responsive website serving 10,000+ daily users, improving load time by 40%"
   - Add relevant technologies used in each role
   - Ensure descriptions are 100-150 characters for optimal ATS parsing

2. SKILLS OPTIMIZATION:
   - Expand skill list to 10-15 relevant skills
   - Categorize skills (Programming Languages, Frameworks, Tools, Soft Skills)
   - Add industry-standard keywords
   - Include both technical and soft skills

3. SUMMARY OPTIMIZATION:
   - Create compelling 2-3 sentence summary (150-200 chars)
   - Include years of experience, key technologies, and value proposition
   - Use industry keywords
   - Example: "Results-driven Software Engineer with 5+ years building scalable web applications using React, Node.js, and AWS. Proven track record of delivering high-impact solutions that improve user experience and business metrics."

4. OBJECTIVE OPTIMIZATION (if missing):
   - Generate professional career objective based on experience
   - Format: "Seeking [role] position leveraging [X] years of experience in [technologies/domain] to [goal/impact]"
   - Keep under 200 characters

5. EDUCATION OPTIMIZATION:
   - Add relevant coursework if applicable
   - Include GPA if 3.0 or higher
   - Add academic achievements (Dean's List, honors, awards)

6. PROJECTS OPTIMIZATION:
   - Ensure each project has clear description (100-150 chars)
   - Add technologies used
   - Include links (GitHub, demo) if available
   - Add impact/results if applicable

7. FORMATTING OPTIMIZATION:
   - Ensure all dates are in YYYY-MM format
   - Make sure all required fields are present
   - Keep descriptions concise but impactful

CRITICAL RULES:
- DO NOT fabricate experience, skills, or achievements
- DO NOT change dates, company names, or institutions
- DO enhance descriptions with action verbs and metrics
- DO add relevant keywords and technologies
- DO make content more ATS-friendly
- Return ONLY valid JSON matching the original structure

RETURN FORMAT (JSON only, no explanations):
{
  "personalInfo": { ... },
  "summary": "optimized summary",
  "objective": "optimized objective",
  "skills": ["expanded skill list"],
  "experience": [
    {
      "company": "same as original",
      "position": "same as original",
      "startDate": "same as original",
      "endDate": "same as original",
      "current": same as original,
      "description": "ENHANCED with action verbs and keywords",
      "achievements": ["ENHANCED with quantifiable metrics"],
      "technologies": ["EXPANDED list"]
    }
  ],
  "education": [ ... with enhancements ],
  "projects": [ ... with enhancements ],
  "certifications": [ ... ],
  "languages": [ ... ]
}

Return ONLY the JSON object. No explanations, no markdown, no preamble.`;
  }

  /**
   * Identify what improvements were made
   */
  private identifyImprovements(original: any, optimized: any): string[] {
    const improvements: string[] = [];

    // Check experience improvements
    if (optimized.experience && original.experience) {
      const originalExp = original.experience.length;
      const optimizedExp = optimized.experience.length;
      
      // Check for added action verbs
      const actionVerbs = ['developed', 'created', 'managed', 'led', 'implemented', 'designed', 'built', 'improved', 'optimized', 'increased', 'reduced', 'achieved'];
      let actionVerbsAdded = 0;
      
      optimized.experience.forEach((exp: any, idx: number) => {
        const origDesc = (original.experience[idx]?.description || '').toLowerCase();
        const optDesc = (exp.description || '').toLowerCase();
        
        actionVerbs.forEach(verb => {
          if (!origDesc.includes(verb) && optDesc.includes(verb)) {
            actionVerbsAdded++;
          }
        });
      });
      
      if (actionVerbsAdded > 0) {
        improvements.push(`Added ${actionVerbsAdded} strong action verbs to experience descriptions`);
      }
      
      // Check for quantifiable achievements
      let metricsAdded = 0;
      optimized.experience.forEach((exp: any, idx: number) => {
        const origAch = (original.experience[idx]?.achievements || []).join(' ');
        const optAch = (exp.achievements || []).join(' ');
        
        const hasMetrics = /\d+%|\d+x|\$\d+|\d+ (users|customers|projects|team)/i;
        if (!hasMetrics.test(origAch) && hasMetrics.test(optAch)) {
          metricsAdded++;
        }
      });
      
      if (metricsAdded > 0) {
        improvements.push(`Added quantifiable metrics to ${metricsAdded} achievement(s)`);
      }
    }

    // Check skills improvements
    if (optimized.skills && original.skills) {
      const skillsAdded = optimized.skills.length - original.skills.length;
      if (skillsAdded > 0) {
        improvements.push(`Expanded skills list by ${skillsAdded} relevant skills`);
      }
    }

    // Check summary improvements
    if (optimized.summary && (!original.summary || original.summary.length < 50)) {
      improvements.push('Added professional summary with industry keywords');
    }

    // Check objective improvements
    if (optimized.objective && (!original.objective || original.objective.length < 30)) {
      improvements.push('Added career objective statement');
    }

    // Check projects improvements
    if (optimized.projects && original.projects) {
      let projectsEnhanced = 0;
      optimized.projects.forEach((proj: any, idx: number) => {
        const origDesc = original.projects[idx]?.description || '';
        const optDesc = proj.description || '';
        
        if (optDesc.length > origDesc.length + 20) {
          projectsEnhanced++;
        }
      });
      
      if (projectsEnhanced > 0) {
        improvements.push(`Enhanced ${projectsEnhanced} project description(s) with more detail`);
      }
    }

    return improvements;
  }

  /**
   * Estimate score increase based on improvements
   */
  private estimateScoreIncrease(improvements: string[]): number {
    let increase = 0;
    
    improvements.forEach(improvement => {
      if (improvement.includes('action verbs')) increase += 5;
      if (improvement.includes('metrics')) increase += 8;
      if (improvement.includes('skills')) increase += 6;
      if (improvement.includes('summary')) increase += 4;
      if (improvement.includes('objective')) increase += 3;
      if (improvement.includes('project')) increase += 4;
    });
    
    return Math.min(increase, 25); // Cap at +25 points
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

    // Remove text before first {
    const firstBrace = jsonText.indexOf('{');
    if (firstBrace > 0) {
      jsonText = jsonText.substring(firstBrace);
    }

    // Remove text after last }
    const lastBrace = jsonText.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < jsonText.length - 1) {
      jsonText = jsonText.substring(0, lastBrace + 1);
    }

    return jsonText.trim();
  }
}

export const resumeOptimizer = new ResumeOptimizer();
