import express from "express";
import { getDatabase } from "../database/connection.js";
import type { Request, Response } from "express";

const router = express.Router();

// Helper function to check if user is a recruiter
async function isRecruiter(userId: number): Promise<boolean> {
  try {
    const db = getDatabase();
    // Check recruiter_profiles table (where registration creates records)
    const result = await db.query(
      'SELECT id FROM recruiter_profiles WHERE user_id = $1',
      [userId]
    );
    const isRecruiterProfile = result.rows.length > 0;
    console.log('🔍 Recruiter status check for user', userId, ':', isRecruiterProfile);
    return isRecruiterProfile;
  } catch (error) {
    console.error('Error checking recruiter status:', error);
    return false;
  }
}

// Helper function to verify shared resume access
async function verifySharedResumeAccess(resumeId: string, shareToken?: string): Promise<boolean> {
  if (!shareToken) return false;
  
  try {
    const db = getDatabase();
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

// POST /api/shortlist - Toggle shortlist for a resume (recruiters only)
router.post("/", async (req: Request, res: Response) => {
  try {
    const { resumeId, shareToken, notes } = req.body;
    const userId = (req as any).user?.id;
    const userType = (req as any).user?.userType;
    
    console.log('🔐 Shortlist request:', { 
      resumeId, 
      hasShareToken: !!shareToken, 
      userId, 
      userType,
      userEmail: (req as any).user?.email 
    });
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Check if user is a recruiter (using the userType from authentication)
    if (userType !== 'recruiter') {
      // As fallback, also check the database for regular users who might be recruiters
      const recruiterStatus = await isRecruiter(userId);
      if (!recruiterStatus) {
        return res.status(403).json({
          success: false,
          error: 'Only recruiters can shortlist resumes'
        });
      }
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
    
    const db = getDatabase();
    
    // Check if resume exists
    const resumeCheck = await db.query(
      'SELECT id FROM resumes WHERE id = $1',
      [resumeId]
    );
    
    if (resumeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    // Check if already shortlisted (using user_id as the recruiter identifier)
    const existingShortlist = await db.query(
      'SELECT id FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2',
      [userId, resumeId]
    );
    
    console.log('📊 Existing shortlist check for user', userId, 'resume', resumeId, ':', existingShortlist.rows.length > 0);
    
    let isShortlisted: boolean;
    
    if (existingShortlist.rows.length > 0) {
      // Remove from shortlist
      await db.query(
        'DELETE FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2',
        [userId, resumeId]
      );
      
      isShortlisted = false;
      console.log('📋 Removed from shortlist by recruiter:', userId, 'Resume:', resumeId);
    } else {
      // Add to shortlist
      await db.query(
        `INSERT INTO recruiter_shortlists (recruiter_id, resume_id, share_token, notes) 
         VALUES ($1, $2, $3, $4)`,
        [userId, resumeId, shareToken, notes || '']
      );
      
      isShortlisted = true;
      console.log('📋 Added to shortlist by recruiter:', userId, 'Resume:', resumeId);
    }
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId),
        isShortlisted
      }
    });
    
  } catch (error) {
    console.error('❌ Error handling shortlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process shortlist'
    });
  }
});

// DELETE /api/shortlist - Remove from shortlist (recruiters only)
router.delete("/", async (req: Request, res: Response) => {
  try {
    const { resumeId, shareToken } = req.body;
    const userId = (req as any).user?.id;
    
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
        error: 'Only recruiters can manage shortlists'
      });
    }
    
    const db = getDatabase();
    
    await db.query(
      'DELETE FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2',
      [userId, resumeId]
    );
    
    console.log('📋 Removed from shortlist by recruiter:', userId, 'Resume:', resumeId);
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId),
        isShortlisted: false
      }
    });
    
  } catch (error) {
    console.error('❌ Error removing from shortlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from shortlist'
    });
  }
});

// GET /api/shortlist/status - Get shortlist status for a resume
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
    
    let isShortlisted = false;
    
    // Check if user is authenticated and is a recruiter
    if (userId) {
      const recruiterStatus = await isRecruiter(userId);
      if (recruiterStatus) {
        const db = getDatabase();
        const shortlistCheck = await db.query(
          'SELECT id FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2',
          [userId, resumeId]
        );
        isShortlisted = shortlistCheck.rows.length > 0;
      }
    }
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId as string),
        isShortlisted
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting shortlist status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shortlist status'
    });
  }
});

export default router;
