/**
 * User Profile Analysis Service
 * Analyzes user resume data to extract characteristics for template recommendations
 */

import { Resume, Experience, Skill, Education, Project } from '@shared/api';
import { ExperienceLevel, VisualStyle } from './templateService';

export interface UserProfile {
  industry?: string;
  experienceLevel?: ExperienceLevel;
  role?: string;
  skills?: string[];
  preferences?: {
    visualStyle?: VisualStyle;
    colorPreference?: string;
    layoutPreference?: string;
  };
  careerStage?: 'entry' | 'career-change' | 'advancement' | 'executive';
  specializations?: string[];
  workEnvironment?: 'corporate' | 'startup' | 'freelance' | 'academic' | 'nonprofit';
  technicalProficiency?: 'low' | 'medium' | 'high';
  leadershipLevel?: 'individual' | 'team-lead' | 'manager' | 'director' | 'executive';
}

export interface IndustryKeywords {
  [industry: string]: {
    keywords: string[];
    roles: string[];
    skills: string[];
  };
}

// Industry classification keywords and patterns
const INDUSTRY_KEYWORDS: IndustryKeywords = {
  technology: {
    keywords: ['software', 'development', 'programming', 'coding', 'tech', 'digital', 'web', 'mobile', 'app', 'system', 'database', 'cloud', 'api', 'frontend', 'backend', 'fullstack', 'devops', 'data', 'ai', 'machine learning', 'cybersecurity'],
    roles: ['developer', 'engineer', 'programmer', 'architect', 'analyst', 'designer', 'product manager', 'scrum master', 'devops', 'data scientist', 'security'],
    skills: ['javascript', 'python', 'java', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum']
  },
  healthcare: {
    keywords: ['medical', 'health', 'clinical', 'patient', 'hospital', 'healthcare', 'nursing', 'physician', 'doctor', 'therapy', 'pharmaceutical', 'medical device', 'biotech', 'research'],
    roles: ['nurse', 'doctor', 'physician', 'therapist', 'pharmacist', 'technician', 'administrator', 'researcher', 'coordinator'],
    skills: ['patient care', 'medical records', 'clinical research', 'healthcare administration', 'medical coding', 'hipaa', 'epic', 'cerner']
  },
  finance: {
    keywords: ['financial', 'banking', 'investment', 'accounting', 'audit', 'tax', 'insurance', 'wealth', 'portfolio', 'trading', 'risk', 'compliance', 'fintech'],
    roles: ['analyst', 'advisor', 'accountant', 'auditor', 'banker', 'trader', 'manager', 'consultant', 'planner', 'underwriter'],
    skills: ['financial modeling', 'excel', 'bloomberg', 'quickbooks', 'gaap', 'sox', 'cfa', 'frm', 'risk management', 'portfolio management']
  },
  legal: {
    keywords: ['legal', 'law', 'attorney', 'lawyer', 'counsel', 'litigation', 'contract', 'compliance', 'regulatory', 'paralegal', 'court', 'case'],
    roles: ['attorney', 'lawyer', 'counsel', 'paralegal', 'clerk', 'judge', 'mediator', 'compliance officer'],
    skills: ['legal research', 'contract negotiation', 'litigation', 'compliance', 'regulatory affairs', 'legal writing', 'case management']
  },
  education: {
    keywords: ['education', 'teaching', 'academic', 'school', 'university', 'student', 'curriculum', 'learning', 'training', 'instruction', 'professor', 'teacher'],
    roles: ['teacher', 'professor', 'instructor', 'principal', 'administrator', 'counselor', 'librarian', 'coordinator'],
    skills: ['curriculum development', 'classroom management', 'student assessment', 'educational technology', 'lesson planning', 'special education']
  },
  nonprofit: {
    keywords: ['nonprofit', 'ngo', 'charity', 'foundation', 'social', 'community', 'volunteer', 'fundraising', 'advocacy', 'program', 'outreach', 'impact'],
    roles: ['program manager', 'coordinator', 'director', 'fundraiser', 'advocate', 'organizer', 'volunteer coordinator'],
    skills: ['program management', 'fundraising', 'grant writing', 'community outreach', 'volunteer management', 'impact measurement']
  },
  consulting: {
    keywords: ['consulting', 'consultant', 'advisory', 'strategy', 'management', 'business', 'operations', 'transformation', 'implementation', 'client'],
    roles: ['consultant', 'advisor', 'analyst', 'manager', 'partner', 'specialist', 'strategist'],
    skills: ['strategic planning', 'business analysis', 'project management', 'client management', 'process improvement', 'change management']
  },
  design: {
    keywords: ['design', 'creative', 'visual', 'graphic', 'ui', 'ux', 'user experience', 'interface', 'branding', 'marketing', 'advertising'],
    roles: ['designer', 'creative director', 'art director', 'illustrator', 'animator', 'photographer'],
    skills: ['photoshop', 'illustrator', 'figma', 'sketch', 'indesign', 'after effects', 'ui design', 'ux design', 'branding']
  },
  marketing: {
    keywords: ['marketing', 'advertising', 'brand', 'campaign', 'digital marketing', 'social media', 'content', 'seo', 'sem', 'analytics'],
    roles: ['marketer', 'manager', 'coordinator', 'specialist', 'analyst', 'strategist', 'director'],
    skills: ['digital marketing', 'social media', 'content marketing', 'seo', 'google analytics', 'facebook ads', 'email marketing']
  },
  sales: {
    keywords: ['sales', 'business development', 'account management', 'revenue', 'quota', 'pipeline', 'crm', 'lead generation', 'customer'],
    roles: ['sales representative', 'account manager', 'business development', 'sales manager', 'director', 'executive'],
    skills: ['salesforce', 'crm', 'lead generation', 'account management', 'negotiation', 'pipeline management', 'customer relationship']
  }
};

// Role-based experience level indicators
const EXPERIENCE_LEVEL_INDICATORS = {
  entry: ['intern', 'junior', 'associate', 'entry', 'trainee', 'assistant', 'coordinator'],
  mid: ['specialist', 'analyst', 'developer', 'consultant', 'manager', 'lead'],
  senior: ['senior', 'principal', 'staff', 'expert', 'architect', 'director'],
  executive: ['executive', 'chief', 'president', 'vice president', 'vp', 'ceo', 'cto', 'cfo', 'head of']
};

// Leadership level indicators
const LEADERSHIP_INDICATORS = {
  executive: ['executive', 'chief', 'president', 'ceo', 'cto', 'cfo'],
  director: ['director', 'head of', 'vice president', 'vp'],
  manager: ['manager', 'supervisor', 'coordinator'],
  'team-lead': ['team lead', 'tech lead', 'lead', 'managed', 'team of', 'leading'],
  individual: ['individual contributor', 'specialist', 'analyst', 'developer', 'engineer']
};

export class UserProfileAnalysisService {
  /**
   * Analyzes a user's resume to extract profile characteristics
   */
  static analyzeUserProfile(resume: Resume): UserProfile {
    const profile: UserProfile = {};

    // Analyze industry based on experience, skills, and role
    profile.industry = this.determineIndustry(resume);
    
    // Determine experience level based on work history and roles
    profile.experienceLevel = this.determineExperienceLevel(resume);
    
    // Extract primary role/title
    profile.role = this.extractPrimaryRole(resume);
    
    // Extract key skills
    profile.skills = this.extractKeySkills(resume);
    
    // Determine career stage
    profile.careerStage = this.determineCareerStage(resume);
    
    // Extract specializations
    profile.specializations = this.extractSpecializations(resume);
    
    // Determine work environment preference
    profile.workEnvironment = this.determineWorkEnvironment(resume);
    
    // Assess technical proficiency
    profile.technicalProficiency = this.assessTechnicalProficiency(resume);
    
    // Determine leadership level
    profile.leadershipLevel = this.determineLeadershipLevel(resume);

    return profile;
  }

  /**
   * Determines the primary industry based on experience and skills
   */
  private static determineIndustry(resume: Resume): string {
    const industryScores: Record<string, number> = {};

    // Initialize scores
    Object.keys(INDUSTRY_KEYWORDS).forEach(industry => {
      industryScores[industry] = 0;
    });

    // Analyze experiences
    resume.experiences.forEach(exp => {
      const text = `${exp.company} ${exp.position} ${exp.description}`.toLowerCase();
      
      Object.entries(INDUSTRY_KEYWORDS).forEach(([industry, data]) => {
        // Check keywords
        data.keywords.forEach(keyword => {
          if (text.includes(keyword)) {
            industryScores[industry] += 2;
          }
        });
        
        // Check roles
        data.roles.forEach(role => {
          if (text.includes(role)) {
            industryScores[industry] += 3;
          }
        });
      });
    });

    // Analyze skills
    resume.skills.forEach(skill => {
      const skillName = skill.name.toLowerCase();
      
      Object.entries(INDUSTRY_KEYWORDS).forEach(([industry, data]) => {
        data.skills.forEach(industrySkill => {
          if (skillName.includes(industrySkill) || industrySkill.includes(skillName)) {
            industryScores[industry] += skill.level / 20; // Weight by proficiency
          }
        });
      });
    });

    // Return industry with highest score
    const topIndustry = Object.entries(industryScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topIndustry[1] > 0 ? topIndustry[0] : 'general';
  }

  /**
   * Determines experience level based on work history and roles
   */
  private static determineExperienceLevel(resume: Resume): ExperienceLevel {
    // Calculate total years of experience
    const totalYears = this.calculateTotalExperience(resume.experiences);
    
    // Analyze role titles for seniority indicators
    const roleText = resume.experiences
      .map(exp => exp.position.toLowerCase())
      .join(' ');

    // Check for entry-level indicators first (most specific)
    if (EXPERIENCE_LEVEL_INDICATORS.entry.some(indicator => roleText.includes(indicator))) {
      return 'entry';
    }

    // Check for executive indicators
    if (EXPERIENCE_LEVEL_INDICATORS.executive.some(indicator => roleText.includes(indicator))) {
      return 'executive';
    }

    // Check for senior indicators
    if (EXPERIENCE_LEVEL_INDICATORS.senior.some(indicator => roleText.includes(indicator))) {
      return 'senior';
    }

    // Check for mid-level indicators
    if (EXPERIENCE_LEVEL_INDICATORS.mid.some(indicator => roleText.includes(indicator))) {
      return 'mid';
    }

    // Fallback to years of experience
    if (totalYears >= 10) return 'executive';
    if (totalYears >= 5) return 'senior';
    if (totalYears >= 2) return 'mid';
    return 'entry';
  }

  /**
   * Calculates total years of professional experience
   */
  private static calculateTotalExperience(experiences: Experience[]): number {
    let totalMonths = 0;

    experiences.forEach(exp => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date();
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      
      totalMonths += Math.max(0, months);
    });

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Extracts the primary role/title from most recent experience
   */
  private static extractPrimaryRole(resume: Resume): string {
    if (resume.experiences.length === 0) return '';
    
    // Sort by most recent (assuming endDate null means current)
    const sortedExperiences = [...resume.experiences].sort((a, b) => {
      const aDate = a.endDate ? new Date(a.endDate) : new Date();
      const bDate = b.endDate ? new Date(b.endDate) : new Date();
      return bDate.getTime() - aDate.getTime();
    });

    return sortedExperiences[0].position;
  }

  /**
   * Extracts key skills, prioritizing by proficiency level
   */
  private static extractKeySkills(resume: Resume): string[] {
    return resume.skills
      .sort((a, b) => b.level - a.level)
      .slice(0, 10) // Top 10 skills
      .map(skill => skill.name);
  }

  /**
   * Determines career stage based on experience pattern
   */
  private static determineCareerStage(resume: Resume): 'entry' | 'career-change' | 'advancement' | 'executive' {
    const totalYears = this.calculateTotalExperience(resume.experiences);
    const industries = new Set(resume.experiences.map(exp => this.categorizeCompany(exp.company)));
    
    // Executive level
    if (totalYears >= 15 || resume.experiences.some(exp => 
      EXPERIENCE_LEVEL_INDICATORS.executive.some(indicator => 
        exp.position.toLowerCase().includes(indicator)))) {
      return 'executive';
    }

    // Career change (multiple industries with recent switch)
    if (industries.size > 2 && totalYears > 3) {
      return 'career-change';
    }

    // Career advancement (consistent growth)
    if (totalYears >= 3) {
      return 'advancement';
    }

    return 'entry';
  }

  /**
   * Extracts specializations from skills and experience
   */
  private static extractSpecializations(resume: Resume): string[] {
    const specializations = new Set<string>();

    // Extract from high-proficiency skills
    resume.skills
      .filter(skill => skill.level >= 80)
      .forEach(skill => {
        specializations.add(skill.category || skill.name);
      });

    // Extract from experience descriptions
    resume.experiences.forEach(exp => {
      const description = exp.description.toLowerCase();
      
      // Look for specialization keywords
      if (description.includes('specialize') || description.includes('expert') || description.includes('focus')) {
        // Extract context around these keywords (simplified)
        const words = description.split(' ');
        words.forEach((word, index) => {
          if (['specialize', 'expert', 'focus'].includes(word) && index < words.length - 1) {
            specializations.add(words[index + 1]);
          }
        });
      }
    });

    return Array.from(specializations).slice(0, 5);
  }

  /**
   * Determines work environment preference based on company types
   */
  private static determineWorkEnvironment(resume: Resume): 'corporate' | 'startup' | 'freelance' | 'academic' | 'nonprofit' {
    const environments = resume.experiences.map(exp => this.categorizeCompany(exp.company));
    
    // Count occurrences
    const counts = environments.reduce((acc, env) => {
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Return most common environment
    const topEnvironment = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0];
    
    return (topEnvironment?.[0] as any) || 'corporate';
  }

  /**
   * Categorizes company type based on name and context
   */
  private static categorizeCompany(companyName: string): 'corporate' | 'startup' | 'freelance' | 'academic' | 'nonprofit' {
    const name = companyName.toLowerCase();
    
    if (name.includes('university') || name.includes('college') || name.includes('school')) {
      return 'academic';
    }
    
    if (name.includes('foundation') || name.includes('nonprofit') || name.includes('ngo')) {
      return 'nonprofit';
    }
    
    if (name.includes('freelance') || name.includes('consultant') || name.includes('independent')) {
      return 'freelance';
    }
    
    // Simple heuristic: smaller/newer companies might be startups
    if (name.length < 15 && !name.includes('inc') && !name.includes('corp') && !name.includes('ltd')) {
      return 'startup';
    }
    
    return 'corporate';
  }

  /**
   * Assesses technical proficiency based on technical skills
   */
  private static assessTechnicalProficiency(resume: Resume): 'low' | 'medium' | 'high' {
    const technicalSkills = resume.skills.filter(skill => 
      this.isTechnicalSkill(skill.name)
    );

    if (technicalSkills.length === 0) return 'low';

    const avgProficiency = technicalSkills.reduce((sum, skill) => sum + skill.level, 0) / technicalSkills.length;
    
    if (avgProficiency >= 80) return 'high';
    if (avgProficiency >= 50) return 'medium';
    return 'low';
  }

  /**
   * Determines if a skill is technical
   */
  private static isTechnicalSkill(skillName: string): boolean {
    const technicalKeywords = [
      'javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 
      'kubernetes', 'git', 'html', 'css', 'typescript', 'angular', 'vue',
      'mongodb', 'postgresql', 'redis', 'elasticsearch', 'jenkins', 'terraform'
    ];
    
    return technicalKeywords.some(keyword => 
      skillName.toLowerCase().includes(keyword)
    );
  }

  /**
   * Determines leadership level based on role titles and descriptions
   */
  private static determineLeadershipLevel(resume: Resume): 'individual' | 'team-lead' | 'manager' | 'director' | 'executive' {
    const roleText = resume.experiences
      .map(exp => `${exp.position} ${exp.description}`)
      .join(' ')
      .toLowerCase();

    // Check each level from highest to lowest
    for (const [level, indicators] of Object.entries(LEADERSHIP_INDICATORS)) {
      if (indicators.some(indicator => roleText.includes(indicator))) {
        return level as any;
      }
    }

    return 'individual';
  }

  /**
   * Extracts user preferences from past template usage (if available)
   */
  static extractPreferencesFromUsage(templateUsageHistory: any[]): UserProfile['preferences'] {
    // This would analyze past template selections to infer preferences
    // For now, return empty preferences
    return {
      visualStyle: undefined,
      colorPreference: undefined,
      layoutPreference: undefined
    };
  }
}