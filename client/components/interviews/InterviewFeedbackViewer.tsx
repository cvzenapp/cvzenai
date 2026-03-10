import React, { useState, useEffect } from 'react';
import { Star, User, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { interviewApi } from '../../services/interviewApi';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import type { InterviewFeedback as SharedInterviewFeedback } from '@shared/api';

interface InterviewFeedback extends SharedInterviewFeedback {
  providerName?: string;
  hiringStatus?: 'hired' | 'rejected' | 'hold';
}

interface InterviewFeedbackViewerProps {
  interviewId: number;
  userType: 'recruiter' | 'job_seeker';
}

export const InterviewFeedbackViewer: React.FC<InterviewFeedbackViewerProps> = ({
  interviewId,
  userType
}) => {
  const [feedback, setFeedback] = useState<InterviewFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
  }, [interviewId, userType]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiClient = userType === 'recruiter' ? recruiterInterviewApi : interviewApi;
      const feedbackData = await apiClient.getFeedback(interviewId);
      
      setFeedback(feedbackData);
    } catch (err) {
      console.error('Failed to load interview feedback:', err);
      setError('Failed to load interview feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)}/10)</span>
      </div>
    );
  };

  const getHiringStatusIcon = (status: string) => {
    switch (status) {
      case 'hired':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'hold':
        return <Clock className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getHiringStatusText = (status: string) => {
    switch (status) {
      case 'hired':
        return 'Hired';
      case 'rejected':
        return 'Not selected';
      case 'hold':
        return 'On hold';
      default:
        return 'Pending decision';
    }
  };

  const getHiringStatusColor = (status: string) => {
    switch (status) {
      case 'hired':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'hold':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
        {error}
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="text-gray-500 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
        No feedback available for this interview yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Interview Feedback</h3>
      
      {feedback.map((item) => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">{item.providerName || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Hiring Status */}
          {item.hiringStatus && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getHiringStatusColor(item.hiringStatus)}`}>
              {getHiringStatusIcon(item.hiringStatus)}
              <span className="font-medium">{getHiringStatusText(item.hiringStatus)}</span>
            </div>
          )}

          {/* Overall Rating */}
          {item.rating && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Overall Rating</p>
              {renderStars(item.rating)}
            </div>
          )}

          {/* Feedback Text */}
          {item.feedbackText && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Feedback</p>
              <p className="text-gray-600 whitespace-pre-wrap">{item.feedbackText}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};