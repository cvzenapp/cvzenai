import { Router, Request, Response } from 'express';
import { requireRecruiterAuth } from '../middleware/recruiterAuth';
import { initializeDatabase, closeDatabase } from '../database/connection';
import { aiResumeScreeningService } from '../services/aiResumeScreeningService';

const router = Router();

// Screen a single job application with AI
router.post('/screen/:applicationId', requireRecruiterAuth, async (req: Request, res: Response) => {
  const db = await initializeDatabase();
  
  try {
    const { applicationId } = req.params;
    const { jobRequirements } = req.body;
    
    console.log('🤖 Screening application:', applicationId);
    
    // Get application details (PostgreSQL)
    const applicationResult = await db.query(`
      SELECT 
        ja.*,
        jp.title as job_title,
        jp.description as job_description,
        jp.requirements as job_requirements,
        r.id as resume_id,
        r.personal_info,
        r.summary,
        r.skills,
        r.experience,
        r.education,
        r.projects,
        u.email as user_email
      FROM job_applications ja
      LEFT JOIN job_postings jp ON ja.job_id = jp.id
      LEFT JOIN users u ON ja.user_id = u.id
      LEFT JOIN resumes r ON ja.user_id = r.user_id
      WHERE ja.id = $1
    `, [applicationId]);
    
    if (applicationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    const application = applicationResult.rows[0];
    
    // Check if application has a resume
    if (!application.resume_id) {
      console.warn('⚠️ Application has no resume attached');
      return res.status(400).json({
        success: false,
        error: 'Cannot screen application without resume data. This application may be a guest application or missing resume information.'
      });
    }
    
    // Parse personal info to get candidate name
    let candidateName = 'Candidate';
    try {
      const personalInfo = typeof application.personal_info === 'string' 
        ? JSON.parse(application.personal_info) 
        : application.personal_info;
      
      if (personalInfo) {
        candidateName = personalInfo.fullName || 
                       `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() ||
                       personalInfo.name ||
                       candidateName;
      }
    } catch (e) {
      console.warn('Failed to parse personal info:', e);
    }
    
    // If guest application, use guest name
    if (application.is_guest && application.guest_name) {
      candidateName = application.guest_name;
    }
    
    // Build job requirements from job posting or custom requirements
    let requirements = jobRequirements;
    if (!requirements && application.job_requirements) {
      try {
        const jobReqs = typeof application.job_requirements === 'string'
          ? JSON.parse(application.job_requirements)
          : application.job_requirements;
        
        if (Array.isArray(jobReqs)) {
          requirements = [
            `Position: ${application.job_title}`,
            '',
            'Requirements:',
            ...jobReqs.map((req: string) => `• ${req}`)
          ].join('\n');
        }
      } catch (e) {
        console.warn('Failed to parse job requirements:', e);
      }
    }
    
    if (!requirements) {
      requirements = `Position: ${application.job_title}\n\n${application.job_description || ''}`;
    }
    
    // Parse JSON fields
    let skills = [];
    let experience = [];
    let education = [];
    let projects = [];
    
    try {
      skills = typeof application.skills === 'string' ? JSON.parse(application.skills) : application.skills || [];
      experience = typeof application.experience === 'string' ? JSON.parse(application.experience) : application.experience || [];
      education = typeof application.education === 'string' ? JSON.parse(application.education) : application.education || [];
      projects = typeof application.projects === 'string' ? JSON.parse(application.projects) : application.projects || [];
    } catch (e) {
      console.warn('Failed to parse resume fields:', e);
    }
    
    console.log('📊 Resume data:', {
      skills: skills.length,
      experience: experience.length,
      education: education.length,
      projects: projects.length,
      summary: application.summary ? 'present' : 'missing'
    });
    
    // Prepare candidate data for screening
    const candidate = {
      id: application.resume_id || application.id,
      name: candidateName,
      title: '',
      summary: application.summary || '',
      skills: skills,
      experience: experience,
      education: education,
      projects: projects,
      location: '',
      resumeUrl: application.resume_url || '',
      // Add these for the screening service
      resume: {
        skills: skills,
        experience: experience,
        education: education,
        projects: projects,
        summary: application.summary,
        personal_info: application.personal_info
      }
    };
    
    console.log('📋 Screening candidate:', candidate.name);
    
    // Screen the candidate using AI
    const screeningResponse = await aiResumeScreeningService.screenCandidates(
      [candidate],
      requirements
    );
    
    console.log('🔍 Screening response:', JSON.stringify(screeningResponse, null, 2));
    
    if (!screeningResponse || !screeningResponse.success) {
      console.error('❌ AI screening failed:', screeningResponse?.error);
      return res.status(500).json({
        success: false,
        error: screeningResponse?.error || 'AI screening failed'
      });
    }
    
    const screeningResults = screeningResponse.results || [];
    
    if (screeningResults.length === 0) {
      console.error('❌ AI screening returned no results');
      return res.status(500).json({
        success: false,
        error: 'AI screening returned no results'
      });
    }
    
    const result = screeningResults[0];
    
    if (!result || result.score === undefined) {
      console.error('❌ Invalid result structure:', result);
      return res.status(500).json({
        success: false,
        error: 'AI screening returned invalid result structure'
      });
    }
    
    // Update application with AI screening results (PostgreSQL)
    await db.query(`
      UPDATE job_applications
      SET 
        ai_score = $1,
        ai_recommendation = $2,
        ai_reasoning = $3,
        ai_strengths = $4,
        ai_concerns = $5,
        ai_screened_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [
      result.score,
      result.recommendation,
      result.reasoning,
      JSON.stringify(result.strengths || []),
      JSON.stringify(result.concerns || []),
      applicationId
    ]);
    
    console.log('✅ Application screened successfully');
    
    res.json({
      success: true,
      data: {
        id: parseInt(applicationId),
        ai_score: result.score,
        ai_recommendation: result.recommendation,
        ai_reasoning: result.reasoning,
        ai_strengths: result.strengths,
        ai_concerns: result.concerns,
        ai_screened_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error screening application:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to screen application'
    });
  } finally {
    await closeDatabase();
  }
});

export default router;
