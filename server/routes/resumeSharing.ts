import express from "express";
import { getDatabase } from "../database/connection.js";
import crypto from "crypto";
import type { Request, Response } from "express";

const router = express.Router();

// Test route to check if router is working
router.get("/test", (_req: Request, res: Response) => {
  res.json({ success: true, message: "Resume sharing router is working!" });
});

// Test database connection
router.get("/test-db", async (req: Request, res: Response) => {
  try {
    console.log('🔍 Testing database connection...');
    
    const db = await getDatabase();
    console.log('✅ Got database instance');
    
    // Simple query to test connection
    const result = await db.query('SELECT NOW() as current_time, version() as db_version');
    console.log('✅ Database query successful');
    
    res.json({
        success: true,
        message: "Database connection working!",
        data: {
          currentTime: result.rows[0].current_time,
          dbVersion: result.rows[0].db_version
        }
      });
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      message: error.message,
      details: {
        code: error.code,
        detail: error.detail
      }
    });
  }
});

// Generate secure sharing link for a resume
router.post("/generate/:resumeId", async (req: Request, res: Response) => {
  console.log('🚀 ROUTE HIT: /generate/:resumeId');
  try {
    const { resumeId } = req.params;
    console.log('📋 Resume ID:', resumeId);
    
    const expiresAt = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
    
    // Store the share token with resume ID in PostgreSQL database
    const db = await getDatabase();
    console.log('🔗 Got database connection');
    
    // Get the resume to find the user_id
    console.log('🔍 Looking up resume:', resumeId);
    const resumeResult = await db.query(`
      SELECT user_id, title FROM resumes WHERE id = $1
    `, [resumeId]);
    
    console.log('📊 Resume query result:', resumeResult.rows.length, 'rows');
    
    if (resumeResult.rows.length === 0) {
      console.log('❌ Resume not found for ID:', resumeId);
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    const userId = resumeResult.rows[0].user_id;
    const resumeTitle = resumeResult.rows[0].title;
    console.log('👤 Found user ID:', userId, 'for resume:', resumeTitle);
    
    // Get user's name to generate slug
    const userResult = await db.query(`
      SELECT r.personal_info, u.email 
      FROM resumes r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [resumeId]);
    
    const personalInfo = typeof userResult.rows[0].personal_info === 'string'
      ? JSON.parse(userResult.rows[0].personal_info)
      : userResult.rows[0].personal_info;
    
    const userName = personalInfo?.name || 
                     personalInfo?.fullName || 
                     `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim() ||
                     userResult.rows[0].email.split('@')[0];
    
    // Generate slug-based token
    const { generateUniqueSlug } = await import('../lib/slugGenerator.js');
    const shareToken = await generateUniqueSlug(db, userName);
    console.log('🔑 Generated slug:', shareToken);
    
    // Check if a share link already exists for this resume
    console.log('🔍 Checking for existing share link...');
    
    // Try with user_id first (if column exists), fallback to just resume_id
    let existingShareResult;
    try {
      existingShareResult = await db.query(`
        SELECT share_token, expires_at FROM resume_shares 
        WHERE resume_id = $1 AND user_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      `, [resumeId, userId]);
    } catch (error) {
      // If user_id column doesn't exist, try without it
      console.log('⚠️ user_id column may not exist, trying without it...');
      existingShareResult = await db.query(`
        SELECT share_token, expires_at FROM resume_shares 
        WHERE resume_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [resumeId]);
    }
    
    let finalShareToken = shareToken;
    let finalExpiresAt = expiresAt;
    
    if (existingShareResult.rows.length > 0) {
      const existingShare = existingShareResult.rows[0];
      const existingExpiresAt = new Date(existingShare.expires_at);
      const now = new Date();
      
      // If existing share is still valid (not expired), return it
      if (existingExpiresAt > now) {
        console.log('✅ Found valid existing share link, returning it');
        finalShareToken = existingShare.share_token;
        finalExpiresAt = existingExpiresAt;
      } else {
        // Update the existing record with new token and expiry
        console.log('🔄 Updating expired share link...');
        try {
          await db.query(`
            UPDATE resume_shares 
            SET share_token = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP
            WHERE resume_id = $3 AND user_id = $4
          `, [shareToken, expiresAt, resumeId, userId]);
          console.log('✅ Updated existing share record');
        } catch (error) {
          // Fallback without user_id if column doesn't exist
          console.log('⚠️ Updating without user_id...');
          await db.query(`
            UPDATE resume_shares 
            SET share_token = $1, expires_at = $2, created_at = CURRENT_TIMESTAMP
            WHERE resume_id = $3
          `, [shareToken, expiresAt, resumeId]);
          console.log('✅ Updated existing share record (without user_id)');
        }
      }
    } else {
      // Insert new share record
      console.log('💾 Inserting new share record...');
      await db.query(`
        INSERT INTO resume_shares (share_token, resume_id, user_id, expires_at)
        VALUES ($1, $2, $3, $4)
      `, [shareToken, resumeId, userId, expiresAt]);
      console.log('✅ New share record inserted');
    }
    
    console.log(`✅ Share token ready for resume ${resumeId} (user ${userId}): ${finalShareToken.substring(0, 8)}...`);
    
    // Debug request headers
    console.log('🔍 Request headers for share URL generation:', {
      protocol: req.protocol,
      host: req.get('host'),
      'x-forwarded-host': req.get('x-forwarded-host'),
      'x-forwarded-proto': req.get('x-forwarded-proto'),
      origin: req.get('origin'),
      referer: req.get('referer')
    });
    
    // Use the correct host - prefer x-forwarded-host if available (from proxy)
    const host = req.get('x-forwarded-host') || req.get('host');
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    
    const shareUrl = `${protocol}://${host}/shared/resume/${finalShareToken}`;
    console.log('🔗 Generated share URL:', shareUrl);
    
    res.json({
      success: true,
      data: {
        shareUrl,
        shareToken: finalShareToken,
        expiresAt: finalExpiresAt,
        resumeTitle: resumeTitle || "Resume"
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating share link:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to generate share link',
        message: error.message || 'Unknown error occurred'
      });
    }
  }
});

// Get resume by share token (public access)
router.get("/resume/:shareToken", async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    
    console.log(`🔍 Looking up shared resume with token: ${shareToken.substring(0, 8)}...`);
    
    if (!shareToken || shareToken.length < 16) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired share link'
      });
    }
    
    const db = await getDatabase();
    
    // First, ensure the table has all required columns (skip for now to avoid hanging)
    console.log('⚠️ Skipping table alterations to avoid hanging');
    
    // Look up the share token and get the resume ID using database connection
    console.log('🔍 Querying share token from database...');
    const shareResult = await db.query(`
      SELECT resume_id, expires_at, 
             COALESCE(is_active, true) as is_active, 
             COALESCE(view_count, 0) as view_count
      FROM resume_shares 
      WHERE share_token = $1 AND COALESCE(is_active, true) = true
    `, [shareToken]);
    
    if (shareResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired share link'
      });
    }
    
    const shareRecord = shareResult.rows[0];
    
    // Check if the share link has expired (only if expires_at is set)
    if (shareRecord.expires_at) {
      const now = new Date();
      const expiresAt = new Date(shareRecord.expires_at);
      if (now > expiresAt) {
        return res.status(404).json({
          success: false,
          error: 'This share link has expired'
        });
      }
    }
    
    // Increment view count in both tables (fire and forget, don't wait)
    db.query(`
      UPDATE resume_shares 
      SET view_count = view_count + 1 
      WHERE share_token = $1
    `, [shareToken]).catch((err: any) => {
      console.warn('Could not update resume_shares view count:', err.message);
    });
    
    // Also increment view count in resumes table for dashboard stats
    db.query(`
      UPDATE resumes 
      SET view_count = COALESCE(view_count, 0) + 1 
      WHERE id = $1
    `, [shareRecord.resume_id]).catch((err: any) => {
      console.warn('Could not update resumes view count:', err.message);
    });
    
    // Fetch the actual resume data using database connection
    console.log('🔍 Fetching resume data for ID:', shareRecord.resume_id);
    const resumeResult = await db.query(`
      SELECT 
        r.id,
        r.user_id,
        r.title,
        r.personal_info,
        r.summary,
        r.objective,
        r.skills,
        r.experience,
        r.education,
        r.projects,
        r.template_id,
        r.view_count,
        r.download_count,
        r.upvotes_count,
        r.created_at,
        r.updated_at,
        u.first_name, 
        u.last_name, 
        u.email as user_email,
        u.avatar
      FROM resumes r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [shareRecord.resume_id]);
    
    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }
    
    const resumeData = resumeResult.rows[0];
    
    // Parse JSONB fields from the database
    const parseJsonField = (field: any) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          console.warn('Failed to parse JSON field:', field);
          return field;
        }
      }
      return field || [];
    };
    
    console.log('📊 Raw resume data from DB:', {
      id: resumeData.id,
      title: resumeData.title,
      hasPersonalInfo: !!resumeData.personal_info,
      hasSummary: !!resumeData.summary,
      summaryValue: resumeData.summary,
      summaryType: typeof resumeData.summary,
      hasSkills: !!resumeData.skills,
      hasExperience: !!resumeData.experience,
      hasEducation: !!resumeData.education,
      hasProjects: !!resumeData.projects
    });
    
    // Load customizations for this resume - CRITICAL for proper display
    let templateCustomizations = null;
    
    console.log('🎨 [CUSTOMIZATION] Loading customizations for resume...');
    console.log('🔍 [CUSTOMIZATION] Resume ID:', resumeData.id);
    console.log('🔍 [CUSTOMIZATION] Resume user_id:', resumeData.user_id);
    console.log('🔍 [CUSTOMIZATION] Resume template_id:', resumeData.template_id);
    
    // Load from resume_customizations table (correct table name and column)
    try {
      const resumeCustomizationResult = await db.query(`
        SELECT customization_data FROM resume_customizations 
        WHERE resume_id = $1
        ORDER BY updated_at DESC
        LIMIT 1
      `, [resumeData.id]);
      
      if (resumeCustomizationResult.rows.length > 0) {
        const customizationData = parseJsonField(resumeCustomizationResult.rows[0].customization_data);
        console.log('✅ [CUSTOMIZATION] Found resume-specific customizations:', customizationData);
        
        // Convert to expected format
        templateCustomizations = {
          id: -1, // Indicate this is from resume_customizations
          templateId: resumeData.template_id || 'tech-modern-1',
          userId: resumeData.user_id,
          name: 'Resume Customization',
          colors: customizationData?.colors || {},
          typography: customizationData?.typography || {},
          layout: customizationData?.layout || {},
          sections: customizationData?.sections || {},
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        console.log('✅ [CUSTOMIZATION] Converted customization:', {
          hasColors: !!templateCustomizations.colors && Object.keys(templateCustomizations.colors).length > 0,
          hasTypography: !!templateCustomizations.typography && Object.keys(templateCustomizations.typography).length > 0,
          hasLayout: !!templateCustomizations.layout && Object.keys(templateCustomizations.layout).length > 0,
          colors: templateCustomizations.colors,
          typography: templateCustomizations.typography,
          layout: templateCustomizations.layout
        });
      } else {
        console.log('ℹ️ [CUSTOMIZATION] No resume-specific customizations found in database');
      }
    } catch (resumeCustomError) {
      console.error('❌ [CUSTOMIZATION] Error loading resume customizations:', resumeCustomError.message);
      console.error('❌ [CUSTOMIZATION] Stack:', resumeCustomError.stack);
    }
    
    // Log final customization state
    if (templateCustomizations) {
      console.log('✅ [CUSTOMIZATION] Final customization object ready to send:', {
        id: templateCustomizations.id,
        templateId: templateCustomizations.templateId,
        name: templateCustomizations.name,
        hasColors: !!templateCustomizations.colors,
        hasTypography: !!templateCustomizations.typography,
        hasLayout: !!templateCustomizations.layout
      });
    } else {
      console.log('⚠️ [CUSTOMIZATION] No customizations found - shared resume will use default styling');
    }

    // Parse personal_info JSONB field
    const personalInfo = parseJsonField(resumeData.personal_info);
    
    // Format the response to match the expected Resume interface
    const formattedResume = {
      id: resumeData.id,
      title: resumeData.title,
      personalInfo: {
        name: personalInfo?.name || personalInfo?.fullName || `${resumeData.first_name || ''} ${resumeData.last_name || ''}`.trim() || 'User',
        title: personalInfo?.title || 'Professional',
        email: personalInfo?.email || resumeData.user_email || '',
        phone: personalInfo?.phone || '',
        location: personalInfo?.location || '',
        website: personalInfo?.website || personalInfo?.portfolioUrl || '',
        linkedin: personalInfo?.linkedin || personalInfo?.linkedinUrl || '',
        github: personalInfo?.github || personalInfo?.githubUrl || '',
        avatar: resumeData.avatar || personalInfo?.avatar || ''
      },
      summary: resumeData.summary || '',
      objective: resumeData.objective || '',
      skills: (() => {
        const skillsData = parseJsonField(resumeData.skills);
        // Use the same parsing logic as the main resume route
        if (!skillsData) return [];
        
        // New format: { skills: [...], categories: {...} }
        if (skillsData && typeof skillsData === 'object' && 'skills' in skillsData) {
          return skillsData.skills || [];
        }
        
        // Old format: just an array
        if (Array.isArray(skillsData)) {
          return skillsData;
        }
        
        return [];
      })(),
      experiences: parseJsonField(resumeData.experience),
      education: parseJsonField(resumeData.education),
      projects: parseJsonField(resumeData.projects),
      upvotes: 0, // Will be loaded separately
      shareToken,
      createdAt: resumeData.created_at,
      updatedAt: resumeData.updated_at
    };
    
    console.log('📦 Formatted resume data:', {
      id: formattedResume.id,
      name: formattedResume.personalInfo.name,
      summary: formattedResume.summary,
      summaryLength: formattedResume.summary?.length || 0,
      skillsCount: formattedResume.skills?.length || 0,
      experiencesCount: formattedResume.experiences?.length || 0,
      educationCount: formattedResume.education?.length || 0,
      projectsCount: formattedResume.projects?.length || 0
    });

    console.log(`✅ Found shared resume: ${formattedResume.personalInfo.name} (ID: ${resumeData.id})`);
    
    // CRITICAL: Log what we're about to send
    console.log('📤 [RESPONSE] About to send response with customization:', {
      hasCustomization: !!templateCustomizations,
      customizationId: templateCustomizations?.id,
      customizationName: templateCustomizations?.name,
      customizationKeys: templateCustomizations ? Object.keys(templateCustomizations) : []
    });
    
    const responseData = {
      ...formattedResume,
      templateCustomization: templateCustomizations
    };
    
    console.log('📤 [RESPONSE] Full response data keys:', Object.keys(responseData));
    console.log('📤 [RESPONSE] templateCustomization in response:', !!responseData.templateCustomization);
    
    res.json({
      success: true,
      data: responseData
    });
    
  } catch (error) {
    console.error('❌ Error getting shared resume:', error);
    
    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to load shared resume',
        message: error.message || 'Unknown error occurred'
      });
    }
  }
});

// Track PDF download for shared resume
router.post("/download/:shareToken", async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    
    if (!shareToken || shareToken.length < 16) {
      return res.status(404).json({
        success: false,
        error: 'Invalid share token'
      });
    }
    
    const db = await getDatabase();
    
    // Look up the share token and get the resume ID
    const shareResult = await db.query(`
      SELECT resume_id FROM resume_shares 
      WHERE share_token = $1 AND COALESCE(is_active, true) = true
    `, [shareToken]);
    
    if (shareResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid share token'
      });
    }
    
    const resumeId = shareResult.rows[0].resume_id;
    
    // Increment download count in resumes table for dashboard stats
    await db.query(`
      UPDATE resumes 
      SET download_count = COALESCE(download_count, 0) + 1 
      WHERE id = $1
    `, [resumeId]);
    
    console.log('📥 Download tracked for resume:', resumeId);
    
    res.json({
      success: true,
      message: 'Download tracked'
    });
    
  } catch (error) {
    console.error('❌ Error tracking download:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track download'
    });
  }
});

export default router;