import { Resume } from "@shared/api";

// Core interfaces for template-specific content
export interface TemplateSpecificContent {
  templateId: string;
  personalInfo: PersonalInfoContent;
  professionalSummary: string;
  objective: string;
  skills: SkillContent[];
  experiences: ExperienceContent[];
  education: EducationContent[];
  projects: ProjectContent[];
  achievements: string[];
  certifications?: CertificationContent[];
  languages?: LanguageContent[];
  metadata: ContentMetadata;
}

export interface PersonalInfoContent {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  avatar?: string;
}

export interface SkillContent {
  id: string;
  name: string;
  proficiency: number;
  category: string;
  level: number;
  yearsOfExperience: number;
  isCore: boolean;
  relevanceScore: number; // 1-10, how relevant this skill is to the template's target role
}

export interface ExperienceContent {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
  achievements: string[];
  technologies: string[];
  location: string;
  employmentType: string;
  industryContext: string; // Healthcare, Finance, Startup, Enterprise, etc.
  roleLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface EducationContent {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  location: string;
  gpa?: string;
  honors?: string[];
  relevantCoursework?: string[];
}

export interface ProjectContent {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  url?: string;
  github?: string;
  images?: string[];
  impact: string; // Business impact or metrics
  roleSpecific: boolean; // Whether this project is specific to the template's role
  metrics?: ProjectMetrics;
}

export interface ProjectMetrics {
  users?: string;
  revenue?: string;
  performance?: string;
  adoption?: string;
  efficiency?: string;
}

export interface CertificationContent {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
}

export interface LanguageContent {
  id: string;
  name: string;
  proficiency: string; // Native, Fluent, Conversational, Basic
}

export interface ContentMetadata {
  targetRole: string;
  industry: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  lastUpdated: Date;
  contentVersion: string;
  tags: string[];
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ContentValidationRules {
  validateSkillsForRole(skills: SkillContent[], role: string): ValidationResult;
  validateExperienceContext(experiences: ExperienceContent[], role: string): ValidationResult;
  validateProjectRelevance(projects: ProjectContent[], role: string): ValidationResult;
  validateExperienceLevel(content: TemplateSpecificContent): ValidationResult;
  validateContentQuality(content: TemplateSpecificContent): ValidationResult;
}

// Template Content Registry interface
export interface TemplateContentRegistry {
  getTemplateContent(templateId: string): TemplateSpecificContent | null;
  registerTemplateContent(templateId: string, content: TemplateSpecificContent): void;
  getAllTemplateContents(): Record<string, TemplateSpecificContent>;
  validateTemplateContent(content: TemplateSpecificContent): ValidationResult;
  getAvailableTemplateIds(): string[];
  hasTemplateContent(templateId: string): boolean;
}

// Content generation helpers
export interface ContentGenerationHelpers {
  generateSkillsForRole(role: string, experienceLevel: string): SkillContent[];
  generateCompaniesForIndustry(industry: string): string[];
  generateProjectsForRole(role: string, technologies: string[]): ProjectContent[];
  generateAchievementsForLevel(role: string, level: string): string[];
  generateEducationForRole(role: string, level: string): EducationContent[];
}

// Fallback strategy interface
export interface FallbackStrategy {
  getFallbackContent(templateId: string): TemplateSpecificContent;
  getIndustryFallback(industry: string): TemplateSpecificContent;
  getGenericFallback(): TemplateSpecificContent;
}

// Role-specific content type definitions
export interface TechnologyRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'devops-engineer' | 'mobile-developer' | 'data-scientist' | 
                'frontend-developer' | 'backend-developer' | 'fullstack-developer' |
                'software-architect' | 'tech-lead' | 'cto';
    industry: 'technology';
  };
}

export interface BusinessRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'product-manager' | 'project-manager' | 'business-analyst' |
                'operations-manager' | 'strategy-consultant';
    industry: 'business' | 'consulting';
  };
}

export interface FinanceRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'financial-analyst' | 'risk-manager' | 'investment-advisor' |
                'portfolio-manager' | 'financial-planner';
    industry: 'finance';
  };
}

export interface HealthcareRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'clinical-researcher' | 'healthcare-admin' | 'medical-device-engineer' |
                'healthcare-data-analyst' | 'clinical-coordinator';
    industry: 'healthcare';
  };
}

export interface DesignRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'ux-designer' | 'ui-designer' | 'graphic-designer' |
                'product-designer' | 'creative-director';
    industry: 'design';
  };
}

export interface MarketingRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'digital-marketer' | 'content-marketer' | 'growth-marketer' |
                'brand-manager' | 'marketing-director';
    industry: 'marketing';
  };
}

export interface SalesRoleContent extends TemplateSpecificContent {
  metadata: ContentMetadata & {
    targetRole: 'sales-representative' | 'account-manager' | 'sales-director' |
                'business-development' | 'sales-engineer';
    industry: 'sales';
  };
}

// Utility function to convert TemplateSpecificContent to Resume format
export function convertToResumeFormat(content: TemplateSpecificContent): Resume {
  return {
    id: content.templateId,
    personalInfo: {
      name: content.personalInfo.name,
      title: content.personalInfo.title,
      email: content.personalInfo.email,
      phone: content.personalInfo.phone,
      location: content.personalInfo.location,
      website: content.personalInfo.website || "",
      linkedin: content.personalInfo.linkedin || "",
      github: content.personalInfo.github || "",
      avatar: content.personalInfo.avatar || "",
    },
    summary: content.professionalSummary,
    objective: content.objective,
    skills: content.skills.map(skill => ({
      id: skill.id,
      name: skill.name,
      proficiency: skill.proficiency,
      category: skill.category,
      level: skill.level,
      yearsOfExperience: skill.yearsOfExperience,
      isCore: skill.isCore,
    })),
    experiences: content.experiences.map(exp => ({
      id: exp.id,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description,
      technologies: exp.technologies,
      location: exp.location,
      employmentType: exp.employmentType as "Full-time" | "Part-time" | "Contract" | "Freelance" | "Internship",
      achievements: exp.achievements,
    })),
    education: content.education.map(edu => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      location: edu.location,
      gpa: edu.gpa,
    })),
    projects: content.projects.map(project => ({
      id: project.id,
      name: project.title, // Map title to name for Resume format
      title: project.title,
      description: project.description,
      technologies: project.technologies,
      startDate: project.startDate,
      endDate: project.endDate,
      url: project.url,
      github: project.github,
      images: project.images,
    })),
    upvotes: 0,
    rating: 0,
    isShortlisted: false,
    hasUpvoted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Template ID mapping utilities
export const TEMPLATE_IDS = {
  // Technology Templates
  DEVOPS_SENIOR: 'devops-engineer-senior',
  DEVOPS_JUNIOR: 'devops-engineer-junior',
  MOBILE_IOS: 'mobile-developer-ios',
  MOBILE_ANDROID: 'mobile-developer-android',
  MOBILE_REACT_NATIVE: 'mobile-developer-react-native',
  DATA_SCIENTIST_SENIOR: 'data-scientist-senior',
  DATA_ANALYST_ENTRY: 'data-analyst-entry',
  FRONTEND_SENIOR: 'frontend-developer-senior',
  FRONTEND_JUNIOR: 'frontend-developer-junior',
  BACKEND_SENIOR: 'backend-developer-senior',
  BACKEND_JUNIOR: 'backend-developer-junior',
  FULLSTACK_SENIOR: 'fullstack-developer-senior',
  FULLSTACK_MID: 'fullstack-developer-mid',
  
  // Business Templates
  PRODUCT_MANAGER: 'product-manager',
  PROJECT_MANAGER: 'project-manager',
  BUSINESS_ANALYST: 'business-analyst',
  
  // Finance Templates
  FINANCIAL_ANALYST: 'financial-analyst',
  RISK_MANAGER: 'risk-manager',
  INVESTMENT_ADVISOR: 'investment-advisor',
  
  // Healthcare Templates
  CLINICAL_RESEARCHER: 'clinical-researcher',
  HEALTHCARE_ADMIN: 'healthcare-admin',
  
  // Legal Templates
  LEGAL_COUNSEL: 'legal-counsel',
  
  // Consulting Templates
  STRATEGY_CONSULTANT: 'strategy-consultant',
  OPERATIONS_CONSULTANT: 'operations-consultant',
  
  // Design Templates
  UX_DESIGNER: 'ux-designer',
  UI_DESIGNER: 'ui-designer',
  CREATIVE_DIRECTOR: 'creative-director',
  
  // Marketing Templates
  DIGITAL_MARKETER: 'digital-marketer',
  GROWTH_MARKETER: 'growth-marketer',
  BRAND_MANAGER: 'brand-manager',
  
  // Sales Templates
  SALES_REP: 'sales-representative',
  ACCOUNT_MANAGER: 'account-manager',
  SALES_DIRECTOR: 'sales-director',
} as const;

export type TemplateId = typeof TEMPLATE_IDS[keyof typeof TEMPLATE_IDS];