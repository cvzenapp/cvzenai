import { groqService } from '../groqService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ATS (Applicant Tracking System) Scorer
 * Uses trained model patterns from 12,093+ resume examples for accurate scoring
 */
export class ATSScorer {
  private initialized = false;
  private compiledPatterns: any = null;

  async initialize() {
    if (this.initialized) return;
    console.log('🎯 Initializing ATS Scorer with trained patterns...');
    
    try {
      // Load compiled patterns from trained model
      const patternsPath = path.join(__dirname, '../../data_sets/ats_scoring_compiled_patterns.json');
      const patternsData = fs.readFileSync(patternsPath, 'utf8');
      this.compiledPatterns = JSON.parse(patternsData);
      
      console.log(`✅ ATS Scorer ready with ${this.compiledPatterns.trainingDataSize} training examples`);
      console.log(`📊 Model: ${this.compiledPatterns.model}, Success Rate: ${this.compiledPatterns.testResults.successRate}`);
    } catch (error) {
      console.error('❌ Failed to load compiled patterns:', error);
      this.compiledPatterns = null;
    }
    
    this.initialized = true;
  }

  /**
   * Calculate ATS score for a resume using trained model patterns
   */
  async calculateScore(resumeData: any): Promise<{
    overallScore: number;
    scores: {
      completeness: number;
      formatting: number;
      keywords: number;
      experience: number;
      education: number;
      skills: number;
    };
    suggestions: string[];
    strengths: string[];
  }> {
    await this.initialize();

    console.log('🎯 Calculating ATS score with trained model...');

    // If compiled patterns are available, use AI scoring with trained prompt
    if (this.compiledPatterns && this.compiledPatterns.systemPrompt) {
      try {
        return await this.calculateScoreWithAI(resumeData);
      } catch (error) {
        console.error('❌ AI scoring failed:', error);
        throw error; // Don't fall back to rule-based, let the error bubble up for debugging
      }
    } else {
      // No compiled patterns available - this shouldn't happen in production
      throw new Error('ATS scoring patterns not loaded. Please check the compiled patterns file.');
    }
  }

  /**
   * Calculate ATS score using trained AI model with compiled patterns
   */
  private async calculateScoreWithAI(resumeData: any): Promise<any> {
    // Prepare resume text for AI analysis
    const resumeText = this.formatResumeForAnalysis(resumeData);
    
    // Validate resume text is not empty
    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Resume content too short for AI analysis');
    }
    
    // Use the trained system prompt from compiled patterns
    const systemPrompt = this.compiledPatterns.systemPrompt;
    
    const userPrompt = `Analyze this resume and provide ATS scoring:

RESUME CONTENT:
${resumeText}

CRITICAL INSTRUCTIONS:
1. Evaluate this resume according to the trained ATS scoring methodology
2. Return ONLY the JSON object in the exact format specified in the system prompt
3. Do not include any explanatory text, comments, or additional content
4. Ensure the JSON is valid and complete

Return the scoring results now:`;

    console.log('🤖 Sending resume to AI for trained ATS analysis...');
    console.log(`📝 Resume text length: ${resumeText.length} characters`);
    
    const response = await groqService.generateResponse(
      systemPrompt,
      userPrompt,
      {
        temperature: 0.1, // Low temperature for consistent scoring
        maxTokens: 1000,
        auditContext: {
          serviceName: 'ats_scoring',
          operationType: 'ats_scoring'
        }
      }
    );

    // Parse AI response
    let aiResult;
    try {
      // Handle the response format - check if it's the new API format
      let responseText;
      if (typeof response === 'object' && response.success && response.response) {
        responseText = response.response;
      } else if (typeof response === 'string') {
        responseText = response;
      } else {
        throw new Error('Invalid response format from AI service');
      }
      
      // Validate response exists
      if (!responseText) {
        throw new Error('Empty response from AI service');
      }
      
      console.log('🔍 Raw AI response:', responseText.substring(0, 200) + '...');
      
      // More robust JSON extraction
      let cleanedResponse = responseText.trim();
      
      // Remove common AI response patterns
      cleanedResponse = cleanedResponse.replace(/```json\n?|\n?```/g, '');
      cleanedResponse = cleanedResponse.replace(/^Here's the ATS scoring.*?:/i, '');
      cleanedResponse = cleanedResponse.replace(/^Based on.*?:/i, '');
      cleanedResponse = cleanedResponse.replace(/^The ATS score.*?:/i, '');
      cleanedResponse = cleanedResponse.replace(/\n\n.*$/s, ''); // Remove trailing explanations
      
      // Try multiple extraction methods
      let jsonOnly = '';
      
      // Method 1: Find JSON object boundaries
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
        jsonOnly = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      } else {
        // Method 2: Try to find JSON using regex
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonOnly = jsonMatch[0];
        } else {
          throw new Error('No valid JSON object found in response');
        }
      }
      
      // Method 3: If still having issues, try to extract the first complete JSON object
      if (!jsonOnly) {
        let braceCount = 0;
        let startIndex = -1;
        let endIndex = -1;
        
        for (let i = 0; i < cleanedResponse.length; i++) {
          const char = cleanedResponse[i];
          if (char === '{') {
            if (braceCount === 0) {
              startIndex = i;
            }
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && startIndex !== -1) {
              endIndex = i;
              break;
            }
          }
        }
        
        if (startIndex !== -1 && endIndex !== -1) {
          jsonOnly = cleanedResponse.substring(startIndex, endIndex + 1);
        } else {
          throw new Error('Could not extract valid JSON from response');
        }
      }
      
      console.log('🔍 Extracted JSON length:', jsonOnly.length);
      
      aiResult = JSON.parse(jsonOnly);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Full AI response:', response);
      throw new Error(`Invalid AI response format: ${parseError.message}`);
    }

    // Validate AI result structure
    if (!aiResult || typeof aiResult !== 'object') {
      throw new Error('AI response is not a valid object');
    }
    
    if (typeof aiResult.overallScore !== 'number' || !aiResult.scores || !aiResult.suggestions || !aiResult.strengths) {
      console.error('❌ AI response missing required fields:', {
        hasOverallScore: typeof aiResult.overallScore === 'number',
        hasScores: !!aiResult.scores,
        hasSuggestions: !!aiResult.suggestions,
        hasStrengths: !!aiResult.strengths,
        actualKeys: Object.keys(aiResult)
      });
      throw new Error('AI response missing required fields');
    }

    // Ensure scores are within valid range (0-100)
    aiResult.overallScore = Math.max(0, Math.min(100, Math.round(aiResult.overallScore)));
    
    // Validate and fix individual scores
    const requiredScores = ['completeness', 'formatting', 'keywords', 'experience', 'education', 'skills'];
    for (const scoreKey of requiredScores) {
      if (typeof aiResult.scores[scoreKey] !== 'number') {
        console.warn(`⚠️ Missing or invalid score for ${scoreKey}, defaulting to 0`);
        aiResult.scores[scoreKey] = 0;
      } else {
        aiResult.scores[scoreKey] = Math.max(0, Math.min(100, Math.round(aiResult.scores[scoreKey])));
      }
    }

    // Ensure suggestions and strengths are arrays
    if (!Array.isArray(aiResult.suggestions)) {
      aiResult.suggestions = [];
    }
    if (!Array.isArray(aiResult.strengths)) {
      aiResult.strengths = [];
    }

    console.log(`✅ AI ATS Score calculated: ${aiResult.overallScore}/100`);
    console.log(`📊 Breakdown: C:${aiResult.scores.completeness} F:${aiResult.scores.formatting} K:${aiResult.scores.keywords} E:${aiResult.scores.experience} Ed:${aiResult.scores.education} S:${aiResult.scores.skills}`);

    return aiResult;
  }

  /**
   * Format resume data for AI analysis
   */
  private formatResumeForAnalysis(resumeData: any): string {
    let text = '';

    // Personal Information
    if (resumeData.personalInfo) {
      text += 'PERSONAL INFORMATION:\n';
      const name = resumeData.personalInfo.name || resumeData.personalInfo.fullName || 
                  `${resumeData.personalInfo.firstName || ''} ${resumeData.personalInfo.lastName || ''}`.trim();
      if (name) text += `Name: ${name}\n`;
      if (resumeData.personalInfo.email) text += `Email: ${resumeData.personalInfo.email}\n`;
      if (resumeData.personalInfo.phone) text += `Phone: ${resumeData.personalInfo.phone}\n`;
      if (resumeData.personalInfo.location) text += `Location: ${resumeData.personalInfo.location}\n`;
      if (resumeData.personalInfo.linkedin) text += `LinkedIn: ${resumeData.personalInfo.linkedin}\n`;
      if (resumeData.personalInfo.github) text += `GitHub: ${resumeData.personalInfo.github}\n`;
      if (resumeData.personalInfo.title) text += `Title: ${resumeData.personalInfo.title}\n`;
      text += '\n';
    }

    // Professional Summary
    if (resumeData.summary) {
      text += 'PROFESSIONAL SUMMARY:\n';
      text += `${resumeData.summary}\n\n`;
    }

    // Career Objective
    if (resumeData.objective) {
      text += 'CAREER OBJECTIVE:\n';
      text += `${resumeData.objective}\n\n`;
    }

    // Work Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      text += 'WORK EXPERIENCE:\n';
      resumeData.experience.forEach((exp: any, index: number) => {
        if (typeof exp === 'string') {
          text += `${index + 1}. ${exp}\n`;
        } else {
          text += `${index + 1}. ${exp.position || exp.title || 'Position'} at ${exp.company || exp.organization || 'Company'}\n`;
          if (exp.startDate || exp.start_date) text += `   Duration: ${exp.startDate || exp.start_date} - ${exp.endDate || exp.end_date || 'Present'}\n`;
          if (exp.description) text += `   Description: ${exp.description}\n`;
          if (exp.achievements && Array.isArray(exp.achievements)) {
            text += `   Achievements: ${exp.achievements.join('; ')}\n`;
          }
          if (exp.technologies && Array.isArray(exp.technologies)) {
            text += `   Technologies: ${exp.technologies.join(', ')}\n`;
          }
        }
        text += '\n';
      });
    }

    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      text += 'EDUCATION:\n';
      resumeData.education.forEach((edu: any, index: number) => {
        text += `${index + 1}. ${edu.degree || 'Degree'} in ${edu.field || edu.major || 'Field'}\n`;
        text += `   Institution: ${edu.institution || edu.school || edu.university || 'Institution'}\n`;
        if (edu.startDate || edu.start_date) text += `   Duration: ${edu.startDate || edu.start_date} - ${edu.endDate || edu.end_date || 'Present'}\n`;
        if (edu.gpa) text += `   GPA: ${edu.gpa}\n`;
        if (edu.achievements && Array.isArray(edu.achievements)) {
          text += `   Achievements: ${edu.achievements.join('; ')}\n`;
        }
        text += '\n';
      });
    }

    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      text += 'SKILLS:\n';
      const skillsByCategory: { [key: string]: string[] } = {};
      
      resumeData.skills.forEach((skill: any) => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        const category = (typeof skill === 'object' && skill.category) ? skill.category : 'General';
        
        if (!skillsByCategory[category]) {
          skillsByCategory[category] = [];
        }
        skillsByCategory[category].push(skillName);
      });

      Object.entries(skillsByCategory).forEach(([category, skills]) => {
        text += `${category}: ${skills.join(', ')}\n`;
      });
      text += '\n';
    }

    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      text += 'PROJECTS:\n';
      resumeData.projects.forEach((project: any, index: number) => {
        text += `${index + 1}. ${project.name || project.title || 'Project'}\n`;
        if (project.description) text += `   Description: ${project.description}\n`;
        if (project.technologies && Array.isArray(project.technologies)) {
          text += `   Technologies: ${project.technologies.join(', ')}\n`;
        }
        if (project.achievements && Array.isArray(project.achievements)) {
          text += `   Achievements: ${project.achievements.join('; ')}\n`;
        }
        text += '\n';
      });
    }

    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      text += 'CERTIFICATIONS:\n';
      resumeData.certifications.forEach((cert: any, index: number) => {
        text += `${index + 1}. ${cert.name || cert.title || 'Certification'}\n`;
        if (cert.issuer) text += `   Issuer: ${cert.issuer}\n`;
        if (cert.date) text += `   Date: ${cert.date}\n`;
        text += '\n';
      });
    }

    return text;
  }

  /**
   * Legacy rule-based scoring (kept for compatibility)
   * Note: AI-powered scoring is now the default method
   */
  private async calculateScoreRuleBased(resumeData: any): Promise<any> {
    console.log('📊 Using legacy rule-based ATS scoring...');

    // Calculate individual component scores
    const completeness = this.scoreCompleteness(resumeData);
    const formatting = this.scoreFormatting(resumeData);
    const keywords = this.scoreKeywords(resumeData);
    const experience = this.scoreExperience(resumeData);
    const education = this.scoreEducation(resumeData);
    const skills = this.scoreSkills(resumeData);

    // Calculate weighted overall score
    const overallScore = Math.round(
      completeness * 0.20 +
      formatting * 0.15 +
      keywords * 0.20 +
      experience * 0.20 +
      education * 0.10 +
      skills * 0.15
    );

    // Generate suggestions and strengths
    const suggestions = this.generateSuggestions(resumeData, {
      completeness,
      formatting,
      keywords,
      experience,
      education,
      skills
    });

    const strengths = this.identifyStrengths(resumeData, {
      completeness,
      formatting,
      keywords,
      experience,
      education,
      skills
    });

    console.log(`✅ Legacy rule-based ATS Score calculated: ${overallScore}/100`);

    return {
      overallScore,
      scores: {
        completeness,
        formatting,
        keywords,
        experience,
        education,
        skills
      },
      suggestions,
      strengths
    };
  }

  /**
   * Score resume completeness (0-100)
   */
  private scoreCompleteness(resumeData: any): number {
    let score = 0;
    const maxScore = 100;
    const weights = {
      personalInfo: 20,
      summary: 15,
      objective: 10,
      experience: 25,
      education: 15,
      skills: 10,
      projects: 5
    };

    // Personal Info (20 points)
    if (resumeData.personalInfo) {
      let personalScore = 0;
      // Check for name in various formats
      const hasName = resumeData.personalInfo.fullName || 
                     resumeData.personalInfo.name || 
                     (resumeData.personalInfo.firstName && resumeData.personalInfo.lastName);
      if (hasName) personalScore += 5;
      if (resumeData.personalInfo.email) personalScore += 5;
      if (resumeData.personalInfo.phone) personalScore += 3;
      if (resumeData.personalInfo.location) personalScore += 3;
      if (resumeData.personalInfo.linkedin || resumeData.personalInfo.github) personalScore += 4;
      score += Math.min(personalScore, weights.personalInfo);
    }

    // Summary (15 points)
    if (resumeData.summary && resumeData.summary.length >= 50) {
      score += weights.summary;
    } else if (resumeData.summary && resumeData.summary.length >= 20) {
      score += weights.summary * 0.5;
    }

    // Objective (10 points)
    if (resumeData.objective && resumeData.objective.length >= 30) {
      score += weights.objective;
    } else if (resumeData.objective && resumeData.objective.length >= 15) {
      score += weights.objective * 0.5;
    }

    // Experience (25 points)
    if (resumeData.experience && resumeData.experience.length > 0) {
      const expScore = Math.min(resumeData.experience.length * 8, weights.experience);
      score += expScore;
    }

    // Education (15 points)
    if (resumeData.education && resumeData.education.length > 0) {
      const eduScore = Math.min(resumeData.education.length * 7.5, weights.education);
      score += eduScore;
    }

    // Skills (10 points)
    if (resumeData.skills && resumeData.skills.length >= 5) {
      score += weights.skills;
    } else if (resumeData.skills && resumeData.skills.length > 0) {
      score += (resumeData.skills.length / 5) * weights.skills;
    }

    // Projects (5 points)
    if (resumeData.projects && resumeData.projects.length > 0) {
      score += weights.projects;
    }

    return Math.min(Math.round(score), maxScore);
  }

  /**
   * Score formatting quality (0-100)
   */
  private scoreFormatting(resumeData: any): number {
    let score = 100;

    // Check for proper date formats in experience
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      for (const exp of resumeData.experience) {
        // Handle both object and string formats
        if (typeof exp === 'object') {
          if (!exp.startDate && !exp.start_date && !exp.from) score -= 5;
          if (!exp.endDate && !exp.end_date && !exp.to) score -= 5;
          if (!exp.company && !exp.organization) score -= 5;
          if (!exp.position && !exp.title && !exp.role) score -= 5;
        }
        // String format is acceptable, don't penalize
      }
    }

    // Check for proper education formatting
    if (resumeData.education && Array.isArray(resumeData.education)) {
      for (const edu of resumeData.education) {
        if (typeof edu === 'object') {
          if (!edu.institution && !edu.school && !edu.university) score -= 5;
          if (!edu.degree && !edu.qualification) score -= 5;
        }
      }
    }

    // Check for quantifiable achievements
    let hasQuantifiableAchievements = false;
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      for (const exp of resumeData.experience) {
        let textToCheck = '';
        
        if (typeof exp === 'string') {
          textToCheck = exp;
        } else if (typeof exp === 'object') {
          textToCheck = (exp.description || '') + ' ' + 
                       (exp.achievements ? (Array.isArray(exp.achievements) ? exp.achievements.join(' ') : exp.achievements) : '');
        }
        
        const hasNumbers = /\d+%|\d+x|\$\d+|\d+ (users|customers|projects|team|million|thousand)/i.test(textToCheck);
        if (hasNumbers) {
          hasQuantifiableAchievements = true;
          break;
        }
      }
    }
    if (hasQuantifiableAchievements) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Score keyword optimization (0-100)
   */
  private scoreKeywords(resumeData: any): number {
    let score = 0;

    // Check for action verbs in experience
    const actionVerbs = [
      'developed', 'created', 'managed', 'led', 'implemented', 'designed',
      'built', 'improved', 'optimized', 'increased', 'reduced', 'achieved',
      'architected', 'delivered', 'launched', 'established', 'coordinated'
    ];

    let actionVerbCount = 0;
    if (resumeData.experience && Array.isArray(resumeData.experience)) {
      for (const exp of resumeData.experience) {
        let text = '';
        
        if (typeof exp === 'string') {
          text = exp;
        } else if (typeof exp === 'object') {
          text = (exp.description || '') + ' ' + 
                (exp.achievements ? (Array.isArray(exp.achievements) ? exp.achievements.join(' ') : exp.achievements) : '');
        }
        
        const lowerText = text.toLowerCase();
        actionVerbCount += actionVerbs.filter(verb => lowerText.includes(verb)).length;
      }
    }

    score += Math.min(actionVerbCount * 5, 40);

    // Check for technical keywords in skills
    if (resumeData.skills && Array.isArray(resumeData.skills) && resumeData.skills.length >= 5) {
      score += 30;
    } else if (resumeData.skills && Array.isArray(resumeData.skills)) {
      score += (resumeData.skills.length / 5) * 30;
    }

    // Check for industry-specific terms
    const hasIndustryTerms = resumeData.summary && (
      /software|engineering|development|data|cloud|ai|machine learning|devops|frontend|backend|fullstack/i.test(resumeData.summary)
    );
    if (hasIndustryTerms) score += 15;

    // Check for certifications
    if (resumeData.certifications && Array.isArray(resumeData.certifications) && resumeData.certifications.length > 0) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Score experience quality (0-100)
   */
  private scoreExperience(resumeData: any): number {
    if (!resumeData.experience || !Array.isArray(resumeData.experience) || resumeData.experience.length === 0) {
      return 0;
    }

    let score = 0;

    // Base score for having experience
    score += 30;

    // Score based on number of experiences
    score += Math.min(resumeData.experience.length * 10, 30);

    // Score based on content quality (achievements, details)
    let totalContentScore = 0;
    for (const exp of resumeData.experience) {
      if (typeof exp === 'string') {
        // String format - score based on length and content
        if (exp.length > 50) totalContentScore += 5;
        if (exp.length > 100) totalContentScore += 5;
      } else if (typeof exp === 'object') {
        // Object format - check for achievements
        if (exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0) {
          totalContentScore += exp.achievements.length * 5;
        }
        // Check for description
        if (exp.description && exp.description.length > 50) {
          totalContentScore += 5;
        }
      }
    }
    score += Math.min(totalContentScore, 20);

    // Score based on technologies mentioned (if available)
    let totalTechnologies = 0;
    for (const exp of resumeData.experience) {
      if (typeof exp === 'object' && exp.technologies && Array.isArray(exp.technologies)) {
        totalTechnologies += exp.technologies.length;
      }
    }
    score += Math.min(totalTechnologies * 2, 20);

    return Math.min(100, score);
  }

  /**
   * Score education quality (0-100)
   */
  private scoreEducation(resumeData: any): number {
    if (!resumeData.education || resumeData.education.length === 0) {
      return 50; // Not having education shouldn't penalize too much
    }

    let score = 60; // Base score for having education

    // Score based on degree level
    for (const edu of resumeData.education) {
      const degree = (edu.degree || '').toLowerCase();
      if (degree.includes('phd') || degree.includes('doctorate')) {
        score += 20;
      } else if (degree.includes('master') || degree.includes('msc') || degree.includes('mba')) {
        score += 15;
      } else if (degree.includes('bachelor') || degree.includes('bsc') || degree.includes('btech')) {
        score += 10;
      }
    }

    // Score based on GPA if provided
    for (const edu of resumeData.education) {
      if (edu.gpa) {
        const gpaNum = parseFloat(edu.gpa);
        if (gpaNum >= 3.5) score += 10;
        else if (gpaNum >= 3.0) score += 5;
      }
    }

    // Score based on achievements
    for (const edu of resumeData.education) {
      if (edu.achievements && edu.achievements.length > 0) {
        score += Math.min(edu.achievements.length * 5, 10);
      }
    }

    return Math.min(100, score);
  }

  /**
   * Score skills section (0-100)
   */
  private scoreSkills(resumeData: any): number {
    if (!resumeData.skills || resumeData.skills.length === 0) {
      return 0;
    }

    let score = 0;

    // Base score for having skills
    score += 30;

    // Score based on number of skills
    if (resumeData.skills.length >= 10) {
      score += 40;
    } else {
      score += (resumeData.skills.length / 10) * 40;
    }

    // Score based on skill diversity (check for different categories)
    const categories = new Set();
    for (const skill of resumeData.skills) {
      if (skill.category) {
        categories.add(skill.category);
      }
    }
    score += Math.min(categories.size * 5, 30);

    return Math.min(100, score);
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(resumeData: any, scores: any): string[] {
    const suggestions: string[] = [];

    if (scores.completeness < 80) {
      if (!resumeData.summary || resumeData.summary.length < 50) {
        suggestions.push('Add a professional summary (2-3 sentences) highlighting your key qualifications');
      }
      if (!resumeData.objective || resumeData.objective.length < 30) {
        suggestions.push('Include a career objective stating your professional goals');
      }
      if (!resumeData.personalInfo?.linkedin && !resumeData.personalInfo?.github) {
        suggestions.push('Add LinkedIn or GitHub profile link to increase credibility');
      }
      if (!resumeData.projects || resumeData.projects.length === 0) {
        suggestions.push('Add relevant projects to showcase your practical experience');
      }
    }

    if (scores.formatting < 80) {
      suggestions.push('Ensure all dates are in consistent format (YYYY-MM)');
      suggestions.push('Add quantifiable achievements (e.g., "Increased sales by 25%")');
    }

    if (scores.keywords < 70) {
      suggestions.push('Use more action verbs (developed, created, managed, led, implemented)');
      suggestions.push('Include industry-specific keywords relevant to your target role');
    }

    if (scores.experience < 70) {
      if (!resumeData.experience || resumeData.experience.length === 0) {
        suggestions.push('Add work experience with detailed descriptions and achievements');
      } else {
        suggestions.push('Add more specific achievements and technologies used in each role');
      }
    }

    if (scores.skills < 70) {
      suggestions.push('Add more relevant technical and soft skills (aim for 10-15 skills)');
      suggestions.push('Organize skills by category (Programming, Frameworks, Tools, etc.)');
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Identify resume strengths
   */
  private identifyStrengths(resumeData: any, scores: any): string[] {
    const strengths: string[] = [];

    if (scores.completeness >= 80) {
      strengths.push('Comprehensive resume with all essential sections');
    }

    if (scores.formatting >= 80) {
      strengths.push('Well-formatted with clear structure and quantifiable achievements');
    }

    if (scores.keywords >= 80) {
      strengths.push('Strong use of action verbs and industry keywords');
    }

    if (scores.experience >= 80) {
      strengths.push('Solid work experience with detailed accomplishments');
    }

    if (scores.education >= 90) {
      strengths.push('Strong educational background');
    }

    if (scores.skills >= 80) {
      strengths.push('Diverse and well-organized skill set');
    }

    if (resumeData.certifications && resumeData.certifications.length > 0) {
      strengths.push(`${resumeData.certifications.length} professional certification(s)`);
    }

    if (resumeData.projects && resumeData.projects.length >= 3) {
      strengths.push('Multiple projects demonstrating practical experience');
    }

    return strengths;
  }
}

export const atsScorer = new ATSScorer();
