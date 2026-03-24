import { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, Sparkles, Loader2, Eye, TrendingUp } from 'lucide-react';
import { jobApplicationApi } from '../../services/jobApplicationApi';
import { coverLetterApi } from '../../services/coverLetterApi';
import { resumeOptimizationApi } from '../../services/resumeOptimizationApi';
import { jobMatchingApi } from '../../services/jobMatchingApi';
import { CVZenLogo } from '../CVZenLogo';
import zenAiPilotIcon from '../../assets/zenaipilot.png';
import type { UserResume } from '@shared/jobApplication';

interface JobApplicationModalProps {
  jobId: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  matchScore?: number;
  matchReasons?: string[];
  missingSkills?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function JobApplicationModal({ 
  jobId, 
  jobTitle, 
  company,
  jobDescription,
  matchScore: initialMatchScore,
  matchReasons: initialMatchReasons,
  missingSkills: initialMissingSkills,
  onClose, 
  onSuccess 
}: JobApplicationModalProps) {
  const [step, setStep] = useState<'select-resume' | 'cover-letter'>('select-resume');
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [optimizingResume, setOptimizingResume] = useState(false);
  const [originalScore, setOriginalScore] = useState<number | null>(initialMatchScore || null);
  const [optimizedScore, setOptimizedScore] = useState<number | null>(null);
  const [matchReasons, setMatchReasons] = useState<string[]>(initialMatchReasons || []);
  const [missingSkills, setMissingSkills] = useState<string[]>(initialMissingSkills || []);
  const [resumeOptimized, setResumeOptimized] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      console.log('Loading resumes...');
      const response = await jobApplicationApi.getUserResumes();
      console.log('Resume response:', response);
      
      if (response.success && response.data) {
        console.log('Resumes loaded:', response.data.length);
        setResumes(response.data);
        if (response.data.length === 1) {
          setSelectedResumeId(response.data[0].id);
        }
      } else {
        console.log('No resumes in response or unsuccessful');
      }
    } catch (error) {
      console.error('Failed to load resumes:', error);
      setError('Failed to load your resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleNext = () => {
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }
    setError('');
    if (step === 'select-resume') {
      setStep('cover-letter');
    }
  };

  const calculateOriginalScore = async () => {
    if (!jobId) return;
    
    try {
      const response = await jobMatchingApi.calculateMatchScore({
        jobId: jobId
      });
      
      if (response.success) {
        setOriginalScore(response.data.score);
        setMatchReasons(response.data.reasons || []);
        setMissingSkills(response.data.missing || []);
      }
    } catch (error) {
      console.error('Failed to calculate original score:', error);
    }
  };

  const optimizeResume = async () => {
    if (!selectedResumeId || !jobDescription) {
      setError('Resume and job description are required for optimization');
      return;
    }

    setOptimizingResume(true);
    setError('');

    try {
      // Use streaming API for real-time progress
      const { resumeOptimizationStreamService } = await import('../../services/resumeOptimizationStreamApi');
      
      await resumeOptimizationStreamService.optimizeResumeWithProgress(
        selectedResumeId.toString(),
        jobTitle,
        jobDescription,
        company,
        (update) => {
          // Handle progress updates
          console.log('Optimization progress:', update);
        },
        (result) => {
          // Handle completion
          console.log('✅ Resume optimization completed:', result);
          setResumeOptimized(true);
          
          // Calculate new score after optimization
          jobMatchingApi.calculateMatchScore({
            jobId: jobId
          }).then(newScoreResponse => {
            console.log('✅ New score response:', newScoreResponse);
            if (newScoreResponse.success) {
              console.log('✅ Setting optimized score to:', newScoreResponse.data.score);
              setOptimizedScore(newScoreResponse.data.score);
            }
          }).catch(error => {
            console.error('Failed to calculate new score:', error);
          });
        },
        (error) => {
          // Handle error
          console.error('❌ Resume optimization failed:', error);
          setError(error || 'Failed to optimize resume');
        }
      );
    } catch (error: any) {
      console.error('Resume optimization error:', error);
      setError(error.message || 'Failed to optimize resume');
    } finally {
      setOptimizingResume(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedResumeId) {
      setError('Please select a resume');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await jobApplicationApi.submitApplication({
        jobId: parseInt(jobId),
        resumeId: selectedResumeId,
        coverLetter: coverLetter.trim() || undefined
      });

      if (response.success) {
        onSuccess();
      } else {
        setError(typeof response.error === 'string' ? response.error : 'Failed to submit application');
      }
    } catch (error: any) {
      console.error('Application submission error:', error);
      setError(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const generateAICoverLetter = async () => {
    if (!selectedResumeId || !jobDescription) {
      setError('Resume and job description are required for AI generation');
      return;
    }

    setGeneratingCoverLetter(true);
    setError('');

    try {
      const response = await coverLetterApi.generateCoverLetter({
        jobId,
        resumeId: selectedResumeId.toString(),
        jobDescription,
        jobTitle,
        companyName: company
      });

      console.log('Cover letter API response:', response);

      setCoverLetter(response.data?.coverLetter || 'Unable to generate cover letter');
    } catch (error: any) {
      console.error('Cover letter generation error:', error);
      setError(error.message || 'Failed to generate cover letter');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'text-green-200', fg: 'text-green-600', bgClass: 'bg-green-50', borderClass: 'border-green-200' };
    if (score >= 60) return { bg: 'text-orange-200', fg: 'text-orange-600', bgClass: 'bg-orange-50', borderClass: 'border-orange-200' };
    return { bg: 'text-red-200', fg: 'text-red-600', bgClass: 'bg-red-50', borderClass: 'border-red-200' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-brand-background text-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CVZenLogo className="h-8 w-auto" showCaption={false} />
            <div>
              <h2 className="text-xl font-bold">Apply for {jobTitle}</h2>
              <p className="text-sm text-brand-auxiliary-1">{company}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-brand-auxiliary-1 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'select-resume' ? 'text-brand-main' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'select-resume' ? 'bg-brand-main/10 text-brand-main' : 'bg-green-100 text-green-600'
              }`}>
                1
              </div>
              <span className="font-medium">Select Resume</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'cover-letter' ? 'text-brand-main' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'cover-letter' ? 'bg-brand-main/10 text-brand-main' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="font-medium">Cover Letter</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 'select-resume' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose a resume to submit
              </h3>

              {loadingResumes ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading your resumes...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Resumes Found</h4>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    You need to create a resume before applying to jobs. Build your professional resume in minutes!
                  </p>
                  <button
                    onClick={() => window.location.href = '/builder'}
                    className="h-10 px-6 bg-brand-main text-white rounded-lg hover:bg-brand-background font-medium transition-colors"
                  >
                    Create Your First Resume
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <button
                      key={resume.id}
                      onClick={() => setSelectedResumeId(resume.id)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${
                        selectedResumeId === resume.id
                          ? 'border-brand-main bg-brand-main/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          selectedResumeId === resume.id ? 'text-brand-main' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{resume.title}</h4>
                          <p className="text-sm text-gray-600">
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedResumeId === resume.id && (
                          <div className="w-5 h-5 bg-brand-main rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'cover-letter' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Cover Letter (Optional)
                </h3>
                {jobDescription && (
                  <button
                    onClick={generateAICoverLetter}
                    disabled={generatingCoverLetter || !selectedResumeId}
                    className="flex items-center gap-2 h-8 px-3 bg-gradient-to-r from-brand-main to-brand-background text-white text-sm rounded-lg hover:from-brand-background hover:to-brand-main disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {generatingCoverLetter ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generatingCoverLetter ? 'Generating...' : 'Write with AI'}
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Add a personalized message to strengthen your application
                {jobDescription && ' or let AI write one for you based on your resume and the job description'}
              </p>

              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Dear Hiring Manager,&#10;&#10;I am excited to apply for this position because..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={2000}
                disabled={generatingCoverLetter}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {coverLetter.length} / 2000 characters
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={() => {
              if (step === 'select-resume') {
                onClose();
              } else {
                setStep('select-resume');
              }
            }}
            className="h-10 px-4 text-gray-700 hover:text-gray-900 transition-colors"
            disabled={loading || optimizingResume}
          >
            {step === 'select-resume' ? 'Cancel' : 'Back'}
          </button>

          {step === 'select-resume' ? (
            <button
              onClick={handleNext}
              disabled={!selectedResumeId || loadingResumes}
              className="h-10 px-6 bg-brand-main text-white rounded-lg hover:bg-brand-background disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedResumeId}
              className="h-10 px-6 bg-brand-main text-white rounded-lg hover:bg-brand-background disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
