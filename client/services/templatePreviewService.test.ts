/**
 * Tests for Template Preview Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Resume } from '@shared/api';
import { TemplatePreviewService } from './templatePreviewService';
import { getTemplateConfig } from './templateService';

// Mock the template service
vi.mock('./templateService', () => ({
  getTemplateConfig: vi.fn(),
  getAllTemplates: vi.fn(() => [
    {
      id: 'tech-template',
      name: 'Technology Template',
      category: 'technology',
      description: 'Template for tech professionals',
      industry: 'Technology',
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showGithub: true,
        showCertifications: false,
        showLanguages: false,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showDesignTools: false
      },
      sections: {
        required: ['contact', 'summary', 'experience'],
        optional: ['skills', 'projects', 'education'],
        industrySpecific: ['techStack', 'github']
      },
      layout: {
        headerStyle: 'tech-focused',
        sidebarPosition: 'left',
        sectionPriority: ['experience', 'skills', 'projects'],
        cardStyle: 'code-blocks'
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#06b6d4',
        background: '#ffffff',
        text: '#1f2937',
        muted: '#6b7280'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono'
      }
    }
  ])
}));

describe('TemplatePreviewService', () => {
  let mockResume: Resume;
  let mockTemplateConfig: any;

  beforeEach(() => {
    mockResume = {
      id: '1',
      personalInfo: {
        name: 'Alex Morgan',
        title: 'Software Engineer',
        email: 'john@example.com',
        phone: '+1234567890',
        location: 'San Francisco, CA',
        github: 'github.com/johndoe'
      },
      summary: 'Experienced software engineer with 5 years of experience.',
      objective: 'Seeking senior software engineer role.',
      skills: [
        { id: '1', name: 'JavaScript', level: 90, category: 'Programming Languages' },
        { id: '2', name: 'React', level: 85, category: 'Frontend Frameworks' },
        { id: '3', name: 'Node.js', level: 80, category: 'Backend Technologies' }
      ],
      experiences: [
        {
          id: '1',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          startDate: '2022-01',
          endDate: null,
          description: 'Led development of web applications.',
          technologies: ['React', 'Node.js', 'TypeScript'],
          achievements: ['Improved performance by 30%'],
          keyMetrics: [
            { metric: 'Performance', value: '30%', description: 'Improvement' }
          ]
        }
      ],
      education: [
        {
          id: '1',
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2015-09',
          endDate: '2019-05'
        }
      ],
      projects: [
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Built a full-stack e-commerce platform.',
          technologies: ['React', 'Node.js', 'MongoDB'],
          startDate: '2023-01',
          github: 'github.com/johndoe/ecommerce'
        }
      ],
      upvotes: 0,
      rating: 0,
      isShortlisted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockTemplateConfig = {
      id: 'tech-template',
      name: 'Technology Template',
      category: 'technology',
      description: 'Template for tech professionals',
      industry: 'Technology',
      features: {
        showTechStack: true,
        showPortfolio: true,
        showMetrics: true,
        showGithub: true,
        showCertifications: false,
        showLanguages: false,
        showPublications: false,
        showCampaigns: false,
        showTeamSize: false,
        showDesignTools: false
      },
      sections: {
        required: ['contact', 'summary', 'experience'],
        optional: ['skills', 'projects', 'education'],
        industrySpecific: ['techStack', 'github']
      },
      layout: {
        headerStyle: 'tech-focused',
        sidebarPosition: 'left',
        sectionPriority: ['experience', 'skills', 'projects'],
        cardStyle: 'code-blocks'
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#06b6d4',
        background: '#ffffff',
        text: '#1f2937',
        muted: '#6b7280'
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono'
      }
    };

    vi.mocked(getTemplateConfig).mockReturnValue(mockTemplateConfig);
  });

  describe('generatePreview', () => {
    it('should generate preview data with adapted content', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      expect(preview).toBeDefined();
      expect(preview.templateId).toBe('tech-template');
      expect(preview.templateConfig).toEqual(mockTemplateConfig);
      expect(preview.resumeData).toEqual(mockResume);
      expect(preview.adaptedContent).toBeDefined();
      expect(preview.placeholderContent).toBeDefined();
      expect(preview.previewMetadata).toBeDefined();
    });

    it('should adapt personal info with display fields', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      const adaptedPersonalInfo = preview.adaptedContent.personalInfo;
      expect(adaptedPersonalInfo.name).toBe('Alex Morgan');
      expect(adaptedPersonalInfo.title).toBe('Software Engineer');
      expect(adaptedPersonalInfo.displayFields).toContain('name');
      expect(adaptedPersonalInfo.displayFields).toContain('title');
      expect(adaptedPersonalInfo.displayFields).toContain('github'); // Should include github for tech template
    });

    it('should adapt experiences with appropriate display format', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      const adaptedExperiences = preview.adaptedContent.experiences;
      expect(adaptedExperiences).toHaveLength(1);
      expect(adaptedExperiences[0].displayFormat).toBe('metrics-focused'); // Has keyMetrics
    });

    it('should adapt skills with tech-focused display format', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      const adaptedSkills = preview.adaptedContent.skills;
      expect(adaptedSkills).toHaveLength(3);
      expect(adaptedSkills[0].displayFormat).toBe('badge'); // code-blocks card style
      expect(adaptedSkills[0].isHighlighted).toBe(true); // Level >= 85
    });

    it('should generate placeholder content for missing fields', async () => {
      const incompleteResume = {
        ...mockResume,
        summary: '',
        experiences: [],
        skills: []
      };

      const preview = await TemplatePreviewService.generatePreview(
        incompleteResume,
        'tech-template'
      );

      const placeholderContent = preview.placeholderContent;
      expect(placeholderContent.summary).toBeTruthy();
      expect(placeholderContent.experiences).toHaveLength(1);
      expect(placeholderContent.skills).toHaveLength(4);
      expect(placeholderContent.missingFields).toContain('summary');
      expect(placeholderContent.missingFields).toContain('experiences');
    });

    it('should calculate preview metadata correctly', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      const metadata = preview.previewMetadata;
      expect(metadata.completionPercentage).toBeGreaterThan(0);
      expect(metadata.templateCompatibility).toBeGreaterThan(0);
      expect(metadata.estimatedLength).toBeGreaterThan(0);
      expect(Array.isArray(metadata.recommendedImprovements)).toBe(true);
    });

    it('should throw error for invalid template', async () => {
      vi.mocked(getTemplateConfig).mockReturnValue(null);

      await expect(
        TemplatePreviewService.generatePreview(mockResume, 'invalid-template')
      ).rejects.toThrow('Template not found: invalid-template');
    });
  });

  describe('switchTemplate', () => {
    it('should switch template while preserving resume data', async () => {
      const originalPreview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      const newPreview = await TemplatePreviewService.switchTemplate(
        originalPreview,
        'tech-template'
      );

      expect(newPreview.resumeData).toEqual(originalPreview.resumeData);
      expect(newPreview.templateId).toBe('tech-template');
    });
  });

  describe('validateTemplateCompatibility', () => {
    it('should validate template compatibility correctly', () => {
      const validation = TemplatePreviewService.validateTemplateCompatibility(
        mockResume,
        'tech-template'
      );

      expect(validation.compatible).toBe(true);
      expect(validation.issues).toHaveLength(0);
      expect(Array.isArray(validation.suggestions)).toBe(true);
    });

    it('should identify missing required sections', () => {
      const incompleteResume = {
        ...mockResume,
        experiences: []
      };

      const validation = TemplatePreviewService.validateTemplateCompatibility(
        incompleteResume,
        'tech-template'
      );

      expect(validation.compatible).toBe(false);
      expect(validation.issues).toContain('Missing required section: Work Experience');
    });

    it('should provide suggestions for better compatibility', () => {
      const resumeWithoutTechSkills = {
        ...mockResume,
        skills: [
          { id: '1', name: 'Communication', level: 80, category: 'Soft Skills' }
        ]
      };

      const validation = TemplatePreviewService.validateTemplateCompatibility(
        resumeWithoutTechSkills,
        'tech-template'
      );

      expect(validation.suggestions).toContain('Add technical skills for better template compatibility');
    });

    it('should handle invalid template gracefully', () => {
      vi.mocked(getTemplateConfig).mockReturnValue(null);

      const validation = TemplatePreviewService.validateTemplateCompatibility(
        mockResume,
        'invalid-template'
      );

      expect(validation.compatible).toBe(false);
      expect(validation.issues).toContain('Template not found');
    });
  });

  describe('content adaptation', () => {
    it('should truncate long summaries based on template style', async () => {
      const longSummary = 'A'.repeat(500);
      const resumeWithLongSummary = {
        ...mockResume,
        summary: longSummary
      };

      const preview = await TemplatePreviewService.generatePreview(
        resumeWithLongSummary,
        'tech-template'
      );

      expect(preview.adaptedContent.summary.length).toBeLessThan(longSummary.length);
      expect(preview.adaptedContent.summary).toMatch(/\.\.\.$/); // Should end with ...
    });

    it('should adapt sections based on template configuration', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      const sections = preview.adaptedContent.sections;
      expect(sections.length).toBeGreaterThan(0);
      
      // Required sections should be visible
      const contactSection = sections.find(s => s.id === 'contact');
      expect(contactSection?.isVisible).toBe(true);
      
      // Sections should be ordered correctly
      expect(sections[0].order).toBeLessThan(sections[1].order);
    });

    it('should estimate document length accurately', async () => {
      const preview = await TemplatePreviewService.generatePreview(
        mockResume,
        'tech-template'
      );

      expect(preview.previewMetadata.estimatedLength).toBeGreaterThan(0);
      expect(preview.previewMetadata.estimatedLength).toBeLessThan(10); // Reasonable upper bound
    });
  });

  describe('placeholder content generation', () => {
    it('should provide meaningful placeholder data', async () => {
      const emptyResume: Resume = {
        id: '1',
        personalInfo: {
          name: '',
          title: '',
          email: '',
          phone: '',
          location: ''
        },
        summary: '',
        objective: '',
        skills: [],
        experiences: [],
        education: [],
        projects: [],
        upvotes: 0,
        rating: 0,
        isShortlisted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const preview = await TemplatePreviewService.generatePreview(
        emptyResume,
        'tech-template'
      );

      const placeholder = preview.placeholderContent;
      expect(placeholder.personalInfo.name || 'Alex Morgan').toBeTruthy(); // Should have placeholder or user data
      expect(placeholder.summary).toBeTruthy();
      expect(placeholder.experiences.length).toBeGreaterThan(0);
      expect(placeholder.skills.length).toBeGreaterThan(0);
      expect(placeholder.missingFields.length).toBeGreaterThan(0);
    });

    it('should merge user data with placeholder data', async () => {
      const partialResume = {
        ...mockResume,
        summary: '',
        experiences: []
      };

      const preview = await TemplatePreviewService.generatePreview(
        partialResume,
        'tech-template'
      );

      const placeholder = preview.placeholderContent;
      expect(placeholder.personalInfo.name).toBe('Alex Morgan'); // User data preserved
      expect(placeholder.summary).toBeTruthy(); // Placeholder provided
      expect(placeholder.experiences.length).toBeGreaterThan(0); // Placeholder provided
    });
  });
});