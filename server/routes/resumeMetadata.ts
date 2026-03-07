import express from 'express';
import { getDatabase } from '../database/connection';
import { Resume } from '@shared/api';
import { generateSharedResumeHTML } from '../templates/sharedResumeTemplate';

const router = express.Router();

// Helper function to create dynamic resume description
const createDynamicDescription = (personalInfo: any, skills: any[], experiences: any[], summary: string) => {
  const name = personalInfo.name || 'Professional';
  const jobTitle = personalInfo.title || 'Professional';
  const location = personalInfo.location || '';
  
  // Get top skills (up to 5)
  const topSkills = skills.slice(0, 5).map((skill: any) => 
    typeof skill === 'string' ? skill : skill.name
  ).filter(Boolean);
  
  // Calculate years of experience
  const yearsOfExperience = experiences.length > 0 ? 
    Math.max(...experiences.map((exp: any) => {
      const startYear = new Date(exp.startDate || exp.start_date || '2020').getFullYear();
      const endYear = exp.endDate || exp.end_date ? 
        new Date(exp.endDate || exp.end_date).getFullYear() : 
        new Date().getFullYear();
      return Math.max(0, endYear - startYear);
    })) : 0;
  
  // Create dynamic description
  const parts = [];
  
  // Add job title if meaningful
  if (jobTitle && jobTitle !== 'Professional') {
    parts.push(jobTitle);
  }
  
  // Add location
  if (location) {
    parts.push(`based in ${location}`);
  }
  
  // Add experience
  if (yearsOfExperience > 0) {
    parts.push(`${yearsOfExperience}+ years experience`);
  }
  
  // Add top skills
  if (topSkills.length > 0) {
    parts.push(`Skills: ${topSkills.join(', ')}`);
  }
  
  // Add summary excerpt if available and no other content
  if (parts.length === 0 && summary) {
    const summaryExcerpt = summary.substring(0, 100);
    parts.push(summaryExcerpt + (summary.length > 100 ? '...' : ''));
  }
  
  return {
    description: parts.length > 0 ? parts.join(' | ') : `Professional resume for ${name}`,
    topSkills,
    yearsOfExperience
  };
};

// Serve HTML page with meta tags for shared resume (for social crawlers)
router.get('/share-preview/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    
    // Get database connection
    const db = await getDatabase();
    
    // Get shared resume data
    const sharedResumeQuery = `
      SELECT 
        r.*,
        rs.share_token,
        rs.expires_at,
        rs.is_active
      FROM resume_shares rs
      JOIN resumes r ON rs.resume_id = r.id
      WHERE rs.share_token = $1 AND rs.is_active = true AND rs.expires_at > NOW()
    `;
    
    const sharedResumeResult = await db.query(sharedResumeQuery, [shareToken]);
    
    if (!sharedResumeResult.rows || sharedResumeResult.rows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html><head><title>Resume Not Found</title></head>
        <body><h1>Resume not found or expired</h1></body></html>
      `);
    }
    
    const resumeData = sharedResumeResult.rows[0] as any;
    
    // Parse JSON fields
    const personalInfo = resumeData.personal_info ? JSON.parse(resumeData.personal_info) : {};
    const skills = resumeData.skills ? JSON.parse(resumeData.skills) : [];
    const experiences = resumeData.experiences ? JSON.parse(resumeData.experiences) : [];
    
    // Generate dynamic metadata
    const name = personalInfo.name || 'Professional';
    const jobTitle = personalInfo.title || 'Professional';
    const summary = resumeData.summary || '';
    
    const { description, topSkills, yearsOfExperience } = createDynamicDescription(
      personalInfo, skills, experiences, summary
    );
    
    const metadata = {
      title: `${name} - ${jobTitle}`,
      description,
      name,
      jobTitle,
      location: personalInfo.location || '',
      skills: topSkills.join(', '),
      yearsOfExperience,
      summary: summary.substring(0, 160) + (summary.length > 160 ? '...' : ''),
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareToken}`,
      image: personalInfo.avatar || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/resume/og-image/${shareToken}`,
      type: 'profile'
    };
    
    const html = generateSharedResumeHTML(metadata, shareToken);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(html);
    
  } catch (error) {
    console.error('Error serving shared resume preview:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html><head><title>Error</title></head>
      <body><h1>Error loading resume</h1></body></html>
    `);
  }
});

// Generate Open Graph metadata for shared resume (API endpoint)
router.get('/metadata/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    
    // Get database connection
    const db = await getDatabase();
    
    // Get shared resume data
    const sharedResumeQuery = `
      SELECT 
        r.*,
        rs.share_token,
        rs.expires_at,
        rs.is_active
      FROM resume_shares rs
      JOIN resumes r ON rs.resume_id = r.id
      WHERE rs.share_token = $1 AND rs.is_active = true AND rs.expires_at > NOW()
    `;
    
    const sharedResumeResult = await db.query(sharedResumeQuery, [shareToken]);
    
    if (!sharedResumeResult.rows || sharedResumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shared resume not found or expired'
      });
    }
    
    const resumeData = sharedResumeResult.rows[0] as any;
    
    // Parse JSON fields
    const personalInfo = resumeData.personal_info ? JSON.parse(resumeData.personal_info) : {};
    const skills = resumeData.skills ? JSON.parse(resumeData.skills) : [];
    const experiences = resumeData.experiences ? JSON.parse(resumeData.experiences) : [];
    
    // Generate dynamic metadata
    const name = personalInfo.name || 'Professional';
    const jobTitle = personalInfo.title || 'Professional';
    const summary = resumeData.summary || '';
    
    const { description, topSkills, yearsOfExperience } = createDynamicDescription(
      personalInfo, skills, experiences, summary
    );
    
    const metadata = {
      title: `${name} - ${jobTitle}`,
      description,
      name,
      jobTitle,
      location: personalInfo.location || '',
      skills: topSkills.join(', '),
      yearsOfExperience,
      summary: summary.substring(0, 160) + (summary.length > 160 ? '...' : ''),
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/share/${shareToken}`,
      image: personalInfo.avatar || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/resume/og-image/${shareToken}`,
      type: 'profile'
    };
    
    res.json({
      success: true,
      data: metadata
    });
    
  } catch (error) {
    console.error('Error generating resume metadata:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate metadata'
    });
  }
});

// Generate Open Graph image for resume
router.get('/og-image/:shareToken', async (req, res) => {
  try {
    const { shareToken } = req.params;
    
    // Get database connection
    const db = await getDatabase();
    
    // Get shared resume data
    const sharedResumeQuery = `
      SELECT 
        r.*,
        rs.share_token,
        rs.expires_at,
        rs.is_active
      FROM resume_shares rs
      JOIN resumes r ON rs.resume_id = r.id
      WHERE rs.share_token = $1 AND rs.is_active = true AND rs.expires_at > NOW()
    `;
    
    const sharedResumeResult = await db.query(sharedResumeQuery, [shareToken]);
    
    if (!sharedResumeResult.rows || sharedResumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Shared resume not found or expired'
      });
    }
    
    const resumeData = sharedResumeResult.rows[0] as any;
    const personalInfo = resumeData.personal_info ? JSON.parse(resumeData.personal_info) : {};
    const skills = resumeData.skills ? JSON.parse(resumeData.skills) : [];
    
    // Generate a dynamic SVG image for Open Graph
    const name = personalInfo.name || 'Professional';
    const jobTitle = personalInfo.title || 'Professional';
    const topSkills = skills.slice(0, 3).map((skill: any) => 
      typeof skill === 'string' ? skill : skill.name
    ).filter(Boolean).join(' • ');
    
    const location = personalInfo.location || '';
    
    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="1200" height="630" fill="url(#bg)"/>
        <rect x="50" y="50" width="1100" height="530" fill="white" rx="20"/>
        
        <!-- Header -->
        <rect x="70" y="70" width="1060" height="140" fill="#F8FAFC" rx="10"/>
        <text x="90" y="130" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#1E293B">${name}</text>
        <text x="90" y="170" font-family="Arial, sans-serif" font-size="28" fill="#64748B">${jobTitle}</text>
        ${location ? `<text x="90" y="200" font-family="Arial, sans-serif" font-size="20" fill="#64748B">📍 ${location}</text>` : ''}
        
        <!-- Skills -->
        ${topSkills ? `<text x="90" y="260" font-family="Arial, sans-serif" font-size="20" fill="#3B82F6" font-weight="600">Core Skills:</text>` : ''}
        ${topSkills ? `<text x="90" y="290" font-family="Arial, sans-serif" font-size="18" fill="#1E293B">${topSkills}</text>` : ''}
        
        <!-- CVZen Branding -->
        <text x="90" y="570" font-family="Arial, sans-serif" font-size="18" fill="#64748B">Powered by CVZen - Professional Resume Builder</text>
        
        <!-- Professional Badge -->
        <circle cx="1050" cy="150" r="45" fill="#10B981"/>
        <text x="1050" y="160" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">✓</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(svg);
    
  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).send('Error generating image');
  }
});

export default router;