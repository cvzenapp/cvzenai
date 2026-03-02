import React from 'react';
import { ProgressiveDisclosure } from '../components/ProgressiveDisclosure';
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure';

/**
 * Progressive Disclosure Example Component
 * 
 * Demonstrates various use cases for progressive disclosure in resume templates:
 * - Skills with detailed proficiency information
 * - Experience with full descriptions and achievements
 * - Projects with technical details
 * - Education with coursework and honors
 */
export const ProgressiveDisclosureExample: React.FC = () => {
  const { isExpanded, toggle, expandAll, collapseAll } = useProgressiveDisclosure({
    'skills-frontend': false,
    'skills-backend': false,
    'experience-1': false,
    'project-1': false,
    'education-details': false
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Progressive Disclosure Examples
        </h1>
        <p className="text-muted-foreground mb-6">
          Demonstrating collapsible sections for detailed information that doesn't fit the scanning hierarchy
        </p>
        
        {/* Bulk Controls */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Skills Section with Progressive Disclosure */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b border-border pb-2">
          Skills with Progressive Disclosure
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend Skills */}
          <ProgressiveDisclosure
            summary={
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Frontend Development</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">React</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">TypeScript</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Tailwind CSS</span>
                </div>
              </div>
            }
            details={
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">React</span>
                    <span className="text-sm text-muted-foreground">Expert • 5 years</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">TypeScript</span>
                    <span className="text-sm text-muted-foreground">Advanced • 4 years</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tailwind CSS</span>
                    <span className="text-sm text-muted-foreground">Advanced • 3 years</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            }
            expandLabel="Show skill details"
            collapseLabel="Hide details"
            variant="card"
            id="skills-frontend"
          />

          {/* Backend Skills */}
          <ProgressiveDisclosure
            summary={
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-foreground">Backend Development</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Node.js</span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">Express</span>
                  <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">PostgreSQL</span>
                </div>
              </div>
            }
            details={
              <div className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Recent Projects</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Built REST API serving 10k+ daily requests</li>
                    <li>• Implemented JWT authentication system</li>
                    <li>• Optimized database queries (40% performance improvement)</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Certifications</h4>
                  <div className="text-sm text-muted-foreground">
                    AWS Certified Developer Associate (2023)
                  </div>
                </div>
              </div>
            }
            expandLabel="Show experience details"
            collapseLabel="Hide details"
            variant="card"
            id="skills-backend"
          />
        </div>
      </section>

      {/* Experience Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b border-border pb-2">
          Experience with Progressive Disclosure
        </h2>
        
        <ProgressiveDisclosure
          summary={
            <div className="border-l-4 border-primary pl-6 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Senior Frontend Developer</h3>
                  <p className="text-primary font-medium">TechCorp Inc.</p>
                </div>
                <span className="text-sm text-muted-foreground">2022 - Present</span>
              </div>
              <p className="text-muted-foreground">
                Led frontend development for enterprise SaaS platform serving 50k+ users...
              </p>
            </div>
          }
          details={
            <div className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Led frontend development for enterprise SaaS platform serving 50k+ users. 
                  Architected and implemented scalable React applications with TypeScript, 
                  resulting in 40% improvement in development velocity and 25% reduction in bugs.
                </p>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/50">
                <h4 className="font-medium text-foreground mb-3">Key Achievements</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Reduced bundle size by 35% through code splitting and optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Implemented accessibility features achieving WCAG 2.1 AA compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Mentored 3 junior developers and established code review processes</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Technologies Used</h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Jest', 'Cypress'].map(tech => (
                    <span key={tech} className="px-2 py-1 bg-secondary/20 text-secondary-foreground rounded text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          }
          expandLabel="Show full experience details"
          collapseLabel="Show less"
          variant="default"
          id="experience-1"
        />
      </section>

      {/* Project Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b border-border pb-2">
          Project with Progressive Disclosure
        </h2>
        
        <ProgressiveDisclosure
          summary={
            <div className="border border-border rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-foreground">E-commerce Platform</h3>
                <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">Featured</span>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Full-stack e-commerce platform with real-time inventory management...
              </p>
              <div className="flex gap-3">
                <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View Demo
                </a>
                <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View Code
                </a>
              </div>
            </div>
          }
          details={
            <div className="space-y-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground leading-relaxed">
                  Full-stack e-commerce platform with real-time inventory management, 
                  payment processing, and admin dashboard. Built with modern technologies 
                  and deployed on AWS with CI/CD pipeline.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Technical Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time inventory updates with WebSocket</li>
                    <li>• Stripe payment integration</li>
                    <li>• JWT authentication with refresh tokens</li>
                    <li>• Image optimization and CDN delivery</li>
                    <li>• Responsive design with mobile-first approach</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lighthouse Score:</span>
                      <span className="font-medium text-green-600">95/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Load Time:</span>
                      <span className="font-medium">&lt; 2s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Test Coverage:</span>
                      <span className="font-medium">85%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Architecture Decisions</h4>
                <p className="text-sm text-muted-foreground">
                  Chose microservices architecture with separate services for user management, 
                  inventory, and payments. Implemented event-driven communication using Redis 
                  for scalability and maintainability.
                </p>
              </div>
            </div>
          }
          expandLabel="Show technical details"
          collapseLabel="Hide technical details"
          variant="default"
          id="project-1"
        />
      </section>

      {/* Education Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground border-b border-border pb-2">
          Education with Progressive Disclosure
        </h2>
        
        <ProgressiveDisclosure
          summary={
            <div className="border border-border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Bachelor of Science in Computer Science
                  </h3>
                  <p className="text-primary font-medium">University of Technology</p>
                </div>
                <span className="text-sm text-muted-foreground">2018 - 2022</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                GPA: 3.8/4.0 • Magna Cum Laude
              </p>
            </div>
          }
          details={
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Relevant Coursework</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Data Structures & Algorithms',
                      'Software Engineering',
                      'Database Systems',
                      'Web Development',
                      'Machine Learning',
                      'Computer Networks'
                    ].map(course => (
                      <span key={course} className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                        {course}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground mb-3">Honors & Activities</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Dean's List (6 semesters)</li>
                    <li>• Computer Science Society President</li>
                    <li>• ACM Programming Contest Participant</li>
                    <li>• Undergraduate Research Assistant</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2">Senior Capstone Project</h4>
                <p className="text-sm text-muted-foreground">
                  "Distributed Task Scheduling System" - Designed and implemented a 
                  distributed system for task scheduling using microservices architecture. 
                  Achieved 99.9% uptime and handled 1000+ concurrent tasks.
                </p>
              </div>
            </div>
          }
          expandLabel="Show academic details"
          collapseLabel="Hide academic details"
          variant="default"
          id="education-details"
        />
      </section>
    </div>
  );
};

export default ProgressiveDisclosureExample;