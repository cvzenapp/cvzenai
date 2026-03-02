import { 
  TemplateSpecificContent, 
  ValidationResult
} from '../types/templateContent';
import { 
  TemplateContentValidationService,
  templateContentValidationService
} from './templateContentValidationService';
import { Resume } from '@shared/api';
import { convertToResumeFormat } from './templateSpecificContentService';

// Fallback strategy implementation
class ContentFallbackStrategy {
  getFallbackContent(templateId: string): TemplateSpecificContent {
    // Try to extract role from template ID
    const role = this.extractRoleFromTemplateId(templateId);
    return this.getIndustryFallback(role);
  }

  getIndustryFallback(industry: string): TemplateSpecificContent {
    // Return industry-appropriate fallback content
    if (industry.includes('tech') || industry.includes('software')) {
      return this.getTechnologyFallback();
    } else if (industry.includes('business') || industry.includes('management')) {
      return this.getBusinessFallback();
    } else {
      return this.getGenericFallback();
    }
  }

  getGenericFallback(): TemplateSpecificContent {
    return {
      templateId: 'generic-fallback',
      personalInfo: {
        name: 'Professional Name',
        title: 'Your Professional Title',
        email: 'your.email@example.com',
        phone: '+1 (555) 123-4567',
        location: 'Your City, State',
        website: 'yourwebsite.com',
        linkedin: 'linkedin.com/in/yourprofile',
        github: 'github.com/yourusername',
      },
      professionalSummary: 'Experienced professional with expertise in your field. Add your professional summary here to highlight your key achievements and career objectives.',
      objective: 'Seeking opportunities to leverage my skills and experience in a challenging role that allows for professional growth and meaningful contribution.',
      skills: [
        {
          name: 'Your Core Skill',
          proficiency: 85,
          category: 'Core Skills',
          yearsOfExperience: 5,
          isCore: true,
          relevanceScore: 8
        }
      ],
      experiences: [
        {
          company: 'Your Company',
          position: 'Your Position',
          startDate: '2020-01',
          endDate: null,
          description: 'Add your work experience description here.',
          achievements: ['Add your key achievements here'],
          technologies: ['Relevant', 'Technologies'],
          location: 'City, State',
          industryContext: 'Your Industry',
          roleLevel: 'mid'
        }
      ],
      education: [
        {
          institution: 'Your University',
          degree: 'Your Degree',
          field: 'Your Field of Study',
          startDate: '2016-09',
          endDate: '2020-05',
          location: 'City, State'
        }
      ],
      projects: [
        {
          title: 'Your Project',
          description: 'Add your project description here.',
          technologies: ['Technology', 'Stack'],
          startDate: '2023-01-01',
          endDate: '2023-06-01',
          impact: 'Describe the impact of your project',
          roleSpecific: true
        }
      ],
      achievements: ['Add your key achievements here']
    };
  }

  private extractRoleFromTemplateId(templateId: string): string {
    // Extract role from template ID (e.g., 'devops-engineer-senior' -> 'devops-engineer')
    return templateId.split('-').slice(0, -1).join('-');
  }

  private getTechnologyFallback(): TemplateSpecificContent {
    const generic = this.getGenericFallback();
    return {
      ...generic,
      templateId: 'technology-fallback',
      personalInfo: {
        ...generic.personalInfo,
        name: 'Alex Johnson',
        title: 'Software Engineer',
        github: 'github.com/alexjohnson',
      },
      professionalSummary: 'Experienced software engineer with expertise in modern web technologies and software development best practices.',
      skills: [
        {
          name: 'JavaScript',
          proficiency: 90,
          category: 'Programming Languages',
          yearsOfExperience: 6,
          isCore: true,
          relevanceScore: 9
        },
        {
          name: 'React',
          proficiency: 85,
          category: 'Frontend Frameworks',
          yearsOfExperience: 5,
          isCore: true,
          relevanceScore: 8
        }
      ]
    };
  }

  private getBusinessFallback(): TemplateSpecificContent {
    const generic = this.getGenericFallback();
    return {
      ...generic,
      templateId: 'business-fallback',
      personalInfo: {
        ...generic.personalInfo,
        name: 'Sarah Wilson',
        title: 'Business Professional',
      },
      professionalSummary: 'Experienced business professional with expertise in strategy, operations, and team leadership.',
      skills: [
        {
          name: 'Strategic Planning',
          proficiency: 90,
          category: 'Business Strategy',
          yearsOfExperience: 8,
          isCore: true,
          relevanceScore: 9
        },
        {
          name: 'Team Leadership',
          proficiency: 85,
          category: 'Management',
          yearsOfExperience: 7,
          isCore: true,
          relevanceScore: 8
        }
      ]
    };
  }
}

// Main TemplateContentRegistry implementation
export class TemplateContentRegistryImpl {
  private contentStore: Map<string, TemplateSpecificContent> = new Map();
  private validator: TemplateContentValidationService = templateContentValidationService;
  private fallbackStrategy: ContentFallbackStrategy = new ContentFallbackStrategy();

  constructor() {
    // Initialize with empty store - content will be registered separately
  }

  getTemplateContent(templateId: string): TemplateSpecificContent | null {
    const content = this.contentStore.get(templateId);
    if (content) {
      return content;
    }

    // Try fallback strategy
    console.warn(`Template content not found for ${templateId}, using fallback`);
    return this.fallbackStrategy.getFallbackContent(templateId);
  }

  registerTemplateContent(templateId: string, content: TemplateSpecificContent): void {
    // Validate content before registration
    const validation = this.validateTemplateContent(content);
    if (!validation.isValid) {
      console.error(`Cannot register template content for ${templateId}:`, validation.errors);
      throw new Error(`Invalid template content: ${validation.errors.join(', ')}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(`Template content warnings for ${templateId}:`, validation.warnings);
    }

    this.contentStore.set(templateId, content);
    console.log(`Registered template content for ${templateId}`);
  }

  getAllTemplateContents(): Record<string, TemplateSpecificContent> {
    const result: Record<string, TemplateSpecificContent> = {};
    this.contentStore.forEach((content, templateId) => {
      result[templateId] = content;
    });
    return result;
  }

  validateTemplateContent(content: TemplateSpecificContent): ValidationResult {
    return this.validator.validateTemplateContent(content);
  }

  getAvailableTemplateIds(): string[] {
    return Array.from(this.contentStore.keys());
  }

  hasTemplateContent(templateId: string): boolean {
    return this.contentStore.has(templateId);
  }

  // Utility method to get content as Resume format
  getTemplateContentAsResume(templateId: string): Resume | null {
    const content = this.getTemplateContent(templateId);
    if (!content) {
      return null;
    }
    
    try {
      return convertToResumeFormat(content);
    } catch (error) {
      console.error(`Failed to convert template content to resume format for ${templateId}:`, error);
      return null;
    }
  }

  // Method to clear all content (useful for testing)
  clearAllContent(): void {
    this.contentStore.clear();
  }

  // Method to get content statistics
  getContentStatistics(): {
    totalTemplates: number;
    byTemplateId: Record<string, number>;
  } {
    const stats = {
      totalTemplates: this.contentStore.size,
      byTemplateId: {} as Record<string, number>
    };

    this.contentStore.forEach((content, templateId) => {
      stats.byTemplateId[templateId] = 1;
    });

    return stats;
  }
}

// Export singleton instance
export const templateContentRegistry = new TemplateContentRegistryImpl();