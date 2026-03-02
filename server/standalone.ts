#!/usr/bin/env node

/**
 * Standalone Express Server
 * Runs the API server on port 3001 for development
 */

import { createServer } from './index.ts';

const PORT = process.env.API_PORT || 3001;

async function startServer() {
  try {
    console.log('🚀 Starting standalone Express server...');
    
    const app = createServer();
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Express API server running on http://localhost:${PORT}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
      console.log(`🔗 Proxied through Vite at http://localhost:8080/api/*`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Express server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Express server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start Express server:', error);
    process.exit(1);
  }
}

startServer();