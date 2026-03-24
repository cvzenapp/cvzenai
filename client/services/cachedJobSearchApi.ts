import { BaseApiClient } from './baseApiClient';

export interface JobSearchParams {
  query?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  limit?: number;
}

export interface CachedJobSearchResponse {
  success: boolean;
  data?: {
    jobs: any[];
    totalResults: number;
    fromCache?: boolean;
    searchParams?: JobSearchParams;
    message: string;
  };
  message?: string;
}

class CachedJobSearchApi extends BaseApiClient {
  constructor() {
    super('/api/cached-jobs');
  }

  /**
   * Get initial job results (cached or fresh)
   * Called when user first opens AI chat
   */
  async getInitialJobs(forceRefresh: boolean = false): Promise<CachedJobSearchResponse> {
    try {
      const params = forceRefresh ? '?refresh=true' : '';
      const response = await this.get<CachedJobSearchResponse>(`/initial${params}`);
      
      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Jobs loaded successfully'
      };
    } catch (error) {
      console.error('❌ [CACHED JOBS API] Error getting initial jobs:', error);
      return {
        success: false,
        message: 'Failed to load job results'
      };
    }
  }

  /**
   * Search for specific jobs (always fresh from Tavily)
   * Called when user manually searches
   */
  async searchJobs(searchParams: JobSearchParams): Promise<CachedJobSearchResponse> {
    try {
      const response = await this.post<CachedJobSearchResponse>('/search', searchParams);
      
      return {
        success: response.success,
        data: response.data,
        message: response.message || 'Search completed successfully'
      };
    } catch (error) {
      console.error('❌ [CACHED JOBS API] Error searching jobs:', error);
      return {
        success: false,
        message: 'Failed to search jobs'
      };
    }
  }

  /**
   * Clear user's job cache
   */
  async clearCache(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.delete<{ success: boolean; message: string }>('/cache');
      
      return {
        success: response.success,
        message: response.message || 'Cache cleared successfully'
      };
    } catch (error) {
      console.error('❌ [CACHED JOBS API] Error clearing cache:', error);
      return {
        success: false,
        message: 'Failed to clear cache'
      };
    }
  }

  /**
   * Get cache statistics (admin only)
   */
  async getCacheStats(): Promise<{
    success: boolean;
    data?: {
      totalCaches: number;
      activeCaches: number;
      expiredCaches: number;
    };
    message?: string;
  }> {
    try {
      const response = await this.get<{
        success: boolean;
        data: {
          totalCaches: number;
          activeCaches: number;
          expiredCaches: number;
        };
      }>('/stats');
      
      return {
        success: response.success,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [CACHED JOBS API] Error getting cache stats:', error);
      return {
        success: false,
        message: 'Failed to get cache statistics'
      };
    }
  }
}

export const cachedJobSearchApi = new CachedJobSearchApi();