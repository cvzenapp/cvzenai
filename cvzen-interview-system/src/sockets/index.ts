import { Server } from 'socket.io';
import { sessionSocketHandler } from './sessionSocket';
import { logger } from '../utils/logger';

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Setup session-related socket handlers
    sessionSocketHandler(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error: ${socket.id}`, error);
    });
  });

  logger.info('Socket handlers configured successfully');
}