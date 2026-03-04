import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../database/connection.js";
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
      summary: currentResume.summary || '',
      careerObjective: currentResume.career_objective || '',
      skills: currentResume.skills || [],
      experience: currentResume.experience || [],
      education: currentResume.education || [],
      projects: currentResume.projects || [],
      certifications: currentResume.certifications || []
    };

    // Generate optimized resume using Groq AI
    const systemPrompt = `You are an expert resume optimizer and ATS specialist. Optimize the provided resume for the specific job posting to maximize ATS compatibility and relevance.

CRITICAL: Return ONLY a valid JSON object with this exact structure:
{
  "summary": "optimized professional summary text",
  "careerObjective": "compelling career objective statement",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name", 
      "duration": "2020-2023",
      "description": "Optimized bullet points with quantified achievements"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Enhanced project description with relevant keywords",
      "technologies": ["tech1", "tech2"]
    }
  ]
}

Optimization Guidelines:
- Add relevant keywords from job description naturally
- Quantify achievements with numbers/percentages where possible
- Enhance project descriptions to match job requirements
- Create compelling professional summary if missing
- Maintain truthfulness while optimizing presentation
- Focus on skills and experience that match the job posting
- Use action verbs and industry terminology`;

    const userPrompt = `Job Title: ${validatedData.jobTitle}
Company: ${validatedData.companyName}

Job Description:
${validatedData.jobDescription}

${validatedData.jobRequirements ? `Job Requirements: ${validatedData.jobRequirements.join(', ')}` : ''}

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please optimize this resume for the job posting. Return only the JSON object.`;

    const optimizationResponse = await groqService.generateResponse(systemPrompt, userPrompt, {
      temperature: 0.4,
      maxTokens: 1500
    });

    console.log('✅ Resume optimization response:', optimizationResponse);

    // Parse the optimized resume data
    let optimizedData;
    try {
      const responseText = optimizationResponse.response || optimizationResponse;
      optimizedData = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('Failed to parse optimization response:', parseError);
      return res.status(500).json({
        success: false,
        message: "Failed to parse optimization results",
      });
    }

    // Update the resume in database
    const updateQuery = `
      UPDATE resumes SET
        summary = $1,
        career_objective = $2,
        skills = $3,
        experience = $4,
        projects = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `;

    const updateValues = [
      optimizedData.summary || currentResume.summary,
      optimizedData.careerObjective || currentResume.career_objective,
      JSON.stringify(optimizedData.skills || currentResume.skills),
      JSON.stringify(optimizedData.experience || currentResume.experience),
      JSON.stringify(optimizedData.projects || currentResume.projects),
      validatedData.resumeId,
      userId
    ];

    const updateResult = await db.query(updateQuery, updateValues);
    const updatedResume = updateResult.rows[0];

    res.json({
      success: true,
      data: {
        optimizedResume: {
          id: updatedResume.id,
          title: updatedResume.title,
          summary: updatedResume.summary,
          careerObjective: updatedResume.career_objective,
          skills: typeof updatedResume.skills === 'string' ? JSON.parse(updatedResume.skills) : updatedResume.skills,
          experience: typeof updatedResume.experience === 'string' ? JSON.parse(updatedResume.experience) : updatedResume.experience,
          projects: typeof updatedResume.projects === 'string' ? JSON.parse(updatedResume.projects) : updatedResume.projects,
          updatedAt: updatedResume.updated_at
        },
        message: "Resume optimized successfully"
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

    res.status(500).json({
      success: false,
      message: "Failed to optimize resume",
    });
  }
});

export default router;