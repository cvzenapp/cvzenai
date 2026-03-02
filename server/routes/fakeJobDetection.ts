import express from 'express';
import { fakeJobDetector, type JobPosting, type DetectionResult } from '../services/dspy/fakeJobDetector.js';
import type { Request, Response } from 'express';

const router = express.Router();

/**
 * POST /api/fake-job-detection/analyze
 * Analyze a single job posting for fraud indicators
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    
    // Map job_description to description for compatibility
    const jobData: Partial<JobPosting> = {
      ...rawData,
      description: rawData.job_description || rawData.description
    };

    if (!jobData.title && !jobData.description) {
      return res.status(400).json({
        success: false,
        error: 'Job title or description is required'
      });
    }

    console.log('🔍 Analyzing job posting:', jobData.title || '(no title)');

    const result: DetectionResult = await fakeJobDetector.detect(jobData);

    console.log('✅ Detection result:', {
      isFake: result.isFake,
      confidence: result.confidence
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('❌ Error in fake job detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze job posting',
      message: error.message
    });
  }
});

/**
 * POST /api/fake-job-detection/batch
 * Analyze multiple job postings
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const jobs: Partial<JobPosting>[] = req.body.jobs;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Jobs array is required'
      });
    }

    if (jobs.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 jobs per batch'
      });
    }

    console.log(`🔍 Analyzing ${jobs.length} job postings...`);

    const results: DetectionResult[] = await fakeJobDetector.detectBatch(jobs);

    const fakeCount = results.filter(r => r.isFake).length;
    console.log(`✅ Analysis complete: ${fakeCount}/${jobs.length} flagged as fake`);

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: jobs.length,
          fake: fakeCount,
          real: jobs.length - fakeCount
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Error in batch fake job detection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze job postings',
      message: error.message
    });
  }
});

/**
 * GET /api/fake-job-detection/health
 * Check if detector is ready
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ready',
      message: 'Fake job detector is operational'
    }
  });
});

export default router;
