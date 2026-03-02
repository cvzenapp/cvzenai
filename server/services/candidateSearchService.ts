import { initializeDatabase, closeDatabase } from '../database/connection.js';
import { queryToSqlParser } from './dspy/queryToSqlParser.js';

export interface DatabaseCandidate {
  id: string;
  name: string;
  email: string;
  title: string;
  location: string;
  experience: string;
  skills: string[];
  matchScore: number;
  availability: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  summary: string;
  profileComplete: boolean;
  lastActive?: Date;
}

export interface CandidateSearchOptions {
  query?: string;
  skills?: string[];
  location?: string;
  experienceYears?: number;
  limit?: number;
}

class CandidateSearchService {
  /**
   * Search candidates in the CVZen database using LLM-powered query parsing
   */
  async searchLocalCandidates(options: CandidateSearchOptions): Promise<DatabaseCandidate[]> {
    const db = await initializeDatabase();
    
    try {
      console.log('🔍 [LOCAL SEARCH] Searching CVZen database with options:', options);
      
      const { query, skills, location, experienceYears, limit = 20 } = options;
      
      // Use LLM to parse the query into structured search parameters
      let parsedQuery = null;
      if (query) {
        parsedQuery = await queryToSqlParser.parseQuery(query);
        console.log('🤖 [LLM PARSED QUERY]:', JSON.stringify(parsedQuery, null, 2));
      }
      
      // Merge parsed query with explicit options (explicit options take precedence)
      const searchSkills = skills || parsedQuery?.skills || [];
      const searchLocation = location || parsedQuery?.location;
      const searchKeywords = parsedQuery?.keywords || [];
      const searchJobTitle = parsedQuery?.jobTitle;
      
      // Build dynamic SQL query
      let sql = `
        SELECT 
          u.id,
          u.email,
          u.created_at,
          r.id as resume_id,
          r.personal_info,
          r.summary,
          r.experience,
          r.skills,
          r.education,
          r.updated_at as resume_updated_at
        FROM users u
        LEFT JOIN resumes r ON u.id = r.user_id
        WHERE u.user_type = 'user'
          AND r.id IS NOT NULL
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      // Add filters based on parsed query
      const searchTerms: string[] = [];
      
      // Add skills to search terms
      if (searchSkills.length > 0) {
        searchTerms.push(...searchSkills);
      }
      
      // Add keywords to search terms
      if (searchKeywords.length > 0) {
        searchTerms.push(...searchKeywords);
      }
      
      // Add job title to search terms
      if (searchJobTitle) {
        searchTerms.push(searchJobTitle);
      }
      
      // Add original query as fallback
      if (query && searchTerms.length === 0) {
        searchTerms.push(query);
      }
      
      // Build search condition for all terms
      if (searchTerms.length > 0) {
        const conditions: string[] = [];
        
        searchTerms.forEach(term => {
          conditions.push(`(
            LOWER(r.personal_info::text) LIKE LOWER($${paramIndex}) OR
            LOWER(r.summary) LIKE LOWER($${paramIndex}) OR
            LOWER(r.skills::text) LIKE LOWER($${paramIndex}) OR
            LOWER(r.experience::text) LIKE LOWER($${paramIndex})
          )`);
          params.push(`%${term}%`);
          paramIndex++;
        });
        
        sql += ` AND (${conditions.join(' OR ')})`;
      }
      
      // Add location filter
      if (searchLocation) {
        sql += ` AND LOWER(r.personal_info::text) LIKE LOWER($${paramIndex})`;
        params.push(`%${searchLocation}%`);
        paramIndex++;
      }
      
      // Order by most recently updated resumes first
      sql += ` ORDER BY r.updated_at DESC NULLS LAST, u.created_at DESC`;
      sql += ` LIMIT $${paramIndex}`;
      params.push(limit);
      
      console.log('📝 [LOCAL SEARCH] SQL Query:', sql.substring(0, 300) + '...');
      console.log('📝 [LOCAL SEARCH] Params:', params);
      
      const result = await db.query(sql, params);
      
      console.log(`✅ [LOCAL SEARCH] Found ${result.rows.length} candidates in database`);
      
      // Transform database results to candidate format
      const candidates: DatabaseCandidate[] = result.rows
        .filter(row => row.resume_id) // Only include users with resumes
        .map((row, index) => {
          const personalInfo = this.parseJSON(row.personal_info) || {};
          const experience = this.parseJSON(row.experience) || [];
          const skills = this.parseJSON(row.skills) || [];
          const summary = row.summary || '';
          
          // Extract name from personal info
          const name = personalInfo.name || personalInfo.fullName || `Candidate ${index + 1}`;
          
          // Extract title from personal info or first experience
          let title = personalInfo.title || personalInfo.jobTitle || 'Professional';
          if (!title && experience.length > 0) {
            title = experience[0].position || experience[0].title || 'Professional';
          }
          
          // Extract location
          const candidateLocation = personalInfo.location || personalInfo.city || 'Location not specified';
          
          // Calculate experience years
          let experienceYearsCalc = 'Experience not specified';
          if (experience.length > 0) {
            const totalMonths = experience.reduce((sum: number, exp: any) => {
              if (exp.startDate && exp.endDate) {
                const start = new Date(exp.startDate);
                const end = exp.current ? new Date() : new Date(exp.endDate);
                const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                return sum + months;
              }
              return sum;
            }, 0);
            const years = Math.floor(totalMonths / 12);
            experienceYearsCalc = years > 0 ? `${years}+ years` : 'Less than 1 year';
          }
          
          // Extract skills array
          const skillsList = Array.isArray(skills) ? skills.map((s: any) => s.name || s).filter(Boolean) : [];
          
          // Calculate match score based on parsed query
          let matchScore = 50; // Base score
          
          if (parsedQuery) {
            const searchableText = `${name} ${title} ${summary} ${skillsList.join(' ')}`.toLowerCase();
            
            // Boost for skill matches
            if (parsedQuery.skills) {
              const matchingSkills = parsedQuery.skills.filter(skill => 
                searchableText.includes(skill.toLowerCase())
              );
              matchScore += Math.min(matchingSkills.length * 10, 30);
            }
            
            // Boost for job title match
            if (parsedQuery.jobTitle && title.toLowerCase().includes(parsedQuery.jobTitle.toLowerCase())) {
              matchScore += 15;
            }
            
            // Boost for location match
            if (parsedQuery.location && candidateLocation.toLowerCase().includes(parsedQuery.location.toLowerCase())) {
              matchScore += 10;
            }
          }
          
          // Boost for complete profiles
          if (personalInfo.email && summary && skills.length > 0 && experience.length > 0) {
            matchScore += 10;
          }
          
          matchScore = Math.min(matchScore, 100);
          
          return {
            id: `cvzen-${row.id}`,
            name,
            email: row.email,
            title,
            location: candidateLocation,
            experience: experienceYearsCalc,
            skills: skillsList.slice(0, 10),
            matchScore,
            availability: 'Contact via CVZen',
            resumeUrl: `/shared/resume/${row.resume_id}`,
            linkedinUrl: personalInfo.linkedin || personalInfo.linkedinUrl,
            summary: summary.substring(0, 250) + (summary.length > 250 ? '...' : ''),
            profileComplete: !!(personalInfo.email && summary && skills.length > 0),
            lastActive: row.resume_updated_at ? new Date(row.resume_updated_at) : undefined
          };
        });
      
      // Sort by match score
      candidates.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log(`🎯 [LOCAL SEARCH] Processed ${candidates.length} candidates with resumes`);
      
      return candidates;
      
    } catch (error) {
      console.error('❌ [LOCAL SEARCH] Database search error:', error);
      return [];
    } finally {
      await closeDatabase();
    }
  }
  
  /**
   * Get candidate statistics
   */
  async getCandidateStats(): Promise<{
    total: number;
    withResumes: number;
    activeLastMonth: number;
  }> {
    const db = await initializeDatabase();
    
    try {
      const result = await db.query(`
        SELECT 
          COUNT(DISTINCT u.id) as total,
          COUNT(DISTINCT r.id) as with_resumes,
          COUNT(DISTINCT CASE 
            WHEN r.updated_at > NOW() - INTERVAL '30 days' 
            THEN u.id 
          END) as active_last_month
        FROM users u
        LEFT JOIN resumes r ON u.id = r.user_id
        WHERE u.user_type = 'user'
      `);
      
      return {
        total: parseInt(result.rows[0].total) || 0,
        withResumes: parseInt(result.rows[0].with_resumes) || 0,
        activeLastMonth: parseInt(result.rows[0].active_last_month) || 0
      };
    } catch (error) {
      console.error('❌ [LOCAL SEARCH] Stats error:', error);
      return { total: 0, withResumes: 0, activeLastMonth: 0 };
    } finally {
      await closeDatabase();
    }
  }
  
  private parseJSON(jsonString: string | null): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }
}

export const candidateSearchService = new CandidateSearchService();
