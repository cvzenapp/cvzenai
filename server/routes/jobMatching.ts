import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../database/connection.js";
import { abstractedAiService } from "../services/abstractedAiService.js";
import { jsonrepair } from 'jsonrepair';

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
  jobId: z.string(), // jobId is required to fetch job details from database
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
    console.log('📝 Request body received:', JSON.stringify(req.body, null, 2));
    console.log('📝 Request headers:', req.headers['content-type']);
    
    const validatedData = jobMatchingSchema.parse(req.body);
    db = await initializeDatabase();

    // Get job details from database using jobId
    const jobQuery = `
      SELECT 
        title,
        description,
        requirements,
        company,
        location,
        salary_range,
        job_type,
        experience_level
      FROM job_postings 
      WHERE id = $1 AND status = 'active'
    `;
    const jobResult = await db.query(jobQuery, [validatedData.jobId]);
    
    if (jobResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found or inactive",
      });
    }

    const jobData = jobResult.rows[0];

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

    // Parse job requirements if it's a JSON string
    let jobRequirements = [];
    if (jobData.requirements) {
      try {
        jobRequirements = typeof jobData.requirements === 'string' ? 
          JSON.parse(jobData.requirements) : jobData.requirements;
      } catch (e) {
        // If not JSON, treat as plain text and split by lines or commas
        jobRequirements = jobData.requirements.split(/[,\n]/).map((req: string) => req.trim()).filter(Boolean);
      }
    }

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

    const userPrompt = `Job Title: ${jobData.title}
Company: ${jobData.company_name}
Location: ${jobData.location}
Experience Level: ${jobData.experience_level}
Job Type: ${jobData.job_type}
Salary Range: ${jobData.salary_range}

Job Description:
${jobData.description}

${jobRequirements.length > 0 ? `Job Requirements: ${jobRequirements.join(', ')}` : ''}

Resume:
${resumeText}

Calculate the ATS match score and provide analysis.`;

    const response = await abstractedAiService.generateResponse({
      systemPrompt,
      userPrompt,
      options: {
        temperature: 0.3,
        maxTokens: 500,
        auditContext: {
          serviceName: 'job_matching',
          operationType: 'ats_score',
          userContext: { userId, jobId: validatedData.jobId }
        }
      }
    });

    console.log('✅ Job match score response:', response);

    // Parse the JSON response from abstractedAiService
    let matchData;
    try {
      const responseText = response.success ? response.response : '';
      if (!responseText) {
        throw new Error('Empty response from AI service');
      }
      
      // Strip markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
      
      // Find JSON object boundaries
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonText = cleanedText.substring(firstBrace, lastBrace + 1);
        matchData = JSON.parse(jsonText);
      } else {
        throw new Error('No valid JSON object found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      
      // Try jsonrepair
      try {
        const responseText = response.success ? response.response : '';
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
        const repairedJson = jsonrepair(cleanedText);
        matchData = JSON.parse(repairedJson);
        console.log('✅ JSON successfully repaired and parsed');
      } catch (repairError) {
        console.error('❌ JSON repair also failed:', repairError);
        return res.status(500).json({
          success: false,
          message: "Failed to parse AI response",
        });
      }
    }

    return res.json({
      success: true,
      data: {
        score: Math.min(100, Math.max(0, matchData.score || 0)),
        reasons: matchData.reasons || [],
        missing: matchData.missing || [],
        jobDetails: {
          title: jobData.title,
          company: jobData.company_name,
          location: jobData.location,
          experienceLevel: jobData.experience_level,
          jobType: jobData.job_type,
          salaryRange: jobData.salary_range
        }
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