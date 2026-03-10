import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Phone, MapPin, Monitor, CheckCircle, XCircle, AlertCircle, User, Building, Plus, Edit, Search, Filter } from 'lucide-react';
import { interviewApi } from '../../services/interviewApi';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import { InterviewResponseModal } from './InterviewResponseModal';
import { InterviewCompletionModal } from './InterviewCompletionModal';
import { VideoCallLauncher } from '../video/VideoCallLauncher';
import { ScheduleInterviewWithSelector } from './ScheduleInterviewWithSelector';
import { ScheduleInterviewForm } from './ScheduleInterviewForm';
import type { InterviewInvitation } from '@shared/api';

interface InterviewsDashboardProps {
  userType: 'recruiter' | 'job_seeker';
}

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-red-50 text-red-700 border-red-200',
  rescheduled: 'bg-brand-main/10 text-brand-main border-brand-main/20',
  completed: 'bg-slate-50 text-slate-700 border-slate-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200'
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
  const [completionInterview, setCompletionInterview] = useState<InterviewInvitation | null>(null);
  const [videoCallInterview, setVideoCallInterview] = useState<InterviewInvitation | null>(null);
  const [editingInterview, setEditingInterview] = useState<InterviewInvitation | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'completed'>('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  const handleInterviewCompletion = async (
    decision: 'hired' | 'rejected' | 'hold', 
    feedback: string, 
    evaluationMetrics: any[]
  ) => {
    if (!completionInterview) return;

    try {
      const apiClient = userType === 'recruiter' ? recruiterInterviewApi : interviewApi;
      await apiClient.markCompleted(completionInterview.id, decision, feedback, evaluationMetrics);
      loadInterviews();
      setCompletionInterview(null);
    } catch (err) {
      console.error('Failed to complete interview:', err);
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
    // Apply search filter
    const matchesSearch = !searchQuery || 
      interview.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.guestCandidateName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.recruiter?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      interview.recruiter?.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    const matchesStatus = filter === 'all' || interview.status === filter;
    
    return matchesSearch && matchesStatus;
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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-main/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-main border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 font-jakarta">Unable to load interviews</h3>
            <p className="text-sm text-red-600 mt-1 font-jakarta">{error}</p>
            <button 
              onClick={loadInterviews}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-jakarta"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Enhanced Header with CVZen Branding */}
      <div className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Title and Stats Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 font-jakarta">
                    {userType === 'recruiter' ? 'Interview Management' : 'My Interviews'}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {filteredInterviews.length} total interview{filteredInterviews.length !== 1 ? 's' : ''}
                    {filter !== 'all' && ` (${filter} status)`}
                  </p>
                </div>
              </div>
              {userType === 'recruiter' && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-xl hover:shadow-lg transition-all font-jakarta font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Schedule Interview</span>
                </button>
              )}
            </div>
            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search Bar with Filter Toggle */}
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-main/60" />
                  <input
                    placeholder="Search interviews..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-brand-main focus:ring-brand-main/20 focus:ring-2 focus:outline-none font-jakarta"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden px-3 py-2 border border-slate-200 rounded-lg hover:border-brand-main hover:text-brand-main transition-colors"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>

              {/* Filter Dropdowns - Always visible on desktop, toggle on mobile */}
              <div className={`flex flex-col sm:flex-row gap-2 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="w-full sm:w-40 px-3 py-2 border border-slate-200 rounded-lg focus:border-brand-main focus:ring-brand-main/20 focus:ring-2 focus:outline-none font-jakarta"
                >
                  <option value="all">All Status ({counts.all})</option>
                  <option value="pending">Pending ({counts.pending})</option>
                  <option value="accepted">Accepted ({counts.accepted})</option>
                  <option value="completed">Completed ({counts.completed})</option>
                </select>

                {(searchQuery || filter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilter('all');
                    }}
                    className="whitespace-nowrap px-3 py-2 border border-slate-200 rounded-lg hover:border-brand-main hover:text-brand-main transition-colors font-jakarta"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced Interviews List */}
      <div className="px-4 sm:px-6 flex-1 overflow-hidden">
        {filteredInterviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-main/10 to-brand-main/20 rounded-2xl flex items-center justify-center">
              <Calendar className="w-8 h-8 text-brand-main" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 font-jakarta">
              {filter === 'all' ? 'No interviews yet' : `No ${filter} interviews`}
            </h3>
            <p className="text-slate-600 font-jakarta max-w-md mx-auto">
              {userType === 'recruiter' 
                ? 'Schedule interviews with shortlisted candidates to get started. Use the Schedule Interview button above.'
                : 'Interview invitations will appear here when recruiters schedule them. Check back soon!'
              }
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="space-y-4 pb-6">
              {filteredInterviews.map((interview) => {
              const { dateStr, timeStr, isPast } = formatDateTime(interview.proposedDatetime);
              const StatusIcon = statusIcons[interview.status];
              const InterviewIcon = interviewTypeIcons[interview.interviewType];
              
              return (
                <div
                  key={interview.id}
                  className={`bg-white border border-slate-200 rounded-xl p-4 sm:p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-200 ${
                    isPast && interview.status !== 'completed' ? 'opacity-70' : ''
                  }`}
                >
                  {/* Mobile-first responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Main content area */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-main/10 to-brand-background/10 flex items-center justify-center border border-brand-main/20 flex-shrink-0">
                          <InterviewIcon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-main" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {/* First line: Title and Round Type */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-base sm:text-lg font-jakarta truncate">
                              {interview.title}
                            </h3>
                            {interview.interviewRoundType && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-jakarta font-medium">
                                {interview.interviewRoundType}
                              </span>
                            )}
                          </div>
                          {/* Second line: Participant and Interview Type */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600 mb-3">
                            {userType === 'recruiter' ? (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-brand-main flex-shrink-0" />
                                <span className="font-jakarta truncate">{interview.candidate?.name || interview.guestCandidateName}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-brand-main flex-shrink-0" />
                                <span className="font-jakarta truncate">
                                  {interview.recruiter?.name}
                                  {interview.recruiter?.company && ` • ${interview.recruiter.company}`}
                                </span>
                              </div>
                            )}
                            <span className="text-slate-400 hidden sm:inline">•</span>
                            <span className="font-jakarta">{interviewTypeLabels[interview.interviewType]}</span>
                          </div>
                          
                          {/* Third line: Date and Time */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-brand-main flex-shrink-0" />
                              <span className="font-jakarta font-medium">{dateStr}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-brand-main flex-shrink-0" />
                              <span className="font-jakarta font-medium">{timeStr}</span>
                            </div>
                            {interview.durationMinutes && (
                              <>
                                <span className="text-slate-400 hidden sm:inline">•</span>
                                <span className="font-jakarta">{interview.durationMinutes} min</span>
                              </>
                            )}
                          </div>
                          {/* Show feedback for completed interviews (job seeker view) */}
                          {userType === 'job_seeker' && interview.status === 'completed' && interview.applicationStatus && interview.recruiterFeedback && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg border border-slate-200">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {interview.applicationStatus === 'accepted' && (
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                  )}
                                  {interview.applicationStatus === 'rejected' && (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                  {interview.applicationStatus === 'under_review' && (
                                    <AlertCircle className="w-5 h-5 text-amber-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-jakarta font-semibold text-slate-900 mb-1">
                                    Status: {interview.applicationStatus === 'accepted' ? 'Hired' : interview.applicationStatus === 'rejected' ? 'Rejected' : 'On Hold'}
                                  </p>
                                  <p className="text-sm text-slate-600 font-jakarta">
                                    {interview.recruiterFeedback}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Right: Status + Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                      <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-jakarta font-medium border ${statusColors[interview.status]}`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Edit button for recruiters */}
                        {userType === 'recruiter' && (
                          <button
                            onClick={() => handleEditInterview(interview)}
                            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-xs sm:text-sm font-jakarta font-medium flex items-center gap-1 sm:gap-2"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                        )}
                        
                        {userType === 'job_seeker' && interview.status === 'pending' && (
                          <button
                            onClick={() => setSelectedInterview(interview)}
                            className="px-3 py-2 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-jakarta font-medium"
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
                                  className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-jakarta font-medium flex items-center gap-1 sm:gap-2"
                                >
                                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Join Call</span>
                                  <span className="sm:hidden">Join</span>
                                </button>
                              ) : interview.meetingLink ? (
                                <a
                                  href={interview.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-jakarta font-medium flex items-center gap-1 sm:gap-2"
                                >
                                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Join Call</span>
                                  <span className="sm:hidden">Join</span>
                                </a>
                              ) : (
                                <button
                                  onClick={() => setVideoCallInterview(interview)}
                                  className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-jakarta font-medium flex items-center gap-1 sm:gap-2"
                                >
                                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Join Call</span>
                                  <span className="sm:hidden">Join</span>
                                </button>
                              )
                            )}
                            {interview.interviewType !== 'video_call' && interview.meetingLink && (
                              <a
                                href={interview.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm font-jakarta font-medium"
                              >
                                Join
                              </a>
                            )}
                            
                            {userType === 'recruiter' && (
                              <button
                                onClick={() => setCompletionInterview(interview)}
                                className="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs sm:text-sm font-jakarta font-medium"
                              >
                                <span className="hidden sm:inline">Mark Completed</span>
                                <span className="sm:hidden">Complete</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>
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

      {/* Interview Completion Modal */}
      {completionInterview && (
        <InterviewCompletionModal
          isOpen={true}
          onClose={() => setCompletionInterview(null)}
          onSubmit={handleInterviewCompletion}
          interview={completionInterview}
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