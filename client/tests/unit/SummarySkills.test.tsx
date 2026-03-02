import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummarySkills } from '@/components/templates/components/SummarySkills';
import { Resume } from '@shared/api';
import { getTemplateConfig } from '@/services/templateService';

// Mock resume data for testing
const mockResume: Resume = {
  id: '1',
  personalInfo: {
    name: 'Alex Morgan',
    title: 'Senior Software Engineer',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'https://johndoe.com',
    linkedin: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    avatar: ''
  },
  summary: 'Experienced software engineer with 8+ years of experience building scalable web applications and leading development teams.',
  objective: '',
  skills: [
    {
      id: '1',
      name: 'JavaScript',
      category: 'Programming',
      proficiency: 95,
      yearsOfExperience: 8,
      isCore: true
    },
    {
      id: '2',
      name: 'React',
      category: 'Frameworks',
      proficiency: 90,
      yearsOfExperience: 5,
      isCore: true
    },
    {
      id: '3',
      name: 'Node.js',
      category: 'Programming',
      proficiency: 85,
      yearsOfExperience: 6,
      isCore: true
    },
    {
      id: '4',
      name: 'Leadership',
      category: 'Soft Skills',
      proficiency: 80,
      yearsOfExperience: 3,
      isCore: false
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'Tech Corp',
      position: 'Senior Software Engineer',
      startDate: '2020-01-01',
      endDate: null,
      description: 'Lead development of web applications',
      technologies: ['React', 'Node.js'],
      keyMetrics: []
    },
    {
      id: '2',
      company: 'StartupXYZ',
      position: 'Software Engineer',
      startDate: '2018-01-01',
      endDate: '2019-12-31',
      description: 'Built scalable backend systems',
      technologies: ['Python', 'Django'],
      keyMetrics: []
    }
  ],
  education: [],
  projects: [
    {
      id: '1',
      title: 'E-commerce Platform',
      name: 'E-commerce Platform',
      description: 'Built a full-stack e-commerce platform',
      technologies: ['React', 'Node.js', 'MongoDB'],
      startDate: '2023-01-01',
      endDate: '2023-06-01',
      url: 'https://example.com',
      github: 'https://github.com/johndoe/ecommerce',
      images: []
    }
  ],
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockTemplateConfig = getTemplateConfig('technology');

describe('SummarySkills Component', () => {
  it('renders professional summary correctly', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    expect(screen.getByText('Professional Summary')).toBeInTheDocument();
    expect(screen.getByText(mockResume.summary)).toBeInTheDocument();
  });

  it('displays key metrics when experience data is available', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
    expect(screen.getByText('Years Experience')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Positions')).toBeInTheDocument();
  });

  it('renders skills grouped by category', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    expect(screen.getByText('Core Skills')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('Frameworks')).toBeInTheDocument();
    expect(screen.getByText('Soft Skills')).toBeInTheDocument();
  });

  it('displays skill proficiency levels and percentages', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    // Check that JavaScript appears multiple times (detailed view + overview)
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getAllByText('Expert').length).toBeGreaterThan(0);
    
    // Check that React appears multiple times (detailed view + overview)
    expect(screen.getAllByText('React').length).toBeGreaterThan(0);
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getAllByText('Advanced').length).toBeGreaterThan(0);
  });

  it('shows core skill badges', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    // Should show "Core" badges for core skills
    const coreBadges = screen.getAllByText('Core');
    expect(coreBadges.length).toBeGreaterThan(0);
  });

  it('displays skills overview section with top skills', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    expect(screen.getByText('Skills Overview')).toBeInTheDocument();
    // Should show core skills and high-proficiency skills in overview
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThanOrEqual(1);
  });

  it('handles empty skills gracefully', () => {
    const resumeWithoutSkills = {
      ...mockResume,
      skills: []
    };

    render(
      <SummarySkills 
        resume={resumeWithoutSkills} 
        templateConfig={mockTemplateConfig} 
      />
    );

    expect(screen.getByText('No skills listed')).toBeInTheDocument();
  });

  it('handles empty summary gracefully', () => {
    const resumeWithoutSummary = {
      ...mockResume,
      summary: ''
    };

    render(
      <SummarySkills 
        resume={resumeWithoutSummary} 
        templateConfig={mockTemplateConfig} 
      />
    );

    expect(screen.getByText('No professional summary provided')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
      />
    );

    // Check for proper ARIA labels and roles
    expect(screen.getByRole('region', { name: 'Professional Summary and Skills' })).toBeInTheDocument();
    
    // Check for progress bars with proper ARIA attributes
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
    
    progressBars.forEach(progressBar => {
      expect(progressBar).toHaveAttribute('aria-valuenow');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label');
    });
  });

  it('applies custom className correctly', () => {
    const customClass = 'custom-summary-skills';
    const { container } = render(
      <SummarySkills 
        resume={mockResume} 
        templateConfig={mockTemplateConfig} 
        className={customClass}
      />
    );

    expect(container.firstChild).toHaveClass(customClass);
  });
});