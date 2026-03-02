import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDatabase } from './database/connection';
import { setupRoutes } from './routes';
import { setupSocketHandlers } from './sockets';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Setup routes
setupRoutes(app);

// Setup socket handlers
setupSocketHandlers(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Interview System server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error as Error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();