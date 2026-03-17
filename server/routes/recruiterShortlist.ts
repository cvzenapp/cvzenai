import express from "express";
import { initializeDatabase, closeDatabase } from "../database/connection.js";
import jwt from 'jsonwebtoken';
import type { Request, Response } from "express";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to authenticate recruiter and get user UUID
async function authenticateRecruiter(req: Request): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    console.log('❌ [RecruiterShortlist] No authorization token provided');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('🔍 [RecruiterShortlist] JWT decoded:', { userId: decoded.userId, type: decoded.type });
    
    // Check if this is a recruiter token
    if (decoded.type === 'recruiter' && decoded.userId) {
      // Check if userId is already a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(decoded.userId)) {
        console.log('✅ [RecruiterShortlist] Authenticated recruiter UUID:', decoded.userId);
        return decoded.userId;
      }
      
      // If it's an integer, map to known UUID (legacy token support)
      if (decoded.userId === 7 || decoded.userId === '7') {
        const recruiterUuid = '7d56be89-2f99-4dc5-abf5-5f2238e3bda0';
        console.log('✅ [RecruiterShortlist] Using known UUID for recruiter 7:', recruiterUuid);
        return recruiterUuid;
      }
      
      console.log('❌ [RecruiterShortlist] Unknown integer userId:', decoded.userId);
      return null;
    }
    console.log('❌ [RecruiterShortlist] Invalid token type or missing userId');
    return null;
  } catch (error) {
    console.error("❌ [RecruiterShortlist] JWT verification failed:", error);
    return null;
  }
}

// Add resume to recruiter's shortlist
router.post("/add", async (req: Request, res: Response) => {
  let db;
  try {
    const { resumeId, shareToken, notes } = req.body;
    const recruiterId = await authenticateRecruiter(req);
    
    console.log('🔍 Shortlist add request:', {
      recruiterId,
      resumeId,
      shareToken: shareToken?.substring(0, 10) + '...',
      hasAuth: !!recruiterId
    });
    
    if (!recruiterId) {
      console.log('❌ No recruiter ID - authentication required');
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Please log in again'
      });
    }
    
    if (!resumeId || !shareToken) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID and share token are required'
      });
    }
    
    db = await initializeDatabase();
    
    // Verify the share token is valid
    const shareCheck = await db.query(
      'SELECT resume_id FROM resume_shares WHERE share_token = $1 AND expires_at > NOW()',
      [shareToken]
    );
    
    if (shareCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired share link'
      });
    }
    
    if (shareCheck.rows[0].resume_id !== parseInt(resumeId)) {
      return res.status(400).json({
        success: false,
        error: 'Resume ID does not match share token'
      });
    }
    
    // Check if already shortlisted
    const existingShortlist = await db.query(
      'SELECT id FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2 AND share_token = $3',
      [recruiterId, resumeId, shareToken]
    );
    
    if (existingShortlist.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Resume already in shortlist',
        data: { isShortlisted: true }
      });
    }
    
    // Add to shortlist
    await db.query(
      `INSERT INTO recruiter_shortlists (recruiter_id, resume_id, share_token, notes) 
       VALUES ($1, $2, $3, $4)`,
      [recruiterId, resumeId, shareToken, notes || '']
    );
    
    // Also add to recruiter_responses table for interaction tracking
    try {
      // Get the resume owner's user_id
      const resumeOwnerResult = await db.query(
        'SELECT user_id FROM resumes WHERE id = $1',
        [resumeId]
      );
      
      if (resumeOwnerResult.rows.length > 0) {
        const resumeOwnerId = resumeOwnerResult.rows[0].user_id;
        
        console.log('🔍 Inserting recruiter response for shortlist:', {
          recruiterId,
          resumeOwnerId,
          resumeId,
          status: 'shortlisted'
        });
        
        // Insert/update recruiter response
        const insertResult = await db.query(`
          INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message)
          VALUES ($1, $2, $3, 'shortlisted', $4)
          ON CONFLICT (recruiter_id, user_id, resume_id) 
          DO UPDATE SET status = 'shortlisted', message = $4, updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [recruiterId, resumeOwnerId, parseInt(resumeId), notes || 'Added to shortlist']);
        
        console.log('✅ Added recruiter response for shortlist, ID:', insertResult.rows[0]?.id);
        
        // Send email notification to the candidate
        try {
          // Get candidate and recruiter details for email
          const candidateResult = await db.query(`
            SELECT u.email, u.first_name, u.last_name, r.title as resume_title
            FROM users u
            JOIN resumes r ON u.id = r.user_id
            WHERE r.id = $1
          `, [parseInt(resumeId)]);
          
          const recruiterResult = await db.query(`
            SELECT u.first_name, u.last_name, u.email, rp.company_name
            FROM users u
            LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
            WHERE u.id = $1
          `, [recruiterId]);
          
          if (candidateResult.rows.length > 0 && recruiterResult.rows.length > 0) {
            const candidate = candidateResult.rows[0];
            const recruiter = recruiterResult.rows[0];
            
            const { emailService } = await import('../services/emailService.js');
            
            await emailService.sendShortlistedNotification({
              candidateEmail: candidate.email,
              candidateName: `${candidate.first_name} ${candidate.last_name}`.trim(),
              recruiterName: `${recruiter.first_name} ${recruiter.last_name}`.trim(),
              companyName: recruiter.company_name || 'Company',
              resumeTitle: candidate.resume_title || 'Your Resume',
              message: notes || 'You have been shortlisted for a position.',
              dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/dashboard`
            });
            
            console.log('✅ Shortlist notification email sent to candidate');
          }
        } catch (emailError) {
          console.error('❌ Failed to send shortlist notification email:', emailError);
          // Don't fail the shortlist operation if email fails
        }
        
        // Also update any existing job applications to "shortlisted" status
        // This prevents redundancy and keeps application status in sync
        try {
          const updateApplicationResult = await db.query(`
            UPDATE job_applications 
            SET status = 'shortlisted', updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND resume_id = $2 
            AND job_id IN (
              SELECT id FROM job_postings WHERE recruiter_id = $3
            )
            AND status IN ('pending', 'reviewed')
            RETURNING id, job_id
          `, [resumeOwnerId, resumeId, recruiterId]);
          
          if (updateApplicationResult.rows.length > 0) {
            console.log('✅ Updated application status to shortlisted for applications:', 
              updateApplicationResult.rows.map(row => `${row.id} (job: ${row.job_id})`).join(', '));
          }
        } catch (appUpdateError) {
          console.error('❌ Could not update application status:', appUpdateError);
        }
      }
    } catch (responseError) {
      console.error('❌ Could not add recruiter response:', responseError);
    }
    
    console.log('✅ Resume shortlisted by recruiter:', recruiterId, 'Resume:', resumeId);
    
    res.json({
      success: true,
      message: 'Resume added to shortlist',
      data: { isShortlisted: true }
    });
    
  } catch (error) {
    console.error('❌ Error adding to shortlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add to shortlist'
    });
  }
});

// Remove resume from recruiter's shortlist
router.post("/remove", async (req: Request, res: Response) => {
  let db;
  try {
    const { resumeId, shareToken } = req.body;
    const recruiterId = await authenticateRecruiter(req);
    
    if (!recruiterId) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Please log in again'
      });
    }
    
    db = await initializeDatabase();
    
    await db.query(
      'DELETE FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2 AND share_token = $3',
      [recruiterId, resumeId, shareToken]
    );
    
    console.log('✅ Resume removed from shortlist by recruiter:', recruiterId, 'Resume:', resumeId);
    
    res.json({
      success: true,
      message: 'Resume removed from shortlist',
      data: { isShortlisted: false }
    });
    
  } catch (error) {
    console.error('❌ Error removing from shortlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove from shortlist'
    });
  }
});

// Check if resume is shortlisted by recruiter
router.get("/status/:resumeId/:shareToken", async (req: Request, res: Response) => {
  let db;
  try {
    const { resumeId, shareToken } = req.params;
    const recruiterId = await authenticateRecruiter(req);
    
    if (!recruiterId) {
      return res.json({
        success: true,
        data: { isShortlisted: false, requiresAuth: true }
      });
    }
    
    db = await initializeDatabase();
    
    // Check both shortlist table AND application status
    const shortlistCheck = await db.query(
      'SELECT id, notes FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2 AND share_token = $3',
      [recruiterId, resumeId, shareToken]
    );
    
    // Also check if there's an application with "shortlisted" status
    // Handle both cases: resume_id match OR user_id match (for legacy data with null resume_id)
    const applicationCheck = await db.query(`
      SELECT ja.id, ja.status, ja.resume_id
      FROM job_applications ja
      JOIN job_postings jp ON ja.job_id = jp.id
      WHERE jp.recruiter_id = $1 
      AND (ja.resume_id = $2 OR (ja.resume_id IS NULL AND ja.user_id IN (
        SELECT user_id FROM resumes WHERE id = $2
      )))
      AND ja.status = 'shortlisted'
      LIMIT 1
    `, [recruiterId, resumeId]);
    
    // Consider it shortlisted if EITHER condition is true
    const isShortlistedInTable = shortlistCheck.rows.length > 0;
    const isShortlistedInApplication = applicationCheck.rows.length > 0;
    const isShortlisted = isShortlistedInTable || isShortlistedInApplication;
    
    const notes = isShortlistedInTable ? shortlistCheck.rows[0].notes : 
                  isShortlistedInApplication ? 'Shortlisted via application' : '';
    
    console.log('🔍 Shortlist status check:', {
      recruiterId,
      resumeId,
      shareToken,
      shortlistRows: shortlistCheck.rows.length,
      applicationRows: applicationCheck.rows.length,
      isShortlistedInTable,
      isShortlistedInApplication,
      finalStatus: isShortlisted
    });
    
    // Additional debugging
    if (applicationCheck.rows.length > 0) {
      console.log('📋 Found shortlisted applications:', applicationCheck.rows);
    }
    if (shortlistCheck.rows.length > 0) {
      console.log('📋 Found shortlist entries:', shortlistCheck.rows);
    }
    
    res.json({
      success: true,
      data: { 
        isShortlisted, 
        notes,
        requiresAuth: false 
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking shortlist status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check shortlist status'
    });
  }
});

// Get recruiter's shortlisted resumes
router.get("/my-shortlist", async (req: Request, res: Response) => {
  let db;
  try {
    console.log('🔍 [RecruiterShortlist] GET /my-shortlist request received');
    console.log('🔍 [RecruiterShortlist] Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 [RecruiterShortlist] Authorization header:', req.headers.authorization);
    
    const recruiterId = await authenticateRecruiter(req);
    
    console.log('🔍 [RecruiterShortlist] Recruiter ID after auth:', recruiterId);
    
    if (!recruiterId) {
      console.log('❌ [RecruiterShortlist] No recruiter ID - authentication failed');
      return res.status(401).json({
        success: false,
        error: 'User not found',
        message: 'Please log in again'
      });
    }
    
    db = await initializeDatabase();
    
    // First, just get the shortlist entries without joins to see if that works
    const shortlist = await db.query(`
      SELECT 
        id as shortlist_id,
        notes,
        created_at as shortlisted_at,
        resume_id,
        share_token,
        recruiter_id
      FROM recruiter_shortlists
      WHERE recruiter_id = $1
      ORDER BY created_at DESC
    `, [recruiterId]);
    
    console.log(`✅ Found ${shortlist.rows.length} shortlisted items for recruiter ${recruiterId}`);
    
    // If no shortlisted items, return empty array
    if (shortlist.rows.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
      
      // Now try to enrich with resume and user data
      const enrichedResults = [];
      for (const item of shortlist.rows) {
        try {
          // Get resume data
          const resumeResult = await db.query(`
            SELECT id, title, personal_info, summary, upvotes_count, user_id
            FROM resumes
            WHERE id = $1
          `, [item.resume_id]);
        
          const resume = resumeResult.rows[0];
          
          // Get user data
          let user = null;
          if (resume && resume.user_id) {
            const userResult = await db.query(`
              SELECT id, email, first_name, last_name
              FROM users
              WHERE id = $1
            `, [resume.user_id]);
            user = userResult.rows[0];
          }
          
          enrichedResults.push({
            shortlistId: item.shortlist_id,
            resumeId: item.resume_id,
            title: resume?.title || 'Untitled Resume',
            personalInfo: resume?.personal_info,
            summary: resume?.summary,
            upvotes: resume?.upvotes_count || 0,
            candidate: {
              id: user?.id || null,
              name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Unknown',
              email: user?.email || ''
            },
            notes: item.notes,
            shortlistedAt: item.shortlisted_at,
            shareToken: item.share_token
          });
        } catch (enrichError) {
          console.error(`⚠️ Error enriching shortlist item ${item.shortlist_id}:`, enrichError);
          // Add basic data even if enrichment fails
          enrichedResults.push({
            shortlistId: item.shortlist_id,
            resumeId: item.resume_id,
            title: 'Untitled Resume',
            personalInfo: null,
            summary: null,
            upvotes: 0,
            candidate: {
              id: null,
              name: 'Unknown',
              email: ''
            },
            notes: item.notes,
            shortlistedAt: item.shortlisted_at,
            shareToken: item.share_token
          });
        }
      }
    
      res.json({
        success: true,
        data: enrichedResults
      });
    
  } catch (error) {
    console.error('❌ Error getting shortlist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shortlist',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;