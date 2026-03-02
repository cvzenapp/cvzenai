import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TemplateRenderer from './TemplateRenderer';
import { Resume } from '@shared/api';
import { getTemplateConfig } from '@/services/templateService';

// Mock the template components
vi.mock('./TechnologyTemplate', () => ({
  default: ({ resume }: { resume: Resume }) => (
    <div data-testid="technology-template">Technology Template: {resume.personalInfo.name}</div>
  ),
}));

vi.mock('./ModernProfessionalTemplate', () => ({
  default: ({ resume }: { resume: Resume }) => (
    <div data-testid="modern-professional-template">Modern Professional Template: {resume.personalInfo.name}</div>
  ),
}));

// Mock other templates
vi.mock('./CreativeDesignerTemplate', () => ({ default: () => <div>Creative Designer Template</div> }));
vi.mock('./ManagementTemplate', () => ({ default: () => <div>Management Template</div> }));
vi.mock('./AcademicTemplate', () => ({ default: () => <div>Academic Template</div> }));
vi.mock('./MarketingTemplate', () => ({ default: () => <div>Marketing Template</div> }));
vi.mock('./SalesTemplate', () => ({ default: () => <div>Sales Template</div> }));
vi.mock('./ModernTechTemplate', () => ({ default: () => <div>Modern Tech Template</div> }));
vi.mock('./DevOpsTemplate', () => ({ default: () => <div>DevOps Template</div> }));
vi.mock('./MobileTemplate', () => ({ default: () => <div>Mobile Template</div> }));

const mockResume: Resume = {
  id: '1',
  personalInfo: {
    name: 'John Doe',
    title: 'Software Engineer',
    email: 'john@example.com',
    phone: '+1234567890',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.dev',
    avatar: ''
  },
  summary: 'Experienced software engineer',
  objective: 'Seeking new opportunities',
  skills: [],
  experiences: [],
  education: [],
  projects: [],
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('TemplateRenderer', () => {
  const mockProps = {
    resume: mockResume,
    activeTab: 'overview',
    setActiveTab: vi.fn(),
    upvotes: 0,
    hasUpvoted: false,
    isShortlisted: false,
    onUpvote: vi.fn(),
    onShortlist: vi.fn(),
  };

  it('renders technology template by default', () => {
    const templateConfig = getTemplateConfig('technology');
    
    render(
      <TemplateRenderer
        {...mockProps}
        templateConfig={templateConfig}
      />
    );

    expect(screen.getByTestId('technology-template')).toBeInTheDocument();
    expect(screen.getByText('Technology Template: John Doe')).toBeInTheDocument();
  });

  it('renders modern professional template', () => {
    const templateConfig = getTemplateConfig('modern-professional');
    
    render(
      <TemplateRenderer
        {...mockProps}
        templateConfig={templateConfig}
      />
    );

    expect(screen.getByTestId('modern-professional-template')).toBeInTheDocument();
    expect(screen.getByText('Modern Professional Template: John Doe')).toBeInTheDocument();
  });

  it('handles undefined templateConfig gracefully', () => {
    render(
      <TemplateRenderer
        {...mockProps}
        templateConfig={undefined as any}
      />
    );

    expect(screen.getByText('Template Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Unable to load the selected template configuration.')).toBeInTheDocument();
  });

  it('handles undefined resume gracefully', () => {
    const templateConfig = getTemplateConfig('technology');
    
    render(
      <TemplateRenderer
        {...mockProps}
        resume={undefined as any}
        templateConfig={templateConfig}
      />
    );

    expect(screen.getByText('Resume Data Missing')).toBeInTheDocument();
    expect(screen.getByText('No resume data available to display.')).toBeInTheDocument();
  });

  it('passes enhanced props to modern professional template', () => {
    const templateConfig = getTemplateConfig('modern-professional');
    const onDownload = vi.fn();
    const onContact = vi.fn();
    const onShare = vi.fn();
    
    render(
      <TemplateRenderer
        {...mockProps}
        templateConfig={templateConfig}
        onDownload={onDownload}
        onContact={onContact}
        onShare={onShare}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('modern-professional-template')).toBeInTheDocument();
  });

  it('falls back to technology template for unknown categories', () => {
    const templateConfig = {
      ...getTemplateConfig('technology'),
      category: 'unknown-category' as any
    };
    
    render(
      <TemplateRenderer
        {...mockProps}
        templateConfig={templateConfig}
      />
    );

    expect(screen.getByTestId('technology-template')).toBeInTheDocument();
  });
});