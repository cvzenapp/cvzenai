import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MapPin, Monitor, CheckCircle, XCircle, AlertCircle, User, Building, Plus, Edit } from 'lucide-react';
import { interviewApi } from '../../services/interviewApi';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import { InterviewResponseModal } from './InterviewResponseModal';
import { InterviewFeedbackModal } from './InterviewFeedbackModal';
import { VideoCallLauncher } from '../video/VideoCallLauncher';
import { ScheduleInterviewWithSelector } from './ScheduleInterviewWithSelector';
import { ScheduleInterviewForm } from './ScheduleInterviewForm';
import type { InterviewInvitation } from '@shared/api';

interface InterviewsDashboardProps {
  userType: 'recruiter' | 'job_seeker';
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
  rescheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200'
};

const statusIcons = {
  pending: AlertCircle,
  accepted: CheckCircle,
  declined: XCircle,
  rescheduled: Calendar,
  completed: CheckCircle,
  cancelled: XCircle
};

const interviewTypeIcons = {
  video_call: Video,
  phone: Phone,
  in_person: MapPin,
  technical: Monitor
};

const interviewTypeLabels = {
  video_call: 'Video Call',
  phone: 'Phone Call',
  in_person: 'In Person',
  technical: 'Technical Interview'
};

export const InterviewsDashboard: React.FC<InterviewsDashboardProps> = ({ userType }) => {
  const [interviews, setInterviews] = useState<InterviewInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewInvitation | null>(null);
  const [feedbackInterview, setFeedbackInterview] = useState<InterviewInvitation | null>(null);
  const [videoCallInterview, setVideoCallInterview] = useState<InterviewInvitation | null>(null);
  const [editingInterview, setEditingInterview] = useState<InterviewInvitation | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Debug: Check what userType we received and what tokens exist
  useEffect(() => {
    try {
      console.log('🔍 InterviewsDashboard - userType:', userType);
      console.log('🔍 InterviewsDashboard - authToken exists:', !!localStorage.getItem('authToken'));
      console.log('🔍 InterviewsDashboard - recruiter_token exists:', !!localStorage.getItem('recruiter_token'));
      
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('🔍 InterviewsDashboard - user object:', user);
        } catch (e) {
          console.log('🔍 InterviewsDashboard - failed to parse user:', e);
        }
      }
    } catch (error) {
      console.error('❌ Error in InterviewsDashboard debug:', error);
    }
  }, [userType]);

  useEffect(() => {
    try {
      console.log('🔍 InterviewsDashboard - Component mounted/userType changed:', userType);
      loadInterviews();
    } catch (error) {
      console.error('❌ Error in InterviewsDashboard useEffect:', error);
      setError('Failed to initialize interviews dashboard');
      setLoading(false);
    }
  }, [userType]); // Add userType as dependency

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 InterviewsDashboard - Loading interviews for userType:', userType);
      console.log('🔄 InterviewsDashboard - Available tokens:', {
        authToken: !!localStorage.getItem('authToken'),
        recruiter_token: !!localStorage.getItem('recruiter_token')
      });
      
      // Validate userType
      if (!userType || (userType !== 'recruiter' && userType !== 'job_seeker')) {
        throw new Error(`Invalid userType: ${userType}`);
      }
      
      // For job seekers, always use the regular interview API with authToken
      // For recruiters, use the recruiter interview API with recruiter_token
      const apiClient = userType === 'recruiter' ? recruiterInterviewApi : interviewApi;
      
      console.log('🔄 InterviewsDashboard - Using API client:', userType === 'recruiter' ? 'recruiterInterviewApi' : 'interviewApi');
      console.log('🔄 InterviewsDashboard - About to call getMyInterviews...');
      
      const data = await apiClient.getMyInterviews();
      console.log('✅ InterviewsDashboard - Loaded interviews:', data);
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setInterviews(data);
      } else {
        console.warn('⚠️ Interview data is not an array:', data);
        setInterviews([]);
      }
    } catch (err: any) {
      console.error('❌ InterviewsDashboard - Error loading interviews:', err);
      setError(err.message || 'Failed to load interviews');
      setInterviews([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleResponseSuccess = () => {
    loadInterviews();
    setSelectedInterview(null);
  };

  const handleScheduleSuccess = () => {
    loadInterviews();
    setShowScheduleModal(false);
  };

  const handleEditInterview = (interview: InterviewInvitation) => {
    setEditingInterview(interview);
  };

  const handleEditSuccess = () => {
    setEditingInterview(null);
    loadInterviews();
  };

  const handleFeedbackSubmit = async (decision: 'hired' | 'rejected' | 'hold', feedback: string) => {
    if (!feedbackInterview) return;

    try {
      const apiClient = userType === 'recruiter' ? recruiterInterviewApi : interviewApi;
      await apiClient.markCompleted(feedbackInterview.id, decision, feedback);
      loadInterviews();
      setFeedbackInterview(null);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      throw err;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (isToday) dateStr = 'Today';
    else if (isTomorrow) dateStr = 'Tomorrow';
    
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
    
    return { dateStr, timeStr, isPast: date < now };
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter === 'all') return true;
    return interview.status === filter;
  });

  const getFilterCounts = () => {
    return {
      all: interviews.length,
      pending: interviews.filter(i => i.status === 'pending').length,
      accepted: interviews.filter(i => i.status === 'accepted').length,
      completed: interviews.filter(i => i.status === 'completed').length
    };
  };

  const counts = getFilterCounts();

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
          onClick={loadInterviews}
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-normal text-gray-900">
          {userType === 'recruiter' ? 'Interview Management' : 'My Interviews'}
        </h2>
        {userType === 'recruiter' && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Schedule Interview</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'pending', label: 'Pending', count: counts.pending },
            { key: 'accepted', label: 'Accepted', count: counts.accepted },
            { key: 'completed', label: 'Completed', count: counts.completed }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`py-2 px-1 border-b-2 font-normal text-sm transition-colors ${
                filter === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label} {count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  filter === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Interviews List */}
      {filteredInterviews.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-900 mb-2">
            {filter === 'all' ? 'No interviews yet' : `No ${filter} interviews`}
          </h3>
          <p className="text-gray-500">
            {userType === 'recruiter' 
              ? 'Schedule interviews with shortlisted candidates to get started.'
              : 'Interview invitations will appear here when recruiters schedule them.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
          {filteredInterviews.map((interview) => {
            const { dateStr, timeStr, isPast } = formatDateTime(interview.proposedDatetime);
            const StatusIcon = statusIcons[interview.status];
            const InterviewIcon = interviewTypeIcons[interview.interviewType];
            
            return (
              <div
                key={interview.id}
                className={`bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all ${
                  isPast && interview.status !== 'completed' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Icon + Title + Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <InterviewIcon className="w-5 h-5 text-slate-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-normal text-slate-900 text-sm truncate">
                          {interview.title}
                        </h3>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {interviewTypeLabels[interview.interviewType]}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-slate-600">
                        {userType === 'recruiter' ? (
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{interview.candidate?.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 truncate">
                            <Building className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {interview.recruiter?.name}
                              {interview.recruiter?.company && ` • ${interview.recruiter.company}`}
                            </span>
                          </div>
                        )}
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{dateStr}</span>
                        </div>
                        <span className="text-slate-400">•</span>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{timeStr}</span>
                        </div>
                      </div>
                      
                      {/* Show feedback for completed interviews (job seeker view) */}
                      {userType === 'job_seeker' && interview.status === 'completed' && interview.applicationStatus && interview.recruiterFeedback && (
                        <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200">
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {interview.applicationStatus === 'accepted' && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {interview.applicationStatus === 'rejected' && (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              {interview.applicationStatus === 'under_review' && (
                                <AlertCircle className="w-4 h-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-normal text-slate-700 mb-1">
                                Status: {interview.applicationStatus === 'accepted' ? 'Hired' : interview.applicationStatus === 'rejected' ? 'Rejected' : 'On Hold'}
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {interview.recruiterFeedback}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Status + Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-normal border ${statusColors[interview.status]}`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                    </div>
                    
                    {/* Edit button for recruiters */}
                    {userType === 'recruiter' && (
                      <button
                        onClick={() => handleEditInterview(interview)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors text-xs font-normal flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                    
                    {userType === 'job_seeker' && interview.status === 'pending' && (
                      <button
                        onClick={() => setSelectedInterview(interview)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-normal whitespace-nowrap"
                      >
                        Respond
                      </button>
                    )}
                    
                    {interview.status === 'accepted' && (
                      <>
                        {interview.interviewType === 'video_call' && (
                          interview.meetingLink?.includes('/interview/') ? (
                            <button
                              onClick={() => setVideoCallInterview(interview)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-normal flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join</span>
                            </button>
                          ) : interview.meetingLink ? (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-normal flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => setVideoCallInterview(interview)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-normal flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join</span>
                            </button>
                          )
                        )}
                        
                        {interview.interviewType !== 'video_call' && interview.meetingLink && (
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-normal whitespace-nowrap"
                          >
                            Join
                          </a>
                        )}
                        
                        {userType === 'recruiter' && (
                          <button
                            onClick={() => setFeedbackInterview(interview)}
                            className="px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors text-xs font-normal whitespace-nowrap"
                          >
                            Mark Completed
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {selectedInterview && (
        <InterviewResponseModal
          isOpen={true}
          onClose={() => setSelectedInterview(null)}
          interview={selectedInterview}
          onSuccess={handleResponseSuccess}
        />
      )}

      {/* Video Call Launcher */}
      {videoCallInterview && (
        <VideoCallLauncher
          interview={videoCallInterview}
          userType={userType === 'recruiter' ? 'recruiter' : 'candidate'}
          onClose={() => setVideoCallInterview(null)}
        />
      )}

      {/* Schedule Interview Modal with Candidate Selector */}
      {showScheduleModal && (
        <ScheduleInterviewWithSelector
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handleScheduleSuccess}
        />
      )}

      {/* Interview Feedback Modal */}
      {feedbackInterview && (
        <InterviewFeedbackModal
          isOpen={true}
          onClose={() => setFeedbackInterview(null)}
          onSubmit={handleFeedbackSubmit}
          interviewTitle={feedbackInterview.title}
          candidateName={feedbackInterview.candidate?.name || feedbackInterview.candidate?.email || 'Candidate'}
        />
      )}

      {/* Edit Interview Modal */}
      {editingInterview && (
        <ScheduleInterviewForm
          isOpen={true}
          onClose={() => setEditingInterview(null)}
          onSuccess={handleEditSuccess}
          preSelectedCandidate={{
            candidateId: editingInterview.candidateId || 0,
            candidateName: editingInterview.candidate?.name || editingInterview.guestCandidateName || 'Unknown',
            candidateEmail: editingInterview.candidate?.email || editingInterview.guestCandidateEmail || '',
            resumeId: editingInterview.resumeId || 0,
            resumeTitle: editingInterview.resume?.title || 'Resume',
            isGuest: !editingInterview.candidateId,
            guestName: editingInterview.guestCandidateName,
            guestEmail: editingInterview.guestCandidateEmail,
            jobPostingId: editingInterview.jobPostingId,
            applicationId: editingInterview.applicationId,
            currentRound: editingInterview.interviewRound || 1
          }}
          editingInterview={{
            id: editingInterview.id.toString(),
            title: editingInterview.title,
            description: editingInterview.description,
            interviewType: editingInterview.interviewType,
            interviewRoundType: editingInterview.interviewRoundType,
            proposedDatetime: editingInterview.proposedDatetime,
            durationMinutes: editingInterview.durationMinutes,
            timezone: editingInterview.timezone,
            meetingLink: editingInterview.meetingLink,
            meetingLocation: editingInterview.meetingLocation,
            meetingInstructions: editingInterview.meetingInstructions,
            recruiterNotes: editingInterview.recruiterNotes
          }}
        />
      )}
    </div>
  );
};