import { Router, Request, Response } from 'express';
import JobSearchService from '../services/jobSearchService';
import { requireAuth } from '../middleware/unifiedAuth';

const router = Router();
const jobSearchService = new JobSearchService();

interface JobSearchRequest extends Request {
  body: {
    query: string;
    location?: string;
    maxResults?: number;
  };
}

interface JobCrawlRequest extends Request {
  body: {
    url: string;
  };
}

interface JobSearchAndCrawlRequest extends Request {
  body: {
    query: string;
    location?: string;
    maxCrawl?: number;
  };
}

/**
 * POST /api/job-search/search
 * Search for jobs using Tavily
 */
router.post('/search', requireAuth, async (req: JobSearchRequest, res: Response) => {
  try {
    const { query, location } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const result = await jobSearchService.searchJobs(query.trim(), location?.trim());
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Job search API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/job-search/crawl
 * Crawl a specific job URL for detailed information
 */
router.post('/crawl', requireAuth, async (req: JobCrawlRequest, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }

    const result = await jobSearchService.crawlJobDetails(url.trim());
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Job crawl API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/job-search/search-and-crawl
 * Search for jobs and crawl top results for detailed information
 */
router.post('/search-and-crawl', requireAuth, async (req: JobSearchAndCrawlRequest, res: Response) => {
  try {
    const { query, location, maxCrawl = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    if (maxCrawl > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum crawl limit is 10'
      });
    }

    const result = await jobSearchService.searchAndCrawlJobs(
      query.trim(), 
      location?.trim(), 
      Math.max(1, Math.min(maxCrawl, 10))
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Job search and crawl API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/job-search/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Job search service is running',
    timestamp: new Date().toISOString()
  });
});

export default router;