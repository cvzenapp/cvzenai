import express from "express";
import { getDatabase } from "../database/connection.js";
import type { Request, Response } from "express";

const router = express.Router();

// Helper function to check if user is a recruiter
async function isRecruiter(userId: number): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = $1',
      [userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking recruiter status:', error);
    return false;
  }
}

// Helper function to verify shared resume access
async function verifySharedResumeAccess(resumeId: string, shareToken?: string): Promise<boolean> {
  if (!shareToken) return false;
  
  try {
    const db = await getDatabase();
    const result = await db.query(
      'SELECT resume_id FROM resume_shares WHERE share_token = $1 AND expires_at > NOW() AND resume_id = $2',
      [shareToken, resumeId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error verifying shared resume access:', error);
    return false;
  }
}

// POST /api/upvote - Toggle upvote for a resume (recruiters only)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { resumeId, shareToken } = req.body;
    const userId = (req as any).user?.id;
    
    console.log('🔐 Upvote request:', { resumeId, hasShareToken: !!shareToken, userId });
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Check if user is a recruiter
    const recruiterStatus = await isRecruiter(userId);
    if (!recruiterStatus) {
      return res.status(403).json({
        success: false,
        error: 'Only recruiters can upvote resumes'
      });
    }
    
    // If shareToken is provided, verify access to shared resume
    if (shareToken) {
      const hasAccess = await verifySharedResumeAccess(resumeId, shareToken);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Invalid or expired share link'
        });
      }
    }
    
    const db = await getDatabase();
    
    // Check if resume exists
    const resumeCheck = await db.query(
      'SELECT id, upvotes_count FROM resumes WHERE id = $1',
      [resumeId]
    );
    
    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    const currentUpvotes = resumeCheck.rows[0].upvotes_count || 0;
    
    // Check if this recruiter has already upvoted this resume
    const existingUpvote = await db.query(
      'SELECT id FROM resume_upvotes WHERE resume_id = $1 AND user_id = $2',
      [resumeId, userId]
    );
    
    let newUpvoteCount: number;
    let hasUpvoted: boolean;
    
    if (existingUpvote.rows.length > 0) {
      // Remove upvote
      await db.query(
        'DELETE FROM resume_upvotes WHERE resume_id = $1 AND user_id = $2',
        [resumeId, userId]
      );
      
      newUpvoteCount = Math.max(0, currentUpvotes - 1);
      hasUpvoted = false;
      
      console.log('👎 Removed upvote from recruiter:', userId, 'Resume:', resumeId);
    } else {
      // Add upvote
      await db.query(
        `INSERT INTO resume_upvotes (resume_id, user_id, ip_address, user_agent, share_token) 
         VALUES ($1, $2, $3, $4, $5)`,
        [resumeId, userId, req.ip || 'unknown', req.headers['user-agent'] || '', shareToken]
      );
      
      newUpvoteCount = currentUpvotes + 1;
      hasUpvoted = true;
      
      console.log('👍 Added upvote from recruiter:', userId, 'Resume:', resumeId);
    }
    
    // Update the resume's upvote count
    await db.query(
      'UPDATE resumes SET upvotes_count = $1, updated_at = NOW() WHERE id = $2',
      [newUpvoteCount, resumeId]
    );
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId),
        upvotes: newUpvoteCount,
        hasUpvoted
      }
    });
    
  } catch (error) {
    console.error('❌ Error handling upvote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process upvote'
    });
  }
});

// GET /api/upvote/status - Get upvote status for a resume
router.get("/status", async (req: Request, res: Response) => {
  try {
    const { resumeId, shareToken } = req.query;
    const userId = (req as any).user?.id;
    
    if (!resumeId) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID is required'
      });
    }
    
    const db = await getDatabase();
    
    // Get resume upvote count
    const resumeResult = await db.query(
      'SELECT upvotes_count FROM resumes WHERE id = $1',
      [resumeId]
    );
    
    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    const upvotes = resumeResult.rows[0].upvotes_count || 0;
    let hasUpvoted = false;
    
    // Check if user has upvoted (only if authenticated)
    if (userId) {
      const upvoteCheck = await db.query(
        'SELECT id FROM resume_upvotes WHERE resume_id = $1 AND user_id = $2',
        [resumeId, userId]
      );
      hasUpvoted = upvoteCheck.rows.length > 0;
    }
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId as string),
        upvotes,
        hasUpvoted
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting upvote status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upvote status'
    });
  }
});

export default router;
