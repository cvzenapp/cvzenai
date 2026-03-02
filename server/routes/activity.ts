import express from 'express';
import { getDatabase } from '../database/connection.js';
import type { Request, Response } from 'express';

const router = express.Router();

// GET /api/activity/recent - Get user's recent activity
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const db = await getDatabase();
    
    // Get recent shortlists
    const shortlistsQuery = `
      SELECT 
        rs.id,
        rs.created_at,
        r.title as resume_title,
        rp.first_name,
        rp.last_name,
        c.name as company_name
      FROM recruiter_shortlists rs
      JOIN resumes r ON rs.resume_id = r.resume_id
      LEFT JOIN users u ON rs.recruiter_id = u.id
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      LEFT JOIN companies c ON rp.company_id = c.id
      WHERE r.user_id = $1
      ORDER BY rs.created_at DESC
      LIMIT 10
    `;
    
    // Get recent upvotes
    const upvotesQuery = `
      SELECT 
        ru.id,
        ru.created_at,
        r.title as resume_title,
        rp.first_name,
        rp.last_name,
        c.name as company_name
      FROM resume_upvotes ru
      JOIN resumes r ON ru.resume_id = r.resume_id
      LEFT JOIN users u ON ru.user_id = u.id
      LEFT JOIN recruiter_profiles rp ON u.id = rp.user_id
      LEFT JOIN companies c ON rp.company_id = c.id
      WHERE r.user_id = $1
      ORDER BY ru.created_at DESC
      LIMIT 10
    `;
    
    const [shortlistsResult, upvotesResult] = await Promise.all([
      db.query(shortlistsQuery, [userId]),
      db.query(upvotesQuery, [userId])
    ]);
    
    // Format activities
    const activities = [];
    
    // Add shortlist activities
    shortlistsResult.rows.forEach(row => {
      const recruiterName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'A recruiter';
      const companyName = row.company_name || 'a company';
      
      activities.push({
        id: `shortlist-${row.id}`,
        type: 'shortlist',
        message: `${recruiterName} from ${companyName} shortlisted your resume`,
        time: getTimeAgo(row.created_at),
        recruiterName: recruiterName === 'A recruiter' ? undefined : recruiterName,
        companyName: row.company_name,
        createdAt: row.created_at
      });
    });
    
    // Add upvote activities
    upvotesResult.rows.forEach(row => {
      const recruiterName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'A recruiter';
      const companyName = row.company_name || 'a company';
      
      activities.push({
        id: `upvote-${row.id}`,
        type: 'upvote',
        message: `${recruiterName} from ${companyName} upvoted your resume`,
        time: getTimeAgo(row.created_at),
        recruiterName: recruiterName === 'A recruiter' ? undefined : recruiterName,
        companyName: row.company_name,
        createdAt: row.created_at
      });
    });
    
    // Sort by creation date (most recent first)
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Get stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM recruiter_shortlists rs 
         JOIN resumes r ON rs.resume_id = r.id 
         WHERE r.user_id = $1) as total_shortlists,
        (SELECT COUNT(*) FROM resume_upvotes ru 
         JOIN resumes r ON ru.resume_id = r.id 
         WHERE r.user_id = $1) as total_upvotes,
        (SELECT COALESCE(SUM(r.views), 0) FROM resumes r 
         WHERE r.user_id = $1) as total_views,
        (SELECT COALESCE(SUM(r.downloads), 0) FROM resumes r 
         WHERE r.user_id = $1) as total_downloads
    `;
    
    const statsResult = await db.query(statsQuery, [userId]);
    const stats = statsResult.rows[0] || {};
    
    res.json({
      success: true,
      data: {
        activities: activities.slice(0, 10), // Limit to 10 most recent
        stats: {
          totalShortlists: parseInt(stats.total_shortlists) || 0,
          totalUpvotes: parseInt(stats.total_upvotes) || 0,
          totalViews: parseInt(stats.total_views) || 0,
          totalDownloads: parseInt(stats.total_downloads) || 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity'
    });
  }
});

// GET /api/activity/stats - Get activity statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const db = await getDatabase();
    
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM recruiter_shortlists rs 
         JOIN resumes r ON rs.resume_id = r.id 
         WHERE r.user_id = $1) as total_shortlists,
        (SELECT COUNT(*) FROM resume_upvotes ru 
         JOIN resumes r ON ru.resume_id = r.id 
         WHERE r.user_id = $1) as total_upvotes,
        (SELECT COALESCE(SUM(r.views), 0) FROM resumes r 
         WHERE r.user_id = $1) as total_views,
        (SELECT COALESCE(SUM(r.downloads), 0) FROM resumes r 
         WHERE r.user_id = $1) as total_downloads
    `;
    
    const statsResult = await db.query(statsQuery, [userId]);
    const stats = statsResult.rows[0] || {};
    
    res.json({
      success: true,
      data: {
        totalShortlists: parseInt(stats.total_shortlists) || 0,
        totalUpvotes: parseInt(stats.total_upvotes) || 0,
        totalViews: parseInt(stats.total_views) || 0,
        totalDownloads: parseInt(stats.total_downloads) || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity stats'
    });
  }
});

// Helper function to format time ago
function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

export default router;