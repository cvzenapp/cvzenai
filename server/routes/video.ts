import express from "express";
import { AccessToken } from "livekit-server-sdk";
import { getDatabase } from "../database/connection.js";
import jwt from 'jsonwebtoken';
import type { Request, Response } from "express";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// LiveKit configuration
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APInYsSRZWNm2Qx';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'nC8nvMyLx4yy8bedovlx5QfIHB1fypm2aRZu1QxLfCzA';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://cvzen-interview-calls-ixqhqhqz.livekit.cloud';

// Helper function to authenticate user
async function authenticateUser(req: Request): Promise<{ userId: number; userType: string } | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.userId || decoded.id) {
      return {
        userId: parseInt(decoded.userId || decoded.id),
        userType: decoded.type || 'job_seeker'
      };
    }
    return null;
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
}

// Generate LiveKit token for interview video call
router.post("/generate-token", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { interviewId, userType, audioEnabled, videoEnabled } = req.body;

    if (!interviewId) {
      return res.status(400).json({
        success: false,
        error: 'Interview ID is required'
      });
    }

    const db = await getDatabase();

    // Verify the interview exists and user is authorized
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, candidate_id, title FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];
    const isRecruiter = interview.recruiter_id === auth.userId;
    const isCandidate = interview.candidate_id === auth.userId;

    if (!isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to join this interview'
      });
    }

    // Generate room name
    const roomName = `interview-${interviewId}`;
    
    // Create participant identity
    const participantName = isRecruiter ? `recruiter-${auth.userId}` : `candidate-${auth.userId}`;
    
    // Create LiveKit access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      name: isRecruiter ? 'Recruiter' : 'Candidate',
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = at.toJwt();

    console.log('✅ Generated LiveKit token for interview:', {
      interviewId,
      userId: auth.userId,
      userType,
      roomName,
      participantName
    });

    res.json({
      success: true,
      data: {
        token,
        roomName,
        serverUrl: LIVEKIT_URL
      }
    });

  } catch (error) {
    console.error('❌ Error generating LiveKit token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate video call token'
    });
  }
});

// Mark interview as completed
router.post("/:interviewId/complete", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { interviewId } = req.params;
    const db = await getDatabase();

    // Verify interview exists and user is authorized
    const interviewCheck = await db.query(
      'SELECT id, recruiter_id, candidate_id FROM interview_invitations WHERE id = $1',
      [interviewId]
    );

    if (interviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    const interview = interviewCheck.rows[0];
    const isRecruiter = interview.recruiter_id === auth.userId;
    const isCandidate = interview.candidate_id === auth.userId;

    if (!isRecruiter && !isCandidate) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this interview'
      });
    }

    // Update interview status to completed
    await db.query(
      'UPDATE interview_invitations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['completed', interviewId]
    );

    console.log('✅ Interview marked as completed:', {
      interviewId,
      userId: auth.userId
    });

    res.json({
      success: true,
      message: 'Interview marked as completed'
    });

  } catch (error) {
    console.error('❌ Error marking interview as completed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update interview status'
    });
  }
});

// Get video call history (placeholder for future implementation)
router.get("/history/:interviewId", async (req: Request, res: Response) => {
  try {
    const auth = await authenticateUser(req);
    
    if (!auth) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // TODO: Implement call history tracking
    res.json({
      success: true,
      data: []
    });

  } catch (error) {
    console.error('❌ Error getting call history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get call history'
    });
  }
});

export default router;