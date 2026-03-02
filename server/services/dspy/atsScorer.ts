import { groqService } from '../groqService.js';

/**
 * ATS (Applicant Tracking System) Scorer
 * Evaluates resume quality and ATS-friendliness using AI
 */
export class ATSScorer {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    console.log('🎯 Initializing ATS Scorer...');
    this.initialized = true;
    console.log('✅ ATS Scorer ready');
  }

  /**
   * Calculate ATS score for a resume
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

    console.log('🎯 Calculating ATS score...');

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

    console.log(`✅ ATS Score calculated: ${overallScore}/100`);

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
