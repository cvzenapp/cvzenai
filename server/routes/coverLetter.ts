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

// Validation schema for cover letter generation
const coverLetterSchema = z.object({
  jobId: z.string(),
  resumeId: z.string(),
  jobDescription: z.string(),
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

    // Get user's resume data (excluding personal info)
    const resumeQuery = `
      SELECT 
        skills,
        experience,
        education,
        projects,
        certifications,
        summary
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
    const systemPrompt = `You are an expert cover letter writer. Create a professional, compelling cover letter based on the provided job description and candidate's resume data. 

Guidelines:
- Write in a confident, direct tone
- Every sentence must contain a specific company name, tool, metric, or achievement. No abstract statements allowed.
- Start the letter with a specific achievement or metric from the resume. The first word must be an action verb, not 'I'."
- Reference specific academic projects, coursework, tools learned, or internship work. If no work experience, lead with the strongest technical skill and a project outcome.
- Never use first-person 'I' statements.
- Open with a strong action verb and a specific achievement.
- Mention 1-2 key qualifications from the resume that match the job.
- Connect experience to job requirements specifically
- Maximum 2 short paragraphs
- No filler phrases like 'I am excited to apply'
- Only use metrics explicitly stated in the resume. Never invent or estimate numbers.
- Keep it concise and impactful
- Highlight relevant skills and experience that match the job requirements
- Show value proposition clearly
- Use professional tone
- Don't include personal information like name, address, phone, email
- Start with "Dear Hiring Manager," and end with "Sincerely,"
- Reference specific achievements from the resume with numbers where available.
- Match keywords from the job description naturally
- Avoid generic statements
- Ending with a result, not a wish
- Don't use bullet points or markdown
- Don't mention the resume explicitly
- Don't use "Thank you for considering my application" or similar closing lines
- Don't use "Best regards" or "Kind regards"
- Don't use "I look forward to hearing from you"
- Don't use "I am writing to express my interest in"
- Don't use "I believe my background aligns well with"
- Don't use "I have attached my resume"
- Don't use "I am confident that I can contribute effectively"
- Don't use 'I am passionate about"
- Don't use "I am excited to"
- Don't use "I am applying for"
- Don't use "I am excited to apply for"
- Don't use "I am confident in my ability to"
- Don't use "I am eager to contribute to"
- Don't use "I am thrilled to apply for"
- Don't use "I am confident that my experience will be an asset to"
- Don't use "I am impressed by"
- Don't use "I am drawn to"
- Don't use "I am seeking"
- Don't use "I am committed to"
- Don't use "I am dedicated to"
- Don't use "I am enthusiastic about"
- Don't use "I am eager to work with"
- Don't use "I am looking forward to"
- Don't use "I am excited about the opportunity to"
- Don't use "I am interested in"
- Don't use "I am available to discuss"
- Don't use "I am ready to contribute to"
- Don't use "I am excited to be considered for"
- Don't use "I am confident that I can make a meaningful contribution to"
- Don't use "I am excited to bring my expertise in"
- Don't use "I am eager to leverage my skills in"
- Don't use "I am excited to explore the possibility of working with"
- Don't use "I am hoping to join"
- Don't use "I am seeking to advance my career at"
- Don't use "I am looking to contribute to"
- Don't use "I am excited to be part of"
- Don't use "I am passionate about contributing to"
- Don't use "I am eager to take on new challenges at"
- Don't use "I am excited to be a part of"
- Don't use "I am looking to grow professionally at"
- Don't use "I am excited to be a valuable addition to"
- Don't use "I am confident that I will be able to deliver results for"
- Don't use "I am excited to be given the opportunity to"
- Don't use "I am eager to collaborate with"
- Don't use "I am enthusiastic about the prospect of"
- Don't use "I am looking to make an impact at"
- Don't use "I am excited to be part of the team at"
- Don't use "I am eager to contribute my expertise to"
- Don't use "I am confident in my ability to"
- Don't use "I am ready to take on responsibilities at"
- Don't use "I am excited to be considered for the position of"
- Don't use "I am looking to make a difference at"
- Don't use "I would welcome the opportunity to discuss how my experience can benefit your team"
- Focus on how the candidate's background directly aligns with the job requirements`;

    const userPrompt = `Job Title: ${validatedData.jobTitle}
Company: ${validatedData.companyName}

Job Description:
${validatedData.jobDescription}

Candidate's Resume Data:
${JSON.stringify(resumeForAI, null, 2)}

Please write a professional cover letter for this job application.`;

    const coverLetterResponse = await groqService.generateResponse(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 800
    });

    console.log('✅ Cover letter raw response:', JSON.stringify(coverLetterResponse, null, 2));

    // Extract the actual text response - handle all possible formats
    let coverLetterText = '';
    
    if (typeof coverLetterResponse === 'string') {
      coverLetterText = coverLetterResponse;
    } else if (coverLetterResponse && typeof coverLetterResponse === 'object') {
      if (coverLetterResponse.response) {
        coverLetterText = coverLetterResponse.response;
      } else if (coverLetterResponse.data) {
        coverLetterText = coverLetterResponse.data;
      } else {
        coverLetterText = JSON.stringify(coverLetterResponse);
      }
    }

    console.log('✅ Final cover letter text:', coverLetterText);

    res.json({
      success: true,
      data: {
        coverLetter: coverLetterText || 'Unable to generate cover letter',
      },
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