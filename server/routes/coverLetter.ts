import { Router, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { initializeDatabase } from "../database/connection.js";
import { abstractedAiService } from "../services/abstractedAiService.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Validation schema for cover letter generation
const coverLetterSchema = z.object({
  jobId: z.union([z.string(), z.number()]).transform(val => String(val)),
  resumeId: z.union([z.string(), z.number()]).transform(val => String(val)),
  jobDescription: z.string().optional(),
  jobTitle: z.string(),
  companyName: z.string(),
});

// POST /api/cover-letter/generate - Generate AI cover letter
router.post("/generate", async (req: Request, res: Response) => {
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
    const validatedData = coverLetterSchema.parse(req.body);
    db = await initializeDatabase();

    // Get job description if not provided
    let jobDescription = validatedData.jobDescription || '';
    if (!jobDescription && validatedData.jobId) {
      const jobQuery = `SELECT description FROM job_postings WHERE id = $1`;
      const jobResult = await db.query(jobQuery, [validatedData.jobId]);
      if (jobResult.rows.length > 0) {
        jobDescription = jobResult.rows[0].description || '';
      }
    }

    // Get user's resume data and personal info for name
    const resumeQuery = `
      SELECT 
        skills,
        experience,
        education,
        projects,
        certifications,
        summary,
        personal_info
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

    const resumeData = resumeResult.rows[0];

    // Get candidate name from personal info or user table
    let candidateName = 'Candidate';
    if (resumeData.personal_info) {
      const personalInfo = typeof resumeData.personal_info === 'string' 
        ? JSON.parse(resumeData.personal_info) 
        : resumeData.personal_info;
      candidateName = personalInfo.fullName || personalInfo.name || 
                     `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 
                     candidateName;
    }
    
    // If no name in resume, get from user table
    if (candidateName === 'Candidate') {
      const userQuery = `SELECT first_name, last_name FROM users WHERE id = $1`;
      const userResult = await db.query(userQuery, [userId]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        candidateName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || candidateName;
      }
    }

    // Prepare resume data for AI (excluding personal info)
    const resumeForAI = {
      skills: resumeData.skills || [],
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      projects: resumeData.projects || [],
      certifications: resumeData.certifications || [],
      summary: resumeData.summary || ""
    };

    // Generate cover letter using Groq AI
    const systemPrompt = `You are an expert cover letter writer. Create a professional, compelling cover letter that specifically matches the candidate's resume to the job requirements.

    CRITICAL REQUIREMENTS:
    - Use ONLY information explicitly stated in the resume data provided
    - Match specific skills from the resume to job requirements
    - Reference actual projects, companies, or achievements from the resume
    - Never invent or assume information not in the resume
    - Keep it concise (2-3 short paragraphs maximum)
    - Start with "Dear Hiring Manager," and end with "Sincerely," followed by the candidate's actual name
    - Write in first person ("I have experience with...")
    - Focus on relevant qualifications that match the job
    - ALWAYS use the candidate's real name in the signature, never use placeholders like "[Your Name]"

    STRUCTURE:
    1. Opening: State the position and highlight 1-2 most relevant qualifications from resume
    2. Body: Connect specific resume experience/skills to job requirements
    3. Closing: Brief statement about contribution and next steps, then "Sincerely," followed by the candidate's name

    AVOID:
    - Generic phrases like "I am excited to apply"
    - Information not in the resume
    - Overly long explanations
    - Bullet points or formatting
    - Mentioning the resume directly
    - Using placeholder names like "[Your Name]" or "[Candidate Name]"`

    const userPrompt = `Job Title: ${validatedData.jobTitle}
Company: ${validatedData.companyName}
Candidate Name: ${candidateName}

${jobDescription ? `Job Description:\n${jobDescription}\n\n` : ''}

Candidate's Resume Data:
Skills: ${JSON.stringify(resumeForAI.skills)}
Experience: ${JSON.stringify(resumeForAI.experience)}
Education: ${JSON.stringify(resumeForAI.education)}
Projects: ${JSON.stringify(resumeForAI.projects)}
Certifications: ${JSON.stringify(resumeForAI.certifications)}
Summary: ${resumeForAI.summary}

Write a personalized cover letter that connects this candidate's specific background to the job requirements. End with "Sincerely," followed by the candidate's name: ${candidateName}.`;

    const coverLetterResponse = await abstractedAiService.generateResponse({
      systemPrompt,
      userPrompt,
      options: {
        temperature: 0.7,
        maxTokens: 800,
        auditContext: {
          serviceName: 'cover_letter_generation',
          operationType: 'cover_letter',
          userContext: { userId, jobId: validatedData.jobId, resumeId: validatedData.resumeId }
        }
      }
    });

    console.log('✅ Cover letter raw response:', JSON.stringify(coverLetterResponse, null, 2));

    // Extract the actual text response from abstractedAiService
    const coverLetterText = coverLetterResponse.success 
      ? coverLetterResponse.response 
      : 'Unable to generate cover letter';

    console.log('✅ Final cover letter text:', coverLetterText);

    res.json({
      success: true,
      coverLetter: coverLetterText || 'Unable to generate cover letter',
    });

  } catch (error) {
    console.error("❌ Generate cover letter error:", error);

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
      message: "Failed to generate cover letter",
    });
  } finally {
    // Don't close database connection
  }
});

export default router;

// POST /api/cover-letter/generate-guest - Generate AI cover letter for guest users
router.post("/generate-guest", async (req: Request, res: Response) => {
  let db;

  try {
    const { resumeData, jobId, jobTitle, companyName, candidateName } = req.body;

    console.log('✅ Guest cover letter generation request:', {
      jobId,
      jobTitle,
      companyName,
      candidateName,
      hasResumeData: !!resumeData,
      resumeDataKeys: resumeData ? Object.keys(resumeData) : [],
      skillsCount: resumeData?.skills?.length || 0,
      experienceCount: resumeData?.experience?.length || 0,
      educationCount: resumeData?.education?.length || 0,
      projectsCount: resumeData?.projects?.length || 0
    });

    if (!resumeData || !jobTitle || !companyName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: resumeData, jobTitle, companyName",
      });
    }

    db = await initializeDatabase();

    // Get job description if jobId is provided
    let jobDescription = '';
    if (jobId) {
      const jobQuery = `SELECT description FROM job_postings WHERE id = $1`;
      const jobResult = await db.query(jobQuery, [jobId]);
      if (jobResult.rows.length > 0) {
        jobDescription = jobResult.rows[0].description || '';
      }
    }

    // Prepare resume data for AI (excluding personal info)
    const resumeForAI = {
      skills: resumeData.skills || [],
      experience: resumeData.experience || [],
      education: resumeData.education || [],
      projects: resumeData.projects || [],
      certifications: resumeData.certifications || [],
      summary: resumeData.summary || ""
    };

    // Generate cover letter using Groq AI
    const systemPrompt = `You are an expert cover letter writer. Create a professional, compelling cover letter that specifically matches the candidate's resume to the job requirements.

CRITICAL REQUIREMENTS:
- Use ONLY information explicitly stated in the resume data provided
- Match specific skills from the resume to job requirements
- Reference actual projects, companies, or achievements from the resume
- Never invent or assume information not in the resume
- Keep it concise (2-3 short paragraphs maximum)
- Start with "Dear Hiring Manager," and end with "Sincerely," followed by the candidate's actual name
- Write in first person ("I have experience with...")
- Focus on relevant qualifications that match the job
- ALWAYS use the candidate's real name in the signature, never use placeholders like "[Your Name]"

STRUCTURE:
1. Opening: State the position and highlight 1-2 most relevant qualifications from resume
2. Body: Connect specific resume experience/skills to job requirements
3. Closing: Brief statement about contribution and next steps, then "Sincerely," followed by the candidate's name

AVOID:
- Generic phrases like "I am excited to apply"
- Information not in the resume
- Overly long explanations
- Bullet points or formatting
- Mentioning the resume directly
- Using placeholder names like "[Your Name]" or "[Candidate Name]"`;

    const userPrompt = `Job Title: ${jobTitle}
Company: ${companyName}
Candidate Name: ${candidateName || 'Candidate'}

${jobDescription ? `Job Description:\n${jobDescription}\n\n` : ''}

Candidate's Resume Data:
Skills: ${JSON.stringify(resumeForAI.skills)}
Experience: ${JSON.stringify(resumeForAI.experience)}
Education: ${JSON.stringify(resumeForAI.education)}
Projects: ${JSON.stringify(resumeForAI.projects)}
Certifications: ${JSON.stringify(resumeForAI.certifications)}
Summary: ${resumeForAI.summary}

Write a personalized cover letter that connects this candidate's specific background to the job requirements. End with "Sincerely," followed by the candidate's name: ${candidateName || 'Candidate'}.`;

    const coverLetterResponse = await abstractedAiService.generateResponse({
      systemPrompt,
      userPrompt,
      options: {
        temperature: 0.7,
        maxTokens: 800,
        auditContext: {
          serviceName: 'cover_letter_generation',
          operationType: 'cover_letter_guest',
          userContext: { jobId, candidateName }
        }
      }
    });

    console.log('✅ Guest cover letter raw response:', JSON.stringify(coverLetterResponse, null, 2));

    // Extract the actual text response from abstractedAiService
    const coverLetterText = coverLetterResponse.success 
      ? coverLetterResponse.response 
      : 'Unable to generate cover letter';

    console.log('✅ Final guest cover letter text:', coverLetterText);

    res.json({
      success: true,
      coverLetter: coverLetterText,
    });

  } catch (error) {
    console.error("❌ Generate guest cover letter error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate cover letter",
      error: error.message
    });
  } finally {
    // Don't close database connection
  }
});