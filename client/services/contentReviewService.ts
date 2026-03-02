import { 
  TemplateSpecificContent, 
  ValidationResult,
  ContentQualityMetrics 
} from '../types/templateContent';

export interface ReviewCriteria {
  skillRelevance: {
    weight: number;
    minScore: number;
    description: string;
  };
  experienceConsistency: {
    weight: number;
    minScore: number;
    description: string;
  };
  projectRelevance: {
    weight: number;
    minScore: number;
    description: string;
  };
  contentQuality: {
    weight: number;
    minScore: number;
    description: string;
  };
  completeness: {
    weight: number;
    minScore: number;
    description: string;
  };
}

export interface DetailedReviewResult {
  overallScore: number;
  passed: boolean;
  criteria: {
    skillRelevance: ReviewCriteriaResult;
    experienceConsistency: ReviewCriteriaResult;
    projectRelevance: ReviewCriteriaResult;
    contentQuality: ReviewCriteriaResult;
    completeness: ReviewCriteriaResult;
  };
  recommendations: string[];
  requiredFixes: string[];
  warnings: string[];
}

export interface ReviewCriteriaResult {
  score: number;
  passed: boolean;
  feedback: string;
  suggestions: string[];
}

/**
 * Content Review Service
 * Provides comprehensive review and quality assessment for template content
 */
export class ContentReviewService {
  private readonly DEFAULT_CRITERIA: ReviewCriteria = {
    skillRelevance: {
      weight: 0.25,
      minScore: 70,
      description: 'Skills must be relevant to the target role and properly categorized'
    },
    experienceConsistency: {
      weight: 0.25,
      minScore: 75,
      description: 'Experience must be consistent with role level and industry context'
    },
    projectRelevance: {
      weight: 0.20,
      minScore: 70,
      description: 'Projects must demonstrate role-specific skills and impact'
    },
    contentQuality: {
      weight: 0.20,
      minScore: 80,
      description: 'Content must be well-written, professional, and error-free'
    },
    completeness: {
      weight: 0.10,
      minScore: 85,
      description: 'All required sections must be complete and comprehensive'
    }
  };

  /**
   * Perform comprehensive review of template content
   */
  reviewContent(
    content: TemplateSpecificContent,
    criteria: ReviewCriteria = this.DEFAULT_CRITERIA
  ): DetailedReviewResult {
    const skillRelevance = this.evaluateSkillRelevance(content);
    const experienceConsistency = this.evaluateExperienceConsistency(content);
    const projectRelevance = this.evaluateProjectRelevance(content);
    const contentQuality = this.evaluateContentQuality(content);
    const completeness = this.evaluateCompleteness(content);

    // Calculate weighted overall score
    const overallScore = Math.round(
      skillRelevance.score * criteria.skillRelevance.weight +
      experienceConsistency.score * criteria.experienceConsistency.weight +
      projectRelevance.score * criteria.projectRelevance.weight +
      contentQuality.score * criteria.contentQuality.weight +
      completeness.score * criteria.completeness.weight
    );

    // Check if all criteria pass
    const passed = 
      skillRelevance.score >= criteria.skillRelevance.minScore &&
      experienceConsistency.score >= criteria.experienceConsistency.minScore &&
      projectRelevance.score >= criteria.projectRelevance.minScore &&
      contentQuality.score >= criteria.contentQuality.minScore &&
      completeness.score >= criteria.completeness.minScore;

    // Collect recommendations and required fixes
    const recommendations: string[] = [];
    const requiredFixes: string[] = [];
    const warnings: string[] = [];

    [skillRelevance, experienceConsistency, projectRelevance, contentQuality, completeness]
      .forEach(result => {
        recommendations.push(...result.suggestions);
        if (!result.passed) {
          requiredFixes.push(result.feedback);
        }
      });

    // Add specific warnings
    if (overallScore < 60) {
      warnings.push('Overall content quality is below acceptable standards');
    }
    if (content.skills.length < 5) {
      warnings.push('Consider adding more skills to better represent the role');
    }
    if (content.experiences.length < 2) {
      warnings.push('Consider adding more work experience entries');
    }

    return {
      overallScore,
      passed,
      criteria: {
        skillRelevance,
        experienceConsistency,
        projectRelevance,
        contentQuality,
        completeness
      },
      recommendations: [...new Set(recommendations)], // Remove duplicates
      requiredFixes: [...new Set(requiredFixes)],
      warnings: [...new Set(warnings)]
    };
  }

  /**
   * Evaluate skill relevance to the target role
   */
  private evaluateSkillRelevance(content: TemplateSpecificContent): ReviewCriteriaResult {
    let score = 0;
    const suggestions: string[] = [];
    let feedback = '';

    // Extract role from template ID
    const role = this.extractRoleFromTemplateId(content.templateId);
    
    // Check if skills are relevant to the role
    const coreSkills = content.skills.filter(skill => skill.isCore);
    const skillRelevanceScores = content.skills.map(skill => skill.relevanceScore || 5);
    const avgRelevanceScore = skillRelevanceScores.length > 0 
      ? skillRelevanceScores.reduce((sum, score) => sum + score, 0) / skillRelevanceScores.length 
      : 0;

    // Base score from average relevance
    score = Math.min(avgRelevanceScore * 10, 100);

    // Bonus for having core skills
    if (coreSkills.length >= 3) {
      score += 10;
    } else if (coreSkills.length >= 1) {
      score += 5;
    }

    // Penalty for too few skills
    if (content.skills.length < 5) {
      score -= 20;
      suggestions.push('Add more skills relevant to the role');
    }

    // Penalty for skills with low relevance scores
    const lowRelevanceSkills = content.skills.filter(skill => (skill.relevanceScore || 0) < 5);
    if (lowRelevanceSkills.length > 0) {
      score -= lowRelevanceSkills.length * 5;
      suggestions.push('Review skills with low relevance scores');
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 70) {
      feedback = 'Skills are well-aligned with the target role';
    } else if (score >= 50) {
      feedback = 'Skills are somewhat relevant but could be improved';
    } else {
      feedback = 'Skills need significant improvement for role relevance';
    }

    return {
      score,
      passed: score >= 70,
      feedback,
      suggestions
    };
  }

  /**
   * Evaluate experience consistency with role and level
   */
  private evaluateExperienceConsistency(content: TemplateSpecificContent): ReviewCriteriaResult {
    let score = 80; // Start with base score
    const suggestions: string[] = [];
    let feedback = '';

    // Check experience level consistency
    const experienceLevels = content.experiences.map(exp => exp.roleLevel);
    const uniqueLevels = [...new Set(experienceLevels)];
    
    if (uniqueLevels.length > 2) {
      score -= 15;
      suggestions.push('Experience levels should be consistent with career progression');
    }

    // Check for achievements in experiences
    const experiencesWithAchievements = content.experiences.filter(exp => exp.achievements.length > 0);
    if (experiencesWithAchievements.length === 0) {
      score -= 20;
      suggestions.push('Add specific achievements to work experiences');
    }

    // Check for technology/skills alignment
    const experienceTechnologies = content.experiences.flatMap(exp => exp.technologies);
    const skillNames = content.skills.map(skill => skill.name);
    const alignedTechnologies = experienceTechnologies.filter(tech => 
      skillNames.some(skill => skill.toLowerCase().includes(tech.toLowerCase()))
    );
    
    const alignmentRatio = experienceTechnologies.length > 0 
      ? alignedTechnologies.length / experienceTechnologies.length 
      : 0;
    
    if (alignmentRatio < 0.5) {
      score -= 15;
      suggestions.push('Ensure technologies in experience align with listed skills');
    }

    // Check for industry context appropriateness
    const industryContexts = content.experiences.map(exp => exp.industryContext);
    if (industryContexts.some(context => !context || context.trim() === '')) {
      score -= 10;
      suggestions.push('Specify industry context for all work experiences');
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 75) {
      feedback = 'Experience is consistent and well-structured';
    } else if (score >= 60) {
      feedback = 'Experience has some inconsistencies that should be addressed';
    } else {
      feedback = 'Experience needs significant improvements for consistency';
    }

    return {
      score,
      passed: score >= 75,
      feedback,
      suggestions
    };
  }

  /**
   * Evaluate project relevance to the role
   */
  private evaluateProjectRelevance(content: TemplateSpecificContent): ReviewCriteriaResult {
    let score = 70; // Start with base score
    const suggestions: string[] = [];
    let feedback = '';

    if (content.projects.length === 0) {
      score = 30;
      suggestions.push('Add relevant projects to demonstrate skills');
      feedback = 'No projects provided - projects are important for showcasing abilities';
      return { score, passed: false, feedback, suggestions };
    }

    // Check for role-specific projects
    const roleSpecificProjects = content.projects.filter(project => project.roleSpecific);
    if (roleSpecificProjects.length === 0) {
      score -= 20;
      suggestions.push('Include projects that are specific to the target role');
    }

    // Check for impact metrics
    const projectsWithImpact = content.projects.filter(project => 
      project.impact && project.impact.trim() !== '' && project.impact !== '[Quantifiable impact or results]'
    );
    if (projectsWithImpact.length === 0) {
      score -= 15;
      suggestions.push('Add quantifiable impact metrics to projects');
    }

    // Check for technology alignment
    const projectTechnologies = content.projects.flatMap(project => project.technologies);
    const skillNames = content.skills.map(skill => skill.name);
    const alignedTechnologies = projectTechnologies.filter(tech => 
      skillNames.some(skill => skill.toLowerCase().includes(tech.toLowerCase()))
    );
    
    const alignmentRatio = projectTechnologies.length > 0 
      ? alignedTechnologies.length / projectTechnologies.length 
      : 0;
    
    if (alignmentRatio < 0.6) {
      score -= 10;
      suggestions.push('Ensure project technologies align with listed skills');
    }

    // Check for project descriptions quality
    const projectsWithGoodDescriptions = content.projects.filter(project => 
      project.description && project.description.length > 50 && 
      !project.description.includes('[') && !project.description.includes(']')
    );
    
    if (projectsWithGoodDescriptions.length < content.projects.length * 0.8) {
      score -= 10;
      suggestions.push('Improve project descriptions with more detail');
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 70) {
      feedback = 'Projects are relevant and well-documented';
    } else if (score >= 50) {
      feedback = 'Projects are somewhat relevant but need improvement';
    } else {
      feedback = 'Projects need significant improvement for role relevance';
    }

    return {
      score,
      passed: score >= 70,
      feedback,
      suggestions
    };
  }

  /**
   * Evaluate overall content quality
   */
  private evaluateContentQuality(content: TemplateSpecificContent): ReviewCriteriaResult {
    let score = 90; // Start with high base score
    const suggestions: string[] = [];
    let feedback = '';

    // Check professional summary quality
    if (!content.professionalSummary || content.professionalSummary.length < 50) {
      score -= 15;
      suggestions.push('Improve professional summary with more detail');
    } else if (content.professionalSummary.includes('[') || content.professionalSummary.includes(']')) {
      score -= 10;
      suggestions.push('Remove placeholder text from professional summary');
    }

    // Check for placeholder text
    const contentString = JSON.stringify(content);
    const placeholderCount = (contentString.match(/\[.*?\]/g) || []).length;
    if (placeholderCount > 0) {
      score -= Math.min(placeholderCount * 2, 20);
      suggestions.push('Replace all placeholder text with actual content');
    }

    // Check email format
    if (content.personalInfo.email && !this.isValidEmail(content.personalInfo.email)) {
      score -= 5;
      suggestions.push('Use a valid email format');
    }

    // Check for empty required fields
    const requiredFields = [
      content.personalInfo.name,
      content.personalInfo.title,
      content.professionalSummary,
      content.objective
    ];
    
    const emptyFields = requiredFields.filter(field => !field || field.trim() === '');
    if (emptyFields.length > 0) {
      score -= emptyFields.length * 10;
      suggestions.push('Fill in all required fields');
    }

    // Check for professional language
    const unprofessionalWords = ['awesome', 'cool', 'stuff', 'things', 'etc.'];
    const hasUnprofessionalLanguage = unprofessionalWords.some(word => 
      contentString.toLowerCase().includes(word)
    );
    
    if (hasUnprofessionalLanguage) {
      score -= 5;
      suggestions.push('Use more professional language throughout');
    }

    score = Math.max(0, Math.min(100, score));

    if (score >= 80) {
      feedback = 'Content quality is excellent and professional';
    } else if (score >= 65) {
      feedback = 'Content quality is good but has room for improvement';
    } else {
      feedback = 'Content quality needs significant improvement';
    }

    return {
      score,
      passed: score >= 80,
      feedback,
      suggestions
    };
  }

  /**
   * Evaluate content completeness
   */
  private evaluateCompleteness(content: TemplateSpecificContent): ReviewCriteriaResult {
    let score = 0;
    const suggestions: string[] = [];
    let feedback = '';

    const maxScore = 100;
    let currentScore = 0;

    // Personal info completeness (20 points)
    const personalInfoFields = [
      content.personalInfo.name,
      content.personalInfo.title,
      content.personalInfo.email,
      content.personalInfo.location
    ];
    const filledPersonalFields = personalInfoFields.filter(field => field && field.trim() !== '').length;
    currentScore += (filledPersonalFields / personalInfoFields.length) * 20;

    // Professional summary (15 points)
    if (content.professionalSummary && content.professionalSummary.length > 50) {
      currentScore += 15;
    } else if (content.professionalSummary && content.professionalSummary.length > 20) {
      currentScore += 8;
    }

    // Skills (20 points)
    if (content.skills.length >= 8) {
      currentScore += 20;
    } else if (content.skills.length >= 5) {
      currentScore += 15;
    } else if (content.skills.length >= 3) {
      currentScore += 10;
    }

    // Experience (25 points)
    if (content.experiences.length >= 3) {
      currentScore += 25;
    } else if (content.experiences.length >= 2) {
      currentScore += 18;
    } else if (content.experiences.length >= 1) {
      currentScore += 10;
    }

    // Education (10 points)
    if (content.education.length >= 1) {
      currentScore += 10;
    }

    // Projects (10 points)
    if (content.projects.length >= 2) {
      currentScore += 10;
    } else if (content.projects.length >= 1) {
      currentScore += 5;
    }

    score = Math.round(currentScore);

    // Add suggestions based on missing elements
    if (content.skills.length < 5) {
      suggestions.push('Add more skills to better represent capabilities');
    }
    if (content.experiences.length < 2) {
      suggestions.push('Add more work experience entries');
    }
    if (content.projects.length < 1) {
      suggestions.push('Add relevant projects to showcase abilities');
    }
    if (!content.personalInfo.linkedin && !content.personalInfo.github) {
      suggestions.push('Add professional social media profiles');
    }

    if (score >= 85) {
      feedback = 'Content is comprehensive and complete';
    } else if (score >= 70) {
      feedback = 'Content is mostly complete but missing some elements';
    } else {
      feedback = 'Content is incomplete and needs more information';
    }

    return {
      score,
      passed: score >= 85,
      feedback,
      suggestions
    };
  }

  /**
   * Extract role from template ID
   */
  private extractRoleFromTemplateId(templateId: string): string {
    // Remove level indicators and extract role
    return templateId
      .replace(/-senior|-junior|-entry|-mid|-executive/g, '')
      .replace(/-/g, ' ')
      .toLowerCase();
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate review report
   */
  generateReviewReport(content: TemplateSpecificContent, review: DetailedReviewResult): string {
    const report = `
# Template Content Review Report

**Template ID:** ${content.templateId}
**Overall Score:** ${review.overallScore}/100
**Status:** ${review.passed ? 'PASSED' : 'FAILED'}

## Criteria Evaluation

### Skill Relevance (${review.criteria.skillRelevance.score}/100)
${review.criteria.skillRelevance.feedback}
${review.criteria.skillRelevance.suggestions.map(s => `- ${s}`).join('\n')}

### Experience Consistency (${review.criteria.experienceConsistency.score}/100)
${review.criteria.experienceConsistency.feedback}
${review.criteria.experienceConsistency.suggestions.map(s => `- ${s}`).join('\n')}

### Project Relevance (${review.criteria.projectRelevance.score}/100)
${review.criteria.projectRelevance.feedback}
${review.criteria.projectRelevance.suggestions.map(s => `- ${s}`).join('\n')}

### Content Quality (${review.criteria.contentQuality.score}/100)
${review.criteria.contentQuality.feedback}
${review.criteria.contentQuality.suggestions.map(s => `- ${s}`).join('\n')}

### Completeness (${review.criteria.completeness.score}/100)
${review.criteria.completeness.feedback}
${review.criteria.completeness.suggestions.map(s => `- ${s}`).join('\n')}

## Recommendations
${review.recommendations.map(r => `- ${r}`).join('\n')}

## Required Fixes
${review.requiredFixes.map(f => `- ${f}`).join('\n')}

## Warnings
${review.warnings.map(w => `- ${w}`).join('\n')}
    `.trim();

    return report;
  }
}

// Export singleton instance
export const contentReviewService = new ContentReviewService();