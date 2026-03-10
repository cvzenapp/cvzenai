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

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object - no markdown, no explanations, no extra text
2. Ensure all strings are properly escaped and terminated
3. Use double quotes for all JSON keys and string values
4. Do not include trailing commas
5. Ensure the JSON is complete and well-formed

Return ONLY this exact JSON structure:
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
- Use action verbs and industry terminology
- Ensure all JSON strings are properly escaped and complete`;

    const userPrompt = `Job Title: ${validatedData.jobTitle}
Company: ${validatedData.companyName}

Job Description:
${validatedData.jobDescription}

${validatedData.jobRequirements ? `Job Requirements: ${validatedData.jobRequirements.join(', ')}` : ''}

Current Resume Data:
${JSON.stringify(resumeData, null, 2)}

Please optimize this resume for the job posting. Return ONLY the JSON object with no additional text or formatting.`;

    const optimizationResponse = await groqService.generateResponse(systemPrompt, userPrompt, {
      temperature: 0.3,  // Lower temperature for more consistent JSON output
      maxTokens: 2000    // Increased token limit for complete responses
    });

    console.log('✅ Resume optimization response:', optimizationResponse);

    // Parse the optimized resume data
    let optimizedData;
    try {
      const responseText = typeof optimizationResponse === 'string' 
        ? optimizationResponse 
        : optimizationResponse.response || '';
      console.log('Raw AI response:', responseText);
      
      // Clean the response text to handle common JSON issues
      let cleanedResponse = responseText.trim();
      
      // Remove any markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      
      // Find the JSON object boundaries
      const jsonStart = cleanedResponse.indexOf('{');
      const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON object found in response');
      }
      
      const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
      console.log('Extracted JSON string:', jsonString);
      
      // Try to fix common JSON issues
      let fixedJson = jsonString
        .replace(/,\s*}/g, '}')  // Remove trailing commas
        .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\r/g, '')      // Remove carriage returns
        .replace(/\t/g, ' ')     // Replace tabs with spaces
        .replace(/\s+/g, ' ')    // Normalize whitespace
        .trim();
      
      // Attempt to parse the cleaned JSON
      optimizedData = JSON.parse(fixedJson);
      
    } catch (parseError) {
      console.error('Failed to parse optimization response:', parseError);
      console.error('Response text:', typeof optimizationResponse === 'string' 
        ? optimizationResponse 
        : optimizationResponse.response || 'No response text');
      
      // Create a fallback optimization with basic improvements
      console.log('Creating fallback optimization...');
      optimizedData = {
        summary: currentResume.summary || `Experienced professional with expertise in ${validatedData.jobTitle}`,
        careerObjective: currentResume.career_objective || `Seeking opportunities in ${validatedData.jobTitle} at ${validatedData.companyName}`,
        skills: currentResume.skills || [],
        experience: currentResume.experience || [],
        projects: currentResume.projects || []
      };
      
      // Add job-relevant keywords to summary if possible
      if (validatedData.jobDescription) {
        const keywords = validatedData.jobDescription
          .toLowerCase()
          .match(/\b(javascript|python|react|node|sql|aws|docker|kubernetes|agile|scrum)\b/g) || [];
        
        if (keywords.length > 0 && optimizedData.summary) {
          optimizedData.summary += ` Skilled in ${keywords.slice(0, 3).join(', ')}.`;
        }
      }
      
      console.log('Using fallback optimization data');
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

    return res.json({
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

    return res.status(500).json({
      success: false,
      message: "Failed to optimize resume",
    });
  }
});

export default router;