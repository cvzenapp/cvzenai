import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../database/connection.js";
import { atsImprover } from "../services/dspy/atsImprover.js";
import { atsScorer } from "../services/dspy/atsScorer.js";

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
  sectionName: z.string().optional(), // Optional: specific section to optimize
});

// POST /api/resume-optimization/optimize - Optimize resume with real-time progress and incremental database updates
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

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to optimization stream' })}\n\n`);

    // Get current resume data
    const resumeQuery = `
      SELECT *
      FROM resumes 
      WHERE id = $1 AND user_id = $2
    `;
    const resumeResult = await db.query(resumeQuery, [validatedData.resumeId, userId]);
    
    if (resumeResult.rows.length === 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Resume not found' })}\n\n`);
      res.end();
      return;
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

    // Send progress update
    res.write(`data: ${JSON.stringify({ type: 'progress', message: 'Calculating current ATS score...', stage: 'scoring' })}\n\n`);

    // Calculate current ATS score
    const currentATSScore = await atsScorer.calculateScore(resumeData);
    
    // Send score calculated update
    res.write(`data: ${JSON.stringify({ 
      type: 'score_calculated', 
      message: `Current ATS score: ${currentATSScore.overallScore}/100`,
      currentScore: currentATSScore.overallScore,
      stage: 'score_calculated'
    })}\n\n`);

    // Progress callback function
    const progressCallback = (update: any) => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    };

    // Database update callback function for incremental updates
    const updateCallback = async (sectionName: string, sectionData: any) => {
      const sectionUpdateQuery = `
        UPDATE resumes SET
          ${sectionName} = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
      `;
      
      const sectionValue = typeof sectionData === 'object' ? JSON.stringify(sectionData) : sectionData;
      await db.query(sectionUpdateQuery, [sectionValue, validatedData.resumeId, userId]);
    };

    // Check if specific section optimization is requested
    let improvementResult;
    if (validatedData.sectionName) {
      // Single section optimization
      console.log(`🎯 Optimizing single section: ${validatedData.sectionName}`);
      
      // Send progress update for single section
      res.write(`data: ${JSON.stringify({ 
        type: 'progress', 
        message: `Optimizing ${validatedData.sectionName} section...`,
        stage: 'single_section',
        sectionName: validatedData.sectionName
      })}\n\n`);

      improvementResult = await atsImprover.improveSingleSectionPublic(
        validatedData.sectionName,
        resumeData,
        currentATSScore,
        progressCallback,
        updateCallback
      );
    } else {
      // Full resume optimization (all sections)
      improvementResult = await atsImprover.improveSectionBySection(
        resumeData, 
        currentATSScore, 
        progressCallback,
        updateCallback
      );
    }
    const optimizedResumeData = improvementResult.improvedData;

    // Get final updated resume from database (since sections were updated incrementally)
    const finalResumeQuery = `
      SELECT *
      FROM resumes 
      WHERE id = $1 AND user_id = $2
    `;
    const finalResumeResult = await db.query(finalResumeQuery, [validatedData.resumeId, userId]);
    const updatedResume = finalResumeResult.rows[0];

    // Send final result
    res.write(`data: ${JSON.stringify({
      type: 'final_result',
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
      }
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error("❌ Resume optimization error:", error);
    
    res.write(`data: ${JSON.stringify({
      type: 'error',
      success: false,
      message: error.message || "Failed to optimize resume"
    })}\n\n`);
    
    res.end();
  }
});

export default router;