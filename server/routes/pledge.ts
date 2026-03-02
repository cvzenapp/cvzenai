import { Router, Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../database/connection';
import { WaitlistEmailService } from '../services/waitlistEmailService';
import type { PledgeSubmission, PledgeResponse } from '@shared/api';

const router = Router();
const emailService = new WaitlistEmailService();

/**
 * POST /api/pledge
 * Submit sustainability pledge
 */
router.post('/', async (req: Request, res: Response) => {
  const client = await initializeDatabase();
  
  try {
    const submission: PledgeSubmission = req.body;

    // Validate required fields
    if (!submission.name || !submission.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      } as PledgeResponse);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submission.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      } as PledgeResponse);
    }

    // Check if email already exists
    const checkQuery = 'SELECT id FROM sustainability_pledges WHERE email = $1';
    const existingResult = await client.query(checkQuery, [submission.email]);
    const existing = existingResult.rows[0];

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already taken the pledge',
      } as PledgeResponse);
    }

    // Insert into database
    const insertQuery = `INSERT INTO sustainability_pledges 
       (name, email, contact, pledge_date, status)
       VALUES ($1, $2, $3, NOW(), $4)
       RETURNING id, email`;
    
    const result = await client.query(insertQuery, [
      submission.name,
      submission.email,
      submission.contact || null,
      'active',
    ]);
    
    const insertedId = result.rows[0].id;

    // Send confirmation email (don't block response)
    emailService.sendPledgeConfirmation(submission.email, submission.name).catch(error => {
      console.error('Failed to send pledge confirmation email:', error);
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for taking the pledge! Check your email for your certificate.',
      data: {
        id: insertedId as number,
        email: submission.email,
      },
    } as PledgeResponse);

  } catch (error) {
    console.error('Pledge submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process pledge submission',
    } as PledgeResponse);
  } finally {
    await closeDatabase(client);
  }
});

/**
 * GET /api/pledge/count
 * Get total number of pledges taken
 */
router.get('/count', async (req: Request, res: Response) => {
  const client = await initializeDatabase();
  
  try {
    const result = await client.query(
      'SELECT COUNT(*) as count FROM sustainability_pledges WHERE status = $1',
      ['active']
    );
    
    const count = parseInt(result.rows[0].count) || 0;
    
    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Error fetching pledge count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pledge count',
    });
  } finally {
    await closeDatabase(client);
  }
});

export default router;
