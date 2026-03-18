import { useState, useEffect } from 'react';
import { X, Zap, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { jobApplicationApi } from '../../services/jobApplicationApi';

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
    skills: { isOptimizing: false, isOptimized: false },
    experience: { isOptimizing: false, isOptimized: false },
    education: { isOptimizing: false, isOptimized: false },
    projects: { isOptimizing: false, isOptimized: false }
  });

  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadResume();
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
        return <p className="whitespace-pre-wrap">{content}</p>;
      
      case 'skills':
        return Array.isArray(content) ? (
          <div className="flex flex-wrap gap-2">
            {content.map((skill, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                {typeof skill === 'string' ? skill : skill.name || JSON.stringify(skill)}
              </span>
            ))}
          </div>
        ) : <p className="text-gray-500 italic">No skills listed</p>;
      
      case 'experience':
        if (!Array.isArray(content)) {
          return <p className="text-gray-500 italic">No experience listed</p>;
        }
        return content.length > 0 ? (
          <div className="space-y-3">
            {content.map((exp, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-3">
                <h4 className="font-medium">{exp.position || exp.title || exp.jobTitle || 'Position'}</h4>
                <p className="text-sm text-gray-600">
                  {exp.company || exp.companyName || 'Company'} • {exp.duration || exp.period || `${exp.startDate || exp.start} - ${exp.endDate || exp.end || 'Present'}`}
                </p>
                {(exp.description || exp.responsibilities) && (
                  <p className="text-sm mt-1">{exp.description || exp.responsibilities}</p>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 italic">No experience listed</p>;
      
      case 'education':
        return Array.isArray(content) ? (
          <div className="space-y-2">
            {content.map((edu, index) => (
              <div key={index}>
                <h4 className="font-medium">{edu.degree || edu.qualification}</h4>
                <p className="text-sm text-gray-600">{edu.institution} • {edu.year || edu.duration}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 italic">No education listed</p>;
      
      case 'projects':
        return Array.isArray(content) ? (
          <div className="space-y-3">
            {content.map((project, index) => (
              <div key={index}>
                <h4 className="font-medium">{project.name || project.title}</h4>
                {project.description && <p className="text-sm text-gray-600 mt-1">{project.description}</p>}
                {project.technologies && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.map((tech: string, techIndex: number) => (
                      <span key={techIndex} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-gray-500 italic">No projects listed</p>;
      
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
              
              {/* Skills */}
              {renderSection('Skills', resume.skills, 'skills')}
              
              {/* Experience */}
              {renderSection('Work Experience', resume.experiences || [], 'experience')}
              
              {/* Education */}
              {renderSection('Education', resume.education, 'education')}
              
              {/* Projects */}
              {resume.projects && resume.projects.length > 0 && renderSection('Projects', resume.projects, 'projects')}
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