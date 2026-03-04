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

// Validation schema for job matching
const jobMatchingSchema = z.object({
  jobId: z.string(),
  jobDescription: z.string(),
  jobTitle: z.string(),
  jobRequirements: z.array(z.string()).optional(),
});

// POST /api/job-matching/calculate-score - Calculate ATS match score
router.post("/calculate-score", async (req: Request, res: Response) => {
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
    const validatedData = jobMatchingSchema.parse(req.body);
    db = await initializeDatabase();

    // Get user's latest resume
    const resumeQuery = `
      SELECT 
        skills,
        experience,
        education,
        summary,
        certifications,
        projects
      FROM resumes 
      WHERE user_id = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    const resumeResult = await db.query(resumeQuery, [userId]);
    
    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No resume found",
      });
    }

    const resumeData = resumeResult.rows[0];

    // Prepare resume text for analysis
    const resumeText = `
Skills: ${Array.isArray(resumeData.skills) ? resumeData.skills.join(', ') : resumeData.skills || ''}

Experience: ${Array.isArray(resumeData.experience) ? 
  resumeData.experience.map((exp: any) => `${exp.title} at ${exp.company} - ${exp.description}`).join('\n') : 
  resumeData.experience || ''}

Education: ${Array.isArray(resumeData.education) ? 
  resumeData.education.map((edu: any) => `${edu.degree} from ${edu.institution}`).join('\n') : 
  resumeData.education || ''}

Summary: ${resumeData.summary || ''}

Certifications: ${Array.isArray(resumeData.certifications) ? resumeData.certifications.join(', ') : resumeData.certifications || ''}

Projects: ${Array.isArray(resumeData.projects) ? 
  resumeData.projects.map((proj: any) => `${proj.name} - ${proj.description}`).join('\n') : 
  resumeData.projects || ''}
    `.trim();

    // Generate ATS score using Groq AI
    const systemPrompt = `You are an ATS (Applicant Tracking System) analyzer. Calculate a match score between a resume and job description.

Analyze the following factors:
1. Skills alignment (40% weight)
2. Experience relevance (30% weight)  
3. Education requirements (15% weight)
4. Keywords matching (15% weight)

Return ONLY a JSON object with this exact format:
{
  "score": 85,
  "reasons": ["Strong skills match in Python and React", "5+ years experience aligns with requirements", "Relevant project experience"],
  "missing": ["AWS certification preferred", "Leadership experience"]
}

Score should be 0-100. Be realistic and fair in scoring.`;

    const userPrompt = `Job Title: ${validatedData.jobTitle}

Job Description:
${validatedData.jobDescription}

${validatedData.jobRequirements ? `Job Requirements: ${validatedData.jobRequirements.join(', ')}` : ''}

Resume:
${resumeText}

Calculate the ATS match score and provide analysis.`;

    const response = await groqService.generateResponse(systemPrompt, userPrompt, {
      temperature: 0.3,
      maxTokens: 500
    });

    console.log('✅ Job match score response:', response);

    // Parse the JSON response
    let matchData;
    try {
      const responseText = response.response || response;
      matchData = JSON.parse(responseText.trim());
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback if JSON parsing fails
      matchData = {
        score: 75,
        reasons: ["Analysis completed"],
        missing: []
      };
    }

    return res.json({
      success: true,
      data: {
        score: Math.min(100, Math.max(0, matchData.score || 75)),
        reasons: matchData.reasons || [],
        missing: matchData.missing || []
      },
    });

  } catch (error) {
    console.error("❌ Calculate job match score error:", error);

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
      message: "Failed to calculate match score",
    });
  }
});

export default router;