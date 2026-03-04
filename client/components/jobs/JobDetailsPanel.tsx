import { useState, useEffect } from 'react';
import { X, MapPin, DollarSign, Briefcase, Clock, Building, ChevronRight, Loader2 } from 'lucide-react';
import { JobApplicationModal } from './JobApplicationModal';
import { jobApplicationApi } from '../../services/jobApplicationApi';
import { jobMatchingApi } from '../../services/jobMatchingApi';

interface JobDetailsPanelProps {
  job: any;
  onClose: () => void;
}

export function JobDetailsPanel({ job, onClose }: JobDetailsPanelProps) {
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [matchReasons, setMatchReasons] = useState<string[]>([]);
  const [loadingMatchScore, setLoadingMatchScore] = useState(false);

  useEffect(() => {
    checkApplicationStatus();
    calculateMatchScore();
  }, [job.id]);

  const checkApplicationStatus = async () => {
    try {
      const response = await jobApplicationApi.checkApplicationStatus(parseInt(job.id));
      if (response.success) {
        setHasApplied(response.data.hasApplied);
      }
    } catch (error) {
      console.error('Failed to check application status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const calculateMatchScore = async () => {
    setLoadingMatchScore(true);
    console.log('🔍 Calculating match score for job:', job.id);
    try {
      const response = await jobMatchingApi.calculateMatchScore({
        jobId: job.id,
        jobDescription: job.description || '',
        jobTitle: job.title,
        jobRequirements: job.requirements || []
      });
      
      console.log('✅ Match score response:', response);
      
      if (response.success) {
        setMatchScore(response.data.score);
        setMatchReasons(response.data.reasons);
      } else {
        console.error('Match score API failed:', response);
        setMatchScore(job.matchScore || 75);
        setMatchReasons(job.matchReasons || []);
      }
    } catch (error) {
      console.error('Failed to calculate match score:', error);
      // Fallback to static score if API fails
      setMatchScore(job.matchScore || 75);
      setMatchReasons(job.matchReasons || []);
    } finally {
      setLoadingMatchScore(false);
    }
  };

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
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
                          className="text-blue-200"
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
                          className="text-blue-600 transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">{matchScore}%</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {loadingMatchScore ? 'Calculating Match...' : 'Your ATS Match'}
                  </h3>
                  {!loadingMatchScore && matchReasons && matchReasons.length > 0 && (
                    <ul className="space-y-1">
                      {matchReasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-4 h-4 text-blue-600" />
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
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements.map((req: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
                    {req}
                  </li>
                ))}
              </ul>
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
            <button
              onClick={() => setShowApplicationModal(true)}
              disabled={checkingStatus}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {checkingStatus ? 'Loading...' : 'Apply for this Position'}
            </button>
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
          onClose={() => setShowApplicationModal(false)}
          onSuccess={() => {
            setHasApplied(true);
            setShowApplicationModal(false);
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
