import express from 'express';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

app.listen(PORT, () => {
  logger.info(`Test server running on port ${PORT}`);
  console.log(`Test server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});