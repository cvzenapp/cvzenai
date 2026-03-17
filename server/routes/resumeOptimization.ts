import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../database/connection.js";
import { atsImprover } from "../services/dspy/atsImprover.js";
import { atsScorer } from "../services/dspy/atsScorer.js";
import { groqService } from "../services/groqService.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Validation schema for resume optimization
const resumeOptimizationSchema = z.object({
  resumeId: z.string(),
  jobTitle: z.string(),
  jobDescription: z.string(),
  jobRequirements: z.array(z.string()).optional(),
  companyName: z.string(),
});

// POST /api/resume-optimization/optimize - Optimize resume for specific job
router.post("/optimize", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  const userId = decoded.userId;
  let db;

  try {
    const validatedData = resumeOptimizationSchema.parse(req.body);
    db = await initializeDatabase();

    // Get current resume data
    const resumeQuery = `
      SELECT *
      FROM resumes 
      WHERE id = $1 AND user_id = $2
    `;
    const resumeResult = await db.query(resumeQuery, [validatedData.resumeId, userId]);
    
    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const currentResume = resumeResult.rows[0];

    // Prepare current resume data for AI
    const resumeData = {
      personalInfo: currentResume.personal_info || {
        fullName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: ''
      },
      summary: currentResume.summary || '',
      objective: currentResume.objective || '',
      skills: currentResume.skills || [],
      experience: currentResume.experience || [],
      education: currentResume.education || [],
      projects: currentResume.projects || [],
      certifications: currentResume.certifications || [],
      languages: currentResume.languages || []
    };

    console.log('📊 Current resume data structure:', {
      skillsCount: Array.isArray(resumeData.skills) ? resumeData.skills.length : 'not array',
      experienceCount: Array.isArray(resumeData.experience) ? resumeData.experience.length : 'not array',
      projectsCount: Array.isArray(resumeData.projects) ? resumeData.projects.length : 'not array'
    });

    // Calculate current ATS score
    console.log('🔍 About to calculate ATS score...');
    const currentATSScore = await atsScorer.calculateScore(resumeData);
    console.log('📈 Current ATS Score:', currentATSScore.overallScore);

    // Use atsImprover for optimization with data preservation
    console.log('🔍 About to improve resume...');
    const improvementResult = await atsImprover.improveResume(resumeData, currentATSScore);
    const optimizedResumeData = improvementResult.improvedData;

    console.log('✅ Resume optimization completed:', {
      originalSkillsCount: Array.isArray(resumeData.skills) ? resumeData.skills.length : 'not array',
      optimizedSkillsCount: Array.isArray(optimizedResumeData.skills) ? optimizedResumeData.skills.length : 'not array',
      originalExperienceCount: Array.isArray(resumeData.experience) ? resumeData.experience.length : 'not array',
      optimizedExperienceCount: Array.isArray(optimizedResumeData.experience) ? optimizedResumeData.experience.length : 'not array',
      originalProjectsCount: Array.isArray(resumeData.projects) ? resumeData.projects.length : 'not array',
      optimizedProjectsCount: Array.isArray(optimizedResumeData.projects) ? optimizedResumeData.projects.length : 'not array',
      estimatedNewScore: improvementResult.estimatedNewScore
    });

    // Update the resume in database with preserved data structure
    console.log('🔍 About to update database...');
    const updateQuery = `
      UPDATE resumes SET
        personal_info = $1,
        summary = $2,
        objective = $3,
        skills = $4,
        experience = $5,
        education = $6,
        projects = $7,
        certifications = $8,
        languages = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND user_id = $11
      RETURNING *
    `;

    const updateValues = [
      JSON.stringify(optimizedResumeData.personalInfo || currentResume.personal_info),
      optimizedResumeData.summary || currentResume.summary,
      optimizedResumeData.objective || currentResume.objective,
      JSON.stringify(optimizedResumeData.skills || currentResume.skills),
      JSON.stringify(optimizedResumeData.experience || currentResume.experience),
      JSON.stringify(optimizedResumeData.education || currentResume.education),
      JSON.stringify(optimizedResumeData.projects || currentResume.projects),
      JSON.stringify(optimizedResumeData.certifications || currentResume.certifications),
      JSON.stringify(optimizedResumeData.languages || currentResume.languages),
      validatedData.resumeId,
      userId
    ];

    const updateResult = await db.query(updateQuery, updateValues);
    const updatedResume = updateResult.rows[0];

    return res.json({
      success: true,
      data: {
        optimizedResume: {
          id: updatedResume.id,
          title: updatedResume.title,
          personalInfo: typeof updatedResume.personal_info === 'string' ? JSON.parse(updatedResume.personal_info) : updatedResume.personal_info,
          summary: updatedResume.summary,
          objective: updatedResume.objective,
          skills: typeof updatedResume.skills === 'string' ? JSON.parse(updatedResume.skills) : updatedResume.skills,
          experience: typeof updatedResume.experience === 'string' ? JSON.parse(updatedResume.experience) : updatedResume.experience,
          education: typeof updatedResume.education === 'string' ? JSON.parse(updatedResume.education) : updatedResume.education,
          projects: typeof updatedResume.projects === 'string' ? JSON.parse(updatedResume.projects) : updatedResume.projects,
          certifications: typeof updatedResume.certifications === 'string' ? JSON.parse(updatedResume.certifications) : updatedResume.certifications,
          languages: typeof updatedResume.languages === 'string' ? JSON.parse(updatedResume.languages) : updatedResume.languages,
          updatedAt: updatedResume.updated_at
        },
        improvements: improvementResult.improvements,
        changesApplied: improvementResult.changesApplied,
        estimatedNewScore: improvementResult.estimatedNewScore,
        message: "Resume optimized successfully with data preservation"
      },
    });

  } catch (error) {
    console.error("❌ Resume optimization error:", error);

    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to optimize resume",
    });
  }
});

export default router;