import React from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, Monitor, User, Building, FileText, Info, MessageSquare } from 'lucide-react';
import { CVZenLogo } from '../CVZenLogo';
import type { InterviewInvitation } from '@shared/api';

interface InterviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewInvitation;
}

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

export const InterviewDetailsModal: React.FC<InterviewDetailsModalProps> = ({
  isOpen,
  onClose,
  interview
}) => {
  if (!isOpen) return null;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(interview.proposedDatetime);
  const InterviewIcon = interviewTypeIcons[interview.interviewType];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with CVZen Branding */}
        <div className="bg-brand-background text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <CVZenLogo className="h-8 w-auto" showCaption={false} />
            <div>
              <h2 className="text-xl font-bold">Interview Details</h2>
              <p className="text-sm text-brand-auxiliary-1">Complete interview information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-brand-auxiliary-1 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interview Title and Type */}
          <div className="bg-gradient-to-br from-brand-main/5 to-brand-background/5 rounded-xl p-6 border border-brand-main/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center flex-shrink-0">
                <InterviewIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{interview.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-brand-main/10 text-brand-main rounded-full text-sm font-medium">
                    {interviewTypeLabels[interview.interviewType]}
                  </span>
                  {interview.interviewRoundType && (
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      {interview.interviewRoundType}
                    </span>
                  )}
                  {interview.interviewRound && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      Round {interview.interviewRound}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-brand-main" />
                <h4 className="font-semibold text-gray-900">Date</h4>
              </div>
              <p className="text-gray-700 font-medium">{dateStr}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-brand-main" />
                <h4 className="font-semibold text-gray-900">Time & Duration</h4>
              </div>
              <p className="text-gray-700 font-medium">{timeStr}</p>
              {interview.durationMinutes && (
                <p className="text-sm text-gray-600 mt-1">{interview.durationMinutes} minutes</p>
              )}
            </div>
          </div>

          {/* Recruiter Information */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <Building className="w-5 h-5 text-brand-main" />
              <h4 className="font-semibold text-gray-900">Interviewer</h4>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700 font-medium">{interview.recruiter?.name}</p>
              {interview.recruiter?.company && (
                <p className="text-sm text-gray-600">{interview.recruiter.company}</p>
              )}
              <p className="text-sm text-gray-600">{interview.recruiter?.email}</p>
            </div>
          </div>

          {/* Job Information */}
          {interview.jobPosting && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-brand-main" />
                <h4 className="font-semibold text-gray-900">Position</h4>
              </div>
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">{interview.jobPosting.title}</p>
                <p className="text-sm text-gray-600">{interview.jobPosting.company}</p>
              </div>
            </div>
          )}

          {/* Interview Description */}
          {interview.description && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Info className="w-5 h-5 text-brand-main" />
                <h4 className="font-semibold text-gray-900">Interview Description</h4>
              </div>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{interview.description}</p>
              </div>
            </div>
          )}

          {/* Meeting Details */}
          {(interview.meetingLink || interview.meetingLocation) && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <InterviewIcon className="w-5 h-5 text-brand-main" />
                <h4 className="font-semibold text-gray-900">Meeting Details</h4>
              </div>
              <div className="space-y-3">
                {interview.meetingLink && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Meeting Link</p>
                    <a 
                      href={interview.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-main hover:text-brand-background underline break-all"
                    >
                      {interview.meetingLink}
                    </a>
                  </div>
                )}
                {interview.meetingLocation && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Location</p>
                    <div className="space-y-2">
                      <p className="text-gray-700">{interview.meetingLocation}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(interview.meetingLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 bg-brand-main text-white rounded-lg hover:bg-brand-background transition-colors text-sm"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>View on Google Maps</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show location section for in-person interviews even if no location is set */}
          {interview.interviewType === 'in_person' && !interview.meetingLocation && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Meeting Location</h4>
              </div>
              <p className="text-amber-800 text-sm">
                Location details will be provided by the recruiter soon. Please check back later or contact the recruiter directly.
              </p>
            </div>
          )}

          {/* Instructions for Candidate */}
          {interview.meetingInstructions && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Instructions for You</h4>
              </div>
              <div className="prose max-w-none">
                <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">{interview.meetingInstructions}</p>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {interview.recruiterNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Info className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">Additional Notes</h4>
              </div>
              <div className="prose max-w-none">
                <p className="text-amber-800 leading-relaxed whitespace-pre-wrap">{interview.recruiterNotes}</p>
              </div>
            </div>
          )}

          {/* Status Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Interview Status</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  interview.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  interview.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  interview.status === 'declined' ? 'bg-red-100 text-red-700' :
                  interview.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Scheduled:</span>
                <span className="text-sm text-gray-700">
                  {new Date(interview.createdAt).toLocaleDateString()}
                </span>
              </div>
              {interview.respondedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Responded:</span>
                  <span className="text-sm text-gray-700">
                    {new Date(interview.respondedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Powered by CVZen - Intelligent Hiring OS
            </p>
            <button
              onClick={onClose}
              className="h-10 px-6 bg-brand-main text-white rounded-lg hover:bg-brand-background transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};