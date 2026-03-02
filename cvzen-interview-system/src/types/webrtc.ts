export interface WebRTCOffer {
  type: 'offer';
  sdp: string;
  from: number;
  to: number;
  sessionId: number;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
  from: number;
  to: number;
  sessionId: number;
}

export interface WebRTCIceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
  from: number;
  to: number;
  sessionId: number;
}

export interface MediaState {
  participantId: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;
}

export interface ConnectionQuality {
  participantId: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  packetLoss: number;
  bandwidth: number;
}

export interface STUNTURNConfig {
  iceServers: RTCIceServer[];
}

export interface PeerConnectionConfig {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
}