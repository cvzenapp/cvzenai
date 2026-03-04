import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCallLauncher } from '@/components/video/VideoCallLauncher';
import { interviewApi } from '@/services/interviewApi';
import { recruiterInterviewApi } from '@/services/recruiterInterviewApi';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import type { InterviewInvitation } from '@shared/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Video, Calendar, Clock, User, AlertCircle } from 'lucide-react';

export const InterviewJoinPage: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'recruiter' | 'candidate' | null>(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  useEffect(() => {
    loadInterview();
  }, [interviewId]);

  const loadInterview = async () => {
    if (!interviewId) {
      setError('Invalid interview link');
      setLoading(false);
      return;
    }

    try {
      // Determine user type based on available tokens (same logic as Dashboard)
      const hasRecruiterToken = !!localStorage.getItem('recruiter_token');
      const hasAuthToken = !!localStorage.getItem('authToken');
      const userTypeFromTokens = hasRecruiterToken ? 'recruiter' : 'job_seeker';
      
      if (!hasRecruiterToken && !hasAuthToken) {
        navigate('/');
        return;
      }

      setUserType(userTypeFromTokens === 'recruiter' ? 'recruiter' : 'candidate');

      let interviewData: InterviewInvitation;
      
      if (userTypeFromTokens === 'recruiter') {
        const response = await recruiterInterviewApi.getInterview(parseInt(interviewId));
        interviewData = response;
      } else {
        const response = await interviewApi.getInterview(parseInt(interviewId));
        interviewData = response;
      }

      setInterview(interviewData);
    } catch (err: any) {
      console.error('Failed to load interview:', err);
      setError(err.message || 'Failed to load interview details');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isInterviewTime = (proposedDatetime: string) => {
    const interviewTime = new Date(proposedDatetime);
    const now = new Date();
    const timeDiff = interviewTime.getTime() - now.getTime();
    
    // Allow joining 15 minutes before scheduled time
    return timeDiff <= 15 * 60 * 1000;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showVideoCall && userType) {
    return (
      <VideoCallLauncher
        interview={interview}
        userType={userType}
        onClose={() => setShowVideoCall(false)}
      />
    );
  }

  const { date, time } = formatDateTime(interview.proposedDatetime);
  const canJoin = isInterviewTime(interview.proposedDatetime);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Interview Meeting</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interview Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">{interview.title}</h2>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{date}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{time}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <span>
                {userType === 'recruiter' 
                  ? `Interview with ${interview.candidate?.name}`
                  : `Interview with ${interview.recruiter?.name}`
                }
              </span>
            </div>

            {interview.description && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">{interview.description}</p>
              </div>
            )}

            {interview.meetingInstructions && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-1">Instructions</h4>
                <p className="text-sm text-blue-800">{interview.meetingInstructions}</p>
              </div>
            )}
          </div>

          {/* Join Button */}
          <div className="space-y-3">
            {canJoin ? (
              <Button 
                onClick={() => setShowVideoCall(true)}
                className="w-full"
                size="lg"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Video Call
              </Button>
            ) : (
              <div className="text-center">
                <Button disabled className="w-full" size="lg">
                  <Video className="w-4 h-4 mr-2" />
                  Join Video Call
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  You can join 15 minutes before the scheduled time
                </p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};