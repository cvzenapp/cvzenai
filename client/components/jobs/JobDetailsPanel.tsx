import { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Briefcase, Clock, Building, ChevronRight, Loader2 } from 'lucide-react';
import { JobApplicationModal } from './JobApplicationModal';
import { ResumeOptimizationModal } from './ResumeOptimizationModal';
import { jobApplicationApi } from '../../services/jobApplicationApi';
import { jobMatchingApi } from '../../services/jobMatchingApi';
import { formatJobContent } from '../../lib/jobContentFormatter';

interface JobDetailsPanelProps {
  jobId: string;
  onClose: () => void;
}

export function JobDetailsPanel({ jobId, onClose }: JobDetailsPanelProps) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchReasons, setMatchReasons] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [loadingMatchScore, setLoadingMatchScore] = useState(false);
  const [optimizingResume, setOptimizingResume] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    if (job) {
      checkApplicationStatus();
      calculateMatchScore();
    }
  }, [job]);

  const fetchJobDetails = async () => {
    try {
      const response = await jobApplicationApi.get(`/jobs/${jobId}`);
      if (response.success && response.data) {
        setJob(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch job details');
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await jobApplicationApi.checkApplicationStatus(jobId);
      if (response.success) {
        setHasApplied(response.data.hasApplied);
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
      setHasApplied(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const calculateMatchScore = async () => {
    if (!jobId) {
      console.error('jobId is undefined in calculateMatchScore');
      return;
    }
    
    setLoadingMatchScore(true);
    try {
      const response = await jobMatchingApi.calculateMatchScore({
        jobId: jobId
      });
      
      if (response.success) {
        setMatchScore(response.data.score);
        setMatchReasons(response.data.reasons || []);
        setMissingSkills(response.data.missing || []);
      } else {
        console.error('Failed to get match score from API');
        return;
      }
    } catch (error) {
      console.error('Failed to calculate match score:', error);
      return;
    } finally {
      setLoadingMatchScore(false);
    }
  };

  const optimizeResume = async () => {
    setShowOptimizationModal(true);
  };

  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'text-green-200', fg: 'text-green-600' };
    if (score >= 60) return { bg: 'text-orange-200', fg: 'text-orange-600' };
    return { bg: 'text-red-200', fg: 'text-red-600' };
  };

  const scoreColors = getScoreColor(matchScore || 0);

  if (loading) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1891db] animate-spin" />
        </div>
      </>
    );
  }

  if (!job || error) {
    return (
      <>
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
        <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">{error || 'Job not found'}</p>
            <button onClick={onClose} className="mt-2 text-[#1891db] hover:underline">
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">{job.title}</h2>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  {job.company}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-slate-700 shadow-sm">
              <Briefcase className="w-4 h-4" />
              {job.type}
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-slate-700 shadow-sm">
              <Clock className="w-4 h-4" />
              {job.experienceLevel}
            </div>
            {job.salaryRange && (job.salaryRange.min > 0 || job.salaryRange.max > 0) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-sm font-medium text-slate-700 shadow-sm">
                <DollarSign className="w-4 h-4" />
                {job.salaryRange.min > 0 && job.salaryRange.max > 0
                  ? `${job.salaryRange.currency} ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}`
                  : job.salaryRange.min > 0
                  ? `From ${job.salaryRange.currency} ${job.salaryRange.min.toLocaleString()}`
                  : `Up to ${job.salaryRange.currency} ${job.salaryRange.max.toLocaleString()}`
                }
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Match Score */}
          {(matchScore !== null || loadingMatchScore) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {loadingMatchScore ? (
                    <div className="w-20 h-20 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-brand-main animate-spin" />
                    </div>
                  ) : (
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 transform -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className={scoreColors.bg}
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 36}`}
                          strokeDashoffset={`${2 * Math.PI * 36 * (1 - (matchScore || 0) / 100)}`}
                          className={`${scoreColors.fg} transition-all duration-1000`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-2xl font-bold ${scoreColors.fg}`}>{matchScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-brand-background mb-2">
                    {loadingMatchScore ? 'Calculating Match...' : 'Your ATS Match'}
                  </h3>
                  {!loadingMatchScore && matchReasons && matchReasons.length > 0 && (
                    <ul className="space-y-1">
                      {matchReasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <ChevronRight className="w-4 h-4 text-brand-main" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Job Description */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Job Description</h3>
            <div className="text-slate-700 leading-relaxed prose max-w-none">
              {formatJobContent(job.description)}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Requirements</h3>
              <div className="prose max-w-none">
                {typeof job.requirements === 'string' 
                  ? formatJobContent(job.requirements)
                  : (
                    <ul className="space-y-2">
                      {job.requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  )
                }
              </div>
            </div>
          )}

          {/* Application Count */}
          {job.applicationCount > 0 && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">
              <span className="font-medium">{job.applicationCount}</span> {job.applicationCount === 1 ? 'person has' : 'people have'} applied to this position
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-slate-50">
          {hasApplied ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-lg font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Application Submitted
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={optimizeResume}
                disabled={checkingStatus}
                className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Optimize CV
              </button>
              <button
                onClick={() => setShowApplicationModal(true)}
                disabled={checkingStatus}
                className="flex-1 h-10 bg-brand-main text-white rounded-lg hover:bg-brand-background font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {checkingStatus ? 'Loading...' : 'Apply for this Position'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <JobApplicationModal
          jobId={job.id}
          jobTitle={job.title}
          company={job.company}
          jobDescription={job.description}
          matchScore={matchScore}
          matchReasons={matchReasons}
          missingSkills={missingSkills}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {
            setHasApplied(true);
            setShowApplicationModal(false);
          }}
        />
      )}

      {/* Resume Optimization Modal */}
      {showOptimizationModal && (
        <ResumeOptimizationModal
          jobId={job.id}
          jobTitle={job.title}
          jobDescription={job.description}
          company={job.company}
          onClose={() => {
            setShowOptimizationModal(false);
            // Recalculate match score after closing optimization modal
            calculateMatchScore();
          }}
        />
      )}

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
