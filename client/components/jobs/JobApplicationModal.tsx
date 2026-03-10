import { useState, useEffect } from 'react';
import { X, FileText, AlertCircle, Sparkles, Loader2, Zap, Eye, TrendingUp } from 'lucide-react';
import { jobApplicationApi } from '../../services/jobApplicationApi';
import { coverLetterApi } from '../../services/coverLetterApi';
import { resumeOptimizationApi } from '../../services/resumeOptimizationApi';
import { jobMatchingApi } from '../../services/jobMatchingApi';
import type { UserResume } from '@shared/jobApplication';

interface JobApplicationModalProps {
  jobId: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function JobApplicationModal({ 
  jobId, 
  jobTitle, 
  company,
  jobDescription,
  onClose, 
  onSuccess 
}: JobApplicationModalProps) {
  const [step, setStep] = useState<'select-resume' | 'optimize-resume' | 'cover-letter'>('select-resume');
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [optimizingResume, setOptimizingResume] = useState(false);
  const [originalScore, setOriginalScore] = useState<number | null>(null);
  const [optimizedScore, setOptimizedScore] = useState<number | null>(null);
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
      setStep('optimize-resume');
      calculateOriginalScore();
    } else if (step === 'optimize-resume') {
      setStep('cover-letter');
    }
  };

  const calculateOriginalScore = async () => {
    if (!jobDescription) return;
    
    try {
      const response = await jobMatchingApi.calculateMatchScore({
        jobId,
        jobDescription,
        jobTitle,
        jobRequirements: []
      });
      
      if (response.success) {
        setOriginalScore(response.data.score);
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
      const response = await resumeOptimizationApi.optimizeResume({
        resumeId: selectedResumeId.toString(),
        jobTitle,
        jobDescription,
        jobRequirements: [],
        companyName: company
      });

      console.log('✅ Resume optimization response:', response);

      if (response.success) {
        console.log('✅ Setting resumeOptimized to true');
        setResumeOptimized(true);
        
        // Calculate new score after optimization
        const newScoreResponse = await jobMatchingApi.calculateMatchScore({
          jobId,
          jobDescription,
          jobTitle,
          jobRequirements: []
        });
        
        console.log('✅ New score response:', newScoreResponse);
        
        if (newScoreResponse.success) {
          console.log('✅ Setting optimized score to:', newScoreResponse.data.score);
          setOptimizedScore(newScoreResponse.data.score);
        }
      } else {
        console.error('❌ Resume optimization failed:', response);
        setError('Failed to optimize resume');
      }
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
        setError(response.error || 'Failed to submit application');
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Apply for {jobTitle}</h2>
            <p className="text-sm text-gray-600">{company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'select-resume' ? 'text-blue-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'select-resume' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                1
              </div>
              <span className="font-medium">Select Resume</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'optimize-resume' ? 'text-blue-600' : step === 'cover-letter' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'optimize-resume' ? 'bg-blue-100' : step === 'cover-letter' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="font-medium">AI Optimize</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200"></div>
            <div className={`flex items-center gap-2 ${step === 'cover-letter' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'cover-letter' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                3
              </div>
              <span className="font-medium">Cover Letter</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
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
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
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
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          selectedResumeId === resume.id ? 'text-blue-600' : 'text-gray-400'
                        }`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{resume.title}</h4>
                          <p className="text-sm text-gray-600">
                            Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedResumeId === resume.id && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
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

          {step === 'optimize-resume' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                AI Resume Optimization
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Optimize your resume with AI to maximize your ATS score and match rate for this specific job
              </p>

              {!resumeOptimized ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <Zap className="w-10 h-10 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Ready to Optimize</h4>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Our AI will enhance your resume by optimizing keywords, improving descriptions, and tailoring content to match this job posting.
                  </p>
                  {originalScore && (
                    <div className="mb-6">
                      <div className="text-sm text-gray-600 mb-2">Current ATS Score</div>
                      <div className="text-3xl font-bold text-gray-900">{originalScore}%</div>
                    </div>
                  )}
                  <button
                    onClick={optimizeResume}
                    disabled={optimizingResume}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mx-auto"
                  >
                    {optimizingResume ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    {optimizingResume ? 'Optimizing...' : 'AI Optimize Resume'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score Comparison */}
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border border-green-100">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      ATS Score Improvement
                    </h4>
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Previous</div>
                        <div className="text-2xl font-bold text-gray-700">{originalScore}%</div>
                      </div>
                      <div className="text-2xl text-gray-400">→</div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Current</div>
                        <div className="text-2xl font-bold text-green-600">{optimizedScore}%</div>
                      </div>
                      {((optimizedScore || 0) - (originalScore || 0)) > 0 && (
                        <div className="text-center">
                          <div className="text-sm text-green-600 mb-1">Improvement</div>
                          <div className="text-xl font-bold text-green-600">
                            +{(optimizedScore || 0) - (originalScore || 0)}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Improvement Suggestions for Good Scores */}
                  {((optimizedScore || 0) - (originalScore || 0)) <= 0 && (optimizedScore || 0) >= 70 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h5 className="font-medium text-blue-900 mb-1">Your resume looks good!</h5>
                          <p className="text-sm text-blue-700 mb-2">
                            To improve your score further, consider adding:
                          </p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>• More relevant skills that match the job requirements</li>
                            <li>• Additional projects that showcase your expertise</li>
                            <li>• Professional certifications related to this role</li>
                            <li>• Quantifiable achievements with specific metrics</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resume Preview Button */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        if (selectedResumeId) {
                          // Open resume in new tab
                          window.open(`/resume/${selectedResumeId}`, '_blank');
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </button>
                  </div>

                  {/* Success message - only show when score actually improved */}
                  {((optimizedScore || 0) - (originalScore || 0)) > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <div>
                          <h5 className="font-medium text-green-900 mb-1">Resume Optimized Successfully!</h5>
                          <p className="text-sm text-green-700">
                            Your resume has been enhanced with relevant keywords and improved descriptions to better match this job posting.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <button
            onClick={() => {
              if (step === 'select-resume') {
                onClose();
              } else if (step === 'optimize-resume') {
                setStep('select-resume');
              } else {
                setStep('optimize-resume');
              }
            }}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={loading || optimizingResume}
          >
            {step === 'select-resume' ? 'Cancel' : 'Back'}
          </button>

          {step === 'select-resume' ? (
            <button
              onClick={handleNext}
              disabled={!selectedResumeId || loadingResumes}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : step === 'optimize-resume' ? (
            <button
              onClick={handleNext}
              disabled={!resumeOptimized}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue to Cover Letter
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedResumeId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
