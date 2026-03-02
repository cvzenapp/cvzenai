import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExperienceProjects } from '@/components/templates/components/ExperienceProjects';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

// Mock template configuration
const mockTemplateConfig: TemplateConfig = {
  id: 'modern-professional',
  name: 'Modern Professional',
  category: 'professional',
  description: 'Clean, professional template',
  previewImage: '/templates/modern-professional-preview.jpg',
  isPremium: false,
  colorScheme: {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#0ea5e9',
    background: '#ffffff',
    text: '#1e293b'
  },
  layout: {
    columns: 1,
    spacing: 'comfortable',
    headerStyle: 'modern'
  }
};

// Mock resume data with comprehensive experience and projects
const mockResumeWithFullData: Resume = {
  id: 'test-resume',
  userId: 'test-user',
  personalInfo: {
    name: 'Alex Morgan',
    title: 'Senior Software Engineer',
    email: 'john.doe@example.com',
    github: 'https://github.com/johndoe',
    portfolio: 'https://johndoe.dev',
  },
  experiences: [
    {
      position: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'San Francisco, CA',
      startDate: '2022-01-01',
      endDate: null, // Current position
      description: 'Led development of microservices architecture serving 1M+ users. Improved system performance by 35% through optimization. Mentored 3 junior developers.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS']
    },
    {
      position: 'Full Stack Developer',
      company: 'Startup Inc',
      location: 'Remote',
      startDate: '2020-06-01',
      endDate: '2021-12-31',
      description: 'Built customer-facing applications using modern web technologies. Implemented automated testing suite.',
      technologies: ['Vue.js', 'Express.js', 'MongoDB']
    }
  ],
  projects: [
    {
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce solution with payment processing',
      technologies: ['React', 'Node.js', 'Stripe'],
      github: 'https://github.com/johndoe/ecommerce',
      url: 'https://ecommerce-demo.com',
      featured: true
    },
    {
      name: 'Task Manager',
      description: 'Collaborative project management tool',
      technologies: ['Vue.js', 'Socket.io'],
      github: 'https://github.com/johndoe/taskmanager',
      featured: false
    }
  ],
  education: [
    {
      degree: 'Bachelor of Science in Computer Science',
      institution: 'University of Technology',
      startDate: '2016-08-01',
      endDate: '2020-05-15',
      gpa: '3.8',
      honors: 'Magna Cum Laude',
      relevantCourses: ['Data Structures', 'Algorithms', 'Software Engineering']
    }
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      issueDate: '2023-06-15',
      expiryDate: '2026-06-15',
      credentialId: 'AWS-SAA-123456'
    }
  ],
  skills: [],
  summary: 'Experienced software engineer',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock resume with minimal data
const mockResumeMinimal: Resume = {
  id: 'minimal-resume',
  userId: 'test-user',
  personalInfo: {
    name: 'Jane Smith',
    title: 'Developer',
    email: 'jane@example.com',
  },
  experiences: [],
  projects: [],
  education: [],
  certifications: [],
  skills: [],
  summary: 'Developer',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

describe('ExperienceProjects Component', () => {
  describe('Experience Section', () => {
    it('renders experience section with work history', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Experience')).toBeInTheDocument();
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Tech Corp')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
      expect(screen.getByText('Startup Inc')).toBeInTheDocument();
    });

    it('displays current position indicator', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('shows experience descriptions and achievements', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText(/Led development of microservices architecture/)).toBeInTheDocument();
      expect(screen.getByText(/Built customer-facing applications/)).toBeInTheDocument();
    });

    it('displays technology tags for experience', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getAllByText('React')).toHaveLength(2); // One in experience, one in projects
      expect(screen.getAllByText('Node.js')).toHaveLength(2);
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText('AWS')).toBeInTheDocument();
    });

    it('sorts experiences in reverse chronological order', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      const experienceItems = screen.getAllByText(/Software Engineer|Full Stack Developer/);
      expect(experienceItems[0]).toHaveTextContent('Senior Software Engineer');
      expect(experienceItems[1]).toHaveTextContent('Full Stack Developer');
    });

    it('does not render experience section when no experiences exist', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeMinimal} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.queryByText('Experience')).not.toBeInTheDocument();
    });
  });

  describe('Projects Section', () => {
    it('renders projects section with project details', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Featured Projects')).toBeInTheDocument();
      expect(screen.getByText('E-Commerce Platform')).toBeInTheDocument();
      expect(screen.getByText('Task Manager')).toBeInTheDocument();
    });

    it('displays featured project indicator', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('shows project descriptions and technologies', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText(/Full-stack e-commerce solution/)).toBeInTheDocument();
      expect(screen.getByText(/Collaborative project management tool/)).toBeInTheDocument();
      expect(screen.getByText('Stripe')).toBeInTheDocument();
      expect(screen.getByText('Socket.io')).toBeInTheDocument();
    });

    it('renders project links correctly', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      const githubLinks = screen.getAllByText('View Code');
      const demoLinks = screen.getAllByText('Live Demo');
      
      expect(githubLinks).toHaveLength(2);
      expect(demoLinks).toHaveLength(1);
      
      expect(githubLinks[0].closest('a')).toHaveAttribute('href', 'https://github.com/johndoe/ecommerce');
      expect(demoLinks[0].closest('a')).toHaveAttribute('href', 'https://ecommerce-demo.com');
    });

    it('displays portfolio links section when available', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Portfolio & Code Repositories')).toBeInTheDocument();
      expect(screen.getByText('GitHub Profile')).toBeInTheDocument();
      expect(screen.getByText('Portfolio Website')).toBeInTheDocument();
    });

    it('does not render projects section when no projects exist', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeMinimal} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.queryByText('Projects')).not.toBeInTheDocument();
    });
  });

  describe('Education Section', () => {
    it('renders education section with degree details', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Bachelor of Science in Computer Science')).toBeInTheDocument();
      expect(screen.getByText('University of Technology')).toBeInTheDocument();
    });

    it('displays GPA and honors when available', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('3.8')).toBeInTheDocument();
      expect(screen.getByText('Magna Cum Laude')).toBeInTheDocument();
    });

    it('shows relevant coursework', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Relevant Coursework:')).toBeInTheDocument();
      expect(screen.getByText('Data Structures')).toBeInTheDocument();
      expect(screen.getByText('Algorithms')).toBeInTheDocument();
      expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    });

    it('does not render education section when no education exists', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeMinimal} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.queryByText('Education')).not.toBeInTheDocument();
    });
  });

  describe('Certifications Section', () => {
    it('renders certifications section with certification details', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText('Certifications')).toBeInTheDocument();
      expect(screen.getByText('AWS Certified Solutions Architect')).toBeInTheDocument();
      expect(screen.getByText('Amazon Web Services')).toBeInTheDocument();
    });

    it('displays issue and expiry dates', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText(/Issued: Jun 2023/)).toBeInTheDocument();
      expect(screen.getByText(/Expires: Jun 2026/)).toBeInTheDocument();
    });

    it('shows credential ID when available', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText(/ID: AWS-SAA-123456/)).toBeInTheDocument();
    });

    it('does not render certifications section when no certifications exist', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeMinimal} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.queryByText('Certifications')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and semantic structure', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      const section = screen.getByRole('region', { name: 'Experience and Projects' });
      expect(section).toBeInTheDocument();
      expect(section).toHaveAttribute('aria-label', 'Experience and Projects');
    });

    it('uses proper heading hierarchy', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      const mainHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(mainHeadings).toHaveLength(4); // Experience, Projects, Education, Certifications
      
      const subHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    it('has accessible external links', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      const externalLinks = screen.getAllByRole('link');
      externalLinks.forEach(link => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer');
        }
      });
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes for different screen sizes', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      const projectsGrid = screen.getByText('E-Commerce Platform').closest('.grid');
      expect(projectsGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });

    it('handles custom className prop', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig}
          className="custom-class"
        />
      );

      const section = screen.getByRole('region', { name: 'Experience and Projects' });
      expect(section).toHaveClass('custom-class');
    });
  });

  describe('Achievement Highlighting', () => {
    it('identifies and highlights quantified achievements', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      // Should highlight achievements with quantified results
      expect(screen.getByText('Key Achievements')).toBeInTheDocument();
      expect(screen.getAllByText(/Improved system performance by 35%/)).toHaveLength(2); // One in description, one in achievements
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      render(
        <ExperienceProjects 
          resume={mockResumeWithFullData} 
          templateConfig={mockTemplateConfig} 
        />
      );

      expect(screen.getByText(/Jan 2022 - Present/)).toBeInTheDocument();
      expect(screen.getByText(/Jun 2020 - Dec 2021/)).toBeInTheDocument();
    });
  });
});