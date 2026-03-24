import { useState, useEffect } from 'react';
import { X, Zap, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { jobApplicationApi } from '../../services/jobApplicationApi';
import zenAiPilotIcon from '../../assets/zenaipilot.png';

interface ResumeOptimizationModalProps {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  company: string;
  onClose: () => void;
}

interface ResumeData {
  id: number;
  title: string;
  personalInfo: any;
  summary: string;
  objective: string;
  skills: any[];
  experiences: any[];
  education: any[];
  projects: any[];
  certifications: any[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  templateId?: string;
  shareToken?: string;
  atsScore?: any;
}

interface SectionOptimization {
  isOptimizing: boolean;
  isOptimized: boolean;
  error?: string;
}

export function ResumeOptimizationModal({ 
  jobId, 
  jobTitle, 
  jobDescription, 
  company, 
  onClose 
}: ResumeOptimizationModalProps) {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [sectionStates, setSectionStates] = useState<Record<string, SectionOptimization>>({
    summary: { isOptimizing: false, isOptimized: false },
    experience: { isOptimizing: false, isOptimized: false },
    projects: { isOptimizing: false, isOptimized: false }
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

  // Add CVZen AI Pilot icon animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .cvzen-optimizing-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        backdrop-filter: blur(1px);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const loadResume = async () => {
    try {
      const resumesResponse = await jobApplicationApi.getUserResumes();
      if (!resumesResponse.success || !resumesResponse.data || resumesResponse.data.length === 0) {
        throw new Error('No resumes found. Please create a resume first.');
      }
      
      const resumeData = resumesResponse.data[0] as ResumeData;
      console.log('Loaded resume data:', resumeData);
      setResume(resumeData);
    } catch (error: any) {
      setError(error.message || 'Failed to load resume');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCV = () => {
    if (resume) {
      // Open resume viewer in a new tab
      const resumeUrl = `/resume/${resume.id}`;
      window.open(resumeUrl, '_blank');
    }
  };

  const optimizeSection = async (sectionName: string) => {
    if (!resume) return;

    // Check if the section is already optimized in the actual data
    if (sectionName.startsWith('experience-')) {
      const experienceIndex = parseInt(sectionName.split('-')[1]);
      const experience = resume.experiences?.[experienceIndex];
      if (experience?.is_optimized) {
        console.log(`ℹ️ Experience ${experienceIndex} is already optimized`);
        return;
      }
    } else if (sectionName.startsWith('projects-')) {
      const projectIndex = parseInt(sectionName.split('-')[1]);
      const project = resume.projects?.[projectIndex];
      if (project?.is_optimized) {
        console.log(`ℹ️ Project ${projectIndex} is already optimized`);
        return;
      }
    }

    setSectionStates(prev => ({
      ...prev,
      [sectionName]: { isOptimizing: true, isOptimized: false }
    }));

    try {
      // Use the existing resumeOptimizationApi service for authentication
      const { resumeOptimizationApi } = await import('../../services/resumeOptimizationApi');
      
      // Call the optimization API with specific section using streaming
      await resumeOptimizationApi.optimizeResumeStream(
        resume.id.toString(),
        jobTitle,
        jobDescription,
        [],
        company,
        sectionName, // Pass section name for targeted optimization
        (update) => {
          console.log(`${sectionName} optimization update:`, update);
        },
        (result) => {
          console.log(`✅ ${sectionName} optimization completed:`, result);
          setSectionStates(prev => ({
            ...prev,
            [sectionName]: { isOptimizing: false, isOptimized: true }
          }));
          // Reload resume to show updated content
          loadResume();
        },
        (error) => {
          console.error(`❌ ${sectionName} optimization failed:`, error);
          setSectionStates(prev => ({
            ...prev,
            [sectionName]: { isOptimizing: false, isOptimized: false, error: error.message }
          }));
        }
      );

    } catch (error: any) {
      console.error(`❌ ${sectionName} optimization failed:`, error);
      setSectionStates(prev => ({
        ...prev,
        [sectionName]: { isOptimizing: false, isOptimized: false, error: error.message }
      }));
    }
  };

  const renderSection = (title: string, content: any, sectionKey: string) => {
    const state = sectionStates[sectionKey] || { isOptimizing: false, isOptimized: false };
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => optimizeSection(sectionKey)}
            disabled={state.isOptimizing}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {state.isOptimizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Optimizing...
              </>
            ) : state.isOptimized ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Optimized
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Optimize
              </>
            )}
          </button>
        </div>
        
        {state.error && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">
            <AlertCircle className="w-4 h-4" />
            {state.error}
          </div>
        )}
        
        <div className="text-gray-700">
          {renderSectionContent(content, sectionKey)}
        </div>
      </div>
    );
  };

  const renderSectionContent = (content: any, sectionKey: string) => {
    console.log(`Rendering ${sectionKey}:`, content);
    
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return <p className="text-gray-500 italic">No content available</p>;
    }

    switch (sectionKey) {
      case 'summary':
      case 'objective':
        // Handle JSONB format: {content: "text", content_optimized: null, is_optimized: false}
        if (typeof content === 'object' && content.content) {
          const displayContent = content.is_optimized && content.content_optimized 
            ? content.content_optimized 
            : content.content;
          return (
            <div>
              <p className="whitespace-pre-wrap">{displayContent}</p>
              {content.is_optimized && (
                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Optimized content
                </div>
              )}
            </div>
          );
        }
        return <p className="whitespace-pre-wrap">{content}</p>;
      
      case 'experience':
        if (!Array.isArray(content)) {
          return <p className="text-gray-500 italic">No experience listed</p>;
        }
        return content.length > 0 ? (
          <div className="space-y-4">
            {content.map((exp, index) => {
              const expState = sectionStates[`experience-${index}`] || { isOptimizing: false, isOptimized: false };
              const isActuallyOptimized = exp.is_optimized || expState.isOptimized;
              
              return (
                <div key={index} className={`border border-gray-100 rounded-lg p-3 bg-gray-50 relative ${expState.isOptimizing ? 'overflow-hidden' : ''}`}>
                  {/* CVZen AI Pilot icon overlay when optimizing */}
                  {expState.isOptimizing && (
                    <div className="cvzen-optimizing-overlay">
                      <div className="relative p-0.5 shadow-lg shadow-blue-500/50 premium-border-animation overflow-visible">
                        <img 
                          src={zenAiPilotIcon} 
                          alt="AI Assistant" 
                          className="w-12 h-12 drop-shadow-lg relative z-10 brightness-110"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{exp.title || exp.position}</h4>
                      <p className="text-sm text-gray-600">{exp.company} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                      {exp.location && <p className="text-sm text-gray-500">{exp.location}</p>}
                    </div>
                    <button
                      onClick={() => optimizeSection(`experience-${index}`)}
                      disabled={expState.isOptimizing || isActuallyOptimized}
                      className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded text-xs hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-2"
                    >
                      {expState.isOptimizing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Optimizing...
                        </>
                      ) : isActuallyOptimized ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Optimized
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          Optimize
                        </>
                      )}
                    </button>
                  </div>
                  
                  {expState.error && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 text-red-700 rounded text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {expState.error}
                    </div>
                  )}
                  
                  <div className={`text-sm text-gray-700 ${expState.isOptimizing ? 'relative opacity-70' : ''}`}>
                    {/* Description */}
                    {exp.description && (
                      <div className="mb-2">
                        <p className="font-medium text-xs text-gray-500 mb-1">Description:</p>
                        <p className={`whitespace-pre-wrap ${expState.isOptimizing ? 'opacity-70' : ''}`}>
                          {exp.is_optimized && exp.description_optimized ? exp.description_optimized : exp.description}
                        </p>
                        {exp.is_optimized && exp.description_optimized && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Optimized description
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Responsibilities */}
                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                      <div className="mb-2">
                        <p className="font-medium text-xs text-gray-500 mb-1">Responsibilities:</p>
                        <ul className={`list-disc list-inside space-y-1 ${expState.isOptimizing ? 'opacity-50' : ''}`}>
                          {(exp.is_optimized && exp.responsibilities_optimized ? exp.responsibilities_optimized : exp.responsibilities).map((resp: string, idx: number) => (
                            <li key={idx} className="text-sm">{resp}</li>
                          ))}
                        </ul>
                        {exp.is_optimized && exp.responsibilities_optimized && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Optimized responsibilities
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Achievements */}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div className="mb-2">
                        <p className="font-medium text-xs text-gray-500 mb-1">Achievements:</p>
                        <ul className={`list-disc list-inside space-y-1 ${expState.isOptimizing ? 'opacity-50' : ''}`}>
                          {(exp.is_optimized && exp.achievements_optimized ? exp.achievements_optimized : exp.achievements).map((achievement: string, idx: number) => (
                            <li key={idx} className="text-sm">{achievement}</li>
                          ))}
                        </ul>
                        {exp.is_optimized && exp.achievements_optimized && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Optimized achievements
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Skills */}
                    {exp.skills && exp.skills.length > 0 && (
                      <div>
                        <p className="font-medium text-xs text-gray-500 mb-1">Skills:</p>
                        <div className={`flex flex-wrap gap-1 ${expState.isOptimizing ? 'opacity-50' : ''}`}>
                          {exp.skills.map((skill: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No experience listed</p>
        );

      case 'projects':
        if (!Array.isArray(content)) {
          return <p className="text-gray-500 italic">No projects listed</p>;
        }
        return content.length > 0 ? (
          <div className="space-y-4">
            {content.map((project, index) => {
              const projectState = sectionStates[`projects-${index}`] || { isOptimizing: false, isOptimized: false };
              const isActuallyOptimized = project.is_optimized || projectState.isOptimized;
              
              return (
                <div key={index} className={`border border-gray-100 rounded-lg p-3 bg-gray-50 relative ${projectState.isOptimizing ? 'overflow-hidden' : ''}`}>
                  {/* CVZen AI Pilot icon overlay when optimizing */}
                  {projectState.isOptimizing && (
                    <div className="cvzen-optimizing-overlay">
                      <div className="relative p-0.5 shadow-lg shadow-blue-500/50 premium-border-animation overflow-visible">
                        <img 
                          src={zenAiPilotIcon} 
                          alt="AI Assistant" 
                          className="w-12 h-12 drop-shadow-lg relative z-10 brightness-110"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.name || project.title}</h4>
                      {project.url && (
                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          View Project
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => optimizeSection(`projects-${index}`)}
                      disabled={projectState.isOptimizing || isActuallyOptimized}
                      className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded text-xs hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all ml-2"
                    >
                      {projectState.isOptimizing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Optimizing...
                        </>
                      ) : isActuallyOptimized ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Optimized
                        </>
                      ) : (
                        <>
                          <Zap className="w-3 h-3" />
                          Optimize
                        </>
                      )}
                    </button>
                  </div>
                  
                  {projectState.error && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 text-red-700 rounded text-xs">
                      <AlertCircle className="w-3 h-3" />
                      {projectState.error}
                    </div>
                  )}
                  
                  <div className={`text-sm text-gray-700 ${projectState.isOptimizing ? 'relative opacity-70' : ''}`}>
                    {/* Description */}
                    {project.description && (
                      <div className="mb-2">
                        <p className="font-medium text-xs text-gray-500 mb-1">Description:</p>
                        <p className={`whitespace-pre-wrap ${projectState.isOptimizing ? 'opacity-50' : ''}`}>
                          {project.is_optimized && project.description_optimized ? project.description_optimized : project.description}
                        </p>
                        {project.is_optimized && project.description_optimized && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Optimized description
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Technologies */}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className={`mb-2 ${projectState.isOptimizing ? 'opacity-50' : ''}`}>
                        <p className="font-medium text-xs text-gray-500 mb-1">Technologies:</p>
                        <div className="flex flex-wrap gap-1">
                          {project.technologies.map((tech: string, techIndex: number) => (
                            <span key={techIndex} className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Achievements */}
                    {project.achievements && project.achievements.length > 0 && (
                      <div className={`mb-2 ${projectState.isOptimizing ? 'opacity-50' : ''}`}>
                        <p className="font-medium text-xs text-gray-500 mb-1">Achievements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {(project.is_optimized && project.achievements_optimized ? project.achievements_optimized : project.achievements).map((achievement: string, idx: number) => (
                            <li key={idx} className="text-sm">{achievement}</li>
                          ))}
                        </ul>
                        {project.is_optimized && project.achievements_optimized && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Optimized achievements
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Features */}
                    {project.features && project.features.length > 0 && (
                      <div className={`mb-2 ${projectState.isOptimizing ? 'opacity-50' : ''}`}>
                        <p className="font-medium text-xs text-gray-500 mb-1">Key Features:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {(project.is_optimized && project.features_optimized ? project.features_optimized : project.features).map((feature: string, idx: number) => (
                            <li key={idx} className="text-sm">{feature}</li>
                          ))}
                        </ul>
                        {project.is_optimized && project.features_optimized && (
                          <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Optimized features
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Achievements (if different from features) */}
                    {project.achievements && project.achievements.length > 0 && (
                      <div>
                        <p className="font-medium text-xs text-gray-500 mb-1">Achievements:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {project.achievements.map((achievement: string, idx: number) => (
                            <li key={idx} className="text-sm">{achievement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">No projects listed</p>
        );
      
      default:
        return <p>{JSON.stringify(content)}</p>;
    }
  };

  if (loading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-center mt-2">Loading resume...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !resume) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Resume</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Optimize Resume</h2>
              <p className="text-gray-600 mt-1">Optimize your resume for: <span className="font-medium">{jobTitle}</span> at {company}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Personal Info */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <div className="text-gray-700">
                  <h4 className="font-medium text-xl">{resume.personalInfo?.fullName}</h4>
                  <p className="text-gray-600">{resume.personalInfo?.email} • {resume.personalInfo?.phone}</p>
                  {resume.personalInfo?.location && <p className="text-gray-600">{resume.personalInfo.location}</p>}
                </div>
              </div>

              {/* Summary */}
              {resume.summary && renderSection('Professional Summary', resume.summary, 'summary')}
              
              {/* Objective */}
              {resume.objective && renderSection('Career Objective', resume.objective, 'objective')}
              
              {/* Experience - Custom rendering without section-level optimize button */}
              {resume.experiences && resume.experiences.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Experience</h3>
                  <div className="text-gray-700">
                    {renderSectionContent(resume.experiences, 'experience')}
                  </div>
                </div>
              )}
              
              {/* Projects - Custom rendering without section-level optimize button */}
              {resume.projects && resume.projects.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Projects</h3>
                  <div className="text-gray-700">
                    {renderSectionContent(resume.projects, 'projects')}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between gap-3">
              <button
                onClick={handlePreviewCV}
                className="flex items-center gap-2 px-4 py-2 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview CV
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}