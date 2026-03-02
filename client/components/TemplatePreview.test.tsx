/**
 * Tests for Template Preview Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Resume } from '@shared/api';
import TemplatePreview from './TemplatePreview';
import { TemplatePreviewService } from '@/services/templatePreviewService';

// Mock the template preview service
vi.mock('@/services/templatePreviewService', () => ({
  TemplatePreviewService: {
    generatePreview: vi.fn(),
    switchTemplate: vi.fn()
  }
}));

// Simplified mocks to avoid hanging
vi.mock('@/components/ui/button', () => ({ Button: 'button' }));
vi.mock('@/components/ui/card', () => ({ Card: 'div', CardContent: 'div', CardHeader: 'div', CardTitle: 'h3' }));
vi.mock('@/components/ui/badge', () => ({ Badge: 'span' }));
vi.mock('@/components/ui/progress', () => ({ Progress: 'div' }));
vi.mock('@/components/ui/tabs', () => ({ Tabs: 'div', TabsContent: 'div', TabsList: 'div', TabsTrigger: 'button' }));

describe('TemplatePreview', () => {
  let mockResume: Resume;
  let mockPreviewData: any;

  beforeEach(() => {
    mockResume = {
      id: '1',
      personalInfo: {
        name: 'John Doe',
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
        { id: '2', name: 'React', level: 85, category: 'Frontend Frameworks' }
      ],
      experiences: [
        {
          id: '1',
          company: 'Tech Corp',
          position: 'Senior Software Engineer',
          startDate: '2022-01',
          endDate: null,
          description: 'Led development of web applications.',
          technologies: ['React', 'Node.js', 'TypeScript']
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
          startDate: '2023-01'
        }
      ],
      upvotes: 0,
      rating: 0,
      isShortlisted: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockPreviewData = {
      templateId: 'tech-template',
      templateConfig: {
        id: 'tech-template',
        name: 'Technology Template',
        category: 'technology',
        description: 'Template for tech professionals',
        features: {
          showTechStack: true,
          showPortfolio: true,
          showMetrics: true,
          showGithub: true
        }
      },
      resumeData: mockResume,
      adaptedContent: {
        personalInfo: {
          ...mockResume.personalInfo,
          displayFields: ['name', 'title', 'email', 'phone', 'location', 'github']
        },
        summary: mockResume.summary,
        experiences: mockResume.experiences.map(exp => ({
          ...exp,
          displayFormat: 'standard'
        })),
        skills: mockResume.skills.map(skill => ({
          ...skill,
          displayFormat: 'bar',
          isHighlighted: skill.level >= 85
        })),
        education: mockResume.education.map(edu => ({
          ...edu,
          displayFormat: 'standard'
        })),
        projects: mockResume.projects.map(proj => ({
          ...proj,
          displayFormat: 'list'
        })),
        sections: []
      },
      placeholderContent: {
        personalInfo: mockResume.personalInfo,
        summary: mockResume.summary,
        experiences: mockResume.experiences,
        skills: mockResume.skills,
        education: mockResume.education,
        projects: mockResume.projects,
        missingFields: []
      },
      previewMetadata: {
        completionPercentage: 85,
        missingRequiredFields: [],
        templateCompatibility: 92,
        recommendedImprovements: ['Add more technical skills', 'Include project metrics'],
        estimatedLength: 2
      }
    };

    vi.mocked(TemplatePreviewService.generatePreview).mockResolvedValue(mockPreviewData);
  });

  describe('rendering', () => {
    it('should render loading state initially', () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      expect(screen.getByText('Generating preview...')).toBeInTheDocument();
    });

    it('should render preview data after loading', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Template Preview')).toBeInTheDocument();
        expect(screen.getByText('Technology Template')).toBeInTheDocument();
      });
    });

    it('should render error state when preview generation fails', async () => {
      vi.mocked(TemplatePreviewService.generatePreview).mockRejectedValue(
        new Error('Failed to generate preview')
      );

      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to generate preview')).toBeInTheDocument();
      });
    });

    it('should render preview metadata when showMetadata is true', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          showMetadata={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview Analysis')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument(); // Completion percentage
        expect(screen.getByText('92%')).toBeInTheDocument(); // Compatibility
        expect(screen.getByText('2 pages')).toBeInTheDocument(); // Estimated length
      });
    });

    it('should not render metadata when showMetadata is false', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          showMetadata={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Preview Analysis')).not.toBeInTheDocument();
      });
    });

    it('should render viewport controls when responsive is true', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          responsive={true}
        />
      );

      await waitFor(() => {
        // Should have mobile, tablet, and desktop viewport buttons
        const buttons = screen.getAllByRole('button');
        const viewportButtons = buttons.filter(btn => 
          btn.getAttribute('title') === 'Mobile' ||
          btn.getAttribute('title') === 'Tablet' ||
          btn.getAttribute('title') === 'Desktop'
        );
        expect(viewportButtons).toHaveLength(3);
      });
    });

    it('should not render controls when showControls is false', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          showControls={false}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Template Preview')).not.toBeInTheDocument();
        expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
      });
    });
  });

  describe('interactions', () => {
    it('should call onDownload when download button is clicked', async () => {
      const onDownload = vi.fn();

      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          onDownload={onDownload}
        />
      );

      await waitFor(() => {
        const downloadButton = screen.getByText('Download');
        fireEvent.click(downloadButton);
        expect(onDownload).toHaveBeenCalled();
      });
    });

    it('should refresh preview when refresh button is clicked', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh');
        fireEvent.click(refreshButton);
        expect(TemplatePreviewService.generatePreview).toHaveBeenCalledTimes(2);
      });
    });

    it('should change viewport when viewport button is clicked', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          responsive={true}
        />
      );

      await waitFor(() => {
        const mobileButton = screen.getByTitle('Mobile');
        fireEvent.click(mobileButton);
        
        // Should show mobile viewport label
        expect(screen.getByText('Mobile')).toBeInTheDocument();
      });
    });

    it('should call onTemplateSwitch when template is switched', async () => {
      const onTemplateSwitch = vi.fn();
      vi.mocked(TemplatePreviewService.switchTemplate).mockResolvedValue(mockPreviewData);

      const component = render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          onTemplateSwitch={onTemplateSwitch}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Template Preview')).toBeInTheDocument();
      });

      // Simulate template switch (this would normally come from a parent component)
      component.rerender(
        <TemplatePreview
          resumeData={mockResume}
          templateId="design-template"
          onTemplateSwitch={onTemplateSwitch}
        />
      );

      await waitFor(() => {
        expect(TemplatePreviewService.generatePreview).toHaveBeenCalledWith(
          mockResume,
          'design-template',
          expect.any(Object)
        );
      });
    });
  });

  describe('template preview renderer', () => {
    it('should render personal information correctly', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
        expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      });
    });

    it('should render professional summary', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Professional Summary')).toBeInTheDocument();
        expect(screen.getByText('Experienced software engineer with 5 years of experience.')).toBeInTheDocument();
      });
    });

    it('should render experience section', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Experience')).toBeInTheDocument();
        expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText('Led development of web applications.')).toBeInTheDocument();
      });
    });

    it('should render skills section with categories', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Skills')).toBeInTheDocument();
        expect(screen.getByText('Programming Languages')).toBeInTheDocument();
        expect(screen.getByText('Frontend Frameworks')).toBeInTheDocument();
        expect(screen.getByText('JavaScript')).toBeInTheDocument();
        expect(screen.getByText('React')).toBeInTheDocument();
      });
    });

    it('should render education section', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
        expect(screen.getByText('Bachelor of Science in Computer Science')).toBeInTheDocument();
        expect(screen.getByText('University of Technology')).toBeInTheDocument();
      });
    });

    it('should render projects section when template supports portfolio', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('E-commerce Platform')).toBeInTheDocument();
        expect(screen.getByText('Built a full-stack e-commerce platform.')).toBeInTheDocument();
      });
    });

    it('should render technology badges for experiences and projects', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('MongoDB')).toBeInTheDocument();
      });
    });
  });

  describe('responsive behavior', () => {
    it('should apply mobile viewport styles', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          responsive={true}
        />
      );

      await waitFor(() => {
        const mobileButton = screen.getByTitle('Mobile');
        fireEvent.click(mobileButton);
        
        // Check that mobile viewport is active
        expect(screen.getByText('Mobile')).toBeInTheDocument();
      });
    });

    it('should apply tablet viewport styles', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          responsive={true}
        />
      );

      await waitFor(() => {
        const tabletButton = screen.getByTitle('Tablet');
        fireEvent.click(tabletButton);
        
        // Check that tablet viewport is active
        expect(screen.getByText('Tablet')).toBeInTheDocument();
      });
    });

    it('should default to desktop viewport', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          responsive={true}
        />
      );

      await waitFor(() => {
        // Desktop should be selected by default (no viewport label shown for desktop)
        expect(screen.queryByText('Desktop')).not.toBeInTheDocument();
        expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
        expect(screen.queryByText('Tablet')).not.toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should show try again button on error', async () => {
      vi.mocked(TemplatePreviewService.generatePreview).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry preview generation when try again is clicked', async () => {
      vi.mocked(TemplatePreviewService.generatePreview)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockPreviewData);

      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
        />
      );

      await waitFor(() => {
        const tryAgainButton = screen.getByText('Try Again');
        fireEvent.click(tryAgainButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Template Preview')).toBeInTheDocument();
      });
    });
  });

  describe('recommendations', () => {
    it('should display recommendations when available', async () => {
      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          showMetadata={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Add more technical skills')).toBeInTheDocument();
        expect(screen.getByText('Include project metrics')).toBeInTheDocument();
      });
    });

    it('should not show recommendations section when none available', async () => {
      const previewDataWithoutRecommendations = {
        ...mockPreviewData,
        previewMetadata: {
          ...mockPreviewData.previewMetadata,
          recommendedImprovements: []
        }
      };

      vi.mocked(TemplatePreviewService.generatePreview).mockResolvedValue(
        previewDataWithoutRecommendations
      );

      render(
        <TemplatePreview
          resumeData={mockResume}
          templateId="tech-template"
          showMetadata={true}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Recommendations')).not.toBeInTheDocument();
      });
    });
  });
});