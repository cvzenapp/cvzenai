import React, { useEffect, useState } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useParticipants,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff,
  Users,
  Clock,
  MessageSquare
} from 'lucide-react';
import '@livekit/components-styles';

interface VideoCallRoomProps {
  roomName: string;
  token: string;
  userInfo: {
    name: string;
    role: 'recruiter' | 'candidate';
    avatar?: string;
  };
  interviewDetails: {
    title: string;
    duration: number;
    startTime: string;
  };
  onLeave: () => void;
  onCallEnd?: () => void;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  roomName,
  token,
  userInfo,
  interviewDetails,
  onLeave,
  onCallEnd
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);

  // Timer for call duration
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDisconnected = () => {
    setIsConnected(false);
    onCallEnd?.();
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {interviewDetails.title}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(callDuration)}</span>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Connected" : "Connecting..."}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onLeave}
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            Leave Call
          </Button>
        </div>
      </div>

      {/* Video Conference */}
      <div className="flex-1 relative">
        <LiveKitRoom
          video={true}
          audio={true}
          token={token}
          serverUrl={process.env.VITE_LIVEKIT_URL || 'wss://cvzen-interview-calls-ixqhqhqz.livekit.cloud'}
          data-lk-theme="default"
          style={{ height: '100%' }}
          onConnected={() => setIsConnected(true)}
          onDisconnected={handleDisconnected}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="absolute right-0 top-0 h-full w-80 bg-white border-l shadow-lg">
            <InterviewChat userInfo={userInfo} />
          </div>
        )}
      </div>
    </div>
  );
};

// Simple chat component for interviews
const InterviewChat: React.FC<{ userInfo: any }> = ({ userInfo }) => {
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now().toString(),
      sender: userInfo.name,
      message: newMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Interview Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{msg.sender}</span>
              <span className="text-xs text-gray-500">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm">{msg.message}</p>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <Button size="sm" onClick={sendMessage}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};