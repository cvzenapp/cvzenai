import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, Monitor, CheckCircle, XCircle } from 'lucide-react';
import { interviewApi } from '../../services/interviewApi';
import type { InterviewInvitation } from '@shared/api';

interface InterviewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewInvitation;
  onSuccess?: () => void;
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

export const InterviewResponseModal: React.FC<InterviewResponseModalProps> = ({
  isOpen,
  onClose,
  interview,
  onSuccess
}) => {
  const [response, setResponse] = useState<'accepted' | 'declined' | null>(null);
  const [candidateResponse, setCandidateResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response) {
      setError('Please select accept or decline');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await interviewApi.respondToInterview({
        interviewId: interview.id,
        status: response,
        candidateResponse: candidateResponse.trim() || undefined
      });
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to respond to interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      })
    };
  };

  if (!isOpen) return null;

  const InterviewIcon = interviewTypeIcons[interview.interviewType];
  const { date, time } = formatDateTime(interview.proposedDatetime);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Interview Invitation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Interview Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <InterviewIcon className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 text-lg">{interview.title}</h3>
                <p className="text-blue-700 text-sm mt-1">
                  {interviewTypeLabels[interview.interviewType]}
                </p>
              </div>
            </div>
          </div>

          {/* Recruiter Info */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">From</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{interview.recruiter?.name}</p>
              <p className="text-gray-600 text-sm">{interview.recruiter?.email}</p>
              {interview.recruiter?.company && (
                <p className="text-gray-600 text-sm">{interview.recruiter.company}</p>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Scheduled Time</h4>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-900">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{date}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 mt-1">
                <Clock className="w-4 h-4" />
                <span>{time} • {interview.durationMinutes} minutes</span>
              </div>
            </div>
          </div>

          {/* Meeting Details */}
          {interview.meetingLink && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Meeting Link</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                {interview.meetingLink.includes('/interview/') ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Secure video call link (will be available when you join)
                    </p>
                    <div className="text-blue-600 font-medium">
                      ✓ Integrated Video Call System
                    </div>
                  </div>
                ) : (
                  <a 
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {interview.meetingLink}
                  </a>
                )}
              </div>
            </div>
          )}

          {interview.meetingLocation && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Location</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{interview.meetingLocation}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {interview.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Interview Description</h4>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{interview.description}</p>
              </div>
            </div>
          )}

          {/* Instructions */}
          {interview.meetingInstructions && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{interview.meetingInstructions}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Your Response</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setResponse('accepted')}
                  className={`flex items-center justify-center space-x-2 p-4 border rounded-lg transition-colors ${
                    response === 'accepted'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Accept</span>
                </button>

                <button
                  type="button"
                  onClick={() => setResponse('declined')}
                  className={`flex items-center justify-center space-x-2 p-4 border rounded-lg transition-colors ${
                    response === 'declined'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">Decline</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (optional)
              </label>
              <textarea
                value={candidateResponse}
                onChange={(e) => setCandidateResponse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder={
                  response === 'accepted' 
                    ? "Thank you for the opportunity. I look forward to our interview..."
                    : response === 'declined'
                    ? "Thank you for considering me. Unfortunately, I won't be able to attend..."
                    : "Add a message to your response..."
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !response}
                className={`px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  response === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : response === 'declined'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                {isSubmitting 
                  ? 'Submitting...' 
                  : response === 'accepted'
                  ? 'Accept Interview'
                  : response === 'declined'
                  ? 'Decline Interview'
                  : 'Submit Response'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};