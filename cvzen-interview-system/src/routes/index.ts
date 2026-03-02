import { Express } from 'express';
import sessionRoutes from './sessions';
import { logger } from '../utils/logger';

export function setupRoutes(app: Express): void {
  // API routes
  app.use('/api/sessions', sessionRoutes);

  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      timestamp: new Date().toISOString()
    });
  });

  logger.info('Routes configured successfully');
}