import { Router, Request, Response } from 'express';
import { emailService } from '../services/emailService';

const router = Router();

// Test endpoint for email functionality (development only)
router.post('/test', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Email testing is not available in production',
    });
  }

  const { type, email, name } = req.body;

  try {
    let result;

    switch (type) {
      case 'account_creation':
        result = await emailService.sendAccountCreationEmail(
          email || 'test@example.com',
          name || 'Test User',
          1
        );
        break;

      case 'job_application':
        result = await emailService.sendJobApplicationEmail(
          email || 'recruiter@example.com',
          'Test Recruiter',
          'John Doe',
          'john@example.com',
          'Software Engineer',
          'Tech Company',
          'https://cvzen.com/resume/123',
          'I am very interested in this position...',
          1,
          1,
          1
        );
        break;

      case 'application_confirmation':
        result = await emailService.sendApplicationConfirmationEmail(
          email || 'candidate@example.com',
          'Jane Smith',
          'Product Manager',
          'Startup Inc',
          'https://cvzen.com/resume/456',
          1,
          1,
          1
        );
        break;

      case 'shortlisted':
        result = await emailService.sendShortlistedNotification(
          email || 'candidate@example.com',
          'Alex Johnson',
          'UX Designer',
          'Design Studio',
          'Sarah Wilson',
          'Please prepare for a technical interview next week.',
          1,
          1,
          1
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Use: account_creation, job_application, application_confirmation, or shortlisted',
        });
    }

    res.json({
      success: true,
      message: `Test email sent successfully`,
      result,
    });

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get email logs for debugging
router.get('/logs', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Email logs are not available in production',
    });
  }

  const { initializeDatabase, closeDatabase } = await import('../database/connection');
  let db;

  try {
    db = await initializeDatabase();
    
    const result = await db.query(`
      SELECT 
        id,
        email_type,
        sender_email,
        recipient_email,
        subject,
        status,
        error_message,
        created_at,
        updated_at
      FROM email_logs 
      ORDER BY created_at DESC 
      LIMIT 50
    `);

    res.json({
      success: true,
      logs: result.rows,
    });

  } catch (error) {
    console.error('Get email logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs',
    });
  } finally {
    if (db) await closeDatabase(db);
  }
});

export default router;