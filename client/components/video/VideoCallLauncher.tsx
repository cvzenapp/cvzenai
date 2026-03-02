import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  Settings,
  Users,
  Calendar,
  Clock
} from 'lucide-react';
import { VideoCallRoom } from './VideoCallRoom';
import { videoCallService } from '@/services/videoCallService';
import type { InterviewInvitation } from '@shared/api';

interface VideoCallLauncherProps {
  interview: InterviewInvitation;
  userType: 'recruiter' | 'candidate';
  onClose: () => void;
}

export const VideoCallLauncher: React.FC<VideoCallLauncherProps> = ({
  interview,
  userType,
  onClose
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const handleJoinCall = async () => {
    try {
      setIsJoining(true);
      
      // Get LiveKit token from your backend
      const callToken = await videoCallService.generateToken({
        interviewId: interview.id,
        userType,
        audioEnabled,
        videoEnabled
      });
      
      setToken(callToken);
      setInCall(true);
    } catch (error) {
      console.error('Failed to join call:', error);
      alert('Failed to join the video call. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveCall = () => {
    setInCall(false);
    setToken(null);
    onClose();
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDateTime(interview.proposedDatetime);

  // If in call, show the video room
  if (inCall && token) {
    return (
      <VideoCallRoom
        roomName={`interview-${interview.id}`}
        token={token}
        userInfo={{
          name: userType === 'recruiter' 
            ? interview.recruiter?.name || 'Recruiter'
            : interview.candidate?.name || 'Candidate',
          role: userType,
        }}
        interviewDetails={{
          title: interview.title,
          duration: interview.durationMinutes,
          startTime: interview.proposedDatetime
        }}
        onLeave={handleLeaveCall}
        onCallEnd={() => {
          // Mark interview as completed
          videoCallService.markInterviewCompleted(interview.id, userType);
        }}
      />
    );
  }

  // Pre-call setup screen
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span>Join Interview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Interview Details */}
          <div className="space-y-3">
            <h3 className="font-semibold">{interview.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{time}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {userType === 'recruiter' 
                  ? `Interview with ${interview.candidate?.name}`
                  : `Interview with ${interview.recruiter?.name}`
                }
              </span>
            </div>
          </div>

          {/* Media Controls */}
          <div className="space-y-3">
            <h4 className="font-medium">Audio & Video Settings</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm">Microphone</span>
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Camera</span>
              <Button
                variant={videoEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleJoinCall}
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? 'Joining...' : 'Join Call'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};