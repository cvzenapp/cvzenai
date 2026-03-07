import React from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { ProgressiveDisclosure } from './ProgressiveDisclosure';
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure';

export interface SummarySkillsProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  className?: string;
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

/**
 * Summary & Skills component implementing Tier 2 of the three-tier hierarchy
 * Contains professional summary and core skills for qualification assessment
 * Optimized for recruiter scanning patterns
 */
export const SummarySkills: React.FC<SummarySkillsProps> = ({
  resume,
  templateConfig: _templateConfig,
  className = '',
  improveSection,
  isImprovingSection,
  showImproveButtons = false,
}) => {
  // Initialize progressive disclosure for skills sections
  useProgressiveDisclosure({
    'skills-details': false,
    'metrics-breakdown': false
  });
  // Group skills by category for better organization
  const getSkillsByCategory = (skills: Resume['skills']) => {
    if (!skills || skills.length === 0) return [];
    
    const grouped = skills.reduce((acc, skill) => {
      const category = skill.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(skill);
      return acc;
    }, {} as Record<string, Resume['skills']>);
    
    // Sort categories by priority (technical skills first)
    const categoryOrder = ['Programming', 'Frameworks', 'Tools', 'Databases', 'Cloud', 'Technical', 'Soft Skills', 'Other'];
    
    return categoryOrder
      .filter(category => grouped[category])
      .map(category => [category, grouped[category]] as [string, Resume['skills']])
      .concat(
        Object.entries(grouped).filter(([category]) => !categoryOrder.includes(category))
      );
  };

  // Calculate key metrics from resume data
  const calculateMetrics = () => {
    const totalExperience = resume.experiences?.length || 0;
    const totalProjects = resume.projects?.length || 0;
    const coreSkills = resume.skills?.filter(skill => 
      typeof skill === 'string' ? false : skill.isCore
    ).length || 0;
    
    // Calculate years of experience from work history
    const yearsOfExperience = resume.experiences?.reduce((acc, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return acc + Math.max(0, months);
    }, 0) || 0;
    
    const totalYears = Math.floor(yearsOfExperience / 12);
    
    return {
      yearsExperience: totalYears,
      projectsCompleted: totalProjects,
      coreSkillsCount: coreSkills,
      totalPositions: totalExperience
    };
  };

  const skillsByCategory = getSkillsByCategory(resume.skills);
  const metrics = calculateMetrics();

  // Bar Chart Item Component for vertical bars
  const BarChartItem: React.FC<{ skill: Resume['skills'][0] }> = ({ skill }) => (
    <div className="flex flex-col items-center gap-2 min-w-[60px]">
      {/* Vertical Bar */}
      <div className="relative w-12 h-32 bg-muted/30 rounded-t-lg flex flex-col justify-end overflow-hidden">
        <div 
          className={`w-full rounded-t-lg transition-all duration-500 ${getProficiencyColor(typeof skill === 'string' ? 70 : (skill.level || 0))}`}
          style={{ height: `${typeof skill === 'string' ? 70 : (skill.level || 0)}%` }}
          role="progressbar"
          aria-valuenow={typeof skill === 'string' ? 70 : (skill.level || 0)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${typeof skill === 'string' ? skill : skill.name} proficiency: ${typeof skill === 'string' ? 70 : (skill.level || 0)}%`}
        />
      </div>
      
      {/* Percentage Badge */}
      {(typeof skill === 'string' ? false : skill.level) && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          {typeof skill === 'string' ? 70 : skill.level}%
        </span>
      )}
      
      {/* Skill Name */}
      <div className="text-center">
        <span className="text-xs font-medium text-foreground block">
          {typeof skill === 'string' ? skill : skill.name}
        </span>
        {(typeof skill === 'string' ? false : skill.isCore) && (
          <span className="text-[10px] text-primary">Core Test</span>
        )}
      </div>
    </div>
  );

  // Get proficiency level display
  const getProficiencyLevel = (proficiency: number): string => {
    if (proficiency >= 90) return 'Expert';
    if (proficiency >= 75) return 'Advanced';
    if (proficiency >= 60) return 'Intermediate';
    if (proficiency >= 40) return 'Beginner';
    return 'Novice';
  };

  // Get proficiency color class
  const getProficiencyColor = (proficiency: number): string => {
    if (proficiency >= 90) return 'bg-green-500';
    if (proficiency >= 75) return 'bg-blue-500';
    if (proficiency >= 60) return 'bg-yellow-500';
    if (proficiency >= 40) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <section 
      className={`summary-skills-component bg-background border-b border-border ${className}`}
      role="region"
      aria-label="Professional Summary and Skills"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Professional Summary Section */}
          <div className="space-y-6">
            {/* Professional Summary */}
            {resume.summary && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                    <svg 
                      className="w-5 h-5 text-primary" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Professional Summary Test
                  </h2>
                  
                  {/* Improve Button */}
                  {showImproveButtons && improveSection && (
                    <button
                      onClick={() => improveSection('summary', resume.summary)}
                      disabled={isImprovingSection?.('summary')}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <svg className={`w-4 h-4 ${isImprovingSection?.('summary') ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      {isImprovingSection?.('summary') ? 'Improving...' : 'Improve'}
                    </button>
                  )}
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {resume.summary}
                  </p>
                </div>
              </div>
            )}

            {/* Career Objective */} Testing
            {resume.objective && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                    <svg 
                      className="w-5 h-5 text-primary" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Career Objective Test
                  </h2>
                  
                  {/* Debug info and Improve Button */}
                  <div className="flex items-center gap-2">
                    {/* Debug badge - remove after testing */}
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                      {showImproveButtons ? '✓ show' : '✗ hide'} | {improveSection ? '✓ fn' : '✗ fn'}
                    </span>
                    
                    {showImproveButtons && improveSection && (
                      <button
                        onClick={() => improveSection('objective', resume.objective)}
                        disabled={isImprovingSection?.('objective')}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <svg className={`w-4 h-4 ${isImprovingSection?.('objective') ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        {isImprovingSection?.('objective') ? 'Improving...' : 'Improve'}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {resume.objective}
                  </p>
                </div>
              </div>
            )}

            {/* Show message if neither summary nor objective exists */}
            {!resume.summary && !resume.objective && (
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg 
                    className="w-5 h-5 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Professional Summary
                </h2>
                
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground italic">
                    No professional summary or career objective provided
                  </p>
                </div>
              </div>
            )}

            {/* Key Metrics with Progressive Disclosure */}
            {(metrics.yearsExperience > 0 || metrics.projectsCompleted > 0) && (
              <ProgressiveDisclosure
                summary={
                  <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                    <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
                      Key Metrics
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {metrics.yearsExperience > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {metrics.yearsExperience}+
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Years Experience
                          </div>
                        </div>
                      )}
                      
                      {metrics.projectsCompleted > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {metrics.projectsCompleted}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Projects
                          </div>
                        </div>
                      )}
                      
                      {metrics.totalPositions > 0 && (
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {metrics.totalPositions}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">
                            Positions
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                }
                details={
                  <div className="space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                      <h4 className="text-sm font-medium text-foreground mb-3">Experience Breakdown</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Total Positions:</span>
                          <span className="font-medium">{metrics.totalPositions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Core Skills:</span>
                          <span className="font-medium">{metrics.coreSkillsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Skills Listed:</span>
                          <span className="font-medium">{resume.skills?.length || 0}</span>
                        </div>
                        {resume.experiences && resume.experiences.length > 0 && (
                          <div className="flex justify-between">
                            <span>Most Recent Role:</span>
                            <span className="font-medium">
                              {resume.experiences
                                .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0]
                                ?.position}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                }
                expandLabel="View detailed breakdown"
                collapseLabel="Hide breakdown"
                variant="default"
                id="metrics-breakdown"
              />
            )}
          </div>

          {/* Core Skills Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
                  <svg 
                    className="w-5 h-5 text-primary" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Core Skills
                </h2>
                
                {/* Improve Button for Skills */}
                {showImproveButtons && improveSection && resume.skills && resume.skills.length > 0 && (
                  <button
                    onClick={() => improveSection('skills', resume.skills)}
                    disabled={isImprovingSection?.('skills')}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <svg className={`w-4 h-4 ${isImprovingSection?.('skills') ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {isImprovingSection?.('skills') ? 'Improving...' : 'Improve'}
                  </button>
                )}
              </div>
              
              {skillsByCategory.length > 0 ? (
                <div className="space-y-8">
                  {skillsByCategory.map(([category, skills]) => {
                    // Show bar charts for Programming and Frameworks (case-insensitive)
                    const categoryLower = category.toLowerCase();
                    const isProgrammingOrFramework = categoryLower === 'programming' || categoryLower === 'frameworks' || categoryLower === 'framework';
                    
                    return (
                      <div key={category} className="space-y-4">
                        <h3 className="text-base font-semibold text-primary uppercase tracking-wide flex items-center gap-2 border-l-4 border-primary pl-3">
                          {category}
                        </h3>
                        
                        {isProgrammingOrFramework ? (
                          /* Bar Chart View for Programming and Frameworks */
                          <div className="flex flex-wrap gap-6 justify-start items-end p-4 bg-muted/20 rounded-lg border border-border/30">
                            {skills.map((skill, index) => (
                              <BarChartItem key={skill.id || index} skill={skill} />
                            ))}
                          </div>
                        ) : (
                          /* Regular list view for other categories */
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill, index) => (
                              <span
                                key={skill.id || index}
                                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                              >
                                {typeof skill === 'string' ? skill : skill.name}
                                {(typeof skill === 'string' ? false : skill.level) && (
                                  <span className="ml-2 text-xs font-bold">
                                    {typeof skill === 'string' ? 70 : skill.level}%
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <svg 
                    className="w-12 h-12 mx-auto mb-4 opacity-50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="italic">No skills listed</p>
                </div>
              )}
            </div>

            {/* Skills Summary for Quick Scanning */}
            {skillsByCategory.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
                <h3 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wide">
                  Skills Overview
                </h3>
                <div className="flex flex-wrap gap-2">
                  {resume.skills
                    ?.filter(skill => 
                      typeof skill === 'string' 
                        ? false 
                        : skill.isCore || (skill.level && skill.level >= 70)
                    )
                    .slice(0, 8) // Show top 8 skills for quick scanning
                    .map((skill, index) => (
                      <span
                        key={skill.id || index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {typeof skill === 'string' ? skill : skill.name}
                        {(typeof skill === 'string' ? false : (skill.level && skill.level >= 90)) && (
                          <svg 
                            className="w-3 h-3 ml-1 text-green-500" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SummarySkills;