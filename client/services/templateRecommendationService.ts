/**
 * Template Recommendation Service
 * Implements algorithm to recommend templates based on user profile, industry, and experience level
 */

import { TemplateConfig, TemplateRecommendation, UserProfile, ExperienceLevel, VisualStyle } from './templateService';
import { UserProfileAnalysisService } from './userProfileAnalysisService';
import { RecommendationAnalyticsService } from './recommendationAnalyticsService';
import { Resume } from '@shared/api';

export interface RecommendationCriteria {
  industryMatch: number;
  experienceLevelMatch: number;
  roleMatch: number;
  skillsMatch: number;
  visualStyleMatch: number;
  atsOptimization: number;
  popularity: number;
}

export interface RecommendationWeights {
  industry: number;
  experienceLevel: number;
  role: number;
  skills: number;
  visualStyle: number;
  atsOptimization: number;
  popularity: number;
}

// Default weights for recommendation scoring
const DEFAULT_WEIGHTS: RecommendationWeights = {
  industry: 0.3,
  experienceLevel: 0.25,
  role: 0.2,
  skills: 0.15,
  visualStyle: 0.05,
  atsOptimization: 0.03,
  popularity: 0.02
};

// Industry-specific template preferences
const INDUSTRY_TEMPLATE_PREFERENCES = {
  technology: {
    preferredStyles: ['modern', 'minimal', 'corporate'],
    avoidStyles: ['creative'],
    requiredFeatures: ['showTechStack', 'showGithub'],
    preferredLayouts: ['sidebar', 'split']
  },
  healthcare: {
    preferredStyles: ['corporate', 'minimal'],
    avoidStyles: ['creative', 'bold'],
    requiredFeatures: ['showCertifications'],
    preferredLayouts: ['traditional', 'academic']
  },
  finance: {
    preferredStyles: ['corporate', 'minimal'],
    avoidStyles: ['creative', 'bold'],
    requiredFeatures: ['showMetrics'],
    preferredLayouts: ['traditional', 'executive']
  },
  legal: {
    preferredStyles: ['corporate', 'minimal'],
    avoidStyles: ['creative', 'bold', 'modern'],
    requiredFeatures: ['showCertifications'],
    preferredLayouts: ['traditional', 'academic']
  },
  education: {
    preferredStyles: ['corporate', 'minimal'],
    avoidStyles: ['bold'],
    requiredFeatures: ['showPublications', 'showCertifications'],
    preferredLayouts: ['academic', 'traditional']
  },
  nonprofit: {
    preferredStyles: ['creative', 'modern', 'minimal'],
    avoidStyles: [],
    requiredFeatures: ['showCampaigns'],
    preferredLayouts: ['creative', 'modern']
  },
  consulting: {
    preferredStyles: ['corporate', 'modern', 'minimal'],
    avoidStyles: ['creative'],
    requiredFeatures: ['showMetrics', 'showTeamSize'],
    preferredLayouts: ['executive', 'modern']
  },
  design: {
    preferredStyles: ['creative', 'bold', 'modern'],
    avoidStyles: ['minimal'],
    requiredFeatures: ['showPortfolio', 'showDesignTools'],
    preferredLayouts: ['portfolio', 'creative']
  },
  marketing: {
    preferredStyles: ['creative', 'modern', 'bold'],
    avoidStyles: [],
    requiredFeatures: ['showCampaigns', 'showMetrics'],
    preferredLayouts: ['creative', 'modern']
  },
  sales: {
    preferredStyles: ['bold', 'modern', 'corporate'],
    avoidStyles: ['minimal'],
    requiredFeatures: ['showMetrics', 'showTeamSize'],
    preferredLayouts: ['results', 'modern']
  }
};

// Experience level template preferences
const EXPERIENCE_LEVEL_PREFERENCES = {
  entry: {
    preferredStyles: ['modern', 'creative'],
    avoidStyles: ['corporate'],
    emphasizeFeatures: ['showEducation', 'showProjects'],
    layoutPreference: 'modern'
  },
  mid: {
    preferredStyles: ['modern', 'corporate', 'minimal'],
    avoidStyles: [],
    emphasizeFeatures: ['showExperience', 'showSkills'],
    layoutPreference: 'balanced'
  },
  senior: {
    preferredStyles: ['corporate', 'minimal', 'modern'],
    avoidStyles: ['creative'],
    emphasizeFeatures: ['showExperience', 'showMetrics', 'showTeamSize'],
    layoutPreference: 'executive'
  },
  executive: {
    preferredStyles: ['corporate', 'minimal'],
    avoidStyles: ['creative', 'bold'],
    emphasizeFeatures: ['showMetrics', 'showTeamSize'],
    layoutPreference: 'executive'
  }
};

export class TemplateRecommendationService {
  /**
   * Generates template recommendations for a user based on their resume
   */
  static async generateRecommendations(
    resume: Resume,
    availableTemplates: TemplateConfig[],
    weights: RecommendationWeights = DEFAULT_WEIGHTS
  ): Promise<TemplateRecommendation[]> {
    // Analyze user profile
    const userProfile = UserProfileAnalysisService.analyzeUserProfile(resume);
    
    // Score each template
    const scoredTemplates = availableTemplates.map(template => {
      const score = this.calculateTemplateScore(template, userProfile, weights);
      const reasons = this.generateRecommendationReasons(template, userProfile, score);
      const category = this.categorizeRecommendation(score);
      
      return {
        template,
        score,
        reasons,
        category
      } as TemplateRecommendation;
    });

    // Sort by score and return top recommendations
    return scoredTemplates
      .sort((a, b) => b.score - a.score)
      .slice(0, 12); // Return top 12 recommendations
  }

  /**
   * Calculates a recommendation score for a template based on user profile
   */
  private static calculateTemplateScore(
    template: TemplateConfig,
    userProfile: UserProfile,
    weights: RecommendationWeights
  ): number {
    const criteria: RecommendationCriteria = {
      industryMatch: this.calculateIndustryMatch(template, userProfile),
      experienceLevelMatch: this.calculateExperienceLevelMatch(template, userProfile),
      roleMatch: this.calculateRoleMatch(template, userProfile),
      skillsMatch: this.calculateSkillsMatch(template, userProfile),
      visualStyleMatch: this.calculateVisualStyleMatch(template, userProfile),
      atsOptimization: this.calculateATSScore(template),
      popularity: this.calculatePopularityScore(template)
    };

    // Calculate weighted score
    const score = 
      criteria.industryMatch * weights.industry +
      criteria.experienceLevelMatch * weights.experienceLevel +
      criteria.roleMatch * weights.role +
      criteria.skillsMatch * weights.skills +
      criteria.visualStyleMatch * weights.visualStyle +
      criteria.atsOptimization * weights.atsOptimization +
      criteria.popularity * weights.popularity;

    return Math.min(100, Math.max(0, score)); // Clamp between 0-100
  }

  /**
   * Calculates industry match score
   */
  private static calculateIndustryMatch(template: TemplateConfig, userProfile: UserProfile): number {
    if (!userProfile.industry) return 50; // Neutral score if no industry detected

    // Direct industry match
    if (template.industry.toLowerCase().includes(userProfile.industry.toLowerCase()) ||
        template.category.includes(userProfile.industry)) {
      return 100;
    }

    // Check industry preferences
    const industryPrefs = INDUSTRY_TEMPLATE_PREFERENCES[userProfile.industry as keyof typeof INDUSTRY_TEMPLATE_PREFERENCES];
    if (!industryPrefs) return 50;

    let score = 50; // Base score

    // Check if template has required features for this industry
    const requiredFeatures = industryPrefs.requiredFeatures || [];
    const hasRequiredFeatures = requiredFeatures.every(feature => 
      template.features[feature as keyof typeof template.features]
    );
    
    if (hasRequiredFeatures) {
      score += 30;
    }

    // Check visual style compatibility
    const templateStyle = this.inferVisualStyle(template);
    if (industryPrefs.preferredStyles.includes(templateStyle)) {
      score += 15;
    } else if (industryPrefs.avoidStyles.includes(templateStyle)) {
      score -= 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates experience level match score
   */
  private static calculateExperienceLevelMatch(template: TemplateConfig, userProfile: UserProfile): number {
    if (!userProfile.experienceLevel) return 50;

    const levelPrefs = EXPERIENCE_LEVEL_PREFERENCES[userProfile.experienceLevel];
    if (!levelPrefs) return 50;

    let score = 50;

    // Check visual style preferences for experience level
    const templateStyle = this.inferVisualStyle(template);
    if (levelPrefs.preferredStyles.includes(templateStyle)) {
      score += 30;
    } else if (levelPrefs.avoidStyles.includes(templateStyle)) {
      score -= 20;
    }

    // Check if template emphasizes features important for this experience level
    const emphasizedFeatures = levelPrefs.emphasizeFeatures || [];
    const hasEmphasizedFeatures = emphasizedFeatures.some(feature => 
      template.features[feature as keyof typeof template.features]
    );
    
    if (hasEmphasizedFeatures) {
      score += 20;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates role match score
   */
  private static calculateRoleMatch(template: TemplateConfig, userProfile: UserProfile): number {
    if (!userProfile.role) return 50;

    const role = userProfile.role.toLowerCase();
    const templateName = template.name.toLowerCase();
    const templateDescription = template.description.toLowerCase();

    // Direct role match in template name or description
    if (templateName.includes(role) || templateDescription.includes(role)) {
      return 100;
    }

    // Check for role-related keywords
    const roleKeywords = this.extractRoleKeywords(userProfile.role);
    const matchingKeywords = roleKeywords.filter(keyword => 
      templateName.includes(keyword) || templateDescription.includes(keyword)
    );

    const matchRatio = matchingKeywords.length / roleKeywords.length;
    return 50 + (matchRatio * 50);
  }

  /**
   * Calculates skills match score
   */
  private static calculateSkillsMatch(template: TemplateConfig, userProfile: UserProfile): number {
    if (!userProfile.skills || userProfile.skills.length === 0) return 50;

    let score = 50;

    // Check if template supports showcasing user's key skills
    const userSkills = userProfile.skills.map(skill => skill.toLowerCase());
    
    // Technical skills boost for tech-focused templates
    const hasTechnicalSkills = userSkills.some(skill => 
      ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws'].includes(skill)
    );
    
    if (hasTechnicalSkills && template.features.showTechStack) {
      score += 25;
    }

    // Design skills boost for portfolio templates
    const hasDesignSkills = userSkills.some(skill => 
      ['photoshop', 'illustrator', 'figma', 'sketch', 'design'].includes(skill)
    );
    
    if (hasDesignSkills && template.features.showPortfolio) {
      score += 25;
    }

    return Math.min(100, score);
  }

  /**
   * Calculates visual style match score
   */
  private static calculateVisualStyleMatch(template: TemplateConfig, userProfile: UserProfile): number {
    if (!userProfile.preferences?.visualStyle) return 50;

    const templateStyle = this.inferVisualStyle(template);
    const userPreference = userProfile.preferences.visualStyle;

    if (templateStyle === userPreference) {
      return 100;
    }

    // Similar styles get partial credit
    const styleCompatibility = this.getStyleCompatibility(templateStyle, userPreference);
    return 50 + (styleCompatibility * 50);
  }

  /**
   * Calculates ATS optimization score
   */
  private static calculateATSScore(template: TemplateConfig): number {
    // Simple heuristic based on template features and layout
    let score = 70; // Base ATS score

    // Prefer simpler layouts for ATS
    if (template.layout.sidebarPosition === 'none') {
      score += 15;
    }

    // Prefer standard header styles
    if (['academic-formal', 'executive-minimal'].includes(template.layout.headerStyle)) {
      score += 10;
    }

    // Avoid overly creative styles
    const templateStyle = this.inferVisualStyle(template);
    if (['creative', 'bold'].includes(templateStyle)) {
      score -= 10;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculates popularity score (placeholder - would use real usage data)
   */
  private static calculatePopularityScore(template: TemplateConfig): number {
    // This would use real popularity metrics in production
    // For now, return a random score based on template ID
    const hash = template.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return Math.abs(hash) % 100;
  }

  /**
   * Infers visual style from template configuration
   */
  private static inferVisualStyle(template: TemplateConfig): VisualStyle {
    const name = template.name.toLowerCase();
    const description = template.description.toLowerCase();
    
    if (name.includes('minimal') || description.includes('minimal')) return 'minimal';
    if (name.includes('bold') || description.includes('bold')) return 'bold';
    if (name.includes('creative') || description.includes('creative')) return 'creative';
    if (name.includes('corporate') || description.includes('corporate')) return 'corporate';
    if (name.includes('modern') || description.includes('modern')) return 'modern';
    
    // Default inference based on layout and colors
    if (template.layout.headerStyle === 'brand-creative') return 'creative';
    if (template.layout.headerStyle === 'executive-minimal') return 'corporate';
    if (template.layout.headerStyle === 'tech-focused') return 'modern';
    
    return 'minimal'; // Default fallback
  }

  /**
   * Extracts keywords from a role title
   */
  private static extractRoleKeywords(role: string): string[] {
    const words = role.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 2); // Filter out short words
  }

  /**
   * Gets compatibility score between two visual styles
   */
  private static getStyleCompatibility(style1: VisualStyle, style2: VisualStyle): number {
    const compatibilityMatrix: Record<VisualStyle, Record<VisualStyle, number>> = {
      minimal: { minimal: 1, corporate: 0.8, modern: 0.6, bold: 0.2, creative: 0.1 },
      corporate: { corporate: 1, minimal: 0.8, modern: 0.5, bold: 0.3, creative: 0.1 },
      modern: { modern: 1, minimal: 0.6, corporate: 0.5, creative: 0.7, bold: 0.6 },
      bold: { bold: 1, creative: 0.8, modern: 0.6, corporate: 0.3, minimal: 0.2 },
      creative: { creative: 1, bold: 0.8, modern: 0.7, minimal: 0.1, corporate: 0.1 }
    };

    return compatibilityMatrix[style1]?.[style2] || 0;
  }

  /**
   * Categorizes recommendation based on score
   */
  private static categorizeRecommendation(score: number): 'perfect-match' | 'good-fit' | 'alternative' {
    if (score >= 85) return 'perfect-match';
    if (score >= 70) return 'good-fit';
    return 'alternative';
  }

  /**
   * Generates human-readable reasons for recommendation
   */
  private static generateRecommendationReasons(
    template: TemplateConfig,
    userProfile: UserProfile,
    score: number
  ): string[] {
    const reasons: string[] = [];

    // Industry match reasons
    if (userProfile.industry) {
      if (template.industry.toLowerCase().includes(userProfile.industry.toLowerCase()) ||
          template.category.includes(userProfile.industry)) {
        reasons.push(`Perfect match for ${userProfile.industry} professionals`);
      } else {
        const industryPrefs = INDUSTRY_TEMPLATE_PREFERENCES[userProfile.industry as keyof typeof INDUSTRY_TEMPLATE_PREFERENCES];
        if (industryPrefs) {
          const templateStyle = this.inferVisualStyle(template);
          if (industryPrefs.preferredStyles.includes(templateStyle)) {
            reasons.push(`${templateStyle} style works well in ${userProfile.industry}`);
          }
        }
      }
    }

    // Experience level reasons
    if (userProfile.experienceLevel) {
      const levelPrefs = EXPERIENCE_LEVEL_PREFERENCES[userProfile.experienceLevel];
      if (levelPrefs) {
        const templateStyle = this.inferVisualStyle(template);
        if (levelPrefs.preferredStyles.includes(templateStyle)) {
          reasons.push(`${templateStyle} design suits ${userProfile.experienceLevel}-level professionals`);
        }
      }
    }

    // Feature-based reasons
    if (userProfile.technicalProficiency === 'high' && template.features.showTechStack) {
      reasons.push('Highlights your technical skills effectively');
    }

    if (userProfile.leadershipLevel && ['manager', 'director', 'executive'].includes(userProfile.leadershipLevel) && template.features.showTeamSize) {
      reasons.push('Emphasizes leadership and team management experience');
    }

    if (template.features.showMetrics) {
      reasons.push('Showcases quantifiable achievements and results');
    }

    // ATS optimization
    const atsScore = this.calculateATSScore(template);
    if (atsScore >= 80) {
      reasons.push('Optimized for Applicant Tracking Systems (ATS)');
    }

    // Fallback reasons based on score
    if (reasons.length === 0) {
      if (score >= 85) {
        reasons.push('Excellent overall match for your profile');
      } else if (score >= 70) {
        reasons.push('Good fit based on your experience and skills');
      } else {
        reasons.push('Alternative option worth considering');
      }
    }

    return reasons.slice(0, 3); // Limit to top 3 reasons
  }

  /**
   * Gets personalized template suggestions for Templates page
   */
  static async getPersonalizedSuggestions(
    resume: Resume,
    availableTemplates: TemplateConfig[],
    limit: number = 6
  ): Promise<TemplateRecommendation[]> {
    const recommendations = await this.generateRecommendations(resume, availableTemplates);
    return recommendations.slice(0, limit);
  }

  /**
   * Tracks recommendation accuracy using analytics service
   */
  static trackRecommendationAccuracy(
    templateId: string,
    userProfile: UserProfile,
    userAction: 'selected' | 'dismissed' | 'customized',
    context?: {
      position: number;
      category: 'perfect-match' | 'good-fit' | 'alternative';
      reasons: string[];
      score: number;
    }
  ): void {
    const userId = 'demo-user'; // In production, get from auth context
    
    RecommendationAnalyticsService.trackInteraction(
      userId,
      templateId,
      context?.score || 0,
      userProfile,
      userAction,
      {
        position: context?.position || 0,
        category: context?.category || 'alternative',
        reasons: context?.reasons || []
      }
    );
  }

  /**
   * Gets recommendation analytics and insights
   */
  static getRecommendationAnalytics(userId?: string) {
    return {
      metrics: RecommendationAnalyticsService.calculateAccuracyMetrics(userId),
      underperforming: RecommendationAnalyticsService.getUnderperformingRecommendations(),
      insights: RecommendationAnalyticsService.getAlgorithmInsights(),
      dailyReport: RecommendationAnalyticsService.generateAccuracyReport('daily'),
      weeklyReport: RecommendationAnalyticsService.generateAccuracyReport('weekly'),
      monthlyReport: RecommendationAnalyticsService.generateAccuracyReport('monthly')
    };
  }
}