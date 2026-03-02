import React from 'react';
import { ExperienceProjects } from '../components/ExperienceProjects';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';

/**
 * Example usage of ExperienceProjects component
 * Demonstrates the Tier 3: Detailed Evaluation section
 */
export const ExperienceProjectsExample: React.FC = () => {
  // Mock resume data for demonstration
  const mockResume: Resume = {
    id: 'example-resume',
    userId: 'example-user',
    personalInfo: {
      name: 'Sarah Chen',
      title: 'Senior Full Stack Developer',
      email: 'sarah.chen@example.com',
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      github: 'https://github.com/sarahchen',
      portfolio: 'https://sarahchen.dev',
    },
    experiences: [
      {
        position: 'Senior Full Stack Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        startDate: '2022-03-01',
        endDate: null, // Current position
        description: 'Led development of microservices architecture serving 2M+ users. Improved system performance by 40% through optimization and caching strategies. Mentored 5 junior developers and established code review processes that reduced bugs by 60%.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'TypeScript']
      },
      {
        position: 'Full Stack Developer',
        company: 'StartupXYZ',
        location: 'Remote',
        startDate: '2020-06-01',
        endDate: '2022-02-28',
        description: 'Built and maintained customer-facing web applications using React and Express.js. Implemented automated testing suite that increased code coverage from 30% to 85%. Collaborated with design team to create responsive, accessible user interfaces.',
        technologies: ['React', 'Express.js', 'MongoDB', 'Jest', 'Cypress']
      },
      {
        position: 'Frontend Developer',
        company: 'Digital Agency Pro',
        location: 'New York, NY',
        startDate: '2019-01-15',
        endDate: '2020-05-30',
        description: 'Developed responsive websites and web applications for clients in various industries. Optimized website performance resulting in 25% faster load times. Worked closely with UX designers to implement pixel-perfect designs.',
        technologies: ['JavaScript', 'HTML5', 'CSS3', 'Sass', 'Webpack']
      }
    ],
    projects: [
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack e-commerce solution with real-time inventory management, payment processing, and admin dashboard. Handles 10,000+ transactions monthly.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe API', 'Redis'],
        github: 'https://github.com/sarahchen/ecommerce-platform',
        url: 'https://demo-ecommerce.sarahchen.dev',
        featured: true
      },
      {
        name: 'Task Management App',
        description: 'Collaborative project management tool with real-time updates, file sharing, and team communication features. Used by 500+ teams.',
        technologies: ['React', 'Socket.io', 'Express.js', 'MongoDB', 'AWS S3'],
        github: 'https://github.com/sarahchen/task-manager',
        url: 'https://taskmanager.sarahchen.dev',
        featured: true
      },
      {
        name: 'Weather Dashboard',
        description: 'Interactive weather application with location-based forecasts, historical data visualization, and severe weather alerts.',
        technologies: ['Vue.js', 'Chart.js', 'OpenWeather API', 'Tailwind CSS'],
        github: 'https://github.com/sarahchen/weather-dashboard',
        url: 'https://weather.sarahchen.dev',
        featured: false
      },
      {
        name: 'Portfolio Website',
        description: 'Personal portfolio showcasing projects and technical skills with responsive design and smooth animations.',
        technologies: ['Next.js', 'Framer Motion', 'Tailwind CSS', 'Vercel'],
        github: 'https://github.com/sarahchen/portfolio',
        url: 'https://sarahchen.dev',
        featured: false
      }
    ],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California, Berkeley',
        startDate: '2015-08-01',
        endDate: '2019-05-15',
        gpa: '3.8',
        honors: 'Magna Cum Laude',
        relevantCourses: ['Data Structures', 'Algorithms', 'Database Systems', 'Software Engineering', 'Web Development']
      },
      {
        degree: 'Associate of Arts in Mathematics',
        institution: 'Community College of San Francisco',
        startDate: '2013-08-01',
        endDate: '2015-05-30',
        gpa: '4.0',
        relevantCourses: ['Calculus I-III', 'Linear Algebra', 'Statistics', 'Discrete Mathematics']
      }
    ],
    certifications: [
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: '2023-06-15',
        expiryDate: '2026-06-15',
        credentialId: 'AWS-SAA-123456789'
      },
      {
        name: 'Google Cloud Professional Developer',
        issuer: 'Google Cloud',
        issueDate: '2022-11-20',
        expiryDate: '2024-11-20',
        credentialId: 'GCP-PD-987654321'
      },
      {
        name: 'Certified Kubernetes Administrator',
        issuer: 'Cloud Native Computing Foundation',
        issueDate: '2023-03-10',
        expiryDate: '2026-03-10',
        credentialId: 'CKA-2023-001234'
      }
    ],
    skills: [
      { name: 'JavaScript', level: 'Expert', category: 'Programming Languages' },
      { name: 'TypeScript', level: 'Advanced', category: 'Programming Languages' },
      { name: 'Python', level: 'Intermediate', category: 'Programming Languages' },
      { name: 'React', level: 'Expert', category: 'Frontend Frameworks' },
      { name: 'Node.js', level: 'Advanced', category: 'Backend Technologies' },
      { name: 'PostgreSQL', level: 'Advanced', category: 'Databases' },
      { name: 'AWS', level: 'Advanced', category: 'Cloud Platforms' },
      { name: 'Docker', level: 'Intermediate', category: 'DevOps' }
    ],
    summary: 'Experienced Full Stack Developer with 5+ years building scalable web applications. Proven track record of leading technical teams, optimizing system performance, and delivering high-quality software solutions. Passionate about mentoring junior developers and implementing best practices.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock template configuration
  const mockTemplateConfig: TemplateConfig = {
    id: 'modern-professional',
    name: 'Modern Professional',
    category: 'professional',
    description: 'Clean, professional template optimized for recruiters',
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

  return (
    <div className="experience-projects-example max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Experience & Projects Component Example
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          This example demonstrates the ExperienceProjects component (Tier 3: Detailed Evaluation) 
          with comprehensive work experience, featured projects, education, and certifications display.
        </p>
      </div>

      {/* Component Example */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground">
            ExperienceProjects Component
          </h2>
        </div>
        <div className="p-6">
          <ExperienceProjects 
            resume={mockResume}
            templateConfig={mockTemplateConfig}
          />
        </div>
      </div>

      {/* Usage Information */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Work Experience</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Reverse chronological order</li>
              <li>• Clear date ranges and company info</li>
              <li>• Achievement highlighting</li>
              <li>• Technology tags</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Projects Showcase</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Featured projects section</li>
              <li>• Portfolio links integration</li>
              <li>• GitHub and live demo links</li>
              <li>• Technology stack display</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Education</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Degrees and certifications</li>
              <li>• GPA and honors display</li>
              <li>• Relevant coursework</li>
              <li>• Chronological ordering</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-foreground">Accessibility</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Semantic HTML structure</li>
              <li>• ARIA labels and descriptions</li>
              <li>• Keyboard navigation support</li>
              <li>• Screen reader compatibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};