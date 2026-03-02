import { Router, Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../database/connection';
import { WaitlistEmailService } from '../services/waitlistEmailService';
import type { WaitlistSubmission, WaitlistResponse } from '@shared/api';

const router = Router();
const emailService = new WaitlistEmailService();

/**
 * POST /api/waitlist
 * Submit early bird waitlist signup
 */
router.post('/', async (req: Request, res: Response) => {
  const client = await initializeDatabase();
  
  try {
    const submission: WaitlistSubmission = req.body;

    // Validate required fields
    if (!submission.name || !submission.email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required',
      } as WaitlistResponse);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submission.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      } as WaitlistResponse);
    }

    // Check if email already exists
    const checkQuery = 'SELECT id FROM early_bird_waitlist WHERE email = $1';
    const existingResult = await client.query(checkQuery, [submission.email]);
    const existing = existingResult.rows[0];

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This email is already on the waitlist',
      } as WaitlistResponse);
    }

    // PostgreSQL expects arrays as JavaScript arrays, not JSON strings
    const featuresArray = submission.interestedFeatures || null;

    // Insert into database
    const insertQuery = `INSERT INTO early_bird_waitlist 
       (name, email, contact, company_name, company_size, use_case, interested_features, additional_info, source, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, email`;
    
    const result = await client.query(insertQuery, [
      submission.name,
      submission.email,
      submission.contact || null,
      submission.companyName || null,
      submission.companySize || null,
      submission.useCase || null,
      featuresArray,
      submission.additionalInfo || null,
      'landing_page',
      'pending',
    ]);
    
    const insertedId = result.rows[0].id;

    // Send notification emails (don't block response)
    Promise.all([
      emailService.sendWaitlistNotification({
        ...submission,
        submittedAt: new Date(),
      }),
      emailService.sendConfirmationEmail(submission.email, submission.name),
    ]).catch(error => {
      console.error('Failed to send emails:', error);
    });

    // Update notified_at timestamp
    const updateQuery = 'UPDATE early_bird_waitlist SET notified_at = NOW() WHERE id = $1';
    await client.query(updateQuery, [insertedId]);

    res.status(201).json({
      success: true,
      message: 'Successfully joined the waitlist! Check your email for confirmation.',
      data: {
        id: insertedId as number,
        email: submission.email,
      },
    } as WaitlistResponse);

  } catch (error) {
    console.error('Waitlist submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process waitlist submission',
    } as WaitlistResponse);
  } finally {
    await closeDatabase(client);
  }
});

export default router;
