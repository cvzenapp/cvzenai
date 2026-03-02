import React from 'react';
import { SummarySkills } from '../components/SummarySkills';
import { Resume } from '@shared/api';
import { getTemplateConfig } from '@/services/templateService';

/**
 * Example usage of the SummarySkills component
 * Demonstrates the Tier 2 qualification review section
 */

// Sample resume data for demonstration
const sampleResume: Resume = {
  id: 'example-1',
  personalInfo: {
    name: 'Sarah Chen',
    title: 'Full Stack Developer',
    email: 'sarah.chen@example.com',
    phone: '+1 (555) 987-6543',
    location: 'Seattle, WA',
    website: 'https://sarahchen.dev',
    linkedin: 'https://linkedin.com/in/sarahchen',
    github: 'https://github.com/sarahchen',
    avatar: ''
  },
  summary: 'Passionate full-stack developer with 6+ years of experience building modern web applications. Expertise in React, Node.js, and cloud technologies. Led development teams and delivered scalable solutions for Fortune 500 companies. Strong advocate for clean code, testing, and user-centered design.',
  objective: '',
  skills: [
    {
      id: '1',
      name: 'JavaScript',
      category: 'Programming',
      proficiency: 95,
      yearsOfExperience: 6,
      isCore: true
    },
    {
      id: '2',
      name: 'TypeScript',
      category: 'Programming',
      proficiency: 90,
      yearsOfExperience: 4,
      isCore: true
    },
    {
      id: '3',
      name: 'React',
      category: 'Frameworks',
      proficiency: 92,
      yearsOfExperience: 5,
      isCore: true
    },
    {
      id: '4',
      name: 'Node.js',
      category: 'Frameworks',
      proficiency: 88,
      yearsOfExperience: 5,
      isCore: true
    },
    {
      id: '5',
      name: 'Next.js',
      category: 'Frameworks',
      proficiency: 85,
      yearsOfExperience: 3,
      isCore: false
    },
    {
      id: '6',
      name: 'PostgreSQL',
      category: 'Databases',
      proficiency: 80,
      yearsOfExperience: 4,
      isCore: false
    },
    {
      id: '7',
      name: 'MongoDB',
      category: 'Databases',
      proficiency: 75,
      yearsOfExperience: 3,
      isCore: false
    },
    {
      id: '8',
      name: 'AWS',
      category: 'Cloud',
      proficiency: 78,
      yearsOfExperience: 3,
      isCore: false
    },
    {
      id: '9',
      name: 'Docker',
      category: 'Tools',
      proficiency: 82,
      yearsOfExperience: 4,
      isCore: false
    },
    {
      id: '10',
      name: 'Git',
      category: 'Tools',
      proficiency: 90,
      yearsOfExperience: 6,
      isCore: false
    },
    {
      id: '11',
      name: 'Team Leadership',
      category: 'Soft Skills',
      proficiency: 85,
      yearsOfExperience: 2,
      isCore: false
    },
    {
      id: '12',
      name: 'Problem Solving',
      category: 'Soft Skills',
      proficiency: 92,
      yearsOfExperience: 6,
      isCore: true
    }
  ],
  experiences: [
    {
      id: '1',
      company: 'TechFlow Solutions',
      position: 'Senior Full Stack Developer',
      startDate: '2022-03-01',
      endDate: null,
      description: 'Lead development of enterprise web applications',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      keyMetrics: []
    },
    {
      id: '2',
      company: 'InnovateLab',
      position: 'Full Stack Developer',
      startDate: '2020-01-15',
      endDate: '2022-02-28',
      description: 'Built scalable web applications for startups',
      technologies: ['React', 'Express', 'MongoDB'],
      keyMetrics: []
    },
    {
      id: '3',
      company: 'WebCraft Agency',
      position: 'Frontend Developer',
      startDate: '2018-06-01',
      endDate: '2019-12-31',
      description: 'Developed responsive websites and web applications',
      technologies: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
      keyMetrics: []
    }
  ],
  education: [
    {
      id: '1',
      institution: 'University of Washington',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2014-09-01',
      endDate: '2018-05-31',
      gpa: '3.8'
    }
  ],
  projects: [
    {
      id: '1',
      title: 'E-commerce Platform',
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce solution with payment processing',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
      startDate: '2023-01-01',
      endDate: '2023-04-30',
      url: 'https://demo-ecommerce.sarahchen.dev',
      github: 'https://github.com/sarahchen/ecommerce-platform',
      images: []
    },
    {
      id: '2',
      title: 'Task Management App',
      name: 'Task Management App',
      description: 'Collaborative task management with real-time updates',
      technologies: ['Next.js', 'Socket.io', 'MongoDB'],
      startDate: '2022-08-01',
      endDate: '2022-11-30',
      url: 'https://taskflow.sarahchen.dev',
      github: 'https://github.com/sarahchen/taskflow',
      images: []
    }
  ],
  upvotes: 0,
  rating: 0,
  isShortlisted: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const SummarySkillsExample: React.FC = () => {
  const templateConfig = getTemplateConfig('technology');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Summary & Skills Component Example
          </h1>
          <p className="text-muted-foreground">
            Tier 2: Qualification Review - Professional summary and core skills display
          </p>
        </div>

        {/* Example with full data */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Complete Example (with all data)
          </h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <SummarySkills 
              resume={sampleResume}
              templateConfig={templateConfig}
            />
          </div>
        </div>

        {/* Example with minimal data */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Minimal Data Example
          </h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <SummarySkills 
              resume={{
                ...sampleResume,
                summary: 'Brief professional summary.',
                skills: [
                  {
                    id: '1',
                    name: 'JavaScript',
                    category: 'Programming',
                    proficiency: 85,
                    yearsOfExperience: 3,
                    isCore: true
                  },
                  {
                    id: '2',
                    name: 'React',
                    category: 'Frameworks',
                    proficiency: 80,
                    yearsOfExperience: 2,
                    isCore: true
                  }
                ],
                experiences: [
                  {
                    id: '1',
                    company: 'Tech Company',
                    position: 'Developer',
                    startDate: '2021-01-01',
                    endDate: null,
                    description: 'Software development',
                    technologies: ['JavaScript'],
                    keyMetrics: []
                  }
                ],
                projects: []
              }}
              templateConfig={templateConfig}
            />
          </div>
        </div>

        {/* Example with no data */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Empty State Example
          </h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <SummarySkills 
              resume={{
                ...sampleResume,
                summary: '',
                skills: [],
                experiences: [],
                projects: []
              }}
              templateConfig={templateConfig}
            />
          </div>
        </div>

        {/* Usage Notes */}
        <div className="bg-muted/50 rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Usage Notes
          </h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground mb-2">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Professional summary with clean, readable formatting</li>
                <li>Skills grouped by category (Programming, Frameworks, Tools, etc.)</li>
                <li>Visual proficiency indicators with progress bars</li>
                <li>Key metrics display (years of experience, projects, positions)</li>
                <li>Skills overview section for quick scanning</li>
                <li>Core skill highlighting with badges</li>
                <li>Responsive layout that works on all devices</li>
                <li>Accessibility compliant with ARIA labels and semantic HTML</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground mb-2">Accessibility Features:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Proper semantic HTML structure with headings hierarchy</li>
                <li>ARIA labels for progress bars and interactive elements</li>
                <li>Screen reader friendly content organization</li>
                <li>High contrast colors for better readability</li>
                <li>Keyboard navigation support</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-foreground mb-2">Recruiter Optimization:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Two-column layout for efficient space usage</li>
                <li>Key metrics prominently displayed for quick assessment</li>
                <li>Skills overview section highlights top competencies</li>
                <li>Core skills clearly marked with badges</li>
                <li>Professional summary positioned for easy scanning</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummarySkillsExample;