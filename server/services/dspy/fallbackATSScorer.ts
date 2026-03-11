/**
 * Fallback ATS Scorer - Works without external APIs
 * Provides basic ATS scoring using rule-based analysis
 */
export class FallbackATSScorer {
  
  async calculateScore(resumeData: any) {
    console.log('🎯 Using fallback ATS scorer (no external API required)');
    
    const scores = {
      completeness: this.calculateCompleteness(resumeData),
      formatting: this.calculateFormatting(resumeData),
      keywords: this.calculateKeywords(resumeData),
      experience: this.calculateExperience(resumeData),
      education: this.calculateEducation(resumeData),
      skills: this.calculateSkills(resumeData)
    };
    
    // Calculate weighted overall score
    const overallScore = Math.round(
      (scores.completeness * 0.25) +
      (scores.formatting * 0.15) +
      (scores.keywords * 0.20) +
      (scores.experience * 0.20) +
      (scores.education * 0.10) +
      (scores.skills * 0.10)
    );
    
    const suggestions = this.generateSuggestions(scores, resumeData);
    const strengths = this.generateStrengths(scores, resumeData);
    
    return {
      overallScore,
      scores,
      suggestions,
      strengths
    };
  }
  
  private calculateCompleteness(resumeData: any): number {
    let score = 0;
    const maxScore = 100;
    
    // Personal info (30 points)
    if (resumeData.personalInfo?.name || resumeData.personalInfo?.firstName) score += 10;
    if (resumeData.personalInfo?.email) score += 10;
    if (resumeData.personalInfo?.phone) score += 10;
    
    // Summary/Objective (20 points)
    if (resumeData.summary || resumeData.objective) score += 20;
    
    // Experience (25 points)
    if (resumeData.experience && resumeData.experience.length > 0) score += 25;
    
    // Education (15 points)
    if (resumeData.education && resumeData.education.length > 0) score += 15;
    
    // Skills (10 points)
    if (resumeData.skills && resumeData.skills.length > 0) score += 10;
    
    return Math.min(score, maxScore);
  }
  
  private calculateFormatting(resumeData: any): number {
    let score = 80; // Start with good base score
    
    // Check for consistent data structure
    if (!resumeData.personalInfo) score -= 20;
    if (!Array.isArray(resumeData.experience)) score -= 15;
    if (!Array.isArray(resumeData.education)) score -= 10;
    if (!Array.isArray(resumeData.skills)) score -= 10;
    
    return Math.max(0, Math.min(score, 100));
  }
  
  private calculateKeywords(resumeData: any): number {
    let score = 0;
    const keywords = this.extractKeywords(resumeData);
    
    // Technical skills keywords
    const techKeywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'git'];
    const foundTechKeywords = keywords.filter(k => 
      techKeywords.some(tech => k.toLowerCase().includes(tech))
    );
    score += Math.min(foundTechKeywords.length * 10, 40);
    
    // Action verbs
    const actionVerbs = ['developed', 'implemented', 'managed', 'led', 'created', 'designed'];
    const foundActionVerbs = keywords.filter(k => 
      actionVerbs.some(verb => k.toLowerCase().includes(verb))
    );
    score += Math.min(foundActionVerbs.length * 8, 30);
    
    // Industry terms
    if (keywords.length > 20) score += 20;
    else if (keywords.length > 10) score += 10;
    
    return Math.min(score, 100);
  }
  
  private calculateExperience(resumeData: any): number {
    if (!resumeData.experience || resumeData.experience.length === 0) return 0;
    
    let score = 0;
    const experiences = resumeData.experience;
    
    // Number of positions
    score += Math.min(experiences.length * 15, 45);
    
    // Check for descriptions
    const withDescriptions = experiences.filter(exp => exp.description || exp.responsibilities);
    score += Math.min(withDescriptions.length * 10, 30);
    
    // Check for quantifiable achievements
    const withNumbers = experiences.filter(exp => 
      (exp.description || exp.responsibilities || '').match(/\d+%|\$\d+|\d+\+/)
    );
    score += Math.min(withNumbers.length * 12, 25);
    
    return Math.min(score, 100);
  }
  
  private calculateEducation(resumeData: any): number {
    if (!resumeData.education || resumeData.education.length === 0) return 30; // Basic score
    
    let score = 50; // Base score for having education
    
    const education = resumeData.education;
    
    // Check for degree information
    const withDegrees = education.filter(edu => edu.degree || edu.qualification);
    score += Math.min(withDegrees.length * 15, 30);
    
    // Check for institution names
    const withInstitutions = education.filter(edu => edu.institution || edu.school);
    score += Math.min(withInstitutions.length * 10, 20);
    
    return Math.min(score, 100);
  }
  
  private calculateSkills(resumeData: any): number {
    if (!resumeData.skills || resumeData.skills.length === 0) return 0;
    
    let score = 0;
    const skills = resumeData.skills;
    
    // Number of skills
    if (skills.length >= 10) score += 40;
    else if (skills.length >= 5) score += 25;
    else score += skills.length * 5;
    
    // Technical skills bonus
    const techSkills = skills.filter(skill => 
      typeof skill === 'string' && 
      /javascript|python|react|node|sql|aws|docker|git|java|c\+\+/i.test(skill)
    );
    score += Math.min(techSkills.length * 8, 40);
    
    // Soft skills bonus
    const softSkills = skills.filter(skill => 
      typeof skill === 'string' && 
      /leadership|communication|teamwork|problem.solving|management/i.test(skill)
    );
    score += Math.min(softSkills.length * 5, 20);
    
    return Math.min(score, 100);
  }
  
  private extractKeywords(resumeData: any): string[] {
    const keywords: string[] = [];
    
    // From summary/objective
    if (resumeData.summary) keywords.push(...resumeData.summary.split(/\s+/));
    if (resumeData.objective) keywords.push(...resumeData.objective.split(/\s+/));
    
    // From experience
    if (resumeData.experience) {
      resumeData.experience.forEach((exp: any) => {
        if (exp.description) keywords.push(...exp.description.split(/\s+/));
        if (exp.responsibilities) keywords.push(...exp.responsibilities.split(/\s+/));
      });
    }
    
    // From skills
    if (resumeData.skills) {
      resumeData.skills.forEach((skill: any) => {
        if (typeof skill === 'string') keywords.push(skill);
      });
    }
    
    return keywords.filter(k => k.length > 2); // Filter out short words
  }
  
  private generateSuggestions(scores: any, resumeData: any): string[] {
    const suggestions: string[] = [];
    
    if (scores.completeness < 80) {
      suggestions.push('Add missing contact information (phone, email, location)');
      if (!resumeData.summary && !resumeData.objective) {
        suggestions.push('Include a professional summary or career objective');
      }
    }
    
    if (scores.experience < 70) {
      suggestions.push('Add more detailed work experience descriptions');
      suggestions.push('Include quantifiable achievements with specific numbers and percentages');
    }
    
    if (scores.skills < 60) {
      suggestions.push('Add more relevant technical skills');
      suggestions.push('Include both hard and soft skills');
    }
    
    if (scores.keywords < 60) {
      suggestions.push('Use more industry-specific keywords and terminology');
      suggestions.push('Include action verbs like "developed", "implemented", "managed"');
    }
    
    if (scores.education < 70) {
      suggestions.push('Provide complete education details including degrees and institutions');
    }
    
    return suggestions;
  }
  
  private generateStrengths(scores: any, resumeData: any): string[] {
    const strengths: string[] = [];
    
    if (scores.completeness >= 80) {
      strengths.push('Complete contact information and profile details');
    }
    
    if (scores.experience >= 70) {
      strengths.push('Well-documented work experience');
    }
    
    if (scores.skills >= 70) {
      strengths.push('Comprehensive skills section');
    }
    
    if (scores.keywords >= 70) {
      strengths.push('Good use of industry keywords and terminology');
    }
    
    if (resumeData.experience && resumeData.experience.length >= 3) {
      strengths.push('Extensive professional experience');
    }
    
    return strengths;
  }
}

export const fallbackATSScorer = new FallbackATSScorer();