import express from "express";
import { getDatabase } from "../database/connection.js";
import type { Request, Response } from "express";

const router = express.Router();

// Helper function to get client IP address
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  let ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;
  
  // Convert IPv6 localhost to IPv4 for consistency
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }
  
  return ip || '127.0.0.1';
}

// POST /api/resume-upvotes/:resumeId - Toggle upvote for a resume
router.post("/:resumeId", async (req: Request, res: Response) => {
  const db = await getDatabase();
  
  try {
    const { resumeId } = req.params;
    const clientIP = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    
    // Get user ID if authenticated (optional)
    const userId = (req as any).user?.id || null;
    
    console.log('👍 Processing upvote request:', {
      resumeId,
      clientIP: clientIP === '127.0.0.1' ? 'localhost' : clientIP.substring(0, 8) + '...',
      userId
    });
    
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
    
    // Check if this IP has already upvoted this resume
    const existingUpvote = await db.query(
      'SELECT id FROM resume_upvotes WHERE resume_id = $1 AND ip_address = $2',
      [resumeId, clientIP]
    );
    
    if (existingUpvote.rows.length > 0) {
      // Already upvoted - return current state without incrementing
      return res.json({
        success: true,
        message: 'Already upvoted',
        data: {
          resumeId: parseInt(resumeId),
          upvotes: currentUpvotes,
          hasUpvoted: true
        }
      });
    }
    
    // Add upvote
    await db.query(
      `INSERT INTO resume_upvotes (resume_id, user_id, ip_address, user_agent, created_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [resumeId, userId, clientIP, userAgent]
    );
    
    const newUpvoteCount = currentUpvotes + 1;
    
    // Update the resume's upvote count
    await db.query(
      'UPDATE resumes SET upvotes_count = $1, updated_at = NOW() WHERE id = $2',
      [newUpvoteCount, resumeId]
    );
    
    // Also add to recruiter_responses table for interaction tracking (if user is authenticated)
    if (userId) {
      try {
        // Get the resume owner's user_id
        const resumeOwnerResult = await db.query(
          'SELECT user_id FROM resumes WHERE id = $1',
          [resumeId]
        );
        
        if (resumeOwnerResult.rows.length > 0) {
          const resumeOwnerId = resumeOwnerResult.rows[0].user_id;
          
          console.log('🔍 Inserting recruiter response:', {
            recruiterId: userId,
            resumeOwnerId,
            resumeId,
            status: 'liked'
          });
          
          // Insert/update recruiter response
          const insertResult = await db.query(`
            INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message)
            VALUES ($1, $2, $3, 'liked', 'Upvoted your resume')
            ON CONFLICT (recruiter_id, user_id, resume_id) 
            DO UPDATE SET status = 'liked', message = 'Upvoted your resume', updated_at = CURRENT_TIMESTAMP
            RETURNING id
          `, [userId, resumeOwnerId, resumeId]);
          
          console.log('✅ Added recruiter response for upvote, ID:', insertResult.rows[0]?.id);
        }
      } catch (responseError) {
        console.error('❌ Could not add recruiter response:', responseError);
      }
    }
    
    console.log('✅ Upvote added successfully. New count:', newUpvoteCount);
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId),
        upvotes: newUpvoteCount,
        hasUpvoted: true
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

// GET /api/resume-upvotes/:resumeId - Get upvote status for a resume
router.get("/:resumeId", async (req: Request, res: Response) => {
  const db = await getDatabase();
  
  try {
    const { resumeId } = req.params;
    const clientIP = getClientIP(req);
    
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
    
    // Check if this IP has upvoted
    const upvoteCheck = await db.query(
      'SELECT id FROM resume_upvotes WHERE resume_id = $1 AND ip_address = $2',
      [resumeId, clientIP]
    );
    
    const hasUpvoted = upvoteCheck.rows.length > 0;
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId),
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

// GET /api/resume-upvotes/:resumeId/stats - Get detailed upvote statistics
router.get("/:resumeId/stats", async (req: Request, res: Response) => {
  try {
    const { resumeId } = req.params;
    const db = await getDatabase();
    
    // Get upvote statistics
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_upvotes,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT user_id) as unique_users,
        DATE_TRUNC('day', created_at) as date,
        COUNT(*) as daily_count
      FROM resume_upvotes 
      WHERE resume_id = $1
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date DESC
      LIMIT 30
    `, [resumeId]);
    
    const totalStats = await db.query(`
      SELECT 
        COUNT(*) as total_upvotes,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT user_id) as unique_users
      FROM resume_upvotes 
      WHERE resume_id = $1
    `, [resumeId]);
    
    res.json({
      success: true,
      data: {
        resumeId: parseInt(resumeId),
        totalStats: totalStats.rows[0],
        dailyStats: stats.rows
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting upvote stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get upvote statistics'
    });
  }
});

export default router;