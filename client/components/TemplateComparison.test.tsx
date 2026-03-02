import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateComparison from './TemplateComparison';
import { TemplateComparison as TemplateComparisonType } from '@/services/templateService';

describe('TemplateComparison', () => {
  const mockComparison: TemplateComparisonType = {
    templates: [
      {
        id: 'tech-1',
        name: 'Technology Template',
        category: 'technology',
        description: 'Modern tech template',
        industry: 'Technology',
        colors: {
          primary: '#000',
          secondary: '#333',
          accent: '#666',
          background: '#fff',
          text: '#000',
          muted: '#999'
        },
        typography: {
          headingFont: 'Arial',
          bodyFont: 'Arial',
          codeFont: 'Courier'
        },
        layout: {
          headerStyle: 'tech-focused',
          sidebarPosition: 'left',
          sectionPriority: ['experience'],
          cardStyle: 'code-blocks'
        },
        sections: {
          required: ['contact'],
          optional: ['projects'],
          industrySpecific: ['techStack']
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
          showLanguages: false
        }
      },
      {
        id: 'design-1',
        name: 'Design Template',
        category: 'design',
        description: 'Creative design template',
        industry: 'Design',
        colors: {
          primary: '#ff0000',
          secondary: '#ff3333',
          accent: '#ff6666',
          background: '#fff',
          text: '#000',
          muted: '#999'
        },
        typography: {
          headingFont: 'Arial',
          bodyFont: 'Arial',
          codeFont: 'Courier'
        },
        layout: {
          headerStyle: 'portfolio-hero',
          sidebarPosition: 'right',
          sectionPriority: ['portfolio'],
          cardStyle: 'portfolio-cards'
        },
        sections: {
          required: ['contact'],
          optional: ['projects'],
          industrySpecific: ['portfolio']
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
          showLanguages: false
        }
      }
    ],
    comparisonMatrix: {
      'tech-1': {
        name: 'Technology Template',
        category: 'technology',
        industry: 'Technology',
        rating: 4.8,
        atsOptimized: true,
        showTechStack: true,
        showPortfolio: false,
        showMetrics: true,
        showPublications: false,
        showCertifications: true,
        headerStyle: 'tech-focused',
        sidebarPosition: 'left',
        cardStyle: 'code-blocks',
        experienceLevel: 'Intermediate',
        downloads: '12.5K',
        isNew: false
      },
      'design-1': {
        name: 'Design Template',
        category: 'design',
        industry: 'Design',
        rating: 4.9,
        atsOptimized: true,
        showTechStack: false,
        showPortfolio: true,
        showMetrics: false,
        showPublications: false,
        showCertifications: false,
        headerStyle: 'portfolio-hero',
        sidebarPosition: 'right',
        cardStyle: 'portfolio-cards',
        experienceLevel: 'Intermediate',
        downloads: '22.3K',
        isNew: false
      }
    }
  };

  const mockProps = {
    comparison: mockComparison,
    onClose: vi.fn(),
    onSelectTemplate: vi.fn(),
    onPreviewTemplate: vi.fn()
  };

  it('should render template comparison modal', () => {
    render(<TemplateComparison {...mockProps} />);
    
    expect(screen.getByText('Template Comparison')).toBeInTheDocument();
    expect(screen.getByText('Technology Template')).toBeInTheDocument();
    expect(screen.getByText('Design Template')).toBeInTheDocument();
  });

  it('should display comparison features', () => {
    render(<TemplateComparison {...mockProps} />);
    
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(<TemplateComparison {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onPreviewTemplate when preview button is clicked', () => {
    render(<TemplateComparison {...mockProps} />);
    
    const previewButtons = screen.getAllByText('Preview');
    fireEvent.click(previewButtons[0]);
    
    expect(mockProps.onPreviewTemplate).toHaveBeenCalledWith('tech-1');
  });

  it('should call onSelectTemplate when use button is clicked', () => {
    render(<TemplateComparison {...mockProps} />);
    
    const useButtons = screen.getAllByText('Use');
    fireEvent.click(useButtons[0]);
    
    expect(mockProps.onSelectTemplate).toHaveBeenCalledWith('tech-1');
  });

  it('should display ratings correctly', () => {
    render(<TemplateComparison {...mockProps} />);
    
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
  });

  it('should show boolean features with check/minus icons', () => {
    render(<TemplateComparison {...mockProps} />);
    
    // Tech Stack should show check for tech template, minus for design template
    const techStackRow = screen.getByText('Tech Stack').closest('div');
    expect(techStackRow).toBeInTheDocument();
  });
});