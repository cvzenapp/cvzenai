import { v4 as uuidv4 } from 'uuid';
import { query, withTransaction } from '../database/connection';
import { 
  InterviewSession, 
  CreateSessionRequest, 
  SessionParticipant,
  JoinSessionResponse 
} from '../types/session';
import { createError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

class SessionService {
  async createSession(request: CreateSessionRequest): Promise<InterviewSession> {
    const sessionToken = uuidv4();
    const roomId = `room-${uuidv4()}`;

    const result = await query(`
      INSERT INTO interview_sessions (
        cvzen_interview_id, session_token, recruiter_id, candidate_id,
        scheduled_start_time, room_id, settings
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      request.cvzenInterviewId,
      sessionToken,
      request.recruiterId,
      request.candidateId,
      request.scheduledStartTime,
      roomId,
      JSON.stringify(request.settings || {})
    ]);

    if (result.rows.length === 0) {
      throw createError('Failed to create session', 500, 'SESSION_CREATION_FAILED');
    }

    const session = this.mapRowToSession(result.rows[0]);
    
    logger.info(`Session created: ${session.id}`, {
      sessionId: session.id,
      cvzenInterviewId: request.cvzenInterviewId,
      recruiterId: request.recruiterId,
      candidateId: request.candidateId
    });

    return session;
  }

  async getSession(sessionId: number, userId: number): Promise<InterviewSession | null> {
    const result = await query(`
      SELECT * FROM interview_sessions 
      WHERE id = $1 AND (recruiter_id = $2 OR candidate_id = $2)
    `, [sessionId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  async getSessionByCvzenId(cvzenInterviewId: number, userId: number): Promise<InterviewSession | null> {
    const result = await query(`
      SELECT * FROM interview_sessions 
      WHERE cvzen_interview_id = $1 AND (recruiter_id = $2 OR candidate_id = $2)
    `, [cvzenInterviewId, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  async startSession(sessionId: number, userId: number): Promise<InterviewSession> {
    const session = await this.getSession(sessionId, userId);
    
    if (!session) {
      throw createError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'scheduled') {
      throw createError('Session cannot be started', 400, 'INVALID_SESSION_STATUS');
    }

    const result = await query(`
      UPDATE interview_sessions 
      SET status = 'active', actual_start_time = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [sessionId]);

    logger.info(`Session started: ${sessionId}`, { userId });

    return this.mapRowToSession(result.rows[0]);
  }

  async endSession(sessionId: number, userId: number): Promise<InterviewSession> {
    const session = await this.getSession(sessionId, userId);
    
    if (!session) {
      throw createError('Session not found', 404, 'SESSION_NOT_FOUND');
    }

    if (session.status !== 'active') {
      throw createError('Session is not active', 400, 'INVALID_SESSION_STATUS');
    }

    // Calculate duration
    const durationQuery = `
      UPDATE interview_sessions 
      SET status = 'completed', 
          end_time = NOW(), 
          duration_minutes = EXTRACT(EPOCH FROM (NOW() - actual_start_time)) / 60,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(durationQuery, [sessionId]);

    logger.info(`Session ended: ${sessionId}`, { 
      userId, 
      duration: result.rows[0].duration_minutes 
    });

    return this.mapRowToSession(result.rows[0]);
  }

  async joinSession(
    sessionId: number, 
    userId: number, 
    userType: string, 
    displayName: string
  ): Promise<JoinSessionResponse> {
    return await withTransaction(async (client) => {
      // Verify session exists and user is authorized
      const sessionResult = await client.query(`
        SELECT * FROM interview_sessions 
        WHERE id = $1 AND (recruiter_id = $2 OR candidate_id = $2)
      `, [sessionId, userId]);

      if (sessionResult.rows.length === 0) {
        throw createError('Session not found or unauthorized', 404, 'SESSION_NOT_FOUND');
      }

      const session = this.mapRowToSession(sessionResult.rows[0]);

      // Check if participant already exists
      const existingParticipant = await client.query(`
        SELECT * FROM session_participants 
        WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL
      `, [sessionId, userId]);

      let participantId: number;

      if (existingParticipant.rows.length > 0) {
        // Update existing participant
        const updateResult = await client.query(`
          UPDATE session_participants 
          SET connection_status = 'connected', joined_at = NOW()
          WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL
          RETURNING id
        `, [sessionId, userId]);
        
        participantId = updateResult.rows[0].id;
      } else {
        // Create new participant
        const insertResult = await client.query(`
          INSERT INTO session_participants (
            session_id, user_id, user_type, display_name, 
            joined_at, connection_status
          ) VALUES ($1, $2, $3, $4, NOW(), 'connected')
          RETURNING id
        `, [sessionId, userId, userType, displayName]);
        
        participantId = insertResult.rows[0].id;
      }

      // Get all current participants
      const participantsResult = await client.query(`
        SELECT * FROM session_participants 
        WHERE session_id = $1 AND left_at IS NULL
        ORDER BY joined_at
      `, [sessionId]);

      const participants = participantsResult.rows.map(this.mapRowToParticipant);

      logger.info(`User joined session: ${sessionId}`, { 
        userId, 
        userType, 
        participantId 
      });

      return {
        sessionId,
        participantId,
        roomId: session.roomId,
        participants,
        settings: session.settings
      };
    });
  }

  async leaveSession(sessionId: number, userId: number): Promise<void> {
    await query(`
      UPDATE session_participants 
      SET connection_status = 'disconnected', left_at = NOW()
      WHERE session_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [sessionId, userId]);

    logger.info(`User left session: ${sessionId}`, { userId });
  }

  async getParticipants(sessionId: number, userId: number): Promise<SessionParticipant[]> {
    // Verify user has access to this session
    const sessionAccess = await query(`
      SELECT id FROM interview_sessions 
      WHERE id = $1 AND (recruiter_id = $2 OR candidate_id = $2)
    `, [sessionId, userId]);

    if (sessionAccess.rows.length === 0) {
      throw createError('Session not found or unauthorized', 404, 'SESSION_NOT_FOUND');
    }

    const result = await query(`
      SELECT * FROM session_participants 
      WHERE session_id = $1 
      ORDER BY joined_at DESC
    `, [sessionId]);

    return result.rows.map(this.mapRowToParticipant);
  }

  private mapRowToSession(row: any): InterviewSession {
    return {
      id: row.id,
      cvzenInterviewId: row.cvzen_interview_id,
      sessionToken: row.session_token,
      recruiterId: row.recruiter_id,
      candidateId: row.candidate_id,
      status: row.status,
      scheduledStartTime: row.scheduled_start_time,
      actualStartTime: row.actual_start_time,
      endTime: row.end_time,
      durationMinutes: row.duration_minutes,
      roomId: row.room_id,
      settings: row.settings || {},
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToParticipant(row: any): SessionParticipant {
    return {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      userType: row.user_type,
      displayName: row.display_name,
      joinedAt: row.joined_at,
      leftAt: row.left_at,
      connectionStatus: row.connection_status,
      audioEnabled: row.audio_enabled,
      videoEnabled: row.video_enabled,
      screenSharing: row.screen_sharing,
      createdAt: row.created_at
    };
  }
}

export const sessionService = new SessionService();