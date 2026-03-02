import React from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { ProgressiveDisclosure } from './ProgressiveDisclosure';
import { ProjectsCarousel } from './ProjectsCarousel';
import { Briefcase, GraduationCap } from 'lucide-react';

export interface ExperienceProjectsProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  className?: string;
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

/**
 * Experience & Projects Component (Tier 3: Detailed Evaluation)
 * 
 * Displays work experience, projects, and education in a recruiter-optimized format
 * following the three-tier hierarchy design principles.
 * 
 * Features:
 * - Reverse chronological order for experience
 * - Clear date ranges and company information
 * - Featured projects with portfolio links
 * - Achievement highlighting with quantified results
 * - Education and certifications display
 */
export const ExperienceProjects: React.FC<ExperienceProjectsProps> = ({
  resume,
  templateConfig,
  className = '',
  improveSection,
  isImprovingSection,
  showImproveButtons = false,
}) => {
  return (
    <section 
      className={`experience-projects py-6 sm:py-8 ${className}`}
      aria-label="Experience and Projects"
      data-template-config={templateConfig.id}
    >
      <div className="space-y-8">
        {/* Work Experience Section */}
        {resume.experiences && resume.experiences.length > 0 && (
          <div className="experience-section">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6 border-b border-border pb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Experience Test
            </h2>
            <div className="space-y-6">
              {resume.experiences
                .sort((a, b) => {
                  // Sort by start date in reverse chronological order (most recent first)
                  const dateA = new Date(a.startDate || '1900-01-01');
                  const dateB = new Date(b.startDate || '1900-01-01');
                  return dateB.getTime() - dateA.getTime();
                })
                .map((experience, index) => (
                  <div 
                    key={index} 
                    className="experience-item border-l-2 border-primary/20 pl-6 relative hover:border-primary/40 transition-colors"
                  >
                    {/* Timeline indicator */}
                    <div className="absolute -left-2 top-0 w-4 h-4 bg-primary rounded-full border-2 border-background"></div>
                    
                    <div className="space-y-3">
                      {/* Position and Company */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {experience.position}
                          </h3>
                          <p className="text-primary font-medium">
                            {experience.company}
                          </p>
                        </div>
                        
                        {/* Date Range */}
                        <div className="text-sm text-muted-foreground font-medium">
                          {formatDateRange(experience.startDate, experience.endDate)}
                          {experience.endDate === null && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Current
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      {experience.location && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {experience.location}
                        </p>
                      )}

                      {/* Description - Summary with Progressive Disclosure */}
                      {experience.description && (
                        <ProgressiveDisclosure
                          summary={
                            <div className="prose prose-sm max-w-none">
                              <p className="text-muted-foreground leading-relaxed">
                                {experience.description.length > 150 
                                  ? `${experience.description.substring(0, 150)}...`
                                  : experience.description
                                }
                              </p>
                            </div>
                          }
                          details={
                            <div className="space-y-4">
                              {experience.description.length > 150 && (
                                <div className="prose prose-sm max-w-none">
                                  <p className="text-muted-foreground leading-relaxed">
                                    {experience.description}
                                  </p>
                                </div>
                              )}
                              
                              {/* Achievements (if available in description) */}
                              {hasQuantifiedResults(experience.description) && (
                                <div className="achievements bg-muted/30 rounded-lg p-3 border-l-4 border-primary/50">
                                  <h4 className="text-sm font-medium text-foreground mb-2">Key Achievements</h4>
                                  <div className="text-sm text-muted-foreground">
                                    {extractAchievements(experience.description).map((achievement, achIndex) => (
                                      <div key={achIndex} className="flex items-start gap-2 mb-1">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{achievement}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Technologies/Skills used */}
                              {experience.technologies && experience.technologies.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-foreground mb-2">Technologies Used</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {experience.technologies.map((tech, techIndex) => (
                                      <span
                                        key={techIndex}
                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary/20 text-secondary-foreground border border-secondary/30"
                                      >
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          }
                          expandLabel="Show full details"
                          collapseLabel="Show less"
                          variant="default"
                          id={`experience-${index}`}
                        />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Projects Section with Carousel */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="projects-section">
            <ProjectsCarousel
              projects={resume.projects}
              primaryColor={'#3b82f6'}
              accentColor={'#60a5fa'}
              fontFamily={'inherit'}
              headingWeight={'700'}
              improveSection={improveSection}
              isImprovingSection={isImprovingSection}
              showImproveButtons={showImproveButtons}
            />
            
            {/* Portfolio & Code Repositories */}
            {(resume.personalInfo.github || resume.personalInfo.website) && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-foreground mb-3">Portfolio & Code Repositories</h3>
                <div className="flex flex-wrap gap-4">
                  {resume.personalInfo.github && (
                    <a
                      href={resume.personalInfo.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      GitHub Profile
                    </a>
                  )}
                  {resume.personalInfo.website && (
                    <a
                      href={resume.personalInfo.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      Portfolio Website
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education Section */}
        {resume.education && resume.education.length > 0 && (
          <div className="education-section">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6 border-b border-border pb-2 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education
            </h2>
            <div className="space-y-4">
              {resume.education
                .sort((a, b) => {
                  // Sort by end date in reverse chronological order (most recent first)
                  const dateA = new Date(a.endDate || a.startDate || '1900-01-01');
                  const dateB = new Date(b.endDate || b.startDate || '1900-01-01');
                  return dateB.getTime() - dateA.getTime();
                })
                .map((edu, index) => (
                  <div 
                    key={index} 
                    className="education-item border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {edu.degree}
                        </h3>
                        <p className="text-primary font-medium">
                          {edu.institution}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        {formatDateRange(edu.startDate, edu.endDate)}
                      </div>
                    </div>

                    {/* Additional Education Details */}
                    <div className="space-y-2">
                      {edu.gpa && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">GPA:</span> {edu.gpa}
                        </p>
                      )}
                      {(edu as any).honors && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Honors:</span> {(edu as any).honors}
                        </p>
                      )}
                      {(edu as any).relevantCourses && (edu as any).relevantCourses.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-foreground mb-1">Relevant Coursework:</p>
                          <div className="flex flex-wrap gap-2">
                            {(edu as any).relevantCourses.map((course: string, courseIndex: number) => (
                              <span
                                key={courseIndex}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground"
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {(resume as any).certifications && (resume as any).certifications.length > 0 && (
          <div className="certifications-section">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-6 border-b border-border pb-2">
              Certifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(resume as any).certifications.map((cert: any, index: number) => (
                <div 
                  key={index} 
                  className="certification-item border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {cert.name}
                  </h3>
                  <p className="text-primary font-medium mb-2">
                    {cert.issuer}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Issued: {formatDate(cert.issueDate)}
                    </span>
                    {cert.expiryDate && (
                      <span>
                        Expires: {formatDate(cert.expiryDate)}
                      </span>
                    )}
                  </div>
                  {cert.credentialId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ID: {cert.credentialId}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Utility functions
function formatDateRange(startDate?: string, endDate?: string | null): string {
  const start = startDate ? formatDate(startDate) : '';
  const end = endDate ? formatDate(endDate) : 'Present';
  
  if (!startDate) return end;
  return `${start} - ${end}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function hasQuantifiedResults(description: string): boolean {
  // Check if description contains numbers, percentages, or quantified achievements
  const quantifiers = /(\d+%|\d+\+|\$\d+|increased|decreased|improved|reduced|grew|saved|generated)/i;
  return quantifiers.test(description);
}

function extractAchievements(description: string): string[] {
  // Simple extraction of sentences that contain quantified results
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences
    .filter(sentence => hasQuantifiedResults(sentence))
    .map(sentence => sentence.trim())
    .slice(0, 3); // Limit to top 3 achievements
}