export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface AuthenticatedRequest {
  userId: number;
  userType: 'recruiter' | 'candidate';
  token: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  database: 'connected' | 'disconnected';
  services: {
    webrtc: 'active' | 'inactive';
    recording: 'active' | 'inactive';
    fileUpload: 'active' | 'inactive';
  };
}