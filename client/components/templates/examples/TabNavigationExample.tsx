import React, { useState } from 'react';
import { TabNavigation } from '../components/TabNavigation';
import { Header } from '../components/Header';
import { SummarySkills } from '../components/SummarySkills';
import { ExperienceProjects } from '../components/ExperienceProjects';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { BaseTemplateStructure, TemplateContainer } from '../foundation';

/**
 * Example demonstrating TabNavigation component integration
 * Shows how to use tabs to navigate between different resume sections
 */
export const TabNavigationExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock resume data for demonstration
  const mockResume: Resume = {
    id: 'example-resume',
    personalInfo: {
      name: 'Alex Johnson',
      title: 'Senior Product Manager',
      email: 'alex.johnson@example.com',
      phone: '+1 (555) 987-6543',
      location: 'Seattle, WA',
      linkedin: 'https://linkedin.com/in/alexjohnson',
      github: 'https://github.com/alexjohnson',
      website: 'https://alexjohnson.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    experiences: [
      {
        id: '1',
        position: 'Senior Product Manager',
        company: 'TechFlow Inc.',
        location: 'Seattle, WA',
        startDate: '2021-08-01',
        endDate: null,
        description: 'Leading product strategy for B2B SaaS platform serving 50,000+ users. Increased user engagement by 35% through data-driven feature development. Managed cross-functional team of 12 engineers and designers.',
        technologies: ['Product Strategy', 'User Research', 'A/B Testing', 'SQL', 'Figma']
      },
      {
        id: '2',
        position: 'Product Manager',
        company: 'StartupCorp',
        location: 'San Francisco, CA',
        startDate: '2019-03-01',
        endDate: '2021-07-31',
        description: 'Launched 3 major product features that generated $2M in additional revenue. Conducted user interviews and market research to identify product opportunities. Collaborated with engineering team to deliver features on time.',
        technologies: ['Product Management', 'Market Research', 'Agile', 'Jira', 'Analytics']
      },
      {
        id: '3',
        position: 'Business Analyst',
        company: 'ConsultingPro',
        location: 'New York, NY',
        startDate: '2017-06-01',
        endDate: '2019-02-28',
        description: 'Analyzed business processes and identified optimization opportunities for Fortune 500 clients. Created detailed reports and presentations for C-level executives. Improved operational efficiency by 25% on average.',
        technologies: ['Business Analysis', 'Excel', 'PowerBI', 'Process Optimization']
      }
    ],
    projects: [
      {
        id: '1',
        name: 'Mobile App Redesign',
        description: 'Led complete redesign of mobile application, resulting in 40% increase in user retention and 4.8 App Store rating.',
        technologies: ['Product Design', 'User Research', 'Prototyping', 'A/B Testing'],
        url: 'https://apps.apple.com/app/example',
        featured: true
      },
      {
        id: '2',
        name: 'Customer Analytics Dashboard',
        description: 'Designed and launched analytics dashboard that provides real-time insights into customer behavior and product usage.',
        technologies: ['Analytics', 'Dashboard Design', 'SQL', 'Tableau'],
        url: 'https://dashboard.example.com',
        featured: true
      },
      {
        id: '3',
        name: 'Product Roadmap Framework',
        description: 'Developed standardized framework for product roadmap planning used across multiple product teams.',
        technologies: ['Product Strategy', 'Framework Design', 'Documentation'],
        featured: false
      }
    ],
    education: [
      {
        id: '1',
        degree: 'Master of Business Administration',
        institution: 'Stanford Graduate School of Business',
        field: 'Technology Management',
        startDate: '2015-08-01',
        endDate: '2017-05-15',
        gpa: '3.9'
      },
      {
        id: '2',
        degree: 'Bachelor of Science',
        institution: 'University of Washington',
        field: 'Computer Science',
        startDate: '2011-08-01',
        endDate: '2015-05-30',
        gpa: '3.7'
      }
    ],
    skills: [
      { id: '1', name: 'Product Strategy', level: 95, category: 'Product Management', isCore: true },
      { id: '2', name: 'User Research', level: 90, category: 'Product Management', isCore: true },
      { id: '3', name: 'Data Analysis', level: 85, category: 'Analytics', isCore: true },
      { id: '4', name: 'A/B Testing', level: 88, category: 'Analytics', isCore: true },
      { id: '5', name: 'SQL', level: 80, category: 'Technical', isCore: false },
      { id: '6', name: 'Figma', level: 75, category: 'Design', isCore: false },
      { id: '7', name: 'Agile/Scrum', level: 92, category: 'Methodology', isCore: true },
      { id: '8', name: 'Leadership', level: 88, category: 'Soft Skills', isCore: true }
    ],
    summary: 'Results-driven Senior Product Manager with 7+ years of experience building and scaling B2B SaaS products. Proven track record of increasing user engagement, driving revenue growth, and leading cross-functional teams. Passionate about using data-driven insights to create products that solve real customer problems.',
    objective: '',
    upvotes: 0,
    rating: 0,
    isShortlisted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Mock template configuration
  const mockTemplateConfig: TemplateConfig = {
    id: 'modern-professional',
    name: 'Modern Professional',
    category: 'technology',
    description: 'Clean, professional template with tab navigation',
    previewImage: '/templates/modern-professional-preview.jpg',
    isPremium: false
  };

  // Mock action handlers
  const handleDownload = () => {
    console.log('Download resume for:', mockResume.personalInfo.name);
  };

  const handleContact = () => {
    console.log('Contact candidate:', mockResume.personalInfo.name);
  };

  const handleShare = () => {
    console.log('Share profile for:', mockResume.personalInfo.name);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <Header
              resume={mockResume}
              templateConfig={mockTemplateConfig}
              onDownload={handleDownload}
              onContact={handleContact}
              onShare={handleShare}
            />
            <SummarySkills
              resume={mockResume}
              templateConfig={mockTemplateConfig}
            />
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
              Work Experience
            </h2>
            <div className="space-y-6">
              {mockResume.experiences.map((experience, index) => (
                <div key={index} className="border-l-2 border-primary/20 pl-6 relative">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{experience.position}</h3>
                        <p className="text-primary font-medium">{experience.company}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(experience.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                        {experience.endDate ? new Date(experience.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {experience.technologies.map((tech, techIndex) => (
                        <span key={techIndex} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary/20 text-secondary-foreground">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'projects':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
              Featured Projects
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockResume.projects.map((project, index) => (
                <div key={index} className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                    {project.featured && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, techIndex) => (
                      <span key={techIndex} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                        {tech}
                      </span>
                    ))}
                  </div>
                  {project.url && (
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2">
              Education
            </h2>
            <div className="space-y-4">
              {mockResume.education.map((edu, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{edu.degree}</h3>
                      <p className="text-primary font-medium">{edu.institution}</p>
                      <p className="text-muted-foreground">{edu.field}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
                      {new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  {edu.gpa && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">GPA:</span> {edu.gpa}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tab-navigation-example max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Tab Navigation Component Example
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          This example demonstrates the TabNavigation component with full keyboard accessibility,
          ARIA compliance, and smooth transitions between resume sections.
        </p>
      </div>

      {/* Component Example */}
      <BaseTemplateStructure
        resume={mockResume}
        templateConfig={mockTemplateConfig}
        className="tab-navigation-demo"
      >
        <TemplateContainer maxWidth="7xl">
          {/* Tab Navigation */}
          <div className="mb-8">
            <TabNavigation
              resume={mockResume}
              templateConfig={mockTemplateConfig}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Tab Content */}
          <div 
            role="tabpanel"
            id={`tabpanel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="tab-content"
          >
            {renderTabContent()}
          </div>
        </TemplateContainer>
      </BaseTemplateStructure>

      {/* Usage Information */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">Key Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Keyboard Navigation
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Arrow keys for navigation</li>
              <li>• Home/End for first/last tab</li>
              <li>• Enter/Space to activate</li>
              <li>• Proper focus management</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              Screen Reader Support
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• ARIA labels and descriptions</li>
              <li>• Live region announcements</li>
              <li>• Semantic HTML structure</li>
              <li>• Tab role implementation</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium text-foreground flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Smart Visibility
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Conditional tab rendering</li>
              <li>• Content-based visibility</li>
              <li>• Responsive design</li>
              <li>• Smooth transitions</li>
            </ul>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-6 border border-border">
          <h3 className="font-medium text-foreground mb-3">Try the Navigation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Use your keyboard to navigate the tabs above:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">←→</kbd>
              <span className="text-muted-foreground">Navigate tabs</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Enter</kbd>
              <span className="text-muted-foreground">Activate tab</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">Home</kbd>
              <span className="text-muted-foreground">First tab</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-background border border-border rounded text-xs">End</kbd>
              <span className="text-muted-foreground">Last tab</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabNavigationExample;