export interface InterviewSession {
  id: number;
  cvzenInterviewId: number;
  sessionToken: string;
  recruiterId: number;
  candidateId: number;
  status: SessionStatus;
  scheduledStartTime: Date;
  actualStartTime?: Date;
  endTime?: Date;
  durationMinutes?: number;
  roomId: string;
  settings: SessionSettings;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';

export interface SessionSettings {
  recordingEnabled?: boolean;
  chatEnabled?: boolean;
  screenSharingEnabled?: boolean;
  maxDurationMinutes?: number;
  audioQuality?: 'low' | 'medium' | 'high';
  videoQuality?: 'low' | 'medium' | 'high';
}

export interface SessionParticipant {
  id: number;
  sessionId: number;
  userId: number;
  userType: 'recruiter' | 'candidate';
  displayName: string;
  joinedAt?: Date;
  leftAt?: Date;
  connectionStatus: ConnectionStatus;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
  createdAt: Date;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface CreateSessionRequest {
  cvzenInterviewId: number;
  recruiterId: number;
  candidateId: number;
  scheduledStartTime: string;
  settings?: SessionSettings;
}

export interface CreateSessionResponse {
  sessionId: number;
  sessionToken: string;
  roomId: string;
  interviewRoomUrl: string;
}

export interface JoinSessionRequest {
  sessionToken: string;
  userType: 'recruiter' | 'candidate';
  displayName: string;
}

export interface JoinSessionResponse {
  sessionId: number;
  participantId: number;
  roomId: string;
  participants: SessionParticipant[];
  settings: SessionSettings;
}