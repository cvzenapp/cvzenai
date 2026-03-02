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
}

export interface PersonalInfoContent {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location: string;
  website?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface SkillContent {
  name: string;
  proficiency: number; // 0-100
  category: string;
  yearsOfExperience: number;
  isCore: boolean;
  relevanceScore: number; // How relevant this skill is to the template's target role (1-10)
}

export interface ExperienceContent {
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
  achievements: string[];
  technologies: string[];
  location: string;
  industryContext: string; // Healthcare, Finance, Startup, etc.
  roleLevel: 'entry' | 'mid' | 'senior' | 'executive';
}

export interface EducationContent {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: number;
  honors?: string[];
  relevantCoursework?: string[];
  location: string;
}

export interface ProjectContent {
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate: string;
  url?: string;
  github?: string;
  impact: string; // Business impact or metrics
  roleSpecific: boolean; // Whether this project is specific to the template's role
  teamSize?: number;
  role?: string; // Your role in the project
}

export interface CertificationContent {
  name: string;
  issuer: string;
  dateEarned: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
  relevanceScore: number; // How relevant to the template's role (1-10)
}

export interface LanguageContent {
  language: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
  certifications?: string[];
}

// Role-specific content interfaces
export interface DevOpsContent extends TemplateSpecificContent {
  cloudPlatforms: string[];
  containerization: string[];
  cicdTools: string[];
  monitoringTools: string[];
  infrastructureAsCode: string[];
}

export interface MobileDeveloperContent extends TemplateSpecificContent {
  platforms: ('iOS' | 'Android' | 'Cross-platform')[];
  appStoreLinks: string[];
  frameworks: string[];
  designPatterns: string[];
}

export interface DataScientistContent extends TemplateSpecificContent {
  programmingLanguages: string[];
  mlFrameworks: string[];
  dataVisualizationTools: string[];
  statisticalMethods: string[];
  publications?: string[];
}

export interface FrontendDeveloperContent extends TemplateSpecificContent {
  frameworks: string[];
  buildTools: string[];
  designSystems: string[];
  performanceOptimization: string[];
}

export interface BackendDeveloperContent extends TemplateSpecificContent {
  programmingLanguages: string[];
  databases: string[];
  apiDesign: string[];
  scalabilityPatterns: string[];
}

export interface FullstackDeveloperContent extends TemplateSpecificContent {
  frontendTechnologies: string[];
  backendTechnologies: string[];
  databases: string[];
  deploymentPlatforms: string[];
}

// Business role content interfaces
export interface ProductManagerContent extends TemplateSpecificContent {
  productMetrics: string[];
  analyticsTools: string[];
  userResearchMethods: string[];
  roadmappingTools: string[];
}

export interface ProjectManagerContent extends TemplateSpecificContent {
  methodologies: string[];
  projectManagementTools: string[];
  teamSizes: number[];
  budgetRanges: string[];
}

export interface BusinessAnalystContent extends TemplateSpecificContent {
  analysisTools: string[];
  processImprovementMethods: string[];
  stakeholderTypes: string[];
  documentationTools: string[];
}

// Finance role content interfaces
export interface FinancialAnalystContent extends TemplateSpecificContent {
  financialModeling: string[];
  analysisTools: string[];
  reportingTools: string[];
  industryExpertise: string[];
}

export interface RiskManagerContent extends TemplateSpecificContent {
  riskFrameworks: string[];
  complianceStandards: string[];
  assessmentTools: string[];
  regulatoryExperience: string[];
}

// Healthcare role content interfaces
export interface ClinicalResearcherContent extends TemplateSpecificContent {
  researchAreas: string[];
  clinicalTrialPhases: string[];
  regulatoryKnowledge: string[];
  statisticalSoftware: string[];
}

export interface HealthcareAdminContent extends TemplateSpecificContent {
  healthcareSystemsKnowledge: string[];
  complianceStandards: string[];
  managementAreas: string[];
  healthcareIT: string[];
}

// Legal role content interfaces
export interface LegalContent extends TemplateSpecificContent {
  practiceAreas: string[];
  jurisdictions: string[];
  legalResearchTools: string[];
  courtExperience: string[];
}

// Education role content interfaces
export interface EducationContent extends TemplateSpecificContent {
  subjectAreas: string[];
  gradeLevels: string[];
  teachingMethods: string[];
  educationalTechnology: string[];
}

// Consulting role content interfaces
export interface ConsultingContent extends TemplateSpecificContent {
  consultingAreas: string[];
  industryExpertise: string[];
  methodologies: string[];
  clientTypes: string[];
}

// Content validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface ContentQualityMetrics {
  skillRelevanceScore: number; // 0-100
  experienceConsistencyScore: number; // 0-100
  projectRelevanceScore: number; // 0-100
  overallQualityScore: number; // 0-100
  completenessScore: number; // 0-100
}