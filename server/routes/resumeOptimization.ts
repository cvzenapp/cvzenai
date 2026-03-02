import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/unifiedAuth.js';
import { resumeOptimizer } from '../services/dspy/resumeOptimizer.js';
import { atsScorer } from '../services/dspy/atsScorer.js';

/**
 * Optimize resume content for better ATS score
 * POST /api/resume/optimize/:id
 */
export const optimizeResume: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get resume from database
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    const resumeResult = await db.query(
      'SELECT * FROM resumes WHERE id = $1 AND user_id = $2',
      [resumeId, userId]
    );

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const resume = resumeResult.rows[0];

    // Parse resume data
    const originalData = {
      personalInfo: typeof resume.personal_info === 'string' 
        ? JSON.parse(resume.personal_info) 
        : resume.personal_info,
      summary: resume.summary || '',
      objective: resume.objective || '',
      skills: typeof resume.skills === 'string' 
        ? JSON.parse(resume.skills) 
        : (resume.skills || []),
      experience: typeof resume.experience === 'string' 
        ? JSON.parse(resume.experience) 
        : (resume.experience || []),
      education: typeof resume.education === 'string' 
        ? JSON.parse(resume.education) 
        : (resume.education || []),
      projects: typeof resume.projects === 'string' 
        ? JSON.parse(resume.projects) 
        : (resume.projects || []),
      certifications: resume.certifications || [],
      languages: resume.languages || []
    };

    // Calculate original ATS score
    console.log('📊 Calculating original ATS score...');
    const originalScore = await atsScorer.calculateScore(originalData);

    // Optimize resume
    console.log('🎯 Optimizing resume content...');
    const optimization = await resumeOptimizer.optimizeResume(originalData);

    // Calculate optimized ATS score
    console.log('📊 Calculating optimized ATS score...');
    const optimizedScore = await atsScorer.calculateScore(optimization.optimizedData);

    // Calculate actual score increase
    const actualScoreIncrease = optimizedScore.overallScore - originalScore.overallScore;

    res.json({
      success: true,
      data: {
        original: {
          data: originalData,
          atsScore: originalScore
        },
        optimized: {
          data: optimization.optimizedData,
          atsScore: optimizedScore
        },
        improvements: optimization.improvements,
        scoreIncrease: actualScoreIncrease
      }
    });

  } catch (error) {
    console.error('❌ Resume optimization failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize resume',
      details: error.message
    });
  }
};

/**
 * Apply optimized resume (replace original with optimized version)
 * POST /api/resume/apply-optimization/:id
 */
export const applyOptimization: RequestHandler = async (req: AuthRequest, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user?.id;
    const { optimizedData, atsScore } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!optimizedData || !atsScore) {
      return res.status(400).json({
        success: false,
        error: 'Optimized data and ATS score are required'
      });
    }

    // Update resume in database
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    await db.query(
      `UPDATE resumes SET
        personal_info = $1,
        summary = $2,
        objective = $3,
        skills = $4,
        experience = $5,
        education = $6,
        projects = $7,
        ats_score = $8,
        ats_score_completeness = $9,
        ats_score_formatting = $10,
        ats_score_keywords = $11,
        ats_score_experience = $12,
        ats_score_education = $13,
        ats_score_skills = $14,
        ats_suggestions = $15,
        ats_strengths = $16,
        ats_scored_at = NOW(),
        updated_at = NOW()
      WHERE id = $17 AND user_id = $18`,
      [
        JSON.stringify(optimizedData.personalInfo),
        optimizedData.summary || '',
        optimizedData.objective || '',
        JSON.stringify(optimizedData.skills || []),
        JSON.stringify(optimizedData.experience || []),
        JSON.stringify(optimizedData.education || []),
        JSON.stringify(optimizedData.projects || []),
        atsScore.overallScore,
        atsScore.scores.completeness,
        atsScore.scores.formatting,
        atsScore.scores.keywords,
        atsScore.scores.experience,
        atsScore.scores.education,
        atsScore.scores.skills,
        JSON.stringify(atsScore.suggestions),
        JSON.stringify(atsScore.strengths),
        resumeId,
        userId
      ]
    );

    res.json({
      success: true,
      message: 'Optimized resume applied successfully'
    });

  } catch (error) {
    console.error('❌ Failed to apply optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply optimization',
      details: error.message
    });
  }
};
