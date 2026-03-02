import { tavily } from '@tavily/core';

interface JobSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  domain: string;
  score?: number;
}

interface JobDetails {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  jobType?: string;
  url: string;
  extractedAt: string;
}

interface JobSearchResponse {
  success: boolean;
  data?: {
    results: JobSearchResult[];
    query: string;
    totalResults: number;
  };
  error?: string;
}

interface JobCrawlResponse {
  success: boolean;
  data?: JobDetails;
  error?: string;
}

class JobSearchService {
  private client: any;

  constructor() {
    const apiKey = process.env.TAVILY_API_KEY || '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';
    this.client = tavily({ apiKey });
  }

  /**
   * Search for jobs using Tavily's advanced search
   */
  async searchJobs(query: string, location?: string): Promise<JobSearchResponse> {
    try {
      // Enhance query with job-specific terms
      let enhancedQuery = `${query} jobs`;
      if (location) {
        enhancedQuery += ` in ${location}`;
      }
      
      // Add job board sites to improve results
      enhancedQuery += ' site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:monster.com OR site:ziprecruiter.com';

      const response = await this.client.search({
        query: enhancedQuery,
        search_depth: 'advanced',
        max_results: 20,
        include_domains: [
          'linkedin.com',
          'indeed.com',
          'glassdoor.com',
          'monster.com',
          'ziprecruiter.com',
          'dice.com',
          'stackoverflow.com',
          'angel.co',
          'wellfound.com'
        ]
      });

      const results: JobSearchResult[] = response.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        publishedDate: result.published_date,
        domain: new URL(result.url).hostname,
        score: result.score
      }));

      return {
        success: true,
        data: {
          results,
          query: enhancedQuery,
          totalResults: results.length
        }
      };
    } catch (error) {
      console.error('Job search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search jobs'
      };
    }
  }

  /**
   * Crawl a specific job URL to extract detailed information
   */
  async crawlJobDetails(url: string): Promise<JobCrawlResponse> {
    try {
      const response = await this.client.extract({
        urls: [url]
      });

      if (!response.results || response.results.length === 0) {
        return {
          success: false,
          error: 'No content extracted from URL'
        };
      }

      const content = response.results[0].content;
      
      // Parse the extracted content to structure job details
      const jobDetails = this.parseJobContent(content, url);

      return {
        success: true,
        data: jobDetails
      };
    } catch (error) {
      console.error('Job crawl error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to crawl job details'
      };
    }
  }

  /**
   * Parse extracted content to structure job information
   */
  private parseJobContent(content: string, url: string): JobDetails {
    // Basic parsing logic - can be enhanced with more sophisticated NLP
    const lines = content.split('\n').filter(line => line.trim());
    
    let title = '';
    let company = '';
    let location = '';
    let description = '';
    let requirements: string[] = [];
    let salary = '';
    let jobType = '';

    // Extract title (usually first meaningful line)
    for (const line of lines) {
      if (line.length > 10 && !line.toLowerCase().includes('cookie') && !line.toLowerCase().includes('privacy')) {
        title = line.trim();
        break;
      }
    }

    // Look for common patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const originalLine = lines[i];

      if (line.includes('company:') || line.includes('employer:')) {
        company = originalLine.split(':')[1]?.trim() || '';
      }
      
      if (line.includes('location:') || line.includes('city:')) {
        location = originalLine.split(':')[1]?.trim() || '';
      }
      
      if (line.includes('salary:') || line.includes('pay:') || line.includes('$')) {
        salary = originalLine.trim();
      }
      
      if (line.includes('full-time') || line.includes('part-time') || line.includes('contract') || line.includes('remote')) {
        jobType = originalLine.trim();
      }
      
      if (line.includes('requirement') || line.includes('skill') || line.includes('experience')) {
        // Collect next few lines as requirements
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          if (lines[j].trim() && lines[j].length > 5) {
            requirements.push(lines[j].trim());
          }
        }
      }
    }

    // Use remaining content as description
    description = content.substring(0, 500) + (content.length > 500 ? '...' : '');

    return {
      title: title || 'Job Title Not Found',
      company: company || 'Company Not Specified',
      location: location || 'Location Not Specified',
      description,
      requirements: requirements.slice(0, 10), // Limit to 10 requirements
      salary,
      jobType,
      url,
      extractedAt: new Date().toISOString()
    };
  }

  /**
   * Search and crawl jobs in one operation
   */
  async searchAndCrawlJobs(query: string, location?: string, maxCrawl: number = 5): Promise<{
    success: boolean;
    data?: {
      searchResults: JobSearchResult[];
      detailedJobs: JobDetails[];
      query: string;
    };
    error?: string;
  }> {
    try {
      // First, search for jobs
      const searchResponse = await this.searchJobs(query, location);
      
      if (!searchResponse.success || !searchResponse.data) {
        return {
          success: false,
          error: searchResponse.error || 'Search failed'
        };
      }

      // Then crawl top results for detailed information
      const topResults = searchResponse.data.results.slice(0, maxCrawl);
      const detailedJobs: JobDetails[] = [];

      for (const result of topResults) {
        try {
          const crawlResponse = await this.crawlJobDetails(result.url);
          if (crawlResponse.success && crawlResponse.data) {
            detailedJobs.push(crawlResponse.data);
          }
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn(`Failed to crawl ${result.url}:`, error);
          // Continue with other URLs
        }
      }

      return {
        success: true,
        data: {
          searchResults: searchResponse.data.results,
          detailedJobs,
          query: searchResponse.data.query
        }
      };
    } catch (error) {
      console.error('Search and crawl error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search and crawl jobs'
      };
    }
  }
}

export default JobSearchService;