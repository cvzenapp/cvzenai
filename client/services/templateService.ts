import { templateAnalyticsService } from './templateAnalyticsService';

// Base template categories (existing)
export type TemplateCategory =
  | "technology"
  | "enhanced-technology" // HFI-optimized technology template
  | "design"
  | "management"
  | "academic"
  | "marketing"
  | "sales"
  | "tech-modern"
  | "tech-minimal"
  | "tech-senior"
  | "tech-fullstack"
  | "tech-devops"
  | "tech-mobile"
  | "modern-professional"; // New three-tier architecture template

// Template filtering and discovery interfaces
export interface TemplateFilters {
  categories: string[];
  experienceLevels: ExperienceLevel[];
  visualStyles: VisualStyle[];
  features: string[];
  industries: string[];
  atsOptimized: boolean;
  rating: number; // Minimum rating filter
}

export interface TemplateSearchOptions {
  query: string;
  filters: TemplateFilters;
  sortBy: 'popularity' | 'newest' | 'name' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export interface TemplateComparison {
  templates: TemplateConfig[];
  comparisonMatrix: {
    [templateId: string]: {
      [feature: string]: boolean | string | number;
    };
  };
}

export interface TemplateRecommendation {
  template: TemplateConfig;
  score: number;
  reasons: string[];
  category: 'perfect-match' | 'good-fit' | 'alternative';
}

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
}

export interface TemplateUsageRecord {
  templateId: string;
  usedAt: Date;
  duration: number; // Time spent using template in minutes
  completed: boolean; // Whether user completed resume with this template
}

export interface UserTemplatePreferences {
  userId: string;
  favoriteTemplates: string[];
  customTemplates: string[]; // IDs of user's custom template variations
  searchHistory: string[];
  industryPreference?: string;
  experienceLevel?: ExperienceLevel;
  visualStylePreference: VisualStyle[];
  lastUsedTemplate?: string;
  templateUsageHistory: TemplateUsageRecord[];
}

// Extended template categories for new industry-specific templates
export type ExtendedTemplateCategory =
  | TemplateCategory
  | "healthcare" | "finance" | "legal" | "education" | "nonprofit" | "consulting"
  | "tech-frontend" | "tech-backend" | "tech-data" | "tech-product"
  | "design-ui" | "design-graphic" | "design-industrial"
  | "healthcare-clinical" | "healthcare-admin" | "healthcare-research"
  | "finance-analyst" | "finance-advisor" | "finance-risk"
  | "legal-corporate" | "legal-litigation" | "legal-compliance";

// Experience level classifications
export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";

// Visual style variations
export type VisualStyle = "minimal" | "bold" | "creative" | "corporate" | "modern";

// ATS optimization levels
export type ATSOptimizationLevel = "basic" | "standard" | "advanced";

// Template variation interface for different visual styles within a category
export interface TemplateVariation {
  id: string;
  name: string; // "Minimal", "Bold", "Creative", "Corporate", "Modern"
  description: string;
  previewImage: string;
}

// Color scheme configuration for template customization
export interface ColorScheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
}

// Font combination configuration for template customization
export interface FontCombination {
  id: string;
  name: string;
  typography: {
    headingFont: string;
    bodyFont: string;
    codeFont: string;
  };
}

// Layout option configuration for template customization
export interface LayoutOption {
  id: string;
  name: string;
  headerStyle: string;
  sidebarPosition: "left" | "right" | "none" | "split";
  cardStyle: string;
}

// Section customization configuration
export interface SectionCustomization {
  sectionId: string;
  displayName: string;
  isVisible: boolean;
  order: number;
  customFields?: Record<string, any>;
}

// Industry-specific template configuration
export interface IndustrySpecificConfig {
  requiredSections: string[];
  recommendedSections: string[];
  industryKeywords: string[];
  complianceRequirements?: string[];
  specializedFields?: Record<string, any>;
}

// Template customization options
export interface CustomizationOptions {
  colorSchemes: ColorScheme[];
  fontCombinations: FontCombination[];
  layoutOptions: LayoutOption[];
  sectionCustomization: SectionCustomization[];
  allowCustomColors: boolean;
  allowCustomFonts: boolean;
  allowSectionReordering: boolean;
}

export interface TemplateConfig {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  headingWeight: string;
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  industry: string;
  templateContentId?: string; // Link to specific template content
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    codeFont: string;
  };
  layout: {
    headerStyle:
    | "tech-focused"
    | "portfolio-hero"
    | "executive-minimal"
    | "academic-formal"
    | "brand-creative"
    | "sales-results";
    sidebarPosition: "left" | "right" | "none" | "split";
    sectionPriority: string[];
    cardStyle:
    | "code-blocks"
    | "portfolio-cards"
    | "metrics-focused"
    | "publication-style"
    | "campaign-style"
    | "achievement-style";
  };
  sections: {
    required: string[];
    optional: string[];
    industrySpecific: string[];
  };
  features: {
    showTechStack: boolean;
    showPortfolio: boolean;
    showMetrics: boolean;
    showPublications: boolean;
    showCampaigns: boolean;
    showTeamSize: boolean;
    showGithub: boolean;
    showDesignTools: boolean;
    showCertifications: boolean;
    showLanguages: boolean;
  };
}

// Enhanced template configuration with new properties for variations, experience levels, and customization
export interface EnhancedTemplateConfig extends Omit<TemplateConfig, 'category'> {
  // Use extended category type
  category: ExtendedTemplateCategory;

  // Template variation properties
  variation: TemplateVariation;
  experienceLevel: ExperienceLevel;
  visualStyle: VisualStyle;

  // Enhanced industry-specific configuration
  industrySpecificConfig: IndustrySpecificConfig;

  // Customization options
  customization: CustomizationOptions;

  // ATS optimization level
  atsOptimization: ATSOptimizationLevel;

  // Additional metadata
  tags: string[];
  popularity: number;
  lastUpdated: Date;

  // Template versioning
  version: string;

  // Accessibility compliance level
  accessibilityLevel: "basic" | "aa" | "aaa";
}

// New industry-specific template configurations
export const industryTemplateConfigs: Record<string, TemplateConfig> = {
  // Healthcare Templates
  "healthcare-clinical": {
    id: "healthcare-clinical-1",
    name: "Clinical Healthcare Professional",
    category: "healthcare-clinical" as any, // Extended category
    description: "Specialized template for clinical healthcare professionals including doctors, nurses, and medical specialists",
    industry: "Healthcare - Clinical",
    templateContentId: "clinical-researcher", // Link to specific content
    colors: {
      primary: "#0369a1",
      secondary: "#0284c7",
      accent: "#dc2626",
      background: "linear-gradient(135deg, #f0f9ff 0%, #fef2f2 100%)",
      text: "#1e293b",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "academic-formal",
      sidebarPosition: "left",
      sectionPriority: ["licenses", "clinicalExperience", "education", "certifications"],
      cardStyle: "publication-style",
    },
    sections: {
      required: ["contact", "summary", "licenses", "clinicalExperience", "education"],
      optional: ["research", "publications", "awards"],
      industrySpecific: ["medicalLicenses", "boardCertifications", "clinicalRotations", "continuingEducation", "patientCare", "medicalProcedures"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  "healthcare-administrative": {
    id: "healthcare-admin-1",
    name: "Healthcare Administrator",
    category: "healthcare-admin" as any, // Extended category
    description: "Template for healthcare administrators, practice managers, and healthcare operations professionals",
    industry: "Healthcare - Administrative",
    templateContentId: "healthcare-admin", // Link to specific content
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#0369a1",
      background: "linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["experience", "achievements", "education", "certifications"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "experience", "achievements"],
      optional: ["education", "certifications", "projects"],
      industrySpecific: ["healthcareOperations", "budgetManagement", "complianceManagement", "staffManagement", "qualityImprovement", "healthInformatics"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "healthcare-research": {
    id: "healthcare-research-1",
    name: "Healthcare Researcher",
    category: "academic", // Academic template for researchers
    description: "Academic template for medical researchers, clinical investigators, and healthcare research professionals",
    industry: "Healthcare - Research",
    colors: {
      primary: "#7c3aed",
      secondary: "#5b21b6",
      accent: "#dc2626",
      background: "linear-gradient(135deg, #faf5ff 0%, #fef2f2 100%)",
      text: "#1e1b4b",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Crimson Text', 'Times New Roman', serif",
      bodyFont: "'Crimson Text', 'Times New Roman', serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "academic-formal",
      sidebarPosition: "none",
      sectionPriority: ["research", "publications", "grants", "education"],
      cardStyle: "publication-style",
    },
    sections: {
      required: ["contact", "summary", "research", "publications", "education"],
      optional: ["grants", "awards", "conferences", "teaching"],
      industrySpecific: ["clinicalTrials", "researchGrants", "peerReview", "labManagement", "dataAnalysis", "ethicsCompliance"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },

  // Finance Templates
  "finance-analyst": {
    id: "finance-analyst-1",
    name: "Financial Analyst",
    category: "management", // Finance roles are management-oriented
    description: "Professional template for financial analysts, investment analysts, and quantitative researchers",
    industry: "Finance - Analysis",
    templateContentId: "financial-analyst", // Link to specific content
    colors: {
      primary: "#1e40af",
      secondary: "#1e3a8a",
      accent: "#059669",
      background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
      text: "#1e293b",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Roboto Slab', 'Georgia', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["experience", "skills", "achievements", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "experience", "skills"],
      optional: ["education", "certifications", "projects"],
      industrySpecific: ["financialModeling", "dataAnalysis", "marketResearch", "riskAssessment", "portfolioManagement", "regulatoryCompliance"],
    },
    features: {
      showTechStack: true,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "finance-advisor": {
    id: "finance-advisor-1",
    name: "Financial Advisor",
    category: "sales", // Sales-oriented role
    description: "Client-focused template for financial advisors, wealth managers, and financial planners",
    industry: "Finance - Advisory",
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#1e40af",
      background: "linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "sales-results",
      sidebarPosition: "left",
      sectionPriority: ["clientResults", "experience", "certifications", "education"],
      cardStyle: "achievement-style",
    },
    sections: {
      required: ["contact", "summary", "clientResults", "experience"],
      optional: ["education", "awards", "speaking"],
      industrySpecific: ["clientPortfolio", "assetManagement", "financialPlanning", "investmentStrategy", "riskManagement", "clientRelations"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "finance-risk": {
    id: "finance-risk-1",
    name: "Risk Management Professional",
    category: "technology", // Using existing category for now, will be updated
    description: "Specialized template for risk managers, compliance officers, and financial risk analysts",
    industry: "Finance - Risk Management",
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#1e40af",
      background: "linear-gradient(135deg, #fef2f2 0%, #f0f9ff 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["experience", "certifications", "achievements", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "experience", "certifications"],
      optional: ["education", "projects", "speaking"],
      industrySpecific: ["riskAssessment", "complianceManagement", "regulatoryReporting", "auditManagement", "policyDevelopment", "riskModeling"],
    },
    features: {
      showTechStack: true,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },

  // Legal Templates
  "legal-corporate": {
    id: "legal-corporate-1",
    name: "Corporate Attorney",
    category: "technology", // Using existing category for now, will be updated
    description: "Professional template for corporate lawyers, in-house counsel, and business attorneys",
    industry: "Legal - Corporate",
    colors: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#dc2626",
      background: "linear-gradient(135deg, #f8fafc 0%, #fef2f2 100%)",
      text: "#0f172a",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Crimson Text', 'Times New Roman', serif",
      bodyFont: "'Crimson Text', 'Times New Roman', serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "academic-formal",
      sidebarPosition: "none",
      sectionPriority: ["experience", "barAdmissions", "education", "publications"],
      cardStyle: "publication-style",
    },
    sections: {
      required: ["contact", "summary", "experience", "barAdmissions", "education"],
      optional: ["publications", "speaking", "awards"],
      industrySpecific: ["legalSpecializations", "corporateTransactions", "complianceWork", "contractNegotiation", "mergerAcquisitions", "corporateGovernance"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: false,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  "legal-litigation": {
    id: "legal-litigation-1",
    name: "Litigation Attorney",
    category: "technology", // Using existing category for now, will be updated
    description: "Results-focused template for trial lawyers, litigators, and courtroom advocates",
    industry: "Legal - Litigation",
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#1e293b",
      background: "linear-gradient(135deg, #fef2f2 0%, #f8fafc 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Crimson Text', 'Times New Roman', serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "sales-results",
      sidebarPosition: "left",
      sectionPriority: ["caseResults", "experience", "barAdmissions", "education"],
      cardStyle: "achievement-style",
    },
    sections: {
      required: ["contact", "summary", "caseResults", "experience", "barAdmissions"],
      optional: ["education", "awards", "speaking"],
      industrySpecific: ["trialExperience", "caseManagement", "clientAdvocacy", "legalResearch", "courtAppearances", "settlementNegotiation"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "legal-compliance": {
    id: "legal-compliance-1",
    name: "Compliance Officer",
    category: "technology", // Using existing category for now, will be updated
    description: "Regulatory-focused template for compliance officers, regulatory affairs specialists, and legal compliance professionals",
    industry: "Legal - Compliance",
    colors: {
      primary: "#1e40af",
      secondary: "#1e3a8a",
      accent: "#dc2626",
      background: "linear-gradient(135deg, #f0f9ff 0%, #fef2f2 100%)",
      text: "#1e293b",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["experience", "certifications", "achievements", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "experience", "certifications"],
      optional: ["education", "projects", "training"],
      industrySpecific: ["regulatoryCompliance", "policyDevelopment", "auditManagement", "riskAssessment", "trainingPrograms", "complianceMonitoring"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },

  // Education Templates
  "education-k12": {
    id: "education-k12-1",
    name: "K-12 Educator",
    category: "academic", // Academic template for educators
    description: "Comprehensive template for K-12 teachers, principals, and educational administrators",
    industry: "Education - K-12",
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #ecfdf5 0%, #fef3c7 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "academic-formal",
      sidebarPosition: "left",
      sectionPriority: ["teachingExperience", "education", "certifications", "achievements"],
      cardStyle: "publication-style",
    },
    sections: {
      required: ["contact", "summary", "teachingExperience", "education", "certifications"],
      optional: ["awards", "professionalDevelopment", "extracurricular"],
      industrySpecific: ["classroomManagement", "curriculumDevelopment", "studentAssessment", "parentCommunication", "educationalTechnology", "specialEducation"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  "education-higher": {
    id: "education-higher-1",
    name: "Higher Education Professional",
    category: "academic", // Academic template for university professionals
    description: "Academic template for university professors, researchers, and higher education administrators",
    industry: "Education - Higher Education",
    colors: {
      primary: "#1e40af",
      secondary: "#3730a3",
      accent: "#dc2626",
      background: "#ffffff",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Crimson Text', 'Times New Roman', serif",
      bodyFont: "'Crimson Text', 'Times New Roman', serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "academic-formal",
      sidebarPosition: "none",
      sectionPriority: ["education", "research", "publications", "teaching"],
      cardStyle: "publication-style",
    },
    sections: {
      required: ["contact", "education", "research", "publications", "teaching"],
      optional: ["grants", "awards", "service", "conferences"],
      industrySpecific: ["academicResearch", "courseDesign", "studentSupervision", "grantWriting", "peerReview", "academicService"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: false,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  "education-administration": {
    id: "education-admin-1",
    name: "Educational Administrator",
    category: "management", // Management-focused role
    description: "Leadership-focused template for school principals, superintendents, and educational leaders",
    industry: "Education - Administration",
    colors: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#059669",
      background: "linear-gradient(135deg, #f8fafc 0%, #ecfdf5 100%)",
      text: "#0f172a",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["leadership", "experience", "achievements", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "executiveSummary", "leadership", "experience"],
      optional: ["education", "awards", "speaking"],
      industrySpecific: ["schoolLeadership", "budgetManagement", "staffDevelopment", "communityEngagement", "policyImplementation", "strategicPlanning"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },

  // Non-profit Templates
  "nonprofit-program": {
    id: "nonprofit-program-1",
    name: "Program Manager",
    category: "technology", // Using existing category for now, will be updated
    description: "Impact-focused template for non-profit program managers and social impact professionals",
    industry: "Non-profit - Program Management",
    colors: {
      primary: "#7c3aed",
      secondary: "#5b21b6",
      accent: "#059669",
      background: "linear-gradient(135deg, #faf5ff 0%, #ecfdf5 100%)",
      text: "#1e1b4b",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "brand-creative",
      sidebarPosition: "left",
      sectionPriority: ["impact", "experience", "skills", "education"],
      cardStyle: "campaign-style",
    },
    sections: {
      required: ["contact", "summary", "impact", "experience"],
      optional: ["education", "volunteer", "awards"],
      industrySpecific: ["programDevelopment", "communityOutreach", "stakeholderEngagement", "impactMeasurement", "grantManagement", "volunteerCoordination"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: true,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: false,
      showLanguages: true,
    },
  },
  "nonprofit-fundraising": {
    id: "nonprofit-fundraising-1",
    name: "Fundraising Professional",
    category: "sales", // Sales-oriented role
    description: "Results-driven template for development officers, fundraising managers, and donor relations specialists",
    industry: "Non-profit - Fundraising",
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#059669",
      background: "linear-gradient(135deg, #fef2f2 0%, #ecfdf5 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Roboto Slab', 'Georgia', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "sales-results",
      sidebarPosition: "left",
      sectionPriority: ["fundraisingResults", "experience", "skills", "education"],
      cardStyle: "achievement-style",
    },
    sections: {
      required: ["contact", "summary", "fundraisingResults", "experience"],
      optional: ["education", "awards", "volunteer"],
      industrySpecific: ["donorRelations", "grantWriting", "eventPlanning", "campaignManagement", "majorGifts", "corporatePartnerships"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: true,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: false,
      showLanguages: false,
    },
  },
  "nonprofit-advocacy": {
    id: "nonprofit-advocacy-1",
    name: "Advocacy Professional",
    category: "technology", // Using existing category for now, will be updated
    description: "Mission-driven template for policy advocates, community organizers, and social justice professionals",
    industry: "Non-profit - Advocacy",
    colors: {
      primary: "#f59e0b",
      secondary: "#d97706",
      accent: "#dc2626",
      background: "linear-gradient(135deg, #fef3c7 0%, #fef2f2 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Montserrat', 'Arial', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "brand-creative",
      sidebarPosition: "left",
      sectionPriority: ["advocacy", "experience", "campaigns", "education"],
      cardStyle: "campaign-style",
    },
    sections: {
      required: ["contact", "summary", "advocacy", "experience"],
      optional: ["education", "speaking", "media"],
      industrySpecific: ["policyAdvocacy", "communityOrganizing", "coalitionBuilding", "publicSpeaking", "mediaRelations", "grassrootsActivism"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: true,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: false,
      showLanguages: true,
    },
  },

  // Consulting Templates
  "consulting-strategy": {
    id: "consulting-strategy-1",
    name: "Strategy Consultant",
    category: "technology", // Using existing category for now, will be updated
    description: "Executive-level template for strategy consultants, management consultants, and business advisors",
    industry: "Consulting - Strategy",
    colors: {
      primary: "#1e293b",
      secondary: "#0f172a",
      accent: "#0ea5e9",
      background: "linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)",
      text: "#0f172a",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["clientImpact", "experience", "skills", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "clientImpact", "experience"],
      optional: ["education", "speaking", "publications"],
      industrySpecific: ["strategicPlanning", "businessTransformation", "marketAnalysis", "clientEngagement", "projectManagement", "changeManagement"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "consulting-operations": {
    id: "consulting-operations-1",
    name: "Operations Consultant",
    category: "technology", // Using existing category for now, will be updated
    description: "Process-focused template for operations consultants, process improvement specialists, and efficiency experts",
    industry: "Consulting - Operations",
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #ecfdf5 0%, #fef3c7 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["processImprovements", "experience", "methodologies", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "processImprovements", "experience"],
      optional: ["education", "certifications", "training"],
      industrySpecific: ["processOptimization", "leanSixSigma", "operationalEfficiency", "supplyChain", "qualityManagement", "continuousImprovement"],
    },
    features: {
      showTechStack: true,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "consulting-technology": {
    id: "consulting-technology-1",
    name: "Technology Consultant",
    category: "technology", // Using existing category for now, will be updated
    description: "Technical template for IT consultants, digital transformation specialists, and technology advisors",
    industry: "Consulting - Technology",
    colors: {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      accent: "#7c3aed",
      background: "linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)",
      text: "#0c4a6e",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Space Grotesk', 'Inter', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Fira Code', monospace",
    },
    layout: {
      headerStyle: "tech-focused",
      sidebarPosition: "left",
      sectionPriority: ["technicalSolutions", "experience", "skills", "certifications"],
      cardStyle: "code-blocks",
    },
    sections: {
      required: ["contact", "summary", "technicalSolutions", "experience", "skills"],
      optional: ["certifications", "education", "projects"],
      industrySpecific: ["digitalTransformation", "systemIntegration", "cloudMigration", "cybersecurity", "dataStrategy", "technologyRoadmap"],
    },
    features: {
      showTechStack: true,
      showPortfolio: true,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
};

// Template variation data structures for existing categories
export const templateVariations: Record<string, Record<VisualStyle, TemplateConfig>> = {
  technology: {
    minimal: {
      id: "tech-minimal-1",
      name: "Minimal Tech",
      category: "technology",
      description: "Clean, minimal design for tech professionals who prefer simplicity",
      industry: "Technology",
      templateContentId: "frontend-developer-junior", // Link to specific content
      colors: {
        primary: "#1f2937",
        secondary: "#374151",
        accent: "#6b7280",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#9ca3af",
      },
      typography: {
        headingFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "tech-focused",
        sidebarPosition: "none",
        sectionPriority: ["skills", "experience", "projects", "education"],
        cardStyle: "code-blocks",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills", "projects"],
        optional: ["education", "certifications"],
        industrySpecific: ["github", "techStack", "openSource", "hackathons"],
      },
      features: {
        showTechStack: true,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: true,
      },
    },
    bold: {
      id: "tech-bold-1",
      name: "Bold Tech",
      category: "technology",
      description: "Strong, impactful design for tech professionals who want to stand out",
      industry: "Technology",
      templateContentId: "backend-developer-senior", // Link to specific content
      colors: {
        primary: "#dc2626",
        secondary: "#b91c1c",
        accent: "#f59e0b",
        background: "linear-gradient(135deg, #fef2f2 0%, #fef3c7 100%)",
        text: "#1f2937",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Roboto Slab', 'Georgia', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "tech-focused",
        sidebarPosition: "left",
        sectionPriority: ["skills", "projects", "experience", "education"],
        cardStyle: "code-blocks",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills", "projects"],
        optional: ["education", "certifications"],
        industrySpecific: ["github", "techStack", "openSource", "hackathons"],
      },
      features: {
        showTechStack: true,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: true,
      },
    },
    creative: {
      id: "tech-creative-1",
      name: "Creative Tech",
      category: "technology",
      description: "Creative, modern design for tech professionals in creative roles",
      industry: "Technology",
      templateContentId: "fullstack-developer-senior", // Link to specific content
      colors: {
        primary: "#7c3aed",
        secondary: "#5b21b6",
        accent: "#ec4899",
        background: "linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)",
        text: "#1e1b4b",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Playfair Display', 'Georgia', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "portfolio-hero",
        sidebarPosition: "right",
        sectionPriority: ["projects", "skills", "experience", "education"],
        cardStyle: "portfolio-cards",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills", "projects"],
        optional: ["education", "certifications"],
        industrySpecific: ["github", "techStack", "openSource", "hackathons"],
      },
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: true,
        showDesignTools: true,
        showCertifications: true,
        showLanguages: true,
      },
    },
    corporate: {
      id: "tech-corporate-1",
      name: "Corporate Tech",
      category: "technology",
      description: "Professional, corporate design for enterprise tech professionals",
      industry: "Technology",
      templateContentId: "devops-engineer-senior", // Link to specific content
      colors: {
        primary: "#1e40af",
        secondary: "#1e3a8a",
        accent: "#059669",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
        text: "#1e293b",
        muted: "#64748b",
      },
      typography: {
        headingFont: "'Merriweather', 'Times New Roman', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "executive-minimal",
        sidebarPosition: "left",
        sectionPriority: ["experience", "skills", "projects", "education"],
        cardStyle: "metrics-focused",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills", "projects"],
        optional: ["education", "certifications"],
        industrySpecific: ["github", "techStack", "openSource", "hackathons"],
      },
      features: {
        showTechStack: true,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: true,
      },
    },
    modern: {
      id: "tech-modern-1",
      name: "Modern Tech",
      category: "technology",
      description: "Contemporary design with modern aesthetics for forward-thinking tech professionals",
      industry: "Technology",
      templateContentId: "data-scientist-senior", // Link to specific content
      colors: {
        primary: "#0f172a",
        secondary: "#1e293b",
        accent: "#10b981",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        text: "#1e293b",
        muted: "#64748b",
      },
      typography: {
        headingFont: "'JetBrains Mono', 'Courier New', monospace",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "tech-focused",
        sidebarPosition: "left",
        sectionPriority: ["skills", "projects", "experience", "education"],
        cardStyle: "code-blocks",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills", "projects"],
        optional: ["education", "certifications"],
        industrySpecific: ["github", "techStack", "openSource", "hackathons"],
      },
      features: {
        showTechStack: true,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: true,
      },
    },
  },
  design: {
    minimal: {
      id: "design-minimal-1",
      name: "Minimal Designer",
      category: "design",
      description: "Clean, minimal design showcasing work through simplicity",
      industry: "Design & Creative",
      colors: {
        primary: "#1f2937",
        secondary: "#374151",
        accent: "#6b7280",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#9ca3af",
      },
      typography: {
        headingFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "portfolio-hero",
        sidebarPosition: "none",
        sectionPriority: ["portfolio", "experience", "skills", "education"],
        cardStyle: "portfolio-cards",
      },
      sections: {
        required: ["contact", "portfolio", "experience", "skills"],
        optional: ["education", "awards"],
        industrySpecific: ["designProcess", "clientWork", "designTools", "inspiration"],
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: false,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: false,
        showDesignTools: true,
        showCertifications: false,
        showLanguages: false,
      },
    },
    bold: {
      id: "design-bold-1",
      name: "Bold Designer",
      category: "design",
      description: "Strong, vibrant design for designers who want to make a statement",
      industry: "Design & Creative",
      colors: {
        primary: "#dc2626",
        secondary: "#b91c1c",
        accent: "#f59e0b",
        background: "linear-gradient(135deg, #fef2f2 0%, #fef3c7 100%)",
        text: "#1f2937",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Montserrat', 'Arial', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "brand-creative",
        sidebarPosition: "left",
        sectionPriority: ["portfolio", "experience", "skills", "education"],
        cardStyle: "campaign-style",
      },
      sections: {
        required: ["contact", "portfolio", "experience", "skills"],
        optional: ["education", "awards"],
        industrySpecific: ["designProcess", "clientWork", "designTools", "inspiration"],
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: true,
        showTeamSize: false,
        showGithub: false,
        showDesignTools: true,
        showCertifications: false,
        showLanguages: false,
      },
    },
    creative: {
      id: "design-creative-1",
      name: "Creative Designer",
      category: "design",
      description: "Artistic, expressive design for creative professionals",
      industry: "Design & Creative",
      colors: {
        primary: "#ec4899",
        secondary: "#7c3aed",
        accent: "#f59e0b",
        background: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 50%, #e0e7ff 100%)",
        text: "#374151",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Playfair Display', 'Georgia', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "portfolio-hero",
        sidebarPosition: "right",
        sectionPriority: ["portfolio", "experience", "skills", "education"],
        cardStyle: "portfolio-cards",
      },
      sections: {
        required: ["contact", "portfolio", "experience", "skills"],
        optional: ["education", "awards"],
        industrySpecific: ["designProcess", "clientWork", "designTools", "inspiration"],
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: false,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: false,
        showDesignTools: true,
        showCertifications: false,
        showLanguages: false,
      },
    },
    corporate: {
      id: "design-corporate-1",
      name: "Corporate Designer",
      category: "design",
      description: "Professional design for corporate and enterprise design roles",
      industry: "Design & Creative",
      colors: {
        primary: "#1e40af",
        secondary: "#1e3a8a",
        accent: "#059669",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
        text: "#1e293b",
        muted: "#64748b",
      },
      typography: {
        headingFont: "'Merriweather', 'Times New Roman', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "executive-minimal",
        sidebarPosition: "left",
        sectionPriority: ["portfolio", "experience", "skills", "education"],
        cardStyle: "metrics-focused",
      },
      sections: {
        required: ["contact", "portfolio", "experience", "skills"],
        optional: ["education", "awards"],
        industrySpecific: ["designProcess", "clientWork", "designTools", "inspiration"],
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: false,
        showDesignTools: true,
        showCertifications: true,
        showLanguages: false,
      },
    },
    modern: {
      id: "design-modern-1",
      name: "Modern Designer",
      category: "design",
      description: "Contemporary design with modern aesthetics and clean lines",
      industry: "Design & Creative",
      colors: {
        primary: "#0ea5e9",
        secondary: "#0284c7",
        accent: "#8b5cf6",
        background: "linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)",
        text: "#1e293b",
        muted: "#64748b",
      },
      typography: {
        headingFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "portfolio-hero",
        sidebarPosition: "split",
        sectionPriority: ["portfolio", "skills", "experience", "education"],
        cardStyle: "portfolio-cards",
      },
      sections: {
        required: ["contact", "portfolio", "experience", "skills"],
        optional: ["education", "awards"],
        industrySpecific: ["designProcess", "clientWork", "designTools", "inspiration"],
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: false,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showGithub: false,
        showDesignTools: true,
        showCertifications: false,
        showLanguages: false,
      },
    },
  },
  management: {
    minimal: {
      id: "management-minimal-1",
      name: "Minimal Executive",
      category: "management",
      description: "Clean, minimal design for executive professionals who prefer simplicity",
      industry: "Management & Leadership",
      colors: {
        primary: "#1f2937",
        secondary: "#374151",
        accent: "#6b7280",
        background: "#ffffff",
        text: "#1f2937",
        muted: "#9ca3af",
      },
      typography: {
        headingFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "executive-minimal",
        sidebarPosition: "none",
        sectionPriority: ["summary", "experience", "achievements", "education"],
        cardStyle: "metrics-focused",
      },
      sections: {
        required: ["contact", "executiveSummary", "experience", "achievements"],
        optional: ["education", "boardPositions"],
        industrySpecific: ["teamLeadership", "budgetManagement", "strategicInitiatives", "kpis"],
      },
      features: {
        showTechStack: false,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: false,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false,
      },
    },
    bold: {
      id: "management-bold-1",
      name: "Bold Executive",
      category: "management",
      description: "Strong, impactful design for executives who want to command attention",
      industry: "Management & Leadership",
      colors: {
        primary: "#dc2626",
        secondary: "#b91c1c",
        accent: "#f59e0b",
        background: "linear-gradient(135deg, #fef2f2 0%, #fef3c7 100%)",
        text: "#1f2937",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Montserrat', 'Arial', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "sales-results",
        sidebarPosition: "left",
        sectionPriority: ["achievements", "experience", "leadership", "education"],
        cardStyle: "achievement-style",
      },
      sections: {
        required: ["contact", "executiveSummary", "experience", "achievements"],
        optional: ["education", "boardPositions"],
        industrySpecific: ["teamLeadership", "budgetManagement", "strategicInitiatives", "kpis"],
      },
      features: {
        showTechStack: false,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: false,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false,
      },
    },
    creative: {
      id: "management-creative-1",
      name: "Creative Executive",
      category: "management",
      description: "Creative, modern design for executives in creative industries",
      industry: "Management & Leadership",
      colors: {
        primary: "#7c3aed",
        secondary: "#5b21b6",
        accent: "#ec4899",
        background: "linear-gradient(135deg, #faf5ff 0%, #fce7f3 100%)",
        text: "#1e1b4b",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Playfair Display', 'Georgia', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "brand-creative",
        sidebarPosition: "right",
        sectionPriority: ["achievements", "experience", "leadership", "education"],
        cardStyle: "campaign-style",
      },
      sections: {
        required: ["contact", "executiveSummary", "experience", "achievements"],
        optional: ["education", "boardPositions"],
        industrySpecific: ["teamLeadership", "budgetManagement", "strategicInitiatives", "kpis"],
      },
      features: {
        showTechStack: false,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: true,
        showTeamSize: true,
        showGithub: false,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false,
      },
    },
    corporate: {
      id: "management-corporate-1",
      name: "Corporate Executive",
      category: "management",
      description: "Traditional, professional design for corporate executives",
      industry: "Management & Leadership",
      colors: {
        primary: "#1e40af",
        secondary: "#1e3a8a",
        accent: "#059669",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        text: "#1f2937",
        muted: "#6b7280",
      },
      typography: {
        headingFont: "'Merriweather', 'Times New Roman', serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "executive-minimal",
        sidebarPosition: "none",
        sectionPriority: ["summary", "achievements", "experience", "leadership"],
        cardStyle: "metrics-focused",
      },
      sections: {
        required: ["contact", "executiveSummary", "experience", "achievements"],
        optional: ["education", "boardPositions"],
        industrySpecific: ["teamLeadership", "budgetManagement", "strategicInitiatives", "kpis"],
      },
      features: {
        showTechStack: false,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: false,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false,
      },
    },
    modern: {
      id: "management-modern-1",
      name: "Modern Executive",
      category: "management",
      description: "Contemporary design for forward-thinking executives and leaders",
      industry: "Management & Leadership",
      colors: {
        primary: "#0ea5e9",
        secondary: "#0284c7",
        accent: "#8b5cf6",
        background: "linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)",
        text: "#1e293b",
        muted: "#64748b",
      },
      typography: {
        headingFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "executive-minimal",
        sidebarPosition: "split",
        sectionPriority: ["achievements", "experience", "leadership", "education"],
        cardStyle: "metrics-focused",
      },
      sections: {
        required: ["contact", "executiveSummary", "experience", "achievements"],
        optional: ["education", "boardPositions"],
        industrySpecific: ["teamLeadership", "budgetManagement", "strategicInitiatives", "kpis"],
      },
      features: {
        showTechStack: false,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: false,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: false,
      },
    },
  },
};

// Legacy template configurations (maintained for backward compatibility)
export const templateConfigs: Record<TemplateCategory, TemplateConfig> = {
  technology: {
    id: "tech-modern-1",
    name: "Modern Tech Professional",
    category: "technology",
    description: "Modern, clean template for technology professionals",
    industry: "Technology",
    templateContentId: "fullstack-developer-senior", // Link to specific content
    colors: {
      primary: "#1f2937",
      secondary: "#374151",
      accent: "#6b7280",
      background: "#ffffff",
      text: "#1f2937",
      muted: "#9ca3af",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "tech-focused",
      sidebarPosition: "none",
      sectionPriority: ["skills", "experience", "projects", "education"],
      cardStyle: "code-blocks",
    },
    sections: {
      required: ["contact", "summary", "experience", "skills", "projects"],
      optional: ["education", "certifications"],
      industrySpecific: ["github", "techStack", "openSource", "hackathons"],
    },
    features: {
      showTechStack: true,
      showPortfolio: true,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  design: {
    id: "design-creative-1",
    name: "Creative Designer",
    category: "design",
    description: "Creative template for designers and creative professionals",
    industry: "Design & Creative",
    templateContentId: "frontend-developer-senior", // Link to specific content
    colors: {
      primary: "#7c3aed",
      secondary: "#5b21b6",
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #faf5ff 0%, #fef3c7 100%)",
      text: "#1e1b4b",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Playfair Display', 'Georgia', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "portfolio-hero",
      sidebarPosition: "left",
      sectionPriority: ["portfolio", "experience", "skills", "education"],
      cardStyle: "portfolio-cards",
    },
    sections: {
      required: ["contact", "summary", "portfolio", "experience", "skills"],
      optional: ["education", "awards"],
      industrySpecific: ["designTools", "portfolio", "clientWork", "designProcess"],
    },
    features: {
      showTechStack: false,
      showPortfolio: true,
      showMetrics: false,
      showPublications: false,
      showCampaigns: true,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: true,
      showCertifications: false,
      showLanguages: false,
    },
  },
  management: {
    id: "management-corporate-1",
    name: "Corporate Executive",
    category: "management",
    description: "Executive template for management and leadership roles",
    industry: "Management & Leadership",
    templateContentId: "project-manager", // Link to specific content
    colors: {
      primary: "#1e40af",
      secondary: "#1e3a8a",
      accent: "#059669",
      background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
      text: "#1e293b",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Merriweather', 'Times New Roman', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["achievements", "experience", "leadership", "education"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "executiveSummary", "achievements", "experience"],
      optional: ["education", "awards", "speaking"],
      industrySpecific: ["leadership", "teamManagement", "strategicPlanning", "budgetManagement"],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  academic: {
    id: "4",
    name: "Academic Researcher",
    category: "academic",
    description:
      "Comprehensive CV format for researchers, professors, and academics",
    industry: "Academia & Research",
    templateContentId: "academic-researcher", // Link to specific content
    colors: {
      primary: "#1e40af",
      secondary: "#3730a3",
      accent: "#dc2626",
      background: "#ffffff",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Crimson Text', 'Times New Roman', serif",
      bodyFont: "'Crimson Text', 'Times New Roman', serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "academic-formal",
      sidebarPosition: "none",
      sectionPriority: ["education", "publications", "research", "teaching"],
      cardStyle: "publication-style",
    },
    sections: {
      required: ["contact", "education", "research", "publications"],
      optional: ["awards", "grants", "conferences"],
      industrySpecific: [
        "dissertations",
        "supervision",
        "reviewing",
        "academicService",
      ],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: false,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  marketing: {
    id: "5",
    name: "Marketing Professional",
    category: "marketing",
    description:
      "Results-driven layout for marketers, brand managers, and growth professionals",
    industry: "Marketing & Growth",
    templateContentId: "business-analyst", // Link to specific content
    colors: {
      primary: "#dc2626",
      secondary: "#ea580c",
      accent: "#7c3aed",
      background:
        "linear-gradient(135deg, #fef2f2 0%, #fef3c7 50%, #f3e8ff 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Montserrat', 'Arial', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "brand-creative",
      sidebarPosition: "left",
      sectionPriority: ["campaigns", "experience", "skills", "achievements"],
      cardStyle: "campaign-style",
    },
    sections: {
      required: ["contact", "summary", "campaigns", "experience", "skills"],
      optional: ["education", "certifications"],
      industrySpecific: [
        "brandWork",
        "analytics",
        "socialMedia",
        "contentStrategy",
      ],
    },
    features: {
      showTechStack: false,
      showPortfolio: true,
      showMetrics: true,
      showPublications: false,
      showCampaigns: true,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  sales: {
    id: "6",
    name: "Sales Professional",
    category: "sales",
    description:
      "Achievement-focused template for sales professionals and business development",
    industry: "Sales & Business Development",
    templateContentId: "business-analyst", // Link to specific content
    colors: {
      primary: "#059669",
      secondary: "#047857",
      accent: "#dc2626",
      background: "linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Roboto Slab', 'Georgia', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Courier New', monospace",
    },
    layout: {
      headerStyle: "sales-results",
      sidebarPosition: "left",
      sectionPriority: ["achievements", "experience", "skills", "education"],
      cardStyle: "achievement-style",
    },
    sections: {
      required: ["contact", "summary", "achievements", "experience"],
      optional: ["education", "awards"],
      industrySpecific: [
        "salesMetrics",
        "clientPortfolio",
        "territoryManagement",
        "quotaAttainment",
      ],
    },
    features: {
      showTechStack: false,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: false,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "tech-modern": {
    id: "7",
    name: "Modern Tech Professional",
    category: "tech-modern",
    description:
      "Contemporary design for modern developers with emphasis on visual hierarchy and clean aesthetics",
    industry: "Technology",
    templateContentId: "frontend-developer-senior", // Link to specific content
    colors: {
      primary: "#2563eb",
      secondary: "#1e40af",
      accent: "#06b6d4",
      background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
      text: "#0f172a",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Inter', 'Segoe UI', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', 'Fira Code', monospace",
    },
    layout: {
      headerStyle: "tech-focused",
      sidebarPosition: "left",
      sectionPriority: ["skills", "projects", "experience", "education"],
      cardStyle: "code-blocks",
    },
    sections: {
      required: ["contact", "summary", "experience", "skills", "projects"],
      optional: ["education", "certifications", "awards"],
      industrySpecific: ["github", "techStack", "openSource", "contributions"],
    },
    features: {
      showTechStack: true,
      showPortfolio: true,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  "tech-minimal": {
    id: "8",
    name: "Minimal Tech",
    category: "tech-minimal",
    description:
      "Clean, minimal design focusing on content hierarchy and readability for tech professionals",
    industry: "Technology",
    templateContentId: "backend-developer-junior", // Link to specific content
    colors: {
      primary: "#1f2937",
      secondary: "#374151",
      accent: "#10b981",
      background: "#ffffff",
      text: "#111827",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'SF Pro Display', 'Inter', sans-serif",
      bodyFont: "'SF Pro Text', 'Inter', sans-serif",
      codeFont: "'SF Mono', 'JetBrains Mono', monospace",
    },
    layout: {
      headerStyle: "tech-focused",
      sidebarPosition: "none",
      sectionPriority: ["summary", "experience", "skills", "projects"],
      cardStyle: "code-blocks",
    },
    sections: {
      required: ["contact", "summary", "experience", "skills"],
      optional: ["projects", "education", "certifications"],
      industrySpecific: ["github", "techStack", "openSource"],
    },
    features: {
      showTechStack: true,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "tech-senior": {
    id: "9",
    name: "Senior Tech Leader",
    category: "tech-senior",
    description:
      "Executive-level template for senior engineers, tech leads, and engineering managers",
    industry: "Technology Leadership",
    templateContentId: "devops-engineer-senior", // Link to specific content
    colors: {
      primary: "#0f172a",
      secondary: "#1e293b",
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      text: "#0f172a",
      muted: "#475569",
    },
    typography: {
      headingFont: "'Merriweather', 'Georgia', serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'JetBrains Mono', monospace",
    },
    layout: {
      headerStyle: "executive-minimal",
      sidebarPosition: "left",
      sectionPriority: ["leadership", "experience", "skills", "achievements"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "executiveSummary", "experience", "leadership"],
      optional: ["education", "speaking", "publications"],
      industrySpecific: ["teamLeadership", "architecture", "mentoring", "strategy"],
    },
    features: {
      showTechStack: true,
      showPortfolio: false,
      showMetrics: true,
      showPublications: true,
      showCampaigns: false,
      showTeamSize: true,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "tech-fullstack": {
    id: "10",
    name: "Full-Stack Developer",
    category: "tech-fullstack",
    description:
      "Comprehensive template showcasing both frontend and backend expertise with project highlights",
    industry: "Technology",
    templateContentId: "fullstack-developer-senior", // Link to specific content
    colors: {
      primary: "#7c3aed",
      secondary: "#5b21b6",
      accent: "#06b6d4",
      background: "linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%)",
      text: "#1e1b4b",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Space Grotesk', 'Inter', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'Fira Code', 'JetBrains Mono', monospace",
    },
    layout: {
      headerStyle: "tech-focused",
      sidebarPosition: "split",
      sectionPriority: ["projects", "skills", "experience", "education"],
      cardStyle: "portfolio-cards",
    },
    sections: {
      required: ["contact", "summary", "projects", "skills", "experience"],
      optional: ["education", "certifications", "contributions"],
      industrySpecific: ["fullStackProjects", "apiDesign", "databases", "deployment"],
    },
    features: {
      showTechStack: true,
      showPortfolio: true,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: true,
    },
  },
  "tech-devops": {
    id: "11",
    name: "DevOps Engineer",
    category: "tech-devops",
    description:
      "Infrastructure-focused template highlighting automation, cloud expertise, and system reliability",
    industry: "Technology",
    templateContentId: "devops-engineer-senior", // Link to specific content
    colors: {
      primary: "#dc2626",
      secondary: "#b91c1c",
      accent: "#059669",
      background: "linear-gradient(135deg, #fef2f2 0%, #ecfdf5 100%)",
      text: "#1f2937",
      muted: "#6b7280",
    },
    typography: {
      headingFont: "'Roboto Mono', 'JetBrains Mono', monospace",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'Roboto Mono', 'JetBrains Mono', monospace",
    },
    layout: {
      headerStyle: "tech-focused",
      sidebarPosition: "left",
      sectionPriority: ["skills", "experience", "projects", "certifications"],
      cardStyle: "metrics-focused",
    },
    sections: {
      required: ["contact", "summary", "experience", "skills"],
      optional: ["projects", "certifications", "education"],
      industrySpecific: ["cloudPlatforms", "automation", "monitoring", "security"],
    },
    features: {
      showTechStack: true,
      showPortfolio: false,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: true,
      showDesignTools: false,
      showCertifications: true,
      showLanguages: false,
    },
  },
  "tech-mobile": {
    id: "12",
    name: "Mobile Developer",
    category: "tech-mobile",
    description:
      "Mobile-first template for iOS, Android, and cross-platform developers with app showcase",
    industry: "Technology",
    templateContentId: "mobile-developer-ios", // Link to specific content
    colors: {
      primary: "#0ea5e9",
      secondary: "#0284c7",
      accent: "#f59e0b",
      background: "linear-gradient(135deg, #f0f9ff 0%, #fef3c7 100%)",
      text: "#0c4a6e",
      muted: "#64748b",
    },
    typography: {
      headingFont: "'Poppins', 'Inter', sans-serif",
      bodyFont: "'Inter', 'Segoe UI', sans-serif",
      codeFont: "'Source Code Pro', 'JetBrains Mono', monospace",
    },
    layout: {
      headerStyle: "portfolio-hero",
      sidebarPosition: "right",
      sectionPriority: ["apps", "skills", "experience", "education"],
      cardStyle: "portfolio-cards",
    },
    sections: {
      required: ["contact", "summary", "apps", "skills", "experience"],
      optional: ["education", "certifications", "hackathons"],
      industrySpecific: ["appStore", "playStore", "frameworks", "platforms"],
    },
    features: {
      showTechStack: true,
      showPortfolio: true,
      showMetrics: true,
      showPublications: false,
      showCampaigns: false,
      showTeamSize: false,
      showGithub: true,
      showDesignTools: true,
      showCertifications: true,
      showLanguages: false,
    },
  },
};

/**
 * Get template content ID from template configuration
 */
export function getTemplateContentId(templateConfig: TemplateConfig): string | null {
  // First check if template has explicit content ID
  if (templateConfig.templateContentId) {
    return templateConfig.templateContentId;
  }

  // Fallback to mapping based on template ID and category
  const contentIdMappings: Record<string, string> = {
    // Technology templates
    'tech-minimal-1': 'frontend-developer-junior',
    'tech-bold-1': 'backend-developer-senior',
    'tech-creative-1': 'fullstack-developer-senior',
    'tech-corporate-1': 'devops-engineer-senior',
    'tech-modern-1': 'data-scientist-senior',
    
    // Healthcare templates
    'healthcare-clinical-1': 'clinical-researcher',
    'healthcare-admin-1': 'healthcare-admin',
    
    // Finance templates
    'finance-analyst-1': 'financial-analyst',
    'finance-risk-1': 'risk-manager',
    
    // Education templates
    'education-k12-1': 'k12-teacher',
    'education-higher-1': 'academic-researcher',
    
    // Business templates
    'product-manager-1': 'product-manager',
    'project-manager-1': 'project-manager',
    'business-analyst-1': 'business-analyst',
  };

  return contentIdMappings[templateConfig.id] || null;
}

export function getTemplateConfig(category: TemplateCategory): TemplateConfig {
  // Handle the new enhanced-technology template with HFI optimization
  if (category === "enhanced-technology") {
    return {
      id: "enhanced-technology-1",
      name: "Enhanced Technology Professional",
      category: "enhanced-technology",
      description: "Sophisticated technology template with HFI-optimized three-tier hierarchy, symmetrical design, and recruiter-friendly scanning patterns",
      industry: "Technology - All Levels",
      templateContentId: "enhanced-technology",
      colors: {
        primary: "#3B82F6", // Blue 500
        secondary: "#64748B", // Slate 500
        accent: "#10B981", // Emerald 500
        background: "#FFFFFF",
        text: "#1E293B", // Slate 800
        muted: "#64748B", // Slate 500
      },
      typography: {
        headingFont: "'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "tech-focused",
        sidebarPosition: "right",
        sectionPriority: ["header", "summary", "skills", "projects", "experience", "education"],
        cardStyle: "sophisticated",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills"],
        optional: ["projects", "education", "certifications", "achievements"],
        industrySpecific: ["github", "techstack"],
      },
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: true,
        showDesignTools: true,
        showCertifications: true,
        showLanguages: true,
      },
    };
  }
  
  // Handle the new modern-professional template
  if (category === "modern-professional") {
    return {
      id: "modern-professional-1",
      name: "Modern Professional",
      category: "modern-professional",
      description: "A clean, modern template following three-tier hierarchy design principles optimized for recruiter scanning patterns",
      industry: "Professional - All Industries",
      templateContentId: "modern-professional",
      colors: {
        primary: "#3B82F6",
        secondary: "#64748B",
        accent: "#10B981",
        background: "#FFFFFF",
        text: "#1F2937",
        muted: "#6B7280",
      },
      typography: {
        headingFont: "'Inter', 'Segoe UI', sans-serif",
        bodyFont: "'Inter', 'Segoe UI', sans-serif",
        codeFont: "'JetBrains Mono', 'Courier New', monospace",
      },
      layout: {
        headerStyle: "executive-minimal",
        sidebarPosition: "none",
        sectionPriority: ["header", "summary", "experience", "skills", "projects", "education"],
        cardStyle: "metrics-focused",
      },
      sections: {
        required: ["contact", "summary", "experience", "skills"],
        optional: ["projects", "education", "certifications"],
        industrySpecific: [],
      },
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: true,
        showGithub: true,
        showDesignTools: false,
        showCertifications: true,
        showLanguages: true,
      },
    };
  }

  const config = templateConfigs[category];
  if (!config) {
    console.error(`Template config not found for category: ${category}`);
    console.log('Available categories:', Object.keys(templateConfigs));
    
    // Return the technology template as fallback
    return templateConfigs.technology;
  }
  return config;
}

export function getTemplateById(id: string): TemplateConfig | undefined {
  // First check legacy template configs
  const existingTemplate = Object.values(templateConfigs).find((template) => template.id === id);
  if (existingTemplate) return existingTemplate;

  // Then check industry template configs
  const industryTemplate = Object.values(industryTemplateConfigs).find((template) => template.id === id);
  if (industryTemplate) return industryTemplate;

  // Finally check template variations
  const allVariations = getAllTemplateVariations();
  return allVariations.find((template) => template.id === id);
}

export function getAllTemplates(): TemplateConfig[] {
  return [...Object.values(templateConfigs), ...Object.values(industryTemplateConfigs)];
}

// Template discovery and filtering functions
export function searchTemplates(options: TemplateSearchOptions): TemplateConfig[] {
  const allTemplates = getAllTemplates();

  // Apply filters
  let filteredTemplates = allTemplates.filter(template => {
    // Category filter
    if (options.filters.categories.length > 0 && !options.filters.categories.includes(template.category)) {
      return false;
    }

    // Industry filter
    if (options.filters.industries.length > 0 && !options.filters.industries.some(industry =>
      template.industry.toLowerCase().includes(industry.toLowerCase())
    )) {
      return false;
    }

    // Features filter
    if (options.filters.features.length > 0) {
      const templateFeatures = getTemplateFeaturesList(template);
      if (!options.filters.features.some(feature => templateFeatures.includes(feature))) {
        return false;
      }
    }

    // Rating filter
    const templateRating = getTemplateRating(template.category);
    if (templateRating < options.filters.rating) {
      return false;
    }

    // ATS optimization filter
    if (options.filters.atsOptimized && !isATSOptimized(template)) {
      return false;
    }

    return true;
  });

  // Apply search query
  if (options.query.trim()) {
    const query = options.query.toLowerCase();
    filteredTemplates = filteredTemplates.filter(template => {
      const searchableText = [
        template.name,
        template.description,
        template.industry,
        template.category,
        ...getTemplateTags(template)
      ].join(' ').toLowerCase();

      return searchableText.includes(query);
    });
  }

  // Apply sorting
  filteredTemplates.sort((a, b) => {
    let comparison = 0;

    switch (options.sortBy) {
      case 'popularity':
        comparison = getTemplateRating(b.category) - getTemplateRating(a.category);
        break;
      case 'newest':
        comparison = (isNewTemplate(b.category) ? 1 : 0) - (isNewTemplate(a.category) ? 1 : 0);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'rating':
        comparison = getTemplateRating(b.category) - getTemplateRating(a.category);
        break;
      default:
        comparison = 0;
    }

    return options.sortOrder === 'desc' ? comparison : -comparison;
  });

  return filteredTemplates;
}

export function getTemplateComparison(templateIds: string[]): TemplateComparison {
  const templates = templateIds.map(id => getTemplateById(id)).filter(Boolean) as TemplateConfig[];

  const comparisonMatrix: { [templateId: string]: { [feature: string]: boolean | string | number } } = {};

  templates.forEach(template => {
    comparisonMatrix[template.id] = {
      name: template.name,
      category: template.category,
      industry: template.industry,
      rating: getTemplateRating(template.category),
      atsOptimized: isATSOptimized(template),
      showTechStack: template.features.showTechStack,
      showPortfolio: template.features.showPortfolio,
      showMetrics: template.features.showMetrics,
      showPublications: template.features.showPublications,
      showCertifications: template.features.showCertifications,
      headerStyle: template.layout.headerStyle,
      sidebarPosition: template.layout.sidebarPosition,
      cardStyle: template.layout.cardStyle,
      experienceLevel: getTemplateDifficulty(template.category),
      downloads: getTemplateDownloads(template.category),
      isNew: isNewTemplate(template.category)
    };
  });

  return {
    templates,
    comparisonMatrix
  };
}

export function getTemplateRecommendations(userProfile: UserProfile): TemplateRecommendation[] {
  const allTemplates = getAllTemplates();
  const recommendations: TemplateRecommendation[] = [];

  allTemplates.forEach(template => {
    let score = 0;
    const reasons: string[] = [];

    // Industry match (highest weight)
    if (userProfile.industry && template.industry.toLowerCase().includes(userProfile.industry.toLowerCase())) {
      score += 40;
      reasons.push(`Perfect match for ${userProfile.industry} industry`);
    }

    // Experience level match
    if (userProfile.experienceLevel) {
      const templateLevel = getTemplateDifficulty(template.category);
      if (templateLevel === userProfile.experienceLevel) {
        score += 25;
        reasons.push(`Designed for ${userProfile.experienceLevel} level professionals`);
      }
    }

    // Visual style preference
    if (userProfile.preferences?.visualStyle) {
      const templateStyle = getTemplateVisualStyle(template);
      if (templateStyle === userProfile.preferences.visualStyle) {
        score += 20;
        reasons.push(`Matches your ${userProfile.preferences.visualStyle} style preference`);
      }
    }

    // Skills match
    if (userProfile.skills && userProfile.skills.length > 0) {
      const templateFeatures = getTemplateFeaturesList(template);
      const skillMatches = userProfile.skills.filter(skill =>
        templateFeatures.some(feature => feature.toLowerCase().includes(skill.toLowerCase()))
      );
      if (skillMatches.length > 0) {
        score += skillMatches.length * 5;
        reasons.push(`Highlights your ${skillMatches.join(', ')} skills`);
      }
    }

    // Base popularity score
    score += getTemplateRating(template.category) * 2;

    let category: 'perfect-match' | 'good-fit' | 'alternative' = 'alternative';
    if (score >= 70) category = 'perfect-match';
    else if (score >= 40) category = 'good-fit';

    recommendations.push({
      template,
      score,
      reasons,
      category
    });
  });

  return recommendations.sort((a, b) => b.score - a.score);
}

// Helper functions for template discovery
function getTemplateFeaturesList(template: TemplateConfig): string[] {
  const features = [];
  if (template.features.showTechStack) features.push('Tech Stack', 'Technology');
  if (template.features.showPortfolio) features.push('Portfolio', 'Creative Work');
  if (template.features.showMetrics) features.push('Metrics', 'Analytics', 'Results');
  if (template.features.showPublications) features.push('Publications', 'Research', 'Academic');
  if (template.features.showCampaigns) features.push('Campaigns', 'Marketing');
  if (template.features.showTeamSize) features.push('Team Leadership', 'Management');
  if (template.features.showGithub) features.push('GitHub', 'Open Source');
  if (template.features.showDesignTools) features.push('Design Tools', 'Creative');
  if (template.features.showCertifications) features.push('Certifications', 'Professional');
  if (template.features.showLanguages) features.push('Languages', 'International');
  return features;
}

function isATSOptimized(template: TemplateConfig): boolean {
  // All templates are ATS optimized, but some have better optimization
  return true;
}

function getTemplateVisualStyle(template: TemplateConfig): VisualStyle {
  // Map template categories to visual styles
  const styleMap: Record<string, VisualStyle> = {
    'tech-minimal': 'minimal',
    'tech-modern': 'modern',
    'tech-senior': 'corporate',
    'design': 'creative',
    'management': 'corporate',
    'academic': 'minimal',
    'marketing': 'bold',
    'sales': 'bold'
  };
  return styleMap[template.category] || 'modern';
}

function getTemplateRating(category: string): number {
  const ratingMap: Record<string, number> = {
    'technology': 4.8,
    'tech-modern': 4.9,
    'tech-minimal': 4.7,
    'tech-senior': 4.8,
    'tech-fullstack': 4.9,
    'tech-devops': 4.6,
    'tech-mobile': 4.7,
    'design': 4.9,
    'management': 4.6,
    'academic': 4.4,
    'marketing': 4.7,
    'sales': 4.5,
  };
  return ratingMap[category] || 4.5;
}

function getTemplateDifficulty(category: string): 'Beginner' | 'Intermediate' | 'Advanced' {
  const difficultyMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
    'technology': 'Intermediate',
    'tech-modern': 'Beginner',
    'tech-minimal': 'Beginner',
    'tech-senior': 'Advanced',
    'tech-fullstack': 'Advanced',
    'tech-devops': 'Advanced',
    'tech-mobile': 'Intermediate',
    'design': 'Intermediate',
    'management': 'Advanced',
    'academic': 'Advanced',
    'marketing': 'Intermediate',
    'sales': 'Intermediate',
  };
  return difficultyMap[category] || 'Intermediate';
}

function getTemplateDownloads(category: string): string {
  const downloadsMap: Record<string, string> = {
    'technology': '12.5K',
    'tech-modern': '18.2K',
    'tech-minimal': '8.9K',
    'tech-senior': '15.3K',
    'tech-fullstack': '22.1K',
    'tech-devops': '9.7K',
    'tech-mobile': '11.4K',
    'design': '22.3K',
    'management': '5.9K',
    'academic': '3.1K',
    'marketing': '7.6K',
    'sales': '4.8K',
  };
  return downloadsMap[category] || '1.2K';
}

function isNewTemplate(category: string): boolean {
  const newTemplates = ['tech-modern', 'tech-fullstack', 'tech-mobile', 'tech-devops'];
  return newTemplates.includes(category);
}

// User preferences management
export function getUserTemplatePreferences(userId: string): UserTemplatePreferences {
  const stored = localStorage.getItem(`template-preferences-${userId}`);
  if (stored) {
    return JSON.parse(stored);
  }

  return {
    userId,
    favoriteTemplates: [],
    customTemplates: [],
    searchHistory: [],
    visualStylePreference: [],
    templateUsageHistory: []
  };
}

export function saveUserTemplatePreferences(preferences: UserTemplatePreferences): void {
  localStorage.setItem(`template-preferences-${preferences.userId}`, JSON.stringify(preferences));
}

export function addToFavorites(userId: string, templateId: string): void {
  const preferences = getUserTemplatePreferences(userId);
  if (!preferences.favoriteTemplates.includes(templateId)) {
    preferences.favoriteTemplates.push(templateId);
    saveUserTemplatePreferences(preferences);
  }
}

export function removeFromFavorites(userId: string, templateId: string): void {
  const preferences = getUserTemplatePreferences(userId);
  preferences.favoriteTemplates = preferences.favoriteTemplates.filter(id => id !== templateId);
  saveUserTemplatePreferences(preferences);
}

export function isFavoriteTemplate(userId: string, templateId: string): boolean {
  const preferences = getUserTemplatePreferences(userId);
  return preferences.favoriteTemplates.includes(templateId);
}

export function addToSearchHistory(userId: string, query: string): void {
  const preferences = getUserTemplatePreferences(userId);
  preferences.searchHistory = [query, ...preferences.searchHistory.filter(q => q !== query)].slice(0, 10);
  saveUserTemplatePreferences(preferences);
}

export function recordTemplateUsage(userId: string, templateId: string, duration: number, completed: boolean): void {
  const preferences = getUserTemplatePreferences(userId);
  preferences.templateUsageHistory.push({
    templateId,
    usedAt: new Date(),
    duration,
    completed
  });
  preferences.lastUsedTemplate = templateId;
  saveUserTemplatePreferences(preferences);
}

export function getTemplatesByIndustry(industry: string): TemplateConfig[] {
  return Object.values(templateConfigs).filter((template) =>
    template.industry.toLowerCase().includes(industry.toLowerCase()),
  );
}

// Enhanced template service functions for the new configuration system
export function getEnhancedTemplateById(id: string): EnhancedTemplateConfig | undefined {
  // This function will be implemented when we have enhanced template data
  // For now, it returns undefined as enhanced templates are not yet created
  return undefined;
}

export function getTemplatesByExperienceLevel(level: ExperienceLevel): TemplateConfig[] {
  // Filter existing templates based on naming patterns that suggest experience level
  return Object.values(templateConfigs).filter((template) => {
    const name = template.name.toLowerCase();
    const description = template.description.toLowerCase();

    switch (level) {
      case "entry":
        return name.includes("entry") || description.includes("entry") ||
          name.includes("junior") || description.includes("junior");
      case "mid":
        return name.includes("professional") || description.includes("professional") ||
          (!name.includes("senior") && !name.includes("executive") && !name.includes("lead"));
      case "senior":
        return name.includes("senior") || description.includes("senior") ||
          name.includes("lead") || description.includes("lead");
      case "executive":
        return name.includes("executive") || description.includes("executive") ||
          name.includes("director") || description.includes("director");
      default:
        return false;
    }
  });
}

export function getTemplatesByVisualStyle(style: VisualStyle): TemplateConfig[] {
  // Filter existing templates based on naming patterns that suggest visual style
  return Object.values(templateConfigs).filter((template) => {
    const name = template.name.toLowerCase();
    const description = template.description.toLowerCase();

    switch (style) {
      case "minimal":
        return name.includes("minimal") || description.includes("minimal") ||
          name.includes("clean") || description.includes("clean");
      case "bold":
        return name.includes("bold") || description.includes("bold") ||
          name.includes("strong") || description.includes("strong");
      case "creative":
        return name.includes("creative") || description.includes("creative") ||
          template.category === "design";
      case "corporate":
        return name.includes("executive") || description.includes("executive") ||
          name.includes("professional") || description.includes("professional");
      case "modern":
        return name.includes("modern") || description.includes("modern") ||
          name.includes("contemporary") || description.includes("contemporary");
      default:
        return false;
    }
  });
}

export function getTemplatesByCategory(category: ExtendedTemplateCategory): TemplateConfig[] {
  // For existing categories, return the template directly
  if (category in templateConfigs) {
    return [templateConfigs[category as TemplateCategory]];
  }

  // For new extended categories, return from industryTemplateConfigs
  if (category in industryTemplateConfigs) {
    return [industryTemplateConfigs[category]];
  }

  // For base industry categories, return all variations
  switch (category) {
    case "healthcare":
      return [
        industryTemplateConfigs["healthcare-clinical"],
        industryTemplateConfigs["healthcare-administrative"],
        industryTemplateConfigs["healthcare-research"]
      ];
    case "finance":
      return [
        industryTemplateConfigs["finance-analyst"],
        industryTemplateConfigs["finance-advisor"],
        industryTemplateConfigs["finance-risk"]
      ];
    case "legal":
      return [
        industryTemplateConfigs["legal-corporate"],
        industryTemplateConfigs["legal-litigation"],
        industryTemplateConfigs["legal-compliance"]
      ];
    case "education":
      return [
        industryTemplateConfigs["education-k12"],
        industryTemplateConfigs["education-higher"],
        industryTemplateConfigs["education-administration"]
      ];
    case "nonprofit":
      return [
        industryTemplateConfigs["nonprofit-program"],
        industryTemplateConfigs["nonprofit-fundraising"],
        industryTemplateConfigs["nonprofit-advocacy"]
      ];
    case "consulting":
      return [
        industryTemplateConfigs["consulting-strategy"],
        industryTemplateConfigs["consulting-operations"],
        industryTemplateConfigs["consulting-technology"]
      ];
    default:
      return [];
  }
}

export function createDefaultCustomizationOptions(): CustomizationOptions {
  return {
    colorSchemes: [
      {
        id: "default",
        name: "Default",
        colors: {
          primary: "#0f172a",
          secondary: "#1e293b",
          accent: "#10b981",
          background: "#ffffff",
          text: "#1e293b",
          muted: "#64748b",
        },
      },
      {
        id: "blue",
        name: "Professional Blue",
        colors: {
          primary: "#1e40af",
          secondary: "#3730a3",
          accent: "#06b6d4",
          background: "#ffffff",
          text: "#1f2937",
          muted: "#6b7280",
        },
      },
      {
        id: "green",
        name: "Success Green",
        colors: {
          primary: "#059669",
          secondary: "#047857",
          accent: "#10b981",
          background: "#ffffff",
          text: "#1f2937",
          muted: "#6b7280",
        },
      },
    ],
    fontCombinations: [
      {
        id: "modern",
        name: "Modern Sans",
        typography: {
          headingFont: "'Inter', 'Segoe UI', sans-serif",
          bodyFont: "'Inter', 'Segoe UI', sans-serif",
          codeFont: "'JetBrains Mono', 'Courier New', monospace",
        },
      },
      {
        id: "classic",
        name: "Classic Serif",
        typography: {
          headingFont: "'Merriweather', 'Times New Roman', serif",
          bodyFont: "'Crimson Text', 'Times New Roman', serif",
          codeFont: "'JetBrains Mono', 'Courier New', monospace",
        },
      },
      {
        id: "tech",
        name: "Tech Mono",
        typography: {
          headingFont: "'JetBrains Mono', 'Courier New', monospace",
          bodyFont: "'Inter', 'Segoe UI', sans-serif",
          codeFont: "'JetBrains Mono', 'Courier New', monospace",
        },
      },
    ],
    layoutOptions: [
      {
        id: "sidebar-left",
        name: "Left Sidebar",
        headerStyle: "tech-focused",
        sidebarPosition: "left",
        cardStyle: "code-blocks",
      },
      {
        id: "sidebar-right",
        name: "Right Sidebar",
        headerStyle: "portfolio-hero",
        sidebarPosition: "right",
        cardStyle: "portfolio-cards",
      },
      {
        id: "no-sidebar",
        name: "Full Width",
        headerStyle: "executive-minimal",
        sidebarPosition: "none",
        cardStyle: "metrics-focused",
      },
    ],
    sectionCustomization: [],
    allowCustomColors: true,
    allowCustomFonts: true,
    allowSectionReordering: true,
  };
}

export function createDefaultIndustrySpecificConfig(): IndustrySpecificConfig {
  return {
    requiredSections: ["contact", "summary", "experience", "skills"],
    recommendedSections: ["education", "projects"],
    industryKeywords: [],
    complianceRequirements: [],
    specializedFields: {},
  };
}
// Template variation system functions
export function getTemplateVariations(category: string): TemplateConfig[] {
  if (category in templateVariations) {
    return Object.values(templateVariations[category]);
  }
  return [];
}

export function getTemplateVariation(category: string, style: VisualStyle): TemplateConfig | undefined {
  if (category in templateVariations && style in templateVariations[category]) {
    return templateVariations[category][style];
  }
  return undefined;
}

export function getAllTemplateVariations(): TemplateConfig[] {
  const allVariations: TemplateConfig[] = [];

  Object.keys(templateVariations).forEach(category => {
    Object.values(templateVariations[category]).forEach(template => {
      allVariations.push(template);
    });
  });

  return allVariations;
}

export function getTemplateVariationsByVisualStyle(style: VisualStyle): TemplateConfig[] {
  const variations: TemplateConfig[] = [];

  Object.keys(templateVariations).forEach(category => {
    if (style in templateVariations[category]) {
      variations.push(templateVariations[category][style]);
    }
  });

  return variations;
}

export function getAvailableVisualStyles(category: string): VisualStyle[] {
  if (category in templateVariations) {
    return Object.keys(templateVariations[category]) as VisualStyle[];
  }
  return [];
}

export function getTemplateVariationMetadata(templateId: string): {
  category: string;
  style: VisualStyle;
  variation: TemplateVariation;
} | undefined {
  for (const [category, variations] of Object.entries(templateVariations)) {
    for (const [style, template] of Object.entries(variations)) {
      if (template.id === templateId) {
        return {
          category,
          style: style as VisualStyle,
          variation: {
            id: template.id,
            name: template.name,
            description: template.description,
            previewImage: `/templates/previews/${template.id}.png`,
          },
        };
      }
    }
  }
  return undefined;
}

// Enhanced template selection logic
export function selectBestTemplateVariation(
  category: string,
  preferences: {
    visualStyle?: VisualStyle;
    experienceLevel?: ExperienceLevel;
    industry?: string;
  }
): TemplateConfig | undefined {
  const variations = getTemplateVariations(category);

  if (variations.length === 0) {
    return undefined;
  }

  // If specific visual style is requested, return that variation
  if (preferences.visualStyle) {
    const specificVariation = getTemplateVariation(category, preferences.visualStyle);
    if (specificVariation) {
      return specificVariation;
    }
  }

  // Default selection logic based on experience level
  if (preferences.experienceLevel) {
    switch (preferences.experienceLevel) {
      case 'entry':
        return getTemplateVariation(category, 'minimal') || variations[0];
      case 'mid':
        return getTemplateVariation(category, 'modern') || variations[0];
      case 'senior':
        return getTemplateVariation(category, 'corporate') || variations[0];
      case 'executive':
        return getTemplateVariation(category, 'bold') || variations[0];
    }
  }

  // Default to modern variation or first available
  return getTemplateVariation(category, 'modern') || variations[0];
}

// Template comparison utilities
export function compareTemplateVariations(templateIds: string[]): {
  templates: TemplateConfig[];
  differences: {
    colors: boolean;
    typography: boolean;
    layout: boolean;
    features: boolean;
  };
} {
  const templates = templateIds
    .map(id => getTemplateById(id))
    .filter((template): template is TemplateConfig => template !== undefined);

  if (templates.length < 2) {
    return {
      templates,
      differences: {
        colors: false,
        typography: false,
        layout: false,
        features: false,
      },
    };
  }

  const first = templates[0];
  const differences = {
    colors: templates.some(t => JSON.stringify(t.colors) !== JSON.stringify(first.colors)),
    typography: templates.some(t => JSON.stringify(t.typography) !== JSON.stringify(first.typography)),
    layout: templates.some(t => JSON.stringify(t.layout) !== JSON.stringify(first.layout)),
    features: templates.some(t => JSON.stringify(t.features) !== JSON.stringify(first.features)),
  };

  return { templates, differences };
}

// Template search and filtering with variations
export function searchTemplateVariations(query: string): TemplateConfig[] {
  const allVariations = getAllTemplateVariations();
  const searchTerm = query.toLowerCase();

  return allVariations.filter(template =>
    template.name.toLowerCase().includes(searchTerm) ||
    template.description.toLowerCase().includes(searchTerm) ||
    template.industry.toLowerCase().includes(searchTerm) ||
    template.category.toLowerCase().includes(searchTerm)
  );
}

export function filterTemplateVariations(filters: {
  categories?: string[];
  visualStyles?: VisualStyle[];
  industries?: string[];
  features?: string[];
}): TemplateConfig[] {
  let templates = getAllTemplateVariations();

  if (filters.categories && filters.categories.length > 0) {
    templates = templates.filter(template =>
      filters.categories!.includes(template.category)
    );
  }

  if (filters.visualStyles && filters.visualStyles.length > 0) {
    templates = templates.filter(template => {
      const metadata = getTemplateVariationMetadata(template.id);
      return metadata && filters.visualStyles!.includes(metadata.style);
    });
  }

  if (filters.industries && filters.industries.length > 0) {
    templates = templates.filter(template =>
      filters.industries!.some(industry =>
        template.industry.toLowerCase().includes(industry.toLowerCase())
      )
    );
  }

  if (filters.features && filters.features.length > 0) {
    templates = templates.filter(template => {
      const templateFeatures = Object.entries(template.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature);

      return filters.features!.some(feature => templateFeatures.includes(feature));
    });
  }

  return templates;
}

// Import analytics service
import { TemplateAnalyticsService, TemplatePerformanceMetrics, TemplateEngagementMetrics, TemplatePopularityData, TemplateABTestResult } from './templateAnalyticsService';

// Template Service with Analytics Integration
export class TemplateService {
  private static instance: TemplateService;
  private analytics = templateAnalyticsService;

  private constructor() { }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  // Enhanced template retrieval with analytics tracking
  public async getTemplate(templateId: string, userId?: string): Promise<TemplateConfig | null> {
    const startTime = performance.now();

    try {
      const template = templates.find(t => t.id === templateId) || null;

      if (template && userId) {
        this.analytics.trackTemplateView(templateId, userId, {
          source: 'direct-access',
          loadTime: performance.now() - startTime,
        });
      }

      // Record performance metrics
      this.analytics.recordTemplateLoadTime(templateId, performance.now() - startTime);

      return template;
    } catch (error) {
      this.analytics.recordTemplateError(templateId);
      throw error;
    }
  }

  // Enhanced template search with analytics
  public async searchTemplates(
    options: TemplateSearchOptions,
    userId?: string
  ): Promise<TemplateConfig[]> {
    const startTime = performance.now();

    try {
      let results = [...templates];

      // Apply filters
      if (options.filters.categories.length > 0) {
        results = results.filter(t => options.filters.categories.includes(t.category));
      }

      if (options.filters.atsOptimized) {
        results = results.filter(t => t.features.showTechStack); // Simplified ATS check
      }

      // Apply search query
      if (options.query) {
        const query = options.query.toLowerCase();
        results = results.filter(t =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.industry.toLowerCase().includes(query)
        );
      }

      // Sort results
      results = this.sortTemplates(results, options.sortBy, options.sortOrder);

      // Track search analytics
      if (userId) {
        results.forEach((template, index) => {
          this.analytics.trackTemplateView(template.id, userId, {
            source: 'search',
            query: options.query,
            position: index + 1,
            loadTime: performance.now() - startTime,
          });
        });
      }

      return results;
    } catch (error) {
      console.error('Template search error:', error);
      return [];
    }
  }

  // Template selection with analytics
  public selectTemplate(templateId: string, userId: string, source?: string): void {
    this.analytics.trackTemplateSelection(templateId, userId, source);
  }

  // Template customization tracking
  public trackCustomization(
    templateId: string,
    userId: string,
    customizations: string[],
    duration: number
  ): void {
    this.analytics.trackTemplateCustomization(templateId, userId, customizations, duration);
    this.analytics.recordCustomizationTime(templateId, duration);
  }

  // Template download tracking
  public trackDownload(templateId: string, userId: string): void {
    this.analytics.trackTemplateDownload(templateId, userId);
  }

  // Get popular templates with analytics data
  public getPopularTemplates(limit: number = 10): TemplatePopularityData[] {
    return this.analytics.getPopularTemplates(limit);
  }

  // Get template performance metrics
  public getTemplateMetrics(templateId: string): {
    performance: TemplatePerformanceMetrics | null;
    engagement: TemplateEngagementMetrics | null;
  } {
    return {
      performance: this.analytics.getTemplatePerformanceMetrics(templateId),
      engagement: this.analytics.getTemplateEngagementMetrics(templateId),
    };
  }

  // Get template usage report
  public getUsageReport(
    templateId: string,
    dateRange?: { start: Date; end: Date }
  ): ReturnType<TemplateAnalyticsService['getUsageReport']> {
    return this.analytics.getUsageReport(templateId, dateRange);
  }

  // A/B testing methods
  public createABTest(testId: string, templateVariants: string[]): void {
    this.analytics.createABTest(testId, templateVariants);
  }

  public getABTestResults(testId: string): TemplateABTestResult | null {
    return this.analytics.getABTestResults(testId);
  }

  private sortTemplates(
    templates: TemplateConfig[],
    sortBy: TemplateSearchOptions['sortBy'],
    sortOrder: TemplateSearchOptions['sortOrder']
  ): TemplateConfig[] {
    const sorted = [...templates].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          // Get popularity scores from analytics
          const aMetrics = this.analytics.getTemplateEngagementMetrics(a.id);
          const bMetrics = this.analytics.getTemplateEngagementMetrics(b.id);
          const aScore = aMetrics ? aMetrics.totalViews + aMetrics.selections * 2 : 0;
          const bScore = bMetrics ? bMetrics.totalViews + bMetrics.selections * 2 : 0;
          return bScore - aScore;
        case 'newest':
          // For now, sort by ID (newer templates have higher IDs)
          return b.id.localeCompare(a.id);
        case 'rating':
          // Simplified rating based on engagement metrics
          const aEngagement = this.analytics.getTemplateEngagementMetrics(a.id);
          const bEngagement = this.analytics.getTemplateEngagementMetrics(b.id);
          const aRating = aEngagement ? aEngagement.conversionRate : 0;
          const bRating = bEngagement ? bEngagement.conversionRate : 0;
          return bRating - aRating;
        default:
          return 0;
      }
    });

    return sortOrder === 'desc' ? sorted : sorted.reverse();
  }
}

// Export singleton instances
export const templateService = TemplateService.getInstance();