import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/templates/components/Header';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

// Mock resume data for testing
const mockResume: Resume = {
  id: '1',
  personalInfo: {
    name: 'Alex Morgan',
    title: 'Senior Software Engineer',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.dev',
    avatar: 'https://example.com/avatar.jpg'
  },
  summary: 'Experienced software engineer with 8+ years of experience.',
  objective: 'Seeking challenging opportunities in full-stack development.',
  skills: [
    { id: '1', name: 'JavaScript', level: 90, category: 'Programming Languages' },
    { id: '2', name: 'React', level: 85, category: 'Frontend Frameworks' }
  ],
  experiences: [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Senior Software Engineer',
      startDate: '2020-01-01',
      endDate: null,
      description: 'Leading frontend development team.',
      technologies: ['React', 'TypeScript']
    },
    {
      id: '2',
      company: 'StartupXYZ',
      position: 'Software Engineer',
      startDate: '2018-06-01',
      endDate: '2019-12-31',
      description: 'Full-stack development.',
      technologies: ['Node.js', 'React']
    }
  ],
  education: [],
  projects: [],
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

const mockTemplateConfig: TemplateConfig = {
  id: 'modern-professional',
  name: 'Modern Professional',
  category: 'technology',
  description: 'A clean, modern template',
  industry: 'Technology',
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280'
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    codeFont: 'Monaco'
  }
};

describe('Header Component', () => {
  it('renders candidate name and title correctly', () => {
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Alex Morgan');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Senior Software Engineer');
  });

  it('displays contact information with proper links', () => {
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    // Check email link
    const emailLink = screen.getByRole('link', { name: /email Alex Morgan/i });
    expect(emailLink).toHaveAttribute('href', 'mailto:john.doe@example.com');

    // Check phone link
    const phoneLink = screen.getByRole('link', { name: /call Alex Morgan/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:+1 (555) 123-4567');

    // Check LinkedIn link
    const linkedinLink = screen.getByRole('link', { name: /linkedin profile/i });
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/johndoe');
    expect(linkedinLink).toHaveAttribute('target', '_blank');

    // Check GitHub link
    const githubLink = screen.getByRole('link', { name: /github profile/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/johndoe');
    expect(githubLink).toHaveAttribute('target', '_blank');

    // Check portfolio link
    const portfolioLink = screen.getByRole('link', { name: /portfolio website/i });
    expect(portfolioLink).toHaveAttribute('href', 'https://johndoe.dev');
    expect(portfolioLink).toHaveAttribute('target', '_blank');
  });

  it('displays location and experience information', () => {
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText(/7 years experience/)).toBeInTheDocument();
  });

  it('renders avatar image when provided', () => {
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    const avatar = screen.getByRole('img', { name: /Alex Morgan profile picture/i });
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('renders initials when no avatar is provided', () => {
    const resumeWithoutAvatar = {
      ...mockResume,
      personalInfo: {
        ...mockResume.personalInfo,
        avatar: undefined
      }
    };

    render(
      <Header 
        resume={resumeWithoutAvatar} 
        templateConfig={mockTemplateConfig}
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('calls onDownload when download button is clicked', () => {
    const onDownload = vi.fn();
    
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
        onDownload={onDownload}
      />
    );

    const downloadButton = screen.getByRole('button', { name: /download resume pdf/i });
    fireEvent.click(downloadButton);

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('calls onContact when contact button is clicked', () => {
    const onContact = vi.fn();
    
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
        onContact={onContact}
      />
    );

    const contactButton = screen.getByRole('button', { name: /contact candidate/i });
    fireEvent.click(contactButton);

    expect(onContact).toHaveBeenCalledTimes(1);
  });

  it('renders share button when onShare is provided', () => {
    const onShare = vi.fn();
    
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
        onShare={onShare}
      />
    );

    const shareButton = screen.getByRole('button', { name: /share profile/i });
    expect(shareButton).toBeInTheDocument();
    
    fireEvent.click(shareButton);
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('does not render share button when onShare is not provided', () => {
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    const shareButton = screen.queryByRole('button', { name: /share profile/i });
    expect(shareButton).not.toBeInTheDocument();
  });

  it('handles missing optional contact information gracefully', () => {
    const minimalResume = {
      ...mockResume,
      personalInfo: {
        name: 'Jane Smith',
        title: 'Developer',
        email: 'jane@example.com',
        phone: '',
        location: '',
        linkedin: undefined,
        github: undefined,
        website: undefined
      }
    };

    render(
      <Header 
        resume={minimalResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    
    // Should not render empty location or social links
    expect(screen.queryByText('LinkedIn')).not.toBeInTheDocument();
    expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
    expect(screen.queryByText('Portfolio')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <Header 
        resume={mockResume} 
        templateConfig={mockTemplateConfig}
      />
    );

    // Check header role and aria-label
    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('aria-label', 'Candidate Header Information');

    // Check button accessibility
    const downloadButton = screen.getByRole('button', { name: /download resume pdf/i });
    expect(downloadButton).toHaveAttribute('type', 'button');
    expect(downloadButton).toHaveAttribute('aria-label', 'Download Resume PDF');

    const contactButton = screen.getByRole('button', { name: /contact candidate/i });
    expect(contactButton).toHaveAttribute('type', 'button');
    expect(contactButton).toHaveAttribute('aria-label', 'Contact Candidate');
  });
});