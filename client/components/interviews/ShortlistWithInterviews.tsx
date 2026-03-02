import React, { useState, useEffect } from 'react';
import { Calendar, User, Mail, Star, MessageSquare, Clock, Video } from 'lucide-react';
import { shortlistApi, type ShortlistedResume } from '../../services/shortlistApi';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

export const ShortlistWithInterviews: React.FC = () => {
  const [shortlistedResumes, setShortlistedResumes] = useState<ShortlistedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    resumeId: number;
    resumeTitle: string;
  } | null>(null);

  // Debug: Log token on mount
  useEffect(() => {
    console.log('🔍 [ShortlistWithInterviews] Component mounted');
    console.log('🔍 [ShortlistWithInterviews] Checking localStorage...');
    console.log('🔍 [ShortlistWithInterviews] recruiter_token:', localStorage.getItem('recruiter_token') ? 'EXISTS' : 'MISSING');
    console.log('🔍 [ShortlistWithInterviews] recruiter_user:', localStorage.getItem('recruiter_user') ? 'EXISTS' : 'MISSING');
  }, []);

  useEffect(() => {
    loadShortlist();
  }, []);

  const loadShortlist = async () => {
    try {
      setLoading(true);
      console.log('🔍 [ShortlistWithInterviews] loadShortlist called');
      console.log('🔍 [ShortlistWithInterviews] Token before API call:', localStorage.getItem('recruiter_token') ? 'EXISTS' : 'MISSING');
      
      const response = await shortlistApi.getMyShortlist();
      console.log('🔍 [ShortlistWithInterviews] API response:', response);
      
      if (response.success) {
        setShortlistedResumes(response.data);
        setError(null);
      } else {
        setError('Failed to load shortlisted candidates');
      }
    } catch (err: any) {
      console.error('❌ [ShortlistWithInterviews] Error:', err);
      setError(err.message || 'Failed to load shortlisted candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleInterview = (resume: ShortlistedResume) => {
    setSelectedCandidate({
      candidateId: resume.candidate.id,
      candidateName: resume.candidate.name,
      candidateEmail: resume.candidate.email,
      resumeId: resume.resumeId,
      resumeTitle: resume.title
    });
  };

  const handleInterviewScheduled = () => {
    setSelectedCandidate(null);
    // Optionally refresh the shortlist or show a success message
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadShortlist}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal text-gray-900">Shortlisted Candidates</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadShortlist}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
          <div className="text-sm text-gray-500">
            {shortlistedResumes.length} candidate{shortlistedResumes.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      {shortlistedResumes.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-900 mb-2">No shortlisted candidates yet</h3>
          <p className="text-gray-500">
            Candidates you shortlist will appear here, and you can schedule interviews with them.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {shortlistedResumes.map((resume) => (
            <div
              key={resume.shortlistId}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Candidate Info */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-normal text-gray-900">
                        {resume.candidate.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{resume.candidate.email}</span>
                      </div>
                      <p className="text-gray-700 font-normal">{resume.title}</p>
                    </div>
                  </div>

                  {/* Resume Summary */}
                  {resume.summary && (
                    <div className="mb-4">
                      <p className="text-gray-600 text-sm line-clamp-3">{resume.summary}</p>
                    </div>
                  )}

                  {/* Upvotes */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-normal">{resume.upvotes} upvotes</span>
                    </div>
                    <div className="text-gray-500 text-sm">
                      Shortlisted {new Date(resume.shortlistedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Notes */}
                  {resume.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <div className="flex items-start space-x-2">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-normal text-gray-700 mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{resume.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-6 flex flex-col space-y-3">
                  <button
                    onClick={() => handleScheduleInterview(resume)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Interview</span>
                  </button>
                  
                  <a
                    href={`/resume/${resume.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
                  >
                    <User className="w-4 h-4" />
                    <span>View Resume</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Interview Modal */}
      {selectedCandidate && (
        <ScheduleInterviewModal
          isOpen={true}
          onClose={() => setSelectedCandidate(null)}
          candidateId={selectedCandidate.candidateId}
          candidateName={selectedCandidate.candidateName}
          candidateEmail={selectedCandidate.candidateEmail}
          resumeId={selectedCandidate.resumeId}
          resumeTitle={selectedCandidate.resumeTitle}
          onSuccess={handleInterviewScheduled}
        />
      )}
    </div>
  );
};