import { tavily } from "@tavily/core";
import { fakeJobDetector, type DetectionResult } from './dspy/fakeJobDetector.js';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "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";

const tavilyClient = tavily({ apiKey: TAVILY_API_KEY });

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface TavilyCrawlResult {
  url: string;
  content: string;
  markdown?: string;
  links?: string[];
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface JobSearchParams {
  query: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: string;
  maxResults?: number;
}

export interface FraudDetection {
  isFake: boolean;
  confidence: number;
  reasoning: string;
  redFlags: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface JobWithFraudScore {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  description: string;
  requirements: string[];
  url: string;
  matchScore: number;
  postedDate: string;
  source: string;
  fraudDetection?: FraudDetection;
}

class TavilyService {
  /**
   * Search for jobs using Tavily's advanced search
   */
  async searchJobs(params: JobSearchParams): Promise<any[]> {
    try {
      // Build specific search query for targeted job results
      let searchQuery = `"${params.query}"`;
      
      if (params.location) {
        searchQuery += ` "${params.location}"`;
      }
      
      if (params.jobType) {
        searchQuery += ` "${params.jobType}"`;
      }
      
      if (params.experienceLevel) {
        searchQuery += ` "${params.experienceLevel}"`;
      }
      
      console.log(`🔍 Tavily Job Search Query: "${searchQuery}"`);
      
      const response = await tavilyClient.search(searchQuery, {
        searchDepth: "advanced",
        timeRange: "day",
        includeDomains: ["indeed.com", "glassdoor.com", "linkedin.com", "ziprecruiter.com"],
        maxResults: params.maxResults || 10,
        includeAnswer: 'advanced',
        includeImageDescriptions:true,
        includeUsage:true,
        includeImages: false,
        country:"India"
      });
      
      console.log(`✅ Tavily returned ${response.results?.length || 0} results`);
      
      if (!response.results || response.results.length === 0) {
        return [];
      }

      // Process each result to extract job details
      const jobs = [];
      for (let i = 0; i < response.results.length; i++) {
        const result = response.results[i];
        
        try {
          // Extract job details from the content
          const jobDetails = await this.extractJobFromContent(result, i);
          if (jobDetails) {
            jobs.push(jobDetails);
          }
        } catch (error) {
          console.error(`Failed to extract job ${i}:`, error);
          // Continue with next job
        }
      }
      
      console.log(`📋 Successfully extracted ${jobs.length} job postings`);
      return jobs;
      
    } catch (error) {
      console.error("Tavily search error:", error);
      console.warn('⚠️ Tavily search failed, returning empty results');
      return [];
    }
  }

  /**
   * Extract job details from Tavily search result content
   */
  private async extractJobFromContent(result: any, index: number): Promise<any | null> {
    try {
      const content = result.content || result.rawContent || '';
      const url = result.url || '';
      const title = result.title || '';
      
      // Skip if this looks like a job board search page rather than individual posting
      if (this.isJobBoardSearchPage(url, content)) {
        console.log(`⚠️ Skipping job board search page: ${url}`);
        return null;
      }

      // Use the clean content from Tavily directly
      const jobTitle = this.extractJobTitle(content) || title || 'Job Opening';
      const company = this.extractCompanyFromContent(content) || this.extractCompanyFromUrl(url);
      const location = this.extractLocation(content) || 'Not specified';
      const salary = this.extractSalary(content);
      const jobType = this.extractEmploymentType(content);
      const description = content.substring(0, 300) || 'Job description not available';
      const requirements = this.extractRequirementsArray(content);

      // Create job object with clean data
      const job = {
        id: `job-${index}`,
        title: jobTitle,
        company: company,
        location: location,
        salary: salary,
        type: jobType || 'Full-time',
        description: description,
        requirements: requirements,
        url: url,
        matchScore: Math.round(result.score * 100) || 50,
        postedDate: result.publishedDate || 'Recently',
        source: 'tavily'
      };

      console.log(`✅ Extracted job: ${job.title} at ${job.company}`);
      return job;

    } catch (error) {
      console.error('Error extracting job from content:', error);
      return null;
    }
  }

  /**
   * Clean job content by removing junk characters and formatting properly
   */
  private cleanJobContent(content: string): string {
    if (!content) return '';
    
    return content
      // Remove all blob URLs and image references first
      .replace(/blob:[^\s)]+/g, '')
      .replace(/!\[Image \d+:.*?\]\([^)]*\)/g, '')
      .replace(/\[Image \d+:.*?\]/g, '')
      .replace(/https?:\/\/[^\s)]+\.(jpg|jpeg|png|gif|svg|webp)/gi, '')
      .replace(/https?:\/\/localhost[^\s)]+/g, '')
      
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      
      // Remove excessive formatting and special characters
      .replace(/={3,}/g, '')
      .replace(/\*{2,}/g, '')
      .replace(/-{3,}/g, '')
      .replace(/_{3,}/g, '')
      .replace(/#\s*/g, '')
      
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      
      // Remove parentheses with URLs or blob references
      .replace(/\([^)]*(?:blob|http|localhost)[^)]*\)/g, '')
      
      // Clean up remaining junk
      .replace(/[^\w\s\-.,!?()$%&@#:]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if URL/content is a job board search page rather than individual posting
   */
  private isJobBoardSearchPage(url: string, content: string): boolean {
    const searchPageIndicators = [
      'search results',
      'jobs found',
      'showing jobs',
      'filter by',
      'sort by',
      'page 1 of',
      'results per page',
      'refine your search'
    ];

    const lowerContent = content.toLowerCase();
    const lowerUrl = url.toLowerCase();

    // Check URL patterns
    if (lowerUrl.includes('/search') || lowerUrl.includes('/jobs?') || lowerUrl.includes('q=')) {
      return true;
    }

    // Check content patterns
    return searchPageIndicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Extract requirements as an array
   */
  private extractRequirementsArray(content: string): string[] {
    const requirements: string[] = [];
    
    // Look for requirements section
    const reqSection = content.match(/(?:requirements?|qualifications?|skills?):?\s*\n([\s\S]{0,500}?)(?:\n\s*(?:responsibilities|benefits|about|company)|$)/i);
    
    if (reqSection) {
      const reqText = reqSection[1];
      
      // Extract bullet points
      const bullets = reqText.match(/[•\-\*]\s*([^\n]+)/g);
      if (bullets) {
        requirements.push(...bullets.map(b => b.replace(/[•\-\*]\s*/, '').trim()).slice(0, 5));
      } else {
        // Extract sentences if no bullets
        const sentences = reqText.split(/[.!?]\s+/).filter(s => s.trim().length > 10).slice(0, 3);
        requirements.push(...sentences.map(s => s.trim()));
      }
    }

    // If no requirements found, extract common skills from content
    if (requirements.length === 0) {
      const skillPatterns = [
        /\b(JavaScript|Python|Java|React|Node\.js|SQL|AWS|Docker|Kubernetes)\b/gi,
        /\b(\d+\+?\s*years?\s*(?:of\s*)?experience)\b/gi,
        /\b(Bachelor'?s|Master'?s|degree)\b/gi
      ];

      for (const pattern of skillPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          requirements.push(...matches.slice(0, 2));
          if (requirements.length >= 3) break;
        }
      }
    }

    return requirements.slice(0, 5); // Limit to 5 requirements
  }

  /**
   * Crawl a specific job posting URL for detailed information
   */
  async crawlJobPosting(url: string): Promise<TavilyCrawlResult> {
    try {
      console.log(`🕷️ Crawling job posting: ${url}`);
      
      const response = await tavilyClient.extract([url], {
        extractDepth: "advanced"
      });
      
      if (!response.results || response.results.length === 0) {
        throw new Error("No content extracted from URL");
      }
      
      const result = response.results[0];
      
      return {
        url: url,
        content: result.rawContent || '',
        markdown: result.content || '',
        links: result.links || [],
        metadata: {
          title: result.title,
          description: result.content?.substring(0, 200)
        }
      };
      
    } catch (error) {
      console.error("Tavily crawl error:", error);
      throw new Error(`Failed to crawl job posting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Crawl multiple job posting URLs in parallel
   */
  async crawlMultipleJobPostings(urls: string[]): Promise<TavilyCrawlResult[]> {
    try {
      console.log(`🕷️ Crawling ${urls.length} job postings`);
      
      const response = await tavilyClient.extract(urls, {
        extractDepth: "advanced"
      });
      
      if (!response.results || response.results.length === 0) {
        return [];
      }
      
      return response.results.map((result: any, index: number) => ({
        url: urls[index],
        content: result.rawContent || '',
        markdown: result.content || '',
        links: result.links || [],
        metadata: {
          title: result.title,
          description: result.content?.substring(0, 200)
        }
      }));
      
    } catch (error) {
      console.error("Tavily multi-crawl error:", error);
      throw new Error(`Failed to crawl job postings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse job details from crawled content using AI-like extraction
   */
  parseJobDetails(crawlResult: TavilyCrawlResult): any {
    const content = crawlResult.content.toLowerCase();
    
    // Extract common job details using pattern matching
    const jobDetails: any = {
      url: crawlResult.url,
      title: crawlResult.metadata?.title || '',
      description: crawlResult.content.substring(0, 500),
      fullContent: crawlResult.content
    };
    
    // Try to extract salary information
    const salaryPatterns = [
      /\$[\d,]+\s*-\s*\$[\d,]+/g,
      /\$[\d,]+k?\s*-\s*\$[\d,]+k?/gi,
      /salary:?\s*\$?[\d,]+/gi
    ];
    
    for (const pattern of salaryPatterns) {
      const match = crawlResult.content.match(pattern);
      if (match) {
        jobDetails.salary = match[0];
        break;
      }
    }
    
    // Try to extract location
    const locationPatterns = [
      /location:?\s*([^\n]+)/i,
      /based in\s+([^\n]+)/i,
      /office in\s+([^\n]+)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = crawlResult.content.match(pattern);
      if (match && match[1]) {
        jobDetails.location = match[1].trim();
        break;
      }
    }
    
    // Try to extract job type
    if (content.includes('remote')) {
      jobDetails.type = 'Remote';
    } else if (content.includes('hybrid')) {
      jobDetails.type = 'Hybrid';
    } else if (content.includes('on-site') || content.includes('onsite')) {
      jobDetails.type = 'On-site';
    }
    
    // Extract requirements (look for bullet points or numbered lists)
    const requirements: string[] = [];
    const reqSection = crawlResult.content.match(/requirements?:?\s*\n([\s\S]*?)(?:\n\n|responsibilities|qualifications|$)/i);
    if (reqSection) {
      const bullets = reqSection[1].match(/[•\-\*]\s*([^\n]+)/g);
      if (bullets) {
        requirements.push(...bullets.map(b => b.replace(/[•\-\*]\s*/, '').trim()).slice(0, 5));
      }
    }
    jobDetails.requirements = requirements;
    
    return jobDetails;
  }

  /**
   * Search and crawl jobs in one operation
   */
  async searchAndCrawlJobs(params: JobSearchParams): Promise<any[]> {
    try {
      // First, search for jobs
      const searchResults = await this.searchJobs(params);
      
      if (searchResults.length === 0) {
        return [];
      }
      
      // Get top URLs to crawl (limit to avoid rate limits)
      const topUrls = searchResults
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(5, params.maxResults || 5))
        .map(r => r.url);
      
      console.log(`📋 Crawling top ${topUrls.length} job postings for details`);
      
      // Crawl the top results for detailed information
      const crawlResults = await this.crawlMultipleJobPostings(topUrls);
      
      // Combine search and crawl results
      const enrichedJobs = await Promise.all(searchResults.map(async (searchResult, index) => {
        const crawlResult = crawlResults.find(c => c.url === searchResult.url);
        
        if (crawlResult) {
          const parsedDetails = this.parseJobDetails(crawlResult);
          return {
            id: `job-${index}`,
            title: parsedDetails.title || searchResult.title,
            company: this.extractCompanyFromUrl(searchResult.url),
            location: parsedDetails.location || 'Not specified',
            salary: parsedDetails.salary,
            type: parsedDetails.type || 'Full-time',
            description: parsedDetails.description || searchResult.content,
            requirements: parsedDetails.requirements || [],
            url: searchResult.url,
            matchScore: Math.round(searchResult.score * 100),
            postedDate: searchResult.publishedDate || 'Recently',
            source: 'tavily'
          };
        }
        
        // Fallback to search result only
        return {
          id: `job-${index}`,
          title: searchResult.title,
          company: this.extractCompanyFromUrl(searchResult.url),
          location: 'Not specified',
          type: 'Full-time',
          description: searchResult.content,
          requirements: [],
          url: searchResult.url,
          matchScore: Math.round(searchResult.score * 100),
          postedDate: searchResult.publishedDate || 'Recently',
          source: 'tavily'
        };
      }));
      
      return enrichedJobs;
      
    } catch (error) {
      console.error("Search and crawl error:", error);
      throw error;
    }
  }

  async calculateJobMatchScore(jobContent: string, resumeData: any): Promise<number> {
    try {
      // Validate input content
      if (!jobContent || jobContent.trim() === '') {
        console.warn('⚠️ Empty job content provided for match scoring');
        return 50;
      }

      const { abstractedAiService } = await import('./abstractedAiService.js');
      
      const resumeSkills = Array.isArray(resumeData?.skills) ? resumeData.skills.join(', ') : (resumeData?.skills || '');
      const resumeExperience = Array.isArray(resumeData?.experience) ? resumeData.experience.map((e: any) => e.title).join(', ') : (resumeData?.experience || '');
      
      const prompt = `Rate job match 0-100 based on resume fit:

Job: ${jobContent.substring(0, 300)}
Resume Skills: ${resumeSkills}
Resume Experience: ${resumeExperience}

Return ONLY a number 0-100, nothing else.`;

      const result = await abstractedAiService.generateResponse(
        'You are a job matching system. Return only a number.',
        prompt,
        { temperature: 0.3, maxTokens: 10 }
      );
      
      const score = parseInt(result.response.trim());
      return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Match score calculation failed:', error);
      return 50;
    }
  }

  /**
   * Stream jobs one by one with AI-based match scoring
   */
  async streamJobsWithAIScoring(
    params: JobSearchParams,
    resumeData: any,
    onJob: (job: any) => void
  ): Promise<void> {
    try {
      console.log('🔍 Starting streaming job search');
      
      // Search for jobs
      const searchResults = await this.searchJobs(params);
      console.log(`📦 Found ${searchResults.length} job results`);
      
      // Process each job one by one
      for (let i = 0; i < searchResults.length; i++) {
        const searchResult = searchResults[i];
        console.log(`🔄 Processing job ${i + 1}/${searchResults.length}: ${searchResult.title}`);
        
        try {
          // Use search result content directly
          const cleanedDescription = searchResult.content || searchResult.title || 'Job description not available';
          
          // Only calculate match score if we have meaningful content
          let matchScore = 50; // Default score
          if (cleanedDescription && cleanedDescription.trim().length > 10) {
            matchScore = await this.calculateJobMatchScore(cleanedDescription, resumeData);
            console.log(`✅ Match score for "${searchResult.title}": ${matchScore}%`);
          } else {
            console.warn(`⚠️ Insufficient content for "${searchResult.title}", using default score`);
          }
          
          // Create job object
          const job = {
            id: `job-${i}`,
            title: searchResult.title || 'Job Opening',
            company: this.extractCompanyFromUrl(searchResult.url),
            location: params.location || 'Not specified',
            type: 'Full-time',
            description: cleanedDescription,
            requirements: [],
            url: searchResult.url,
            matchScore: matchScore,
            postedDate: searchResult.publishedDate || 'Recently',
            source: 'tavily'
          };
          
          // Stream this job immediately
          onJob(job);
          
        } catch (jobError) {
          console.error(`❌ Error processing job ${i + 1}:`, jobError);
          // Continue with next job
        }
      }
      
      console.log('✅ Finished streaming all jobs');
      
    } catch (error) {
      console.error('Streaming job search error:', error);
      throw error;
    }
  }

  /**
     * Extract job details from URL using Tavily's extract API
     */
    async extractJobDetails(url: string): Promise<string> {
      if (!url) return '';

      try {
        console.log(`🔍 Extracting job details from: ${url}`);

        const response = await tavilyClient.extract([url], {
          extract_depth: "advanced",
          include_images: false
        });

        console.log('Tavily response:', JSON.stringify(response, null, 2));

        if (response?.results?.length > 0) {
          const extractedContent = response.results[0].raw_content;
          console.log(`✅ Tavily extracted ${extractedContent?.length || 0} characters from ${url}`);
          return this.parseExtractedJobContent(extractedContent || '');
        } else if (response?.failed_results?.length > 0) {
          console.warn(`⚠️ Tavily extraction failed for ${url}:`, response.failed_results[0].error);
          return '';
        } else {
          console.warn(`⚠️ No content extracted from ${url}`);
          return '';
        }
      } catch (error) {
        console.error(`❌ Tavily extraction error for ${url}:`, error);
        return '';
      }
    }

    /**
     * Parse extracted job content and extract relevant information
     */
    private parseExtractedJobContent(content: string): string {
      if (!content) return '';

      // Clean up the content by removing unwanted elements
      let cleanContent = content
        // Remove image references and links
        .replace(/!\[Image \d+:.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/https?:\/\/[^\s)]+/g, '')
        .replace(/blob:[^\s)]+/g, '')
        // Remove excessive formatting
        .replace(/={3,}/g, '')
        .replace(/\*{2,}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Extract key job information
      const jobTitle = this.extractJobTitle(cleanContent);
      const company = this.extractCompanyFromContent(cleanContent);
      const description = this.extractJobDescription(cleanContent);

      // Combine the extracted information
      let result = '';
      if (jobTitle) result += `Job Title: ${jobTitle}\n`;
      if (company) result += `Company: ${company}\n`;
      if (description) result += `Description: ${description}`;

      return result || cleanContent.substring(0, 500);
    }

    /**
     * Extract job title from content
     */
    private extractJobTitle(content: string): string {
      const titlePatterns = [
        // Look for specific job titles first
        /(?:job title|position|role)[:\s]+([^\n]+)/i,
        // Look for common job title patterns at start of content
        /^([^\n]*(?:engineer|developer|manager|analyst|specialist|coordinator|director|lead|architect|designer|consultant|administrator|owner)[^\n]*)/im,
        // Look for "We are hiring" patterns
        /(?:hiring|seeking|looking for)[:\s]+([^\n]+)/i,
        // Look for job titles in quotes
        /"([^"]*(?:engineer|developer|manager|analyst|specialist|coordinator|director|lead|architect|designer|consultant|administrator|owner)[^"]*)"/i
      ];

      for (const pattern of titlePatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const title = match[1].trim();
          // Ensure it's a meaningful title
          if (title.length > 5 && !title.toLowerCase().includes('job')) {
            return title.substring(0, 100);
          }
        }
      }

      return '';
    }

    /**
     * Extract company name from content
     */
    private extractCompanyFromContent(content: string): string {
      const companyPatterns = [
        /company[:\s]+([^\n]+)/i,
        /employer[:\s]+([^\n]+)/i,
        /organization[:\s]+([^\n]+)/i,
        /at\s+([A-Z][a-zA-Z\s&]+(?:Inc|LLC|Corp|Ltd|Company))/
      ];

      for (const pattern of companyPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          return match[1].trim().substring(0, 100);
        }
      }

      return '';
    }

    /**
     * Extract job description from content
     */
    private extractJobDescription(content: string): string {
      const descriptionPatterns = [
        /(?:job\s+)?description[:\s]+([\s\S]+?)(?:\n\s*(?:requirements|qualifications|responsibilities)|$)/i,
        /(?:about\s+(?:the\s+)?(?:role|position|job))[:\s]+([\s\S]+?)(?:\n\s*(?:requirements|qualifications|responsibilities)|$)/i,
        /summary[:\s]+([\s\S]+?)(?:\n\s*(?:requirements|qualifications|responsibilities)|$)/i
      ];

      for (const pattern of descriptionPatterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          return match[1].trim().substring(0, 300);
        }
      }

      // Fallback: return first 300 characters
      return content.substring(0, 300);
    }

    /**
     * @deprecated Use extractJobDetails instead
     */
    private async cleanJobDescription(content: string): Promise<string> {
      console.warn('cleanJobDescription is deprecated, use extractJobDetails for URL-based extraction');

      if (!content) return '';

      // Fallback to regex cleanup for non-URL content
      content = content.replace(/!\[Image \d+:.*?\]\(.*?\)/g, '');
      content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      content = content.replace(/https?:\/\/[^\s)]+/g, '');
      content = content.replace(/={3,}/g, '');
      content = content.replace(/\*{2,}/g, '');
      content = content.replace(/blob:[^\s)]+/g, '');
      content = content.replace(/\s+/g, ' ');
      return content.trim().substring(0, 250);
    }


  /**
   * Extract company name from URL
   */
  private extractCompanyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      
      // Common job board patterns
      if (hostname.includes('linkedin.com')) {
        const match = url.match(/\/company\/([^\/]+)/);
        if (match) return this.formatCompanyName(match[1]);
      }
      
      if (hostname.includes('indeed.com') || hostname.includes('glassdoor.com')) {
        const match = url.match(/\/cmp\/([^\/]+)/);
        if (match) return this.formatCompanyName(match[1]);
      }
      
      // Default: use domain name
      const parts = hostname.split('.');
      return this.formatCompanyName(parts[0]);
      
    } catch (error) {
      return 'Company';
    }
  }

  /**
   * Format company name for display
   */
  private formatCompanyName(name: string): string {
    return name
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Search jobs and detect fake postings using Tavily Extract + JD Trust Score
   * Crawls LinkedIn URLs and analyzes them for fraud indicators
   */
  async searchAndDetectFakeJobs(params: JobSearchParams): Promise<JobWithFraudScore[]> {
    try {
      console.log('🔍 Starting job search with fraud detection...');
      
      // Step 1: Search for jobs
      const searchResults = await this.searchJobs(params);
      
      if (searchResults.length === 0) {
        console.log('⚠️ No search results found');
        return [];
      }
      
      console.log(`✅ Found ${searchResults.length} job results`);
      
      // Step 2: Filter LinkedIn URLs (most reliable for crawling)
      const linkedInResults = searchResults.filter(r => 
        r.url.includes('linkedin.com/jobs')
      );
      
      console.log(`🔗 Found ${linkedInResults.length} LinkedIn job postings`);
      
      // Step 3: Get top URLs to crawl (limit to avoid rate limits)
      const topUrls = linkedInResults
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.min(5, params.maxResults || 5))
        .map(r => r.url);
      
      if (topUrls.length === 0) {
        console.log('⚠️ No LinkedIn URLs to crawl, returning results without fraud detection');
        return this.formatJobsWithoutFraudDetection(searchResults);
      }
      
      console.log(`🕷️ Crawling ${topUrls.length} LinkedIn job postings...`);
      
      // Step 4: Crawl job postings in parallel
      const crawlPromises = topUrls.map(url => 
        this.crawlJobPosting(url).catch(error => {
          console.error(`Failed to crawl ${url}:`, error);
          return null;
        })
      );
      
      const crawlResults = (await Promise.all(crawlPromises)).filter(r => r !== null) as TavilyCrawlResult[];
      
      console.log(`✅ Successfully crawled ${crawlResults.length} job postings`);
      
      // Step 5: Detect fake jobs in parallel
      const detectionPromises = crawlResults.map(async (crawlResult) => {
        try {
          // Convert crawled content to job posting format
          const jobData = this.convertCrawlToJobPosting(crawlResult);
          
          // Detect if fake
          const detection = await fakeJobDetector.detect(jobData);
          
          return {
            url: crawlResult.url,
            detection
          };
        } catch (error) {
          console.error(`Failed to detect fake job for ${crawlResult.url}:`, error);
          return {
            url: crawlResult.url,
            detection: null
          };
        }
      });
      
      const detectionResults = await Promise.all(detectionPromises);
      
      console.log(`✅ Completed fraud detection for ${detectionResults.length} jobs`);
      
      // Step 6: Combine search results with fraud detection
      const jobsWithFraudScores: JobWithFraudScore[] = searchResults.map((searchResult, index) => {
        const crawlResult = crawlResults.find(c => c.url === searchResult.url);
        const detectionResult = detectionResults.find(d => d.url === searchResult.url);
        
        // Parse job details
        let parsedDetails: any = {};
        if (crawlResult) {
          parsedDetails = this.parseJobDetails(crawlResult);
        }
        
        // Build base job object
        const job: JobWithFraudScore = {
          id: `job-${index}`,
          title: parsedDetails.title || searchResult.title,
          company: this.extractCompanyFromUrl(searchResult.url),
          location: parsedDetails.location || 'Not specified',
          salary: parsedDetails.salary,
          type: parsedDetails.type || 'Full-time',
          description: parsedDetails.description || searchResult.content,
          requirements: parsedDetails.requirements || [],
          url: searchResult.url,
          matchScore: Math.round(searchResult.score * 100),
          postedDate: searchResult.publishedDate || 'Recently',
          source: 'tavily'
        };
        
        // Add fraud detection if available
        if (detectionResult?.detection) {
          const detection = detectionResult.detection;
          job.fraudDetection = {
            isFake: detection.isFake,
            confidence: detection.confidence,
            reasoning: detection.reasoning,
            redFlags: detection.redFlags,
            riskLevel: this.calculateRiskLevel(detection.confidence)
          };
        }
        
        return job;
      });
      
      // Log summary
      const fraudCount = jobsWithFraudScores.filter(j => j.fraudDetection?.isFake).length;
      console.log(`📊 Fraud Detection Summary: ${fraudCount}/${jobsWithFraudScores.length} jobs flagged as potentially fake`);
      
      return jobsWithFraudScores;
      
    } catch (error) {
      console.error('❌ Error in searchAndDetectFakeJobs:', error);
      throw error;
    }
  }

  /**
   * Convert crawled content to job posting format for fake detection
   */
  private convertCrawlToJobPosting(crawlResult: TavilyCrawlResult): any {
    const content = crawlResult.content;
    const metadata = crawlResult.metadata || {};
    
    return {
      title: metadata.title || '',
      location: this.extractLocation(content),
      department: this.extractDepartment(content),
      salary_range: this.extractSalary(content),
      company_profile: this.extractCompanyProfile(content),
      description: content.substring(0, 1000),
      requirements: this.extractRequirements(content),
      benefits: this.extractBenefits(content),
      employment_type: this.extractEmploymentType(content),
      required_experience: this.extractExperience(content),
      required_education: this.extractEducation(content),
      industry: '',
      function: ''
    };
  }

  /**
   * Extract location from job content
   */
  private extractLocation(content: string): string {
    const patterns = [
      /location:?\s*([^\n]+)/i,
      /based in\s+([^\n]+)/i,
      /office in\s+([^\n]+)/i,
      /\b([A-Z][a-z]+,\s*[A-Z]{2})\b/
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Extract department from job content
   */
  private extractDepartment(content: string): string {
    const patterns = [
      /department:?\s*([^\n]+)/i,
      /team:?\s*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Extract salary from job content
   */
  private extractSalary(content: string): string {
    const patterns = [
      /\$[\d,]+\s*-\s*\$[\d,]+/,
      /\$[\d,]+k?\s*-\s*\$[\d,]+k?/i,
      /salary:?\s*\$?[\d,]+/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return '';
  }

  /**
   * Extract company profile from job content
   */
  private extractCompanyProfile(content: string): string {
    const patterns = [
      /about (?:the )?company:?\s*([^\n]{50,200})/i,
      /company (?:overview|description):?\s*([^\n]{50,200})/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Extract requirements from job content
   */
  private extractRequirements(content: string): string {
    const reqSection = content.match(/requirements?:?\s*\n([\s\S]{0,500}?)(?:\n\n|responsibilities|qualifications|benefits|$)/i);
    if (reqSection) {
      return reqSection[1].trim();
    }
    return '';
  }

  /**
   * Extract benefits from job content
   */
  private extractBenefits(content: string): string {
    const benefitsSection = content.match(/benefits?:?\s*\n([\s\S]{0,300}?)(?:\n\n|requirements|qualifications|$)/i);
    if (benefitsSection) {
      return benefitsSection[1].trim();
    }
    return '';
  }

  /**
   * Extract employment type from job content
   */
  private extractEmploymentType(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('full-time') || lowerContent.includes('full time')) {
      return 'Full-time';
    }
    if (lowerContent.includes('part-time') || lowerContent.includes('part time')) {
      return 'Part-time';
    }
    if (lowerContent.includes('contract')) {
      return 'Contract';
    }
    if (lowerContent.includes('temporary') || lowerContent.includes('temp')) {
      return 'Temporary';
    }
    if (lowerContent.includes('internship') || lowerContent.includes('intern')) {
      return 'Internship';
    }
    
    return 'Full-time';
  }

  /**
   * Extract experience requirements from job content
   */
  private extractExperience(content: string): string {
    const patterns = [
      /(\d+\+?\s*years?\s*(?:of\s*)?experience)/i,
      /experience:?\s*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  }

  /**
   * Extract education requirements from job content
   */
  private extractEducation(content: string): string {
    const patterns = [
      /(bachelor'?s|master'?s|phd|doctorate|associate'?s)\s*(?:degree)?/i,
      /education:?\s*([^\n]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }
    
    return '';
  }

  /**
   * Calculate risk level based on confidence score
   */
  private calculateRiskLevel(confidence: number): 'low' | 'medium' | 'high' {
    if (confidence >= 61) return 'high';
    if (confidence >= 31) return 'medium';
    return 'low';
  }

  /**
   * Format jobs without fraud detection (fallback)
   */
  private formatJobsWithoutFraudDetection(searchResults: TavilySearchResult[]): JobWithFraudScore[] {
    return searchResults.map((result, index) => ({
      id: `job-${index}`,
      title: result.title,
      company: this.extractCompanyFromUrl(result.url),
      location: 'Not specified',
      type: 'Full-time',
      description: result.content,
      requirements: [],
      url: result.url,
      matchScore: Math.round(result.score * 100),
      postedDate: result.publishedDate || 'Recently',
      source: 'tavily'
    }));
  }
}

export const tavilyService = new TavilyService();
