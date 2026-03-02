import { RequestHandler, Response } from "express";
import { AuthRequest } from '../middleware/unifiedAuth.js';

/**
 * Clean skill name by removing category hints and extra info
 */
function cleanSkillName(skillName: string): string {
  // Remove content in parentheses (e.g., "Playwright (UI automation)" → "Playwright")
  let cleaned = skillName.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Remove common category prefixes
  const categoryPrefixes = [
    'Automation & Testing Tools',
    'Programming Languages',
    'Frameworks & Platforms',
    'Cloud & DevOps',
    'Databases',
    'AI & Workflow Systems',
    'Collaboration & Management Tools',
    'Development Tools',
    'Web Technologies'
  ];
  
  for (const prefix of categoryPrefixes) {
    if (cleaned === prefix) {
      // This is a category name, not a skill - skip it
      return '';
    }
  }
  
  return cleaned;
}

/**
 * Intelligently categorize a skill based on its name
 */
function categorizeSkill(skillName: string): string {
  const lowerSkill = skillName.toLowerCase().trim();
  
  // Programming Languages
  if (/^(python|javascript|typescript|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab|perl|shell|bash|sql)$/i.test(lowerSkill)) {
    return 'Programming Languages';
  }
  
  // Frontend
  if (/^(react|vue|angular|svelte|next\.?js|nuxt|html5?|css3?|sass|scss|less|tailwind|bootstrap|jquery)$/i.test(lowerSkill)) {
    return 'Frontend';
  }
  
  // Backend
  if (/^(node\.?js|express|django|flask|spring|laravel|rails|asp\.net|fastapi|nest\.?js|koa|hapi)$/i.test(lowerSkill)) {
    return 'Backend';
  }
  
  // Databases
  if (/^(mysql|postgresql|postgres|mongodb|redis|elasticsearch|cassandra|dynamodb|oracle|sql\s*server|sqlite|mariadb|neo4j|couchdb|supabase|firebase)$/i.test(lowerSkill)) {
    return 'Databases';
  }
  
  // Cloud Platforms
  if (/^(aws|azure|gcp|google\s*cloud|heroku|digitalocean|vercel|netlify|cloudflare)$/i.test(lowerSkill)) {
    return 'Cloud Platforms';
  }
  
  // DevOps
  if (/^(docker|kubernetes|k8s|jenkins|gitlab|github\s*actions|ci\/cd|terraform|ansible|puppet|chef|vagrant)$/i.test(lowerSkill)) {
    return 'DevOps';
  }
  
  // Testing & QA
  if (/^(jest|mocha|chai|pytest|junit|selenium|cypress|playwright|jasmine|karma|testng|cucumber|postman|api\s*testing)$/i.test(lowerSkill)) {
    return 'Testing & QA';
  }
  
  // Development Tools
  if (/^(git|github|gitlab|bitbucket|jira|confluence|slack|trello|vscode|visual\s*studio|intellij|eclipse|webpack|vite|npm|yarn|maven|gradle)$/i.test(lowerSkill)) {
    return 'Development Tools';
  }
  
  // Data Science & AI
  if (/^(tensorflow|pytorch|keras|scikit-learn|pandas|numpy|jupyter|machine\s*learning|deep\s*learning|ai|llm|rag|prompt|nlp|computer\s*vision)$/i.test(lowerSkill)) {
    return 'Data Science & AI';
  }
  
  // Mobile Development
  if (/^(react\s*native|flutter|ionic|xamarin|swift|kotlin|android|ios|mobile)$/i.test(lowerSkill)) {
    return 'Mobile Development';
  }
  
  return 'Other';
}

/**
 * Parse skills from database - handles both old format (array) and new format (object with categories)
 * Ensures all skills are returned as objects with { name, level, category, ... }
 */
function parseSkills(skillsData: any): any[] {
  if (!skillsData) return [];
  
  // Parse if string
  const parsed = typeof skillsData === 'string' ? JSON.parse(skillsData) : skillsData;
  
  // New format: { skills: [...], categories: {...} }
  if (parsed && typeof parsed === 'object' && 'skills' in parsed) {
    const skills = parsed.skills || [];
    
    // Transform string skills to objects if needed
    const transformedSkills = skills.map((skill: any, index: number) => {
      // If already an object with name, clean and recategorize
      if (typeof skill === 'object' && skill.name) {
        const cleanedName = cleanSkillName(skill.name);
        if (!cleanedName) return null; // Skip category names
        
        return {
          ...skill,
          name: cleanedName,
          category: categorizeSkill(cleanedName)
        };
      }
      
      // If it's a string, convert to object
      if (typeof skill === 'string') {
        const cleanedName = cleanSkillName(skill);
        if (!cleanedName) return null; // Skip category names
        
        return {
          id: `skill-${Date.now()}-${index}`,
          name: cleanedName,
          level: 70, // Default proficiency
          proficiency: 70,
          category: categorizeSkill(cleanedName),
          isCore: false
        };
      }
      
      return skill;
    }).filter(Boolean); // Remove null entries
    
    return transformedSkills;
  }
  
  // Old format: just an array
  if (Array.isArray(parsed)) {
    // Transform string skills to objects if needed
    const transformedSkills = parsed.map((skill: any, index: number) => {
      // If already an object with name, clean and recategorize
      if (typeof skill === 'object' && skill.name) {
        const cleanedName = cleanSkillName(skill.name);
        if (!cleanedName) return null;
        
        return {
          ...skill,
          name: cleanedName,
          category: categorizeSkill(cleanedName)
        };
      }
      
      // If it's a string, convert to object
      if (typeof skill === 'string') {
        const cleanedName = cleanSkillName(skill);
        if (!cleanedName) return null;
        
        return {
          id: `skill-${Date.now()}-${index}`,
          name: cleanedName,
          level: 70,
          proficiency: 70,
          category: categorizeSkill(cleanedName),
          isCore: false
        };
      }
      
      return skill;
    }).filter(Boolean);
    
    return transformedSkills;
  }
  
  return [];
}

// API endpoint handlers
export const getUserResumes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    // Use the existing database connection
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Get user's resumes from database
    const resumesResult = await db.query(`
      SELECT r.*, u.email, u.avatar
      FROM resumes r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = $1
      ORDER BY r.is_active DESC NULLS LAST, r.updated_at DESC
    `, [userId]);

    const resumes = resumesResult.rows;

    const formattedResumes = resumes.map((resume: any) => {
      const personalInfo = typeof resume.personal_info === 'string' ? JSON.parse(resume.personal_info) : (resume.personal_info || {});
      // Merge user's avatar from users table into personalInfo
      if (resume.avatar) {
        personalInfo.avatar = resume.avatar;
      }
      
      // Map fullName to name for compatibility with ResumeBuilder
      if (personalInfo.fullName && !personalInfo.name) {
        personalInfo.name = personalInfo.fullName;
      }
      
      // Parse ATS score data if available
      let atsScore = undefined;
      if (resume.ats_score && resume.ats_score > 0) {
        atsScore = {
          overallScore: resume.ats_score,
          scores: {
            completeness: resume.ats_score_completeness || 0,
            formatting: resume.ats_score_formatting || 0,
            keywords: resume.ats_score_keywords || 0,
            experience: resume.ats_score_experience || 0,
            education: resume.ats_score_education || 0,
            skills: resume.ats_score_skills || 0
          },
          suggestions: resume.ats_suggestions ? JSON.parse(resume.ats_suggestions) : [],
          strengths: resume.ats_strengths ? JSON.parse(resume.ats_strengths) : [],
          scoredAt: resume.ats_scored_at
        };
      }
      
      return {
        id: resume.id,
        title: resume.title,
        isActive: resume.is_active === true,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
        personalInfo,
        experience: typeof resume.experience === 'string' ? JSON.parse(resume.experience) : (resume.experience || []),
        education: typeof resume.education === 'string' ? JSON.parse(resume.education) : (resume.education || []),
        skills: parseSkills(resume.skills),
        projects: typeof resume.projects === 'string' ? JSON.parse(resume.projects) : (resume.projects || []),
        certifications: typeof resume.certifications === 'string' ? JSON.parse(resume.certifications) : (resume.certifications || []),
        summary: resume.summary || '',
        objective: resume.objective || '',
        templateId: resume.template_id,
        atsScore
      };
    });

    res.json({
      success: true,
      data: formattedResumes,
      total: formattedResumes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user resumes:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Public endpoint to view any resume (for recruiters)
export const getResumePublic = async (req: any, res: Response) => {
  try {
    const resumeId = req.params.id;

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    const resumeResult = await db.query(`
      SELECT r.*, u.email, u.avatar
      FROM resumes r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
    `, [resumeId]);

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Resume not found"
      });
    }

    const resume = resumeResult.rows[0];
    
    const personalInfo = typeof resume.personal_info === 'string' ? JSON.parse(resume.personal_info) : (resume.personal_info || {});
    if (resume.avatar) {
      personalInfo.avatar = resume.avatar;
    }
    
    // Map fullName to name for compatibility with ResumeBuilder
    if (personalInfo.fullName && !personalInfo.name) {
      personalInfo.name = personalInfo.fullName;
    }

    // Parse ATS score data if available
    let atsScore = undefined;
    if (resume.ats_score && resume.ats_score > 0) {
      atsScore = {
        overallScore: resume.ats_score,
        scores: {
          completeness: resume.ats_score_completeness || 0,
          formatting: resume.ats_score_formatting || 0,
          keywords: resume.ats_score_keywords || 0,
          experience: resume.ats_score_experience || 0,
          education: resume.ats_score_education || 0,
          skills: resume.ats_score_skills || 0
        },
        suggestions: resume.ats_suggestions ? JSON.parse(resume.ats_suggestions) : [],
        strengths: resume.ats_strengths ? JSON.parse(resume.ats_strengths) : [],
        scoredAt: resume.ats_scored_at
      };
    }

    res.json({
      success: true,
      data: {
        id: resume.id,
        title: resume.title,
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
        personalInfo,
        experience: typeof resume.experience === 'string' ? JSON.parse(resume.experience) : (resume.experience || []),
        education: typeof resume.education === 'string' ? JSON.parse(resume.education) : (resume.education || []),
        skills: parseSkills(resume.skills),
        projects: typeof resume.projects === 'string' ? JSON.parse(resume.projects) : (resume.projects || []),
        certifications: typeof resume.certifications === 'string' ? JSON.parse(resume.certifications) : (resume.certifications || []),
        summary: resume.summary || '',
        objective: resume.objective || '',
        templateId: resume.template_id,
        atsScore
      }
    });
  } catch (error) {
    console.error("Error fetching public resume:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getResume = async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    const resumeResult = await db.query(`
      SELECT r.*, u.email, u.avatar
      FROM resumes r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1 AND r.user_id = $2
    `, [resumeId, userId]);

    if (resumeResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Resume not found"
      });
    }

    const resume = resumeResult.rows[0];
    
    const personalInfo = typeof resume.personal_info === 'string' ? JSON.parse(resume.personal_info) : (resume.personal_info || {});
    // Merge user's avatar from users table into personalInfo
    if (resume.avatar) {
      personalInfo.avatar = resume.avatar;
    }
    
    // Map fullName to name for compatibility with ResumeBuilder
    if (personalInfo.fullName && !personalInfo.name) {
      personalInfo.name = personalInfo.fullName;
    }

    // Parse ATS score data if available
    let atsScore = undefined;
    if (resume.ats_score && resume.ats_score > 0) {
      atsScore = {
        overallScore: resume.ats_score,
        scores: {
          completeness: resume.ats_score_completeness || 0,
          formatting: resume.ats_score_formatting || 0,
          keywords: resume.ats_score_keywords || 0,
          experience: resume.ats_score_experience || 0,
          education: resume.ats_score_education || 0,
          skills: resume.ats_score_skills || 0
        },
        suggestions: resume.ats_suggestions ? JSON.parse(resume.ats_suggestions) : [],
        strengths: resume.ats_strengths ? JSON.parse(resume.ats_strengths) : [],
        scoredAt: resume.ats_scored_at
      };
    }

    res.json({
      success: true,
      data: {
        id: resume.id,
        title: resume.title,
        status: 'draft', // Default status since column doesn't exist
        isPublic: false, // Default since column doesn't exist
        createdAt: resume.created_at,
        updatedAt: resume.updated_at,
        personalInfo,
        experience: typeof resume.experience === 'string' ? JSON.parse(resume.experience) : (resume.experience || []),
        education: typeof resume.education === 'string' ? JSON.parse(resume.education) : (resume.education || []),
        skills: parseSkills(resume.skills),
        projects: typeof resume.projects === 'string' ? JSON.parse(resume.projects) : (resume.projects || []),
        certifications: typeof resume.certifications === 'string' ? JSON.parse(resume.certifications) : (resume.certifications || []),
        summary: resume.summary || '',
        objective: resume.objective || '',
        templateId: resume.template_id,
        atsScore
      }
    });
  } catch (error) {
    console.error("Error fetching resume:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const updateResumeInteractions: RequestHandler = (req, res) => {
  res.json({ success: true, message: "Interactions updated" });
};

export const getSkills: RequestHandler = (req, res) => {
  res.json({ success: true, data: [] });
};

export const getExperiences: RequestHandler = (req, res) => {
  res.json({ success: true, data: [] });
};

export const getEducation: RequestHandler = (req, res) => {
  res.json({ success: true, data: [] });
};

export const getProjects: RequestHandler = (req, res) => {
  res.json({ success: true, data: [] });
};

export const getPersonalInfo: RequestHandler = (req, res) => {
  res.json({ success: true, data: {} });
};

export const createResume = async (req: AuthRequest, res: Response) => {
  try {
    const resumeData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    console.log('📝 Creating resume for user:', userId);
    console.log('📝 Resume data:', JSON.stringify(resumeData, null, 2));

    // Use the existing database connection
    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Extract content from the request body
    const content = resumeData.content || resumeData;
    
    // Create resume in PostgreSQL using the correct schema
    const insertResult = await db.query(`
      INSERT INTO resumes (
        user_id, 
        title, 
        personal_info, 
        summary, 
        objective, 
        skills, 
        experience, 
        education, 
        projects,
        certifications,
        template_id,
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING id, title, personal_info, summary, objective, skills, experience, education, projects, certifications, template_id, created_at, updated_at
    `, [
      userId,
      resumeData.title || content.title || 'Untitled Resume',
      JSON.stringify(content.personalInfo || {}),
      content.summary || content.personalInfo?.summary || '',
      content.objective || '',
      JSON.stringify(content.skills || []),
      JSON.stringify(content.experience || []),
      JSON.stringify(content.education || []),
      JSON.stringify(content.projects || []),
      JSON.stringify(content.certifications || []),
      content.templateId || 'modern-professional'
    ]);

    const newResume = insertResult.rows[0];

    console.log('✅ Resume created successfully:', newResume.id);

    // Track usage for subscription
    try {
      const { SubscriptionService } = await import('../services/subscriptionService.js');
      const subscription = await SubscriptionService.getUserSubscription(userId);
      if (subscription) {
        await SubscriptionService.incrementUsage(
          subscription.id,
          'user',
          'resumes',
          1
        );
      }
    } catch (usageError) {
      console.error('Error tracking resume usage:', usageError);
      // Don't fail the request if usage tracking fails
    }

    res.status(201).json({
      success: true,
      data: {
        id: newResume.id,
        title: newResume.title,
        personalInfo: typeof newResume.personal_info === 'string' ? JSON.parse(newResume.personal_info) : (newResume.personal_info || {}),
        summary: newResume.summary,
        objective: newResume.objective,
        skills: parseSkills(newResume.skills),
        experience: typeof newResume.experience === 'string' ? JSON.parse(newResume.experience) : (newResume.experience || []),
        education: typeof newResume.education === 'string' ? JSON.parse(newResume.education) : (newResume.education || []),
        projects: typeof newResume.projects === 'string' ? JSON.parse(newResume.projects) : (newResume.projects || []),
        certifications: typeof newResume.certifications === 'string' ? JSON.parse(newResume.certifications) : (newResume.certifications || []),
        templateId: newResume.template_id,
        createdAt: newResume.created_at,
        updatedAt: newResume.updated_at
      },
      message: "Resume created successfully",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Error creating resume:", error);
    console.error("❌ Error stack:", error.stack);
    console.error("❌ Error details:", {
      message: error.message,
      name: error.name,
      code: error.code
    });
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateResume = async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = req.params.id;
    const resumeData = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Get existing resume to merge images
    const existingResult = await db.query(`
      SELECT projects FROM resumes WHERE id = $1 AND user_id = $2
    `, [resumeId, userId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Resume not found"
      });
    }

    // Extract content from the request body
    const content = resumeData.content || resumeData;
    
    // Smart merge: Keep existing images if not provided in update
    let projectsToSave = content.projects || [];
    if (existingResult.rows[0].projects) {
      const existingProjects = typeof existingResult.rows[0].projects === 'string' 
        ? JSON.parse(existingResult.rows[0].projects) 
        : existingResult.rows[0].projects;
      
      // Merge: If project doesn't have image, use existing one
      projectsToSave = projectsToSave.map((project: any, index: number) => {
        if (!project.image && existingProjects[index]?.image) {
          return { ...project, image: existingProjects[index].image };
        }
        return project;
      });
    }

    // Update resume in PostgreSQL using the correct schema
    const updateResult = await db.query(`
      UPDATE resumes 
      SET 
        title = $1, 
        personal_info = $2, 
        summary = $3, 
        objective = $4, 
        skills = $5, 
        experience = $6, 
        education = $7, 
        projects = $8,
        certifications = $9,
        template_id = $10,
        updated_at = NOW()
      WHERE id = $11 AND user_id = $12
      RETURNING id, title, personal_info, summary, objective, skills, experience, education, projects, certifications, template_id, created_at, updated_at
    `, [
      resumeData.title || content.title || 'Untitled Resume',
      JSON.stringify(content.personalInfo || {}),
      content.summary || content.personalInfo?.summary || '',
      content.objective || '',
      JSON.stringify(content.skills || []),
      JSON.stringify(content.experience || []),
      JSON.stringify(content.education || []),
      JSON.stringify(projectsToSave),
      JSON.stringify(content.certifications || []),
      content.templateId || 'modern-professional',
      resumeId,
      userId
    ]);

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Resume not found"
      });
    }

    const updatedResume = updateResult.rows[0];

    res.json({
      success: true,
      data: {
        id: updatedResume.id,
        title: updatedResume.title,
        personalInfo: typeof updatedResume.personal_info === 'string' ? JSON.parse(updatedResume.personal_info) : (updatedResume.personal_info || {}),
        summary: updatedResume.summary,
        objective: updatedResume.objective,
        skills: parseSkills(updatedResume.skills),
        experience: typeof updatedResume.experience === 'string' ? JSON.parse(updatedResume.experience) : (updatedResume.experience || []),
        education: typeof updatedResume.education === 'string' ? JSON.parse(updatedResume.education) : (updatedResume.education || []),
        projects: typeof updatedResume.projects === 'string' ? JSON.parse(updatedResume.projects) : (updatedResume.projects || []),
        certifications: typeof updatedResume.certifications === 'string' ? JSON.parse(updatedResume.certifications) : (updatedResume.certifications || []),
        templateId: updatedResume.template_id,
        createdAt: updatedResume.created_at,
        updatedAt: updatedResume.updated_at
      },
      message: "Resume updated successfully"
    });

  } catch (error) {
    console.error("❌ Error updating resume:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Delete a resume
export const deleteResume = async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    const deleteResult = await db.query(`
      DELETE FROM resumes 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [resumeId, userId]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Resume not found"
      });
    }

    res.json({
      success: true,
      message: "Resume deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error deleting resume:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Set a resume as active (and deactivate others) or deactivate it
export const setActiveResume = async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user?.id;
    const { isActive } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }

    const { getDatabase } = await import('../database/connection.js');
    const db = await getDatabase();

    // Verify the resume belongs to the user
    const verifyResult = await db.query(`
      SELECT id FROM resumes 
      WHERE id = $1 AND user_id = $2
    `, [resumeId, userId]);

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Resume not found"
      });
    }

    if (isActive === false) {
      // Deactivating a resume
      await db.query(`
        UPDATE resumes 
        SET is_active = false 
        WHERE id = $1 AND user_id = $2
      `, [resumeId, userId]);

      res.json({
        success: true,
        message: "Resume deactivated"
      });
    } else {
      // Activating a resume - deactivate all others first
      await db.query(`
        UPDATE resumes 
        SET is_active = false 
        WHERE user_id = $1
      `, [userId]);

      // Activate the selected resume
      await db.query(`
        UPDATE resumes 
        SET is_active = true 
        WHERE id = $1 AND user_id = $2
      `, [resumeId, userId]);

      res.json({
        success: true,
        message: "Resume set as active"
      });
    }

  } catch (error) {
    console.error("❌ Error setting active resume:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};



