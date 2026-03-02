import { useState, useEffect } from 'react';
import { X, FileText, AlertCircle } from 'lucide-react';
import { jobApplicationApi } from '../../services/jobApplicationApi';
import type { UserResume } from '@shared/jobApplication';

interface JobApplicationModalProps {
  jobId: string;
  jobTitle: string;
  company: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function JobApplicationModal({ 
  jobId, 
  jobTitle, 
  company, 
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
    setStep('cover-letter');
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
            <div className={`flex items-center gap-2 ${step === 'cover-letter' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'cover-letter' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                2
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

          {step === 'cover-letter' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cover Letter (Optional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add a personalized message to strengthen your application
              </p>

              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Dear Hiring Manager,&#10;&#10;I am excited to apply for this position because..."
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={2000}
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
            onClick={step === 'select-resume' ? onClose : () => setStep('select-resume')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
            disabled={loading}
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
