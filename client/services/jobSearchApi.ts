import { BaseApiClient } from './baseApiClient';
import { 
  JobSearchResult, 
  JobDetails, 
  JobSearchResponse, 
  JobCrawlResponse, 
  JobSearchAndCrawlResponse 
} from '@shared/api';

class JobSearchApi extends BaseApiClient {
  constructor() {
    super('/api/job-search');
  }

  /**
   * Search for jobs using Tavily's advanced search
   */
  async searchJobs(query: string, location?: string): Promise<JobSearchResponse> {
    return this.post('/search', {
      query: query.trim(),
      location: location?.trim()
    });
  }

  /**
   * Crawl a specific job URL for detailed information
   */
  async crawlJobDetails(url: string): Promise<JobCrawlResponse> {
    return this.post('/crawl', {
      url: url.trim()
    });
  }

  /**
   * Search for jobs and crawl top results for detailed information
   */
  async searchAndCrawlJobs(
    query: string, 
    location?: string, 
    maxCrawl: number = 5
  ): Promise<JobSearchAndCrawlResponse> {
    return this.post('/search-and-crawl', {
      query: query.trim(),
      location: location?.trim(),
      maxCrawl: Math.max(1, Math.min(maxCrawl, 10))
    });
  }

  /**
   * Health check for the job search service
   */
  async healthCheck(): Promise<{ success: boolean; message: string; timestamp: string }> {
    return this.get('/health');
  }
}

export const jobSearchApi = new JobSearchApi();