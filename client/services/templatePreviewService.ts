/**
 * Template Preview Service
 * Applies user resume data to any template for preview purposes
 */

import { Resume } from '@shared/api';
import { TemplateConfig, getAllTemplates, getTemplateConfig } from './templateService';

export interface TemplatePreviewData {
  templateId: string;
  templateConfig: TemplateConfig;
  resumeData: Resume;
  adaptedContent: AdaptedContent;
  placeholderContent: PlaceholderContent;
  previewMetadata: PreviewMetadata;
}

export interface AdaptedContent {
  personalInfo: AdaptedPersonalInfo;
  summary: string;
  experiences: AdaptedExperience[];
  skills: AdaptedSkill[];
  education: AdaptedEducation[];
  projects: AdaptedProject[];
  sections: AdaptedSection[];
}

export interface AdaptedPersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  avatar?: string;
  displayFields: string[]; // Fields to show based on template
}

export interface AdaptedExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  description: string;
  technologies?: string[];
  achievements?: string[];
  keyMetrics?: Array<{
    metric: string;
    value: string;
    description?: string;
  }>;
  displayFormat: 'standard' | 'metrics-focused' | 'tech-focused' | 'achievement-focused';
}

export interface AdaptedSkill {
  id: string;
  name: string;
  level: number;
  category: string;
  displayFormat: 'bar' | 'badge' | 'list' | 'grid';
  isHighlighted: boolean;
}

export interface AdaptedEducation {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  achievements?: string[];
  displayFormat: 'standard' | 'academic' | 'minimal';
}

export interface AdaptedProject {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  url?: string;
  github?: string;
  images?: string[];
  displayFormat: 'portfolio' | 'list' | 'card';
}

export interface AdaptedSection {
  id: string;
  title: string;
  content: any;
  isVisible: boolean;
  order: number;
  displayFormat: string;
}

export interface PlaceholderContent {
  personalInfo: Partial<AdaptedPersonalInfo>;
  summary: string;
  experiences: AdaptedExperience[];
  skills: AdaptedSkill[];
  education: AdaptedEducation[];
  projects: AdaptedProject[];
  missingFields: string[];
}

export interface PreviewMetadata {
  completionPercentage: number;
  missingRequiredFields: string[];
  templateCompatibility: number; // 0-100 score
  recommendedImprovements: string[];
  estimatedLength: number; // pages
}

export interface ContentAdaptationOptions {
  preserveFormatting: boolean;
  fillMissingWithPlaceholders: boolean;
  optimizeForTemplate: boolean;
  responsiveBreakpoints: string[];
}

export class TemplatePreviewService {
  private static placeholderData = {
    personalInfo: {
      name: 'Alex Morgan',
      title: 'Professional Title',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'City, State',
      website: 'johndoe.com',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe'
    },
    summary: 'Experienced professional with a proven track record of success in [industry]. Skilled in [key skills] with [X] years of experience delivering high-quality results.',
    experiences: [
      {
        id: 'placeholder-exp-1',
        company: 'Company Name',
        position: 'Job Title',
        startDate: '2022-01',
        endDate: null,
        description: 'Led cross-functional teams to deliver innovative solutions that improved efficiency by 30%. Managed projects from conception to completion.',
        technologies: ['Technology 1', 'Technology 2', 'Technology 3'],
        achievements: [
          'Achieved significant milestone or result',
          'Led successful project or initiative',
          'Improved process or system efficiency'
        ],
        keyMetrics: [
          { metric: 'Performance Improvement', value: '30%', description: 'Increased team productivity' },
          { metric: 'Projects Completed', value: '15+', description: 'Successfully delivered projects' }
        ]
      }
    ],
    skills: [
      { id: 'skill-1', name: 'Primary Skill', level: 90, category: 'Core Skills' },
      { id: 'skill-2', name: 'Secondary Skill', level: 85, category: 'Core Skills' },
      { id: 'skill-3', name: 'Technical Skill', level: 80, category: 'Technical' },
      { id: 'skill-4', name: 'Soft Skill', level: 88, category: 'Soft Skills' }
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'University Name',
        degree: 'Bachelor of Science',
        field: 'Field of Study',
        startDate: '2018-09',
        endDate: '2022-05',
        gpa: '3.8',
        achievements: ['Dean\'s List', 'Relevant Honor or Award']
      }
    ],
    projects: [
      {
        id: 'project-1',
        name: 'Project Name',
        description: 'Developed innovative solution that addressed key business challenges and improved user experience.',
        technologies: ['React', 'Node.js', 'MongoDB'],
        startDate: '2023-01',
        endDate: '2023-06',
        url: 'https://project-demo.com',
        github: 'github.com/username/project'
      }
    ]
  };

  /**
   * Generate template preview with user resume data
   */
  static async generatePreview(
    resumeData: Resume,
    templateId: string,
    options: ContentAdaptationOptions = {
      preserveFormatting: true,
      fillMissingWithPlaceholders: true,
      optimizeForTemplate: true,
      responsiveBreakpoints: ['mobile', 'tablet', 'desktop']
    }
  ): Promise<TemplatePreviewData> {
    const templateConfig = getTemplateConfig(templateId as any);
    
    if (!templateConfig) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Adapt content to template structure
    const adaptedContent = this.adaptContentToTemplate(resumeData, templateConfig, options);
    
    // Generate placeholder content for missing fields
    const placeholderContent = this.generatePlaceholderContent(resumeData, templateConfig);
    
    // Calculate preview metadata
    const previewMetadata = this.calculatePreviewMetadata(resumeData, templateConfig, adaptedContent);

    return {
      templateId,
      templateConfig,
      resumeData,
      adaptedContent,
      placeholderContent,
      previewMetadata
    };
  }

  /**
   * Adapt resume content to specific template structure
   */
  private static adaptContentToTemplate(
    resumeData: Resume,
    templateConfig: TemplateConfig,
    options: ContentAdaptationOptions
  ): AdaptedContent {
    return {
      personalInfo: this.adaptPersonalInfo(resumeData.personalInfo, templateConfig),
      summary: this.adaptSummary(resumeData.summary, templateConfig),
      experiences: this.adaptExperiences(resumeData.experiences, templateConfig),
      skills: this.adaptSkills(resumeData.skills, templateConfig),
      education: this.adaptEducation(resumeData.education, templateConfig),
      projects: this.adaptProjects(resumeData.projects, templateConfig),
      sections: this.adaptSections(resumeData, templateConfig)
    };
  }

  /**
   * Adapt personal information based on template requirements
   */
  private static adaptPersonalInfo(
    personalInfo: Resume['personalInfo'],
    templateConfig: TemplateConfig
  ): AdaptedPersonalInfo {
    const displayFields: string[] = ['name', 'title', 'email', 'phone', 'location'];
    
    // Add optional fields based on template features
    if (templateConfig.features.showGithub && personalInfo.github) {
      displayFields.push('github');
    }
    if (personalInfo.linkedin) {
      displayFields.push('linkedin');
    }
    if (personalInfo.website) {
      displayFields.push('website');
    }

    return {
      ...personalInfo,
      displayFields
    };
  }

  /**
   * Adapt summary based on template style
   */
  private static adaptSummary(summary: string, templateConfig: TemplateConfig): string {
    if (!summary) return '';
    
    // Adjust summary length based on template layout
    const maxLength = templateConfig.layout.headerStyle === 'tech-focused' ? 200 : 300;
    
    if (summary.length > maxLength) {
      return summary.substring(0, maxLength - 3) + '...';
    }
    
    return summary;
  }

  /**
   * Adapt experiences based on template focus
   */
  private static adaptExperiences(
    experiences: Resume['experiences'],
    templateConfig: TemplateConfig
  ): AdaptedExperience[] {
    return experiences.map(exp => {
      let displayFormat: AdaptedExperience['displayFormat'] = 'standard';
      
      // Determine display format based on template features
      if (templateConfig.features.showMetrics && exp.keyMetrics?.length) {
        displayFormat = 'metrics-focused';
      } else if (templateConfig.features.showTechStack && exp.technologies?.length) {
        displayFormat = 'tech-focused';
      } else if (exp.achievements?.length) {
        displayFormat = 'achievement-focused';
      }

      return {
        ...exp,
        displayFormat
      };
    });
  }

  /**
   * Adapt skills based on template visualization preferences
   */
  private static adaptSkills(
    skills: Resume['skills'],
    templateConfig: TemplateConfig
  ): AdaptedSkill[] {
    return skills.map(skill => {
      let displayFormat: AdaptedSkill['displayFormat'] = 'bar';
      
      // Determine display format based on template style
      if (templateConfig.layout.cardStyle === 'code-blocks') {
        displayFormat = 'badge';
      } else if (templateConfig.layout.cardStyle === 'portfolio-cards') {
        displayFormat = 'grid';
      } else if (templateConfig.features.showTechStack) {
        displayFormat = 'list';
      }

      return {
        ...skill,
        displayFormat,
        isHighlighted: skill.isCore || skill.level >= 85
      };
    });
  }

  /**
   * Adapt education based on template academic focus
   */
  private static adaptEducation(
    education: Resume['education'],
    templateConfig: TemplateConfig
  ): AdaptedEducation[] {
    return education.map(edu => {
      let displayFormat: AdaptedEducation['displayFormat'] = 'standard';
      
      if (templateConfig.layout.headerStyle === 'academic-formal') {
        displayFormat = 'academic';
      } else if (templateConfig.layout.headerStyle === 'tech-focused') {
        displayFormat = 'minimal';
      }

      return {
        ...edu,
        displayFormat
      };
    });
  }

  /**
   * Adapt projects based on template portfolio features
   */
  private static adaptProjects(
    projects: Resume['projects'],
    templateConfig: TemplateConfig
  ): AdaptedProject[] {
    return projects.map(project => {
      let displayFormat: AdaptedProject['displayFormat'] = 'list';
      
      if (templateConfig.features.showPortfolio) {
        displayFormat = 'portfolio';
      } else if (templateConfig.layout.cardStyle === 'portfolio-cards') {
        displayFormat = 'card';
      }

      return {
        ...project,
        displayFormat
      };
    });
  }

  /**
   * Adapt sections based on template requirements
   */
  private static adaptSections(
    resumeData: Resume,
    templateConfig: TemplateConfig
  ): AdaptedSection[] {
    const sections: AdaptedSection[] = [];
    
    // Add sections based on template configuration
    templateConfig.sections.required.forEach((sectionId, index) => {
      sections.push({
        id: sectionId,
        title: this.getSectionTitle(sectionId),
        content: this.getSectionContent(sectionId, resumeData),
        isVisible: true,
        order: index,
        displayFormat: this.getSectionDisplayFormat(sectionId, templateConfig)
      });
    });

    templateConfig.sections.optional.forEach((sectionId, index) => {
      const content = this.getSectionContent(sectionId, resumeData);
      if (content) {
        sections.push({
          id: sectionId,
          title: this.getSectionTitle(sectionId),
          content,
          isVisible: true,
          order: templateConfig.sections.required.length + index,
          displayFormat: this.getSectionDisplayFormat(sectionId, templateConfig)
        });
      }
    });

    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Generate placeholder content for incomplete profiles
   */
  private static generatePlaceholderContent(
    resumeData: Resume,
    templateConfig: TemplateConfig
  ): PlaceholderContent {
    const missingFields: string[] = [];
    
    // Check for missing required fields
    if (!resumeData.personalInfo.name) missingFields.push('name');
    if (!resumeData.personalInfo.title) missingFields.push('title');
    if (!resumeData.summary) missingFields.push('summary');
    if (!resumeData.experiences.length) missingFields.push('experiences');
    
    return {
      personalInfo: {
        ...this.placeholderData.personalInfo,
        ...resumeData.personalInfo
      },
      summary: resumeData.summary || this.placeholderData.summary,
      experiences: resumeData.experiences.length ? 
        resumeData.experiences.map(exp => ({ ...exp, displayFormat: 'standard' as const })) :
        this.placeholderData.experiences.map(exp => ({ ...exp, displayFormat: 'standard' as const })),
      skills: resumeData.skills.length ?
        resumeData.skills.map(skill => ({ ...skill, displayFormat: 'bar' as const, isHighlighted: false })) :
        this.placeholderData.skills.map(skill => ({ ...skill, displayFormat: 'bar' as const, isHighlighted: false })),
      education: resumeData.education.length ?
        resumeData.education.map(edu => ({ ...edu, displayFormat: 'standard' as const })) :
        this.placeholderData.education.map(edu => ({ ...edu, displayFormat: 'standard' as const })),
      projects: resumeData.projects.length ?
        resumeData.projects.map(proj => ({ ...proj, displayFormat: 'list' as const })) :
        this.placeholderData.projects.map(proj => ({ ...proj, displayFormat: 'list' as const })),
      missingFields
    };
  }

  /**
   * Calculate preview metadata and recommendations
   */
  private static calculatePreviewMetadata(
    resumeData: Resume,
    templateConfig: TemplateConfig,
    adaptedContent: AdaptedContent
  ): PreviewMetadata {
    const totalFields = 10; // Adjust based on template requirements
    let completedFields = 0;
    const missingRequiredFields: string[] = [];
    const recommendedImprovements: string[] = [];

    // Calculate completion percentage
    if (resumeData.personalInfo.name) completedFields++;
    if (resumeData.personalInfo.title) completedFields++;
    if (resumeData.personalInfo.email) completedFields++;
    if (resumeData.summary) completedFields++;
    if (resumeData.experiences.length) completedFields++;
    if (resumeData.skills.length) completedFields++;
    if (resumeData.education.length) completedFields++;
    if (resumeData.projects.length) completedFields++;

    const completionPercentage = Math.round((completedFields / totalFields) * 100);

    // Check template compatibility
    let compatibilityScore = 100;
    
    if (templateConfig.features.showTechStack && !resumeData.skills.some(s => s.category.toLowerCase().includes('tech'))) {
      compatibilityScore -= 20;
      recommendedImprovements.push('Add technical skills to better match this template');
    }
    
    if (templateConfig.features.showPortfolio && !resumeData.projects.length) {
      compatibilityScore -= 15;
      recommendedImprovements.push('Add projects to showcase your portfolio');
    }

    if (templateConfig.features.showMetrics && !resumeData.experiences.some(e => e.keyMetrics?.length)) {
      compatibilityScore -= 10;
      recommendedImprovements.push('Add quantifiable achievements to your experience');
    }

    // Estimate document length
    const estimatedLength = this.estimateDocumentLength(adaptedContent);

    return {
      completionPercentage,
      missingRequiredFields,
      templateCompatibility: compatibilityScore,
      recommendedImprovements,
      estimatedLength
    };
  }

  /**
   * Helper methods
   */
  private static getSectionTitle(sectionId: string): string {
    const titleMap: Record<string, string> = {
      'contact': 'Contact Information',
      'summary': 'Professional Summary',
      'experience': 'Work Experience',
      'skills': 'Skills',
      'education': 'Education',
      'projects': 'Projects',
      'certifications': 'Certifications',
      'languages': 'Languages'
    };
    return titleMap[sectionId] || sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  }

  private static getSectionContent(sectionId: string, resumeData: Resume): any {
    const contentMap: Record<string, any> = {
      'contact': resumeData.personalInfo,
      'summary': resumeData.summary,
      'experience': resumeData.experiences,
      'skills': resumeData.skills,
      'education': resumeData.education,
      'projects': resumeData.projects
    };
    return contentMap[sectionId];
  }

  private static getSectionDisplayFormat(sectionId: string, templateConfig: TemplateConfig): string {
    // Return appropriate display format based on section and template
    if (sectionId === 'skills' && templateConfig.features.showTechStack) {
      return 'tech-focused';
    }
    if (sectionId === 'projects' && templateConfig.features.showPortfolio) {
      return 'portfolio';
    }
    return 'standard';
  }

  private static estimateDocumentLength(adaptedContent: AdaptedContent): number {
    // Simple estimation based on content length
    let contentLength = 0;
    contentLength += adaptedContent.summary.length;
    contentLength += adaptedContent.experiences.length * 200; // Average experience length
    contentLength += adaptedContent.skills.length * 20;
    contentLength += adaptedContent.education.length * 100;
    contentLength += adaptedContent.projects.length * 150;

    // Estimate pages (assuming ~2000 characters per page)
    return Math.max(1, Math.ceil(contentLength / 2000));
  }

  /**
   * Switch template while preserving content
   */
  static async switchTemplate(
    currentPreview: TemplatePreviewData,
    newTemplateId: string
  ): Promise<TemplatePreviewData> {
    return this.generatePreview(currentPreview.resumeData, newTemplateId);
  }

  /**
   * Get all available templates for preview
   */
  static getAvailableTemplates(): TemplateConfig[] {
    return getAllTemplates();
  }

  /**
   * Validate template compatibility with resume data
   */
  static validateTemplateCompatibility(
    resumeData: Resume,
    templateId: string
  ): { compatible: boolean; issues: string[]; suggestions: string[] } {
    const templateConfig = getTemplateConfig(templateId as any);
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!templateConfig) {
      return { compatible: false, issues: ['Template not found'], suggestions: [] };
    }

    // Check required sections
    templateConfig.sections.required.forEach(section => {
      const content = this.getSectionContent(section, resumeData);
      if (!content || (Array.isArray(content) && content.length === 0)) {
        issues.push(`Missing required section: ${this.getSectionTitle(section)}`);
      }
    });

    // Check feature compatibility
    if (templateConfig.features.showTechStack && !resumeData.skills.some(s => s.category.toLowerCase().includes('tech'))) {
      suggestions.push('Add technical skills for better template compatibility');
    }

    return {
      compatible: issues.length === 0,
      issues,
      suggestions
    };
  }
}