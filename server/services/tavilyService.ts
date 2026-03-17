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
  async searchJobs(params: JobSearchParams): Promise<TavilySearchResult[]> {
    try {
      // Build comprehensive search query
      let searchQuery = params.query;
      
      if (params.location) {
        searchQuery += ` in ${params.location}`;
      }
      
      if (params.jobType) {
        searchQuery += ` ${params.jobType}`;
      }
      
      if (params.experienceLevel) {
        searchQuery += ` ${params.experienceLevel} level`;
      }
      
      if (params.salary) {
        searchQuery += ` salary ${params.salary}`;
      }
      
      // Add job-specific keywords to improve results
      searchQuery += " job opening position hiring";
      
      console.log(`🔍 Tavily Job Search Query: ${searchQuery}`);
      
      const response = await tavilyClient.search(searchQuery, {
        searchDepth: "advanced",
        maxResults: params.maxResults || 10,
        includeAnswer: true,
        includeRawContent: false,
        includeImages: false
      });
      
      console.log(`✅ Tavily returned ${response.results?.length || 0} results`);
      
      // Transform Tavily results to our format
      const results: TavilySearchResult[] = (response.results || []).map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        content: result.content || '',
        score: result.score || 0,
        publishedDate: result.publishedDate
      }));
      
      return results;
      
    } catch (error) {
      console.error("Tavily search error:", error);
      throw new Error(`Failed to search jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
            description: await this.cleanJobDescription(parsedDetails.description || searchResult.content),
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
          description: await this.cleanJobDescription(searchResult.content),
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
      const { groqService } = await import('./groqService.js');
      
      const resumeSkills = resumeData?.skills?.join(', ') || '';
      const resumeExperience = resumeData?.experience?.map((e: any) => e.title).join(', ') || '';
      
      const prompt = `Rate job match 0-100 based on resume fit:

Job: ${jobContent.substring(0, 300)}
Resume Skills: ${resumeSkills}
Resume Experience: ${resumeExperience}

Return ONLY a number 0-100, nothing else.`;

      const result = await groqService.generateResponse(
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
          // Clean description
          const cleanedDescription = await this.cleanJobDescription(searchResult.content);
          
          // Calculate AI match score
          const matchScore = await this.calculateJobMatchScore(searchResult.content, resumeData);
          console.log(`✅ Match score for "${searchResult.title}": ${matchScore}%`);
          
          // Create job object
          const job = {
            id: `job-${i}`,
            title: searchResult.title,
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

  private async cleanJobDescription(content: string): Promise<string> {
    if (!content) return '';
    
    // Use Groq to semantically clean and format the description
    try {
      const { groqService } = await import('./groqService.js');
      const formatted = await groqService.formatJobDescription(content);
      return formatted;
    } catch (error) {
      console.error('Groq formatting failed, using regex cleanup:', error);
      
      // Fallback to regex cleanup
      content = content.replace(/!\[Image \d+:.*?\]\(.*?\)/g, '');
      content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      content = content.replace(/https?:\/\/[^\s)]+/g, '');
      content = content.replace(/={3,}/g, '');
      content = content.replace(/\*{2,}/g, '');
      content = content.replace(/blob:[^\s)]+/g, '');
      content = content.replace(/\s+/g, ' ');
      return content.trim().substring(0, 250);
    }
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
