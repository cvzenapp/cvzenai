import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/connection';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper function to authenticate recruiter and get user UUID
async function authenticateRecruiter(req: Request): Promise<string | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    console.log('[RecruiterApplications] No token found in authorization header');
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('[RecruiterApplications] Decoded token:', { 
      type: decoded.type, 
      userId: decoded.userId,
      userIdType: typeof decoded.userId 
    });
    
    // Check if this is a recruiter token
    if (decoded.type === 'recruiter' && decoded.userId) {
      // Check if userId is already a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(decoded.userId)) {
        console.log('[RecruiterApplications] Authenticated recruiter UUID:', decoded.userId);
        return decoded.userId;
      }
      
      // If it's an integer, we need to look up the UUID
      // This is for legacy tokens that stored integer IDs
      console.log('[RecruiterApplications] Token contains integer ID, looking up UUID...');
      const { getDatabase } = await import('../database/connection.js');
      const db = await getDatabase();
      
      // For now, return the hardcoded UUID for recruiter ID 7
      // TODO: Fix JWT generation to use UUIDs
      if (decoded.userId === 7 || decoded.userId === '7') {
        const recruiterUuid = '7d56be89-2f99-4dc5-abf5-5f2238e3bda0';
        console.log('[RecruiterApplications] Using known UUID for recruiter 7:', recruiterUuid);
        return recruiterUuid;
      }
      
      console.log('[RecruiterApplications] Unknown integer userId:', decoded.userId);
      return null;
    } else {
      console.log('[RecruiterApplications] Token is not a recruiter token or missing userId', {
        hasType: !!decoded.type,
        type: decoded.type,
        hasUserId: !!decoded.userId
      });
    }
    return null;
  } catch (error) {
    console.error("[RecruiterApplications] JWT verification failed:", error);
    return null;
  }
}

// Get applications for recruiter's job postings
router.get('/applications', async (req: Request, res: Response) => {
  try {
    const recruiterUserId = await authenticateRecruiter(req);
    if (!recruiterUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { jobId, status } = req.query;
    const db = await getDatabase();

    try {
      let query = `
        SELECT 
          ja.*,
          jp.title as job_title,
          jp.department,
          jp.location as job_location,
          jp.company as company_name,
          COALESCE(
            ja.guest_name,
            res.personal_info->>'fullName',
            u.email
          ) as applicant_name,
          COALESCE(ja.guest_email, u.email) as applicant_email,
          res.title as resume_title,
          ja.shared_token,
          ja.resume_file_url,
          CASE WHEN ja.user_id IS NULL THEN true ELSE false END as is_guest
        FROM job_applications ja
        INNER JOIN job_postings jp ON ja.job_id = jp.id
        LEFT JOIN users u ON ja.user_id = u.id
        LEFT JOIN resumes res ON ja.user_id = res.user_id
        WHERE jp.recruiter_id = $1
      `;

      const params: any[] = [recruiterUserId];
      let paramIndex = 2;

      if (jobId) {
        query += ` AND ja.job_id = $${paramIndex}`;
        params.push(jobId);
        paramIndex++;
      }

      if (status) {
        query += ` AND ja.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      query += ' ORDER BY ja.applied_at DESC';

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch applications' });
    }
  } catch (error) {
    console.error('Error in applications route:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get single application details
router.get('/applications/:id', async (req: Request, res: Response) => {
  try {
    const recruiterUserId = await authenticateRecruiter(req);
    if (!recruiterUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const db = await getDatabase();

    try {
      const result = await db.query(
        `
        SELECT 
          ja.*,
          jp.title as job_title,
          jp.company as company_name,
          COALESCE(
            ja.guest_name,
            res.personal_info->>'fullName',
            u.email
          ) as applicant_name,
          COALESCE(ja.guest_email, u.email) as applicant_email,
          res.personal_info->>'phone' as applicant_phone,
          res.title as resume_title,
          res.id as resume_id,
          ja.resume_file_url,
          CASE WHEN ja.user_id IS NULL THEN true ELSE false END as is_guest
        FROM job_applications ja
        INNER JOIN job_postings jp ON ja.job_id = jp.id
        LEFT JOIN users u ON ja.user_id = u.id
        LEFT JOIN resumes res ON ja.user_id = res.user_id
        WHERE ja.id = $1 AND jp.recruiter_id = $2
        `,
        [id, recruiterUserId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch application' });
    }
  } catch (error) {
    console.error('Error in application details route:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update application status
router.patch('/applications/:id/status', async (req: Request, res: Response) => {
  try {
    const recruiterUserId = await authenticateRecruiter(req);
    if (!recruiterUserId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const db = await getDatabase();

    try {
      // Verify recruiter owns this job posting
      const checkResult = await db.query(
        `
        SELECT ja.id 
        FROM job_applications ja
        INNER JOIN job_postings jp ON ja.job_id = jp.id
        WHERE ja.id = $1 AND jp.recruiter_id = $2
        `,
        [id, recruiterUserId]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      const result = await db.query(
        `
        UPDATE job_applications 
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
        `,
        [status, id]
      );

      // Also add/update recruiter_responses for interaction tracking
      try {
        const application = result.rows[0];
        
        console.log('🔍 Adding recruiter response for status update:', {
          recruiterId: recruiterUserId,
          userId: application.user_id,
          resumeId: application.resume_id,
          status: status,
          applicationId: application.id
        });
        
        // If resume_id is null, try to find the user's resume
        let actualResumeId = application.resume_id;
        if (!actualResumeId) {
          console.log('⚠️ Application has null resume_id, trying to find user resume...');
          const userResumeResult = await db.query(
            'SELECT id FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [application.user_id]
          );
          if (userResumeResult.rows.length > 0) {
            actualResumeId = userResumeResult.rows[0].id;
            console.log('✅ Found user resume:', actualResumeId);
            
            // Update the application with the correct resume_id
            await db.query(
              'UPDATE job_applications SET resume_id = $1 WHERE id = $2',
              [actualResumeId, application.id]
            );
            console.log('✅ Updated application with resume_id');
          }
        }
        
        // Insert/update recruiter response
        const responseResult = await db.query(`
          INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (recruiter_id, user_id, resume_id) 
          DO UPDATE SET status = $4, message = $5, updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          recruiterUserId, 
          application.user_id, 
          actualResumeId, // Use the actual resume ID (fixed if it was null)
          status, 
          `Application status updated to ${status}`
        ]);
        
        console.log('✅ Added recruiter response for status update, ID:', responseResult.rows[0]?.id);
        
        // Coordinate with shortlist based on status
        if (status === 'shortlisted') {
          // Add to shortlist if not already there
          try {
            // Check if there's a valid share token for this resume
            const shareTokenResult = await db.query(
              'SELECT share_token FROM resume_shares WHERE resume_id = $1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 1',
              [actualResumeId]
            );
            
            if (shareTokenResult.rows.length > 0) {
              const shareToken = shareTokenResult.rows[0].share_token;
              
              // Check if already in shortlist
              const existingShortlist = await db.query(
                'SELECT id FROM recruiter_shortlists WHERE recruiter_id = $1 AND resume_id = $2',
                [recruiterUserId, actualResumeId]
              );
              
              if (existingShortlist.rows.length === 0) {
                // Add to shortlist if not already there
                await db.query(`
                  INSERT INTO recruiter_shortlists (recruiter_id, resume_id, share_token, notes)
                  VALUES ($1, $2, $3, $4)
                `, [
                  recruiterUserId, 
                  actualResumeId, 
                  shareToken, 
                  `Shortlisted via application status update`
                ]);
                
                console.log('✅ Added to shortlist via application status update');
              } else {
                console.log('ℹ️ Already in shortlist');
              }
            } else {
              console.log('⚠️ No valid share token found for resume:', actualResumeId);
            }
          } catch (shortlistError) {
            console.error('❌ Could not add to shortlist:', shortlistError);
          }
        } else {
          // If status is NOT "shortlisted", remove from shortlist to keep them in sync
          // Handle both resume_id match and user_id match for legacy data
          try {
            const removeResult = await db.query(`
              DELETE FROM recruiter_shortlists 
              WHERE recruiter_id = $1 
              AND (resume_id = $2 OR resume_id IN (
                SELECT id FROM resumes WHERE user_id = $3
              ))
              RETURNING id
            `, [recruiterUserId, actualResumeId, application.user_id]);
            
            if (removeResult.rows.length > 0) {
              console.log('✅ Removed from shortlist due to status change to:', status, 'Removed entries:', removeResult.rows.length);
            } else {
              console.log('ℹ️ No shortlist entries to remove for status change to:', status);
            }
          } catch (removeError) {
            console.error('❌ Could not remove from shortlist:', removeError);
          }
        }
      } catch (responseError) {
        console.error('❌ Could not add recruiter response for status update:', responseError);
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      res.status(500).json({ success: false, error: 'Failed to update application status' });
    }
  } catch (error) {
    console.error('Error in status update route:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
