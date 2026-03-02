import express from "express";
import { getDatabase } from "../database/connection.js";

const router = express.Router();

// Get dashboard statistics for a user
router.get("/stats/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    // Get basic resume stats
    const resumeStatsResult = await db.query(
      `
      SELECT 
        COUNT(*)::int as "totalResumes",
        COALESCE(SUM(view_count), 0)::int as "totalViews",
        COALESCE(SUM(download_count), 0)::int as "totalDownloads"
      FROM resumes 
      WHERE user_id = $1
    `,
      [userId]
    );
    const resumeStats = resumeStatsResult.rows[0] || {
      totalResumes: 0,
      totalViews: 0,
      totalDownloads: 0
    };

    // Get recruiter response stats (handle missing table gracefully)
    let recruiterStats = { recruiterResponses: 0 };
    try {
      const recruiterStatsResult = await db.query(
        `
        SELECT 
          COUNT(*)::int as "recruiterResponses"
        FROM recruiter_responses 
        WHERE user_id = $1
      `,
        [userId]
      );
      recruiterStats = recruiterStatsResult.rows[0] || {
        recruiterResponses: 0
      };
    } catch (error) {
      console.warn('recruiter_responses table not found, defaulting to 0 responses');
      recruiterStats = { recruiterResponses: 0 };
    }

    // Get actual upvotes count from resume_upvotes table
    const upvotesResult = await db.query(
      `
      SELECT COUNT(*)::int as "upvotesReceived"
      FROM resume_upvotes ru
      JOIN resumes r ON ru.resume_id = r.id
      WHERE r.user_id = $1
    `,
      [userId]
    );
    const upvotesStats = upvotesResult.rows[0] || { upvotesReceived: 0 };

    // Get actual shortlist count from recruiter_shortlists table
    const shortlistResult = await db.query(
      `
      SELECT COUNT(*)::int as "shortlistCount"
      FROM recruiter_shortlists rs
      JOIN resumes r ON rs.resume_id = r.id
      WHERE r.user_id = $1
    `,
      [userId]
    );
    const shortlistStats = shortlistResult.rows[0] || { shortlistCount: 0 };

    // Get likes count from recruiter_responses (handle missing table gracefully)
    let likesCount = { likesReceived: 0 };
    try {
      const likesCountResult = await db.query(
        `
        SELECT COUNT(*)::int as "likesReceived"
        FROM recruiter_responses rr
        JOIN resumes r ON rr.resume_id = r.resume_id
        WHERE r.user_id = $1 AND rr.status = 'liked'
      `,
        [userId]
      );
      likesCount = likesCountResult.rows[0] || { likesReceived: 0 };
    } catch (error) {
      console.warn('recruiter_responses table not found, defaulting to 0 likes');
      likesCount = { likesReceived: 0 };
    }

    // Get referral count (handle missing table gracefully)
    let referralStats = { referralCount: 0, successfulReferrals: 0 };
    try {
      const referralStatsResult = await db.query(
        `
        SELECT 
          COUNT(*)::int as "referralCount",
          COUNT(CASE WHEN status = 'paid_user' THEN 1 END)::int as "successfulReferrals"
        FROM referrals 
        WHERE referrer_id = $1
      `,
        [userId]
      );
      referralStats = referralStatsResult.rows[0] || {
        referralCount: 0,
        successfulReferrals: 0
      };
    } catch (error) {
      console.warn('referrals table not found, defaulting to 0 referrals');
      referralStats = { referralCount: 0, successfulReferrals: 0 };
    }

    // Calculate additional metrics
    const profileViews = Math.floor((resumeStats.totalViews || 0) * 0.3); // Estimate
    const avgRating = 4.7; // Mock rating
    const completionRate = 85; // Mock completion rate
    let interviewsScheduled = { count: 0 };
    try {
      const interviewsScheduledResult = await db.query(
        `
        SELECT COUNT(*)::int as count
        FROM recruiter_responses 
        WHERE user_id = $1 AND status = 'interview_scheduled'
      `,
        [userId]
      );
      interviewsScheduled = interviewsScheduledResult.rows[0] || { count: 0 };
    } catch (error) {
      console.warn('recruiter_responses table not found for interviews, defaulting to 0');
      interviewsScheduled = { count: 0 };
    }

    const stats = {
      totalResumes: resumeStats.totalResumes || 0,
      totalViews: resumeStats.totalViews || 0,
      totalDownloads: resumeStats.totalDownloads || 0,
      profileViews,
      avgRating,
      completionRate,
      recruiterResponses: recruiterStats.recruiterResponses || 0,
      shortlistCount: shortlistStats.shortlistCount || 0,
      upvotesReceived: upvotesStats.upvotesReceived || 0,
      likesReceived: likesCount.likesReceived || 0,
      interviewsScheduled: interviewsScheduled.count || 0,
      referralCount: referralStats.referralCount || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// Get user activities
router.get("/activities/:userId", async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit as string) || 10;
  const db = await getDatabase();

  try {
    const activitiesResult = await db.query(
      `
      SELECT 
        id,
        activity_type,
        entity_type,
        entity_id,
        description,
        created_at
      FROM activities 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `,
      [userId, limit]
    );

    // Format timestamps
    const formattedActivities = activitiesResult.rows.map((activity: any) => ({
      ...activity,
      timestamp: formatTimeAgo(new Date(activity.created_at))
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error("Activities fetch error:", error);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
});

// Get recruiter responses
router.get("/recruiter-responses/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    const responses = db
      .prepare(
        `
      SELECT 
        rr.id,
        r.first_name || ' ' || r.last_name as recruiterName,
        c.name as company,
        r.job_title as position,
        r.avatar_url as avatar,
        rr.status,
        rr.message,
        rr.salary_min,
        rr.salary_max,
        rr.currency,
        rr.interview_date as interviewDate,
        rr.interview_time as interviewTime,
        rr.interview_type as interviewType,
        rr.upvotes_count as upvotes,
        rr.created_at,
        res.id as resumeId,
        res.title as resumeName,
        jp.title as jobTitle,
        (SELECT COUNT(*) FROM response_interactions 
         WHERE response_id = rr.id AND user_id = ? AND interaction_type = 'upvote') as hasUpvoted
      FROM recruiter_responses rr
      JOIN recruiters r ON rr.recruiter_id = r.id
      JOIN companies c ON r.company_id = c.id
      JOIN resumes res ON rr.resume_id = res.id
      LEFT JOIN job_positions jp ON rr.job_position_id = jp.id
      WHERE rr.user_id = ?
      ORDER BY rr.created_at DESC
    `,
      )
      .all(userId, userId);

    // Format the responses
    const formattedResponses = responses.map((response: any) => ({
      id: response.id.toString(),
      recruiterName: response.recruiterName,
      company: response.company,
      position: response.position,
      avatar: response.avatar,
      status: response.status,
      message: response.message,
      timestamp: formatTimeAgo(new Date(response.created_at)),
      resumeId: response.resumeId.toString(),
      resumeName: response.resumeName,
      jobTitle: response.jobTitle,
      interviewDate: response.interviewDate,
      interviewTime: response.interviewTime,
      interviewType: response.interviewType,
      salary: response.salary_min
        ? `$${response.salary_min.toLocaleString()}${
            response.salary_max
              ? ` - $${response.salary_max.toLocaleString()}`
              : ""
          }`
        : undefined,
      upvotes: response.upvotes || 0,
      hasUpvoted: Boolean(response.hasUpvoted),
    }));

    res.json(formattedResponses);
  } catch (error) {
    console.error("Recruiter responses fetch error:", error);
    res.status(500).json({ error: "Failed to fetch recruiter responses" });
  }
});

// Get user resumes
router.get("/resumes/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    const resumes = db
      .prepare(
        `
      SELECT 
        id,
        title as name,
        slug,
        thumbnail_url as thumbnail,
        status,
        is_public as isPublic,
        view_count as views,
        download_count as downloads,
        updated_at,
        (SELECT name FROM resume_templates WHERE id = resumes.template_id) as template
      FROM resumes 
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `,
      )
      .all(userId);

    // Format the resumes
    const formattedResumes = resumes.map((resume: any) => ({
      id: resume.id.toString(),
      name: resume.name,
      template: resume.template || "Custom Template",
      lastModified: formatTimeAgo(new Date(resume.updated_at)),
      status: resume.status,
      views: resume.views || 0,
      downloads: resume.downloads || 0,
      thumbnail: resume.thumbnail,
      isPublic: Boolean(resume.isPublic),
    }));

    res.json(formattedResumes);
  } catch (error) {
    console.error("Resumes fetch error:", error);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

// Get referral data
router.get("/referrals/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    // Get referral statistics
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as totalReferred,
        COUNT(CASE WHEN status = 'paid_user' THEN 1 END) as successfulReferrals,
        COUNT(CASE WHEN status = 'pending' OR status = 'signed_up' OR status = 'trial_user' THEN 1 END) as pendingReferrals,
        SUM(CASE WHEN status = 'paid_user' THEN reward_amount ELSE 0 END) as rewardsEarned
      FROM referrals 
      WHERE referrer_id = ?
    `,
      )
      .get(userId) as {
      totalReferred: number;
      successfulReferrals: number;
      pendingReferrals: number;
      rewardsEarned: number;
    };

    // Get recent referrals
    const referrals = db
      .prepare(
        `
      SELECT 
        id,
        referee_name as name,
        referee_email as email,
        position_title as position,
        company_name as company,
        status,
        reward_amount,
        created_at
      FROM referrals 
      WHERE referrer_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `,
      )
      .all(userId);

    const formattedReferrals = referrals.map((referral: any) => ({
      ...referral,
      id: referral.id.toString(),
      createdAt: formatTimeAgo(new Date(referral.created_at)),
    }));

    res.json({
      stats: {
        totalReferred: stats.totalReferred || 0,
        successfulReferrals: stats.successfulReferrals || 0,
        pendingReferrals: stats.pendingReferrals || 0,
        rewardsEarned: stats.rewardsEarned || 0,
      },
      referrals: formattedReferrals,
    });
  } catch (error) {
    console.error("Referrals fetch error:", error);
    res.status(500).json({ error: "Failed to fetch referral data" });
  }
});

// Update upvote for a recruiter response
router.post("/upvote/:userId/:responseId", async (req, res) => {
  const { userId, responseId } = req.params;
  const db = await getDatabase();

  try {
    // Check if user already upvoted
    const existingUpvote = db
      .prepare(
        `
      SELECT id FROM response_interactions 
      WHERE user_id = ? AND response_id = ? AND interaction_type = 'upvote'
    `,
      )
      .get(userId, responseId);

    if (existingUpvote) {
      // Remove upvote
      db.prepare(`DELETE FROM response_interactions WHERE id = ?`).run(
        existingUpvote.id,
      );

      // Decrease upvote count
      db.prepare(
        `UPDATE recruiter_responses SET upvotes_count = upvotes_count - 1 WHERE id = ?`,
      ).run(responseId);

      res.json({ hasUpvoted: false });
    } else {
      // Add upvote
      db.prepare(
        `INSERT INTO response_interactions (user_id, response_id, interaction_type) VALUES (?, ?, 'upvote')`,
      ).run(userId, responseId);

      // Increase upvote count
      db.prepare(
        `UPDATE recruiter_responses SET upvotes_count = upvotes_count + 1 WHERE id = ?`,
      ).run(responseId);

      res.json({ hasUpvoted: true });
    }
  } catch (error) {
    console.error("Upvote error:", error);
    res.status(500).json({ error: "Failed to update upvote" });
  }
});

// Helper function to format timestamps
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return diffMins <= 1 ? "1 minute ago" : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Get recruiter interactions for a user's resumes
router.get("/recruiter-interactions/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    const interactions = [];
    
    console.log('🔍 Fetching recruiter interactions for user:', userId);

    // Get all recruiter responses (views, likes, shortlists, etc.)
    try {
      console.log('🔍 Querying recruiter_responses table...');
      const responsesResult = await db.query(`
        SELECT 
          rr.status as action_type,
          rr.created_at,
          rr.message,
          r.id as resume_id,
          r.title as resume_title,
          u.first_name || ' ' || u.last_name as recruiter_name,
          u.email as recruiter_email,
          rp.job_title as recruiter_position,
          c.name as company_name,
          c.logo_url as company_logo
        FROM recruiter_responses rr
        JOIN resumes r ON rr.resume_id = r.id
        LEFT JOIN users u ON rr.recruiter_id = u.id
        LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
        LEFT JOIN companies c ON rp.company_id = c.id
        WHERE rr.user_id = $1
        ORDER BY rr.created_at DESC
        LIMIT 50
      `, [userId]);
      
      console.log('✅ Found recruiter responses:', responsesResult.rows.length);
      interactions.push(...responsesResult.rows);
    } catch (error) {
      console.warn('❌ Could not fetch recruiter responses:', error.message);
    }

    // Get upvotes with recruiter info (if resume_upvotes table exists)
    try {
      const upvotesResult = await db.query(`
        SELECT 
          'upvote' as action_type,
          ru.created_at,
          r.id as resume_id,
          r.title as resume_title,
          u.first_name || ' ' || u.last_name as recruiter_name,
          u.email as recruiter_email,
          rp.job_title as recruiter_position,
          c.name as company_name,
          c.logo_url as company_logo
        FROM resume_upvotes ru
        JOIN resumes r ON ru.resume_id = r.id
        LEFT JOIN users u ON ru.user_id = u.id
        LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
        LEFT JOIN companies c ON rp.company_id = c.id
        WHERE r.user_id = $1
        ORDER BY ru.created_at DESC
        LIMIT 50
      `, [userId]);
      
      interactions.push(...upvotesResult.rows);
    } catch (error) {
      console.warn('Could not fetch upvotes:', error.message);
    }

    // Get shortlists with recruiter info (if recruiter_shortlists table exists)
    try {
      const shortlistsResult = await db.query(`
        SELECT 
          'shortlist' as action_type,
          rs.created_at,
          r.id as resume_id,
          r.title as resume_title,
          u.first_name || ' ' || u.last_name as recruiter_name,
          u.email as recruiter_email,
          rp.job_title as recruiter_position,
          c.name as company_name,
          c.logo_url as company_logo,
          rs.notes as message
        FROM recruiter_shortlists rs
        JOIN resumes r ON rs.resume_id = r.id
        LEFT JOIN users u ON rs.recruiter_id = u.id
        LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
        LEFT JOIN companies c ON rp.company_id = c.id
        WHERE r.user_id = $1
        ORDER BY rs.created_at DESC
        LIMIT 50
      `, [userId]);
      
      interactions.push(...shortlistsResult.rows);
    } catch (error) {
      console.warn('Could not fetch shortlists:', error.message);
    }

    // Sort all interactions by date (most recent first)
    interactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Format the interactions
    const formattedInteractions = interactions.slice(0, 50).map((interaction) => ({
      id: `${interaction.action_type}-${interaction.resume_id}-${interaction.created_at}`,
      actionType: interaction.action_type,
      timestamp: formatTimeAgo(new Date(interaction.created_at)),
      resumeId: interaction.resume_id,
      resumeTitle: interaction.resume_title,
      recruiter: {
        name: interaction.recruiter_name || 'Anonymous Recruiter',
        email: interaction.recruiter_email || '',
        position: interaction.recruiter_position || '',
        company: interaction.company_name || '',
        logo: interaction.company_logo || ''
      },
      notes: interaction.message || '',
      viewCount: 1
    }));

    res.json({
      success: true,
      data: formattedInteractions
    });

  } catch (error) {
    console.error("Recruiter interactions fetch error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch recruiter interactions" 
    });
  }
});

// Debug endpoint to check recruiter_responses table
router.get("/debug-recruiter-responses/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    // Check if recruiter_responses table exists and has data
    const tableCheck = await db.query(`
      SELECT COUNT(*) as total FROM recruiter_responses WHERE user_id = $1
    `, [userId]);
    
    const allResponses = await db.query(`
      SELECT * FROM recruiter_responses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10
    `, [userId]);
    
    // Also check related tables
    const resumeUpvotes = await db.query(`
      SELECT ru.*, r.user_id as resume_owner FROM resume_upvotes ru
      JOIN resumes r ON ru.resume_id = r.id
      WHERE r.user_id = $1
      ORDER BY ru.created_at DESC LIMIT 5
    `, [userId]);
    
    const shortlists = await db.query(`
      SELECT rs.*, r.user_id as resume_owner FROM recruiter_shortlists rs
      JOIN resumes r ON rs.resume_id = r.id
      WHERE r.user_id = $1
      ORDER BY rs.created_at DESC LIMIT 5
    `, [userId]);

    res.json({
      success: true,
      data: {
        userId,
        recruiterResponsesCount: tableCheck.rows[0].total,
        recruiterResponses: allResponses.rows,
        resumeUpvotes: resumeUpvotes.rows,
        shortlists: shortlists.rows
      }
    });

  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

// Create sample recruiter interactions for testing (remove in production)
router.post("/create-sample-interactions/:userId", async (req, res) => {
  const { userId } = req.params;
  const db = await getDatabase();

  try {
    // Get user's resumes
    const resumesResult = await db.query(`
      SELECT id, title FROM resumes WHERE user_id = $1 LIMIT 3
    `, [userId]);

    if (resumesResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No resumes found for this user'
      });
    }

    const sampleInteractions = [
      {
        recruiter_id: 1,
        status: 'viewed',
        message: 'Reviewed your profile for Software Engineer position'
      },
      {
        recruiter_id: 2,
        status: 'liked',
        message: 'Impressed by your technical skills!'
      },
      {
        recruiter_id: 1,
        status: 'shortlisted',
        message: 'Great fit for our team. Would like to schedule an interview.'
      },
      {
        recruiter_id: 3,
        status: 'interested',
        message: 'Your experience matches our requirements perfectly'
      }
    ];

    // Insert sample interactions
    for (const interaction of sampleInteractions) {
      const resumeId = resumesResult.rows[Math.floor(Math.random() * resumesResult.rows.length)].id;
      
      try {
        await db.query(`
          INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (recruiter_id, user_id, resume_id) 
          DO UPDATE SET status = $4, message = $5, updated_at = CURRENT_TIMESTAMP
        `, [interaction.recruiter_id, userId, resumeId, interaction.status, interaction.message]);
      } catch (insertError) {
        console.warn('Could not insert sample interaction:', insertError.message);
      }
    }

    res.json({
      success: true,
      message: 'Sample interactions created',
      data: { interactionsCreated: sampleInteractions.length }
    });

  } catch (error) {
    console.error("Error creating sample interactions:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to create sample interactions" 
    });
  }
});

export default router;
