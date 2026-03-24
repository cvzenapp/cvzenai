import { initializeDatabase, closeDatabase } from '../database/connection.js';
import { tavilyService } from './tavilyService.js';

export interface CachedJobSearchResult {
  id: number;
  userId: string;
  searchQuery: string;
  searchLocation?: string;
  jobResults: any[];
  totalResults: number;
  searchMetadata: any;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface JobSearchParams {
  query?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  limit?: number;
}

class CachedJobSearchService {
  private readonly CACHE_DURATION_DAYS = 7;
  private readonly DEFAULT_SEARCH_LIMIT = 20;

  /**
   * Get cached job results for a user, or fetch new ones if cache is empty/expired
   */
  async getJobResults(userId: string, forceRefresh: boolean = false): Promise<{
    success: boolean;
    data?: any[];
    totalResults?: number;
    fromCache?: boolean;
    message?: string;
  }> {
    let db;
    
    try {
      db = await initializeDatabase();

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedResults = await this.getCachedResults(userId);
        if (cachedResults && cachedResults.jobResults && cachedResults.jobResults.length > 0) {
          console.log(`📋 [CACHED JOBS] Returning ${cachedResults.jobResults.length} cached results for user ${userId}`);
          return {
            success: true,
            data: cachedResults.jobResults,
            totalResults: cachedResults.totalResults,
            fromCache: true
          };
        }
      }

      // No cache exists or force refresh - fetch and cache for first time only
      console.log(`🔍 [CACHED JOBS] No cache found, fetching fresh results for user ${userId}`);
      const userProfile = await this.getUserProfile(userId);
      const searchParams = this.buildSearchParams(userProfile);
      
      const tavilyResults = await tavilyService.searchJobs({
        query: searchParams.query || 'software developer',
        location: searchParams.location, // Don't default to 'remote'
        maxResults: this.DEFAULT_SEARCH_LIMIT
      });
      
      if (tavilyResults && tavilyResults.length > 0) {
        await this.cacheResults(userId, searchParams, tavilyResults);
        console.log(`✅ [CACHED JOBS] Cached ${tavilyResults.length} fresh results for user ${userId}`);
        return {
          success: true,
          data: tavilyResults,
          totalResults: tavilyResults.length,
          fromCache: false
        };
      }

      return {
        success: false,
        message: 'No job results available'
      };

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error:', error);
      return {
        success: false,
        message: 'Failed to get job results'
      };
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }

  /**
   * Search for specific jobs (always hits Tavily, updates cache)
   */
  async searchJobs(userId: string, searchParams: JobSearchParams): Promise<{
    success: boolean;
    data?: any[];
    totalResults?: number;
    message?: string;
  }> {
    let db;
    
    try {
      db = await initializeDatabase();

      console.log(`🔍 [CACHED JOBS] Manual search for user ${userId}:`, searchParams);
      
      // Fetch from Tavily with user's search parameters
      const tavilyResults = await tavilyService.searchJobs({
        query: searchParams.query || 'software developer',
        location: searchParams.location, // Don't default to 'remote'
        maxResults: searchParams.limit || this.DEFAULT_SEARCH_LIMIT
      });
      
      if (!tavilyResults || tavilyResults.length === 0) {
        return {
          success: false,
          message: 'Failed to search jobs'
        };
      }

      // Update cache with new search results (this replaces old cache)
      await this.cacheResults(userId, searchParams, tavilyResults);
      console.log(`✅ [CACHED JOBS] Updated cache with ${tavilyResults.length} new search results for user ${userId}`);

      return {
        success: true,
        data: tavilyResults,
        totalResults: tavilyResults.length
      };

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error searching jobs:', error);
      return {
        success: false,
        message: 'Failed to search jobs'
      };
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }

  /**
   * Get cached results for a user (if valid and not expired)
   */
  private async getCachedResults(userId: string): Promise<CachedJobSearchResult | null> {
    let db;
    
    try {
      db = await initializeDatabase();

      console.log(`🔍 [CACHED JOBS] Checking cache for user ${userId}`);

      const result = await db.query(`
        SELECT 
          id,
          user_id,
          search_query,
          search_location,
          job_results,
          total_results,
          search_metadata,
          created_at,
          updated_at,
          expires_at,
          is_active
        FROM cached_job_search_results 
        WHERE user_id = $1 
          AND is_active = true 
          AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC 
        LIMIT 1
      `, [userId]);

      if (result.rows.length === 0) {
        console.log(`📭 [CACHED JOBS] No valid cache found for user ${userId}`);
        return null;
      }

      const row = result.rows[0];
      console.log(`📋 [CACHED JOBS] Found valid cache for user ${userId}, created: ${row.created_at}, expires: ${row.expires_at}`);
      
      return {
        id: row.id,
        userId: row.user_id,
        searchQuery: row.search_query,
        searchLocation: row.search_location,
        jobResults: row.job_results,
        totalResults: row.total_results,
        searchMetadata: row.search_metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        expiresAt: row.expires_at,
        isActive: row.is_active
      };

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error getting cached results:', error);
      return null;
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }

  /**
   * Cache job search results for a user
   */
  private async cacheResults(userId: string, searchParams: JobSearchParams, jobResults: any[]): Promise<void> {
    let db;
    
    try {
      db = await initializeDatabase();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.CACHE_DURATION_DAYS);

      // First, deactivate any existing active cache for this user
      await db.query(`
        UPDATE cached_job_search_results 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      // Then insert the new cache entry
      await db.query(`
        INSERT INTO cached_job_search_results (
          user_id,
          search_query,
          search_location,
          job_results,
          total_results,
          search_metadata,
          expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userId,
        searchParams.query || 'general search',
        searchParams.location || null, // Don't default to 'remote'
        JSON.stringify(jobResults),
        jobResults.length,
        JSON.stringify(searchParams),
        expiresAt
      ]);

      console.log(`✅ [CACHED JOBS] Cached ${jobResults.length} job results for user ${userId}`);

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error caching results:', error);
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }

  /**
   * Get user profile to build search parameters
   */
  private async getUserProfile(userId: string): Promise<any> {
    let db;
    
    try {
      db = await initializeDatabase();

      // Get user's latest resume and job preferences
      const result = await db.query(`
        SELECT 
          r.skills,
          r.experience,
          r.personal_info,
          r.summary,
          r.objective,
          jp.preferred_job_titles,
          jp.preferred_locations,
          jp.preferred_job_types,
          jp.preferred_experience_levels
        FROM resumes r
        LEFT JOIN job_preferences jp ON r.user_id = jp.user_id
        WHERE r.user_id = $1 AND r.is_active = true
        ORDER BY r.updated_at DESC 
        LIMIT 1
      `, [userId]);

      const profile = result.rows[0] || {};
      
      // Parse JSON fields
      if (profile.skills && typeof profile.skills === 'string') {
        profile.skills = JSON.parse(profile.skills);
      }
      if (profile.experience && typeof profile.experience === 'string') {
        profile.experience = JSON.parse(profile.experience);
      }
      if (profile.personal_info && typeof profile.personal_info === 'string') {
        profile.personal_info = JSON.parse(profile.personal_info);
      }

      console.log(`📋 [CACHED JOBS] User profile for ${userId}:`, {
        hasSkills: !!profile.skills?.length,
        hasExperience: !!profile.experience?.length,
        hasPersonalInfo: !!profile.personal_info,
        location: profile.personal_info?.location,
        latestJobTitle: profile.experience?.[0]?.position || profile.experience?.[0]?.title
      });

      return profile;

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error getting user profile:', error);
      return {};
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }

  /**
   * Build search parameters from user profile
   */
  private buildSearchParams(userProfile: any): JobSearchParams {
    const params: JobSearchParams = {
      limit: this.DEFAULT_SEARCH_LIMIT
    };

    console.log(`🎯 [CACHED JOBS] Building search params from profile:`, {
      hasPreferredTitles: !!userProfile.preferred_job_titles?.length,
      hasSkills: !!userProfile.skills?.length,
      hasExperience: !!userProfile.experience?.length,
      hasPersonalInfo: !!userProfile.personal_info,
      personalInfoLocation: userProfile.personal_info?.location
    });

    // Build query from job preferences first, then resume data
    if (userProfile.preferred_job_titles?.length > 0) {
      params.query = userProfile.preferred_job_titles[0];
      console.log(`✅ [CACHED JOBS] Using preferred job title: "${params.query}"`);
    } else if (userProfile.experience?.length > 0) {
      // Use latest job title from experience
      const latestJob = userProfile.experience[0];
      const jobTitle = latestJob.position || latestJob.title;
      if (jobTitle) {
        params.query = jobTitle;
        console.log(`✅ [CACHED JOBS] Using latest job title from experience: "${params.query}"`);
      }
    } else if (userProfile.skills?.length > 0) {
      // Use top skills to build query
      const topSkills = userProfile.skills.slice(0, 2)
        .map((s: any) => typeof s === 'string' ? s : s.name)
        .filter(Boolean)
        .join(' ');
      if (topSkills) {
        params.query = `${topSkills} developer`;
        console.log(`✅ [CACHED JOBS] Using skills-based query: "${params.query}"`);
      }
    }

    // Fallback to default if no query built
    if (!params.query) {
      params.query = 'software developer';
      console.log(`⚠️ [CACHED JOBS] Using default query: "${params.query}"`);
    }

    // Set location from preferences or personal info
    if (userProfile.preferred_locations?.length > 0) {
      params.location = userProfile.preferred_locations[0];
      console.log(`✅ [CACHED JOBS] Using preferred location: "${params.location}"`);
    } else if (userProfile.personal_info?.location) {
      params.location = userProfile.personal_info.location;
      console.log(`✅ [CACHED JOBS] Using personal info location: "${params.location}"`);
    } else if (userProfile.experience?.length > 0) {
      // Use location from latest experience
      const latestLocation = userProfile.experience[0]?.location;
      if (latestLocation && latestLocation.toLowerCase() !== 'remote') {
        params.location = latestLocation;
        console.log(`✅ [CACHED JOBS] Using experience location: "${params.location}"`);
      }
    }

    // Set job type preference
    if (userProfile.preferred_job_types?.length > 0) {
      params.jobType = userProfile.preferred_job_types[0];
      console.log(`✅ [CACHED JOBS] Using preferred job type: "${params.jobType}"`);
    }

    // Set experience level
    if (userProfile.preferred_experience_levels?.length > 0) {
      params.experienceLevel = userProfile.preferred_experience_levels[0];
      console.log(`✅ [CACHED JOBS] Using preferred experience level: "${params.experienceLevel}"`);
    }

    console.log(`🎯 [CACHED JOBS] Final search params:`, params);
    return params;
  }

  /**
   * Clear cache for a user (useful for testing or manual cache invalidation)
   */
  async clearUserCache(userId: string): Promise<void> {
    let db;
    
    try {
      db = await initializeDatabase();

      await db.query(`
        UPDATE cached_job_search_results 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND is_active = true
      `, [userId]);

      console.log(`🗑️ [CACHED JOBS] Cleared cache for user ${userId}`);

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error clearing cache:', error);
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    totalCaches: number;
    activeCaches: number;
    expiredCaches: number;
  }> {
    let db;
    
    try {
      db = await initializeDatabase();

      const result = await db.query(`
        SELECT 
          COUNT(*) as total_caches,
          COUNT(*) FILTER (WHERE is_active = true) as active_caches,
          COUNT(*) FILTER (WHERE expires_at < CURRENT_TIMESTAMP) as expired_caches
        FROM cached_job_search_results
      `);

      return result.rows[0] || { totalCaches: 0, activeCaches: 0, expiredCaches: 0 };

    } catch (error) {
      console.error('❌ [CACHED JOBS] Error getting cache stats:', error);
      return { totalCaches: 0, activeCaches: 0, expiredCaches: 0 };
    } finally {
      if (db) {
        await closeDatabase();
      }
    }
  }
}

export const cachedJobSearchService = new CachedJobSearchService();