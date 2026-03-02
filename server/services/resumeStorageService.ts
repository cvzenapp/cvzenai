import { initializeDatabase, closeDatabase } from '../database/connection.js';
import { ParsedResumeData } from './resumeParsingService.js';

export interface StoredResumeResult {
  resumeId: number;
  success: boolean;
  message: string;
}

class ResumeStorageService {
  /**
   * Store parsed resume data in database
   */
  async storeResumeData(userId: string | number, parsedData: ParsedResumeData, title?: string): Promise<StoredResumeResult> {
    console.log('💾 Storing resume data for user:', userId);
    
    const db = await initializeDatabase();
    
    try {
      // Generate resume title if not provided
      const resumeTitle = title || `${parsedData.personalInfo.fullName}'s Resume`;
      
      // Prepare JSONB data for database
      const personalInfoJson = JSON.stringify({
        fullName: parsedData.personalInfo.fullName,
        email: parsedData.personalInfo.email,
        phone: parsedData.personalInfo.phone,
        location: parsedData.personalInfo.location,
        linkedin: parsedData.personalInfo.linkedin || '',
        github: parsedData.personalInfo.github || '',
        website: parsedData.personalInfo.website || ''
      });
      
      // Store both flat skills array and categorized skills
      const skillsData = {
        skills: parsedData.skills || [],
        categories: parsedData.skillCategories || {}
      };
      const skillsJson = JSON.stringify(skillsData);
      
      const experienceJson = JSON.stringify(
        (parsedData.experience || []).map(exp => ({
          company: exp.company,
          position: exp.position,
          location: exp.location || '',
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current || false,
          description: exp.description || '',
          achievements: exp.achievements || []
        }))
      );
      
      const educationJson = JSON.stringify(
        (parsedData.education || []).map(edu => ({
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          location: edu.location || '',
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.gpa || '',
          achievements: edu.achievements || []
        }))
      );
      
      const projectsJson = JSON.stringify(
        (parsedData.projects || []).map(proj => ({
          name: proj.name,
          description: proj.description,
          technologies: proj.technologies || [],
          link: proj.link || '',
          startDate: proj.startDate || '',
          endDate: proj.endDate || ''
        }))
      );
      
      // Log what we're about to store
      console.log('💾 Data being stored:');
      console.log('  Skills:', skillsJson.substring(0, 200));
      console.log('  Experience:', experienceJson.substring(0, 200));
      console.log('  Education:', educationJson.substring(0, 200));
      console.log('  Projects:', projectsJson.substring(0, 200));
      
      // Insert resume into database (without ATS score initially)
      const result = await db.query(
        `INSERT INTO resumes (
          user_id, 
          title, 
          personal_info, 
          summary, 
          objective, 
          skills, 
          experience, 
          education, 
          projects,
          template_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING id`,
        [
          userId,
          resumeTitle,
          personalInfoJson,
          parsedData.summary || '',
          parsedData.objective || '',
          skillsJson,
          experienceJson,
          educationJson,
          projectsJson,
          'modern-professional' // Default template
        ]
      );
      const resumeId = result.rows[0].id;
      
      console.log('✅ Resume stored successfully:', {
        resumeId,
        userId,
        title: resumeTitle
      });
      
      return {
        resumeId,
        success: true,
        message: 'Resume parsed and stored successfully'
      };
      
    } catch (error) {
      console.error('❌ Failed to store resume:', error);
      throw new Error(`Database error: ${error.message}`);
    } finally {
      await closeDatabase();
    }
  }

  /**
   * Check if user already has a resume
   */
  async getUserResumeCount(userId: string | number): Promise<number> {
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM resumes WHERE user_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } finally {
      await closeDatabase();
    }
  }

  /**
   * Get user's most recent resume
   */
  async getUserLatestResume(userId: string | number): Promise<any | null> {
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(
        'SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      return result.rows[0] || null;
    } finally {
      await closeDatabase();
    }
  }
}

export const resumeStorageService = new ResumeStorageService();
