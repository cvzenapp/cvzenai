import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth';
import { sessionService } from '../services/sessionService';
import { CreateSessionRequest, CreateSessionResponse } from '../types/session';
import { ApiResponse } from '../types/api';
import { createError } from '../middleware/errorHandler';

class SessionController {
  async createSession(req: AuthRequest, res: Response): Promise<void> {
    const createRequest: CreateSessionRequest = req.body;
    
    // Validate required fields
    if (!createRequest.cvzenInterviewId || !createRequest.recruiterId || 
        !createRequest.candidateId || !createRequest.scheduledStartTime) {
      throw createError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    // Ensure the authenticated user is the recruiter
    if (req.user!.userId !== createRequest.recruiterId) {
      throw createError('Unauthorized: Can only create sessions for yourself', 403, 'UNAUTHORIZED');
    }

    const session = await sessionService.createSession(createRequest);
    
    const response: ApiResponse<CreateSessionResponse> = {
      success: true,
      data: {
        sessionId: session.id,
        sessionToken: session.sessionToken,
        roomId: session.roomId,
        interviewRoomUrl: `${process.env.CVZEN_BASE_URL}/interview/${session.sessionToken}`
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  }

  async getSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      throw createError('Invalid session ID', 400, 'INVALID_SESSION_ID');
    }

    const session = await sessionService.getSession(sessionId, req.user!.userId);
    
    if (!session) {
      throw createError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const response: ApiResponse = {
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async startSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      throw createError('Invalid session ID', 400, 'INVALID_SESSION_ID');
    }

    const session = await sessionService.startSession(sessionId, req.user!.userId);

    const response: ApiResponse = {
      success: true,
      data: session,
      message: 'Session started successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async endSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      throw createError('Invalid session ID', 400, 'INVALID_SESSION_ID');
    }

    const session = await sessionService.endSession(sessionId, req.user!.userId);

    const response: ApiResponse = {
      success: true,
      data: session,
      message: 'Session ended successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async getSessionByCvzenId(req: AuthRequest, res: Response): Promise<void> {
    const cvzenInterviewId = parseInt(req.params.cvzenInterviewId);
    
    if (isNaN(cvzenInterviewId)) {
      throw createError('Invalid CVZen interview ID', 400, 'INVALID_CVZEN_ID');
    }

    const session = await sessionService.getSessionByCvzenId(cvzenInterviewId, req.user!.userId);
    
    if (!session) {
      throw createError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    const response: ApiResponse = {
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async joinSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = parseInt(req.params.sessionId);
    const { displayName } = req.body;
    
    if (isNaN(sessionId)) {
      throw createError('Invalid session ID', 400, 'INVALID_SESSION_ID');
    }

    if (!displayName) {
      throw createError('Display name is required', 400, 'MISSING_DISPLAY_NAME');
    }

    const result = await sessionService.joinSession(
      sessionId, 
      req.user!.userId, 
      req.user!.userType, 
      displayName
    );

    const response: ApiResponse = {
      success: true,
      data: result,
      message: 'Joined session successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async leaveSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      throw createError('Invalid session ID', 400, 'INVALID_SESSION_ID');
    }

    await sessionService.leaveSession(sessionId, req.user!.userId);

    const response: ApiResponse = {
      success: true,
      message: 'Left session successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }

  async getParticipants(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      throw createError('Invalid session ID', 400, 'INVALID_SESSION_ID');
    }

    const participants = await sessionService.getParticipants(sessionId, req.user!.userId);

    const response: ApiResponse = {
      success: true,
      data: participants,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  }
}

export const sessionController = new SessionController();