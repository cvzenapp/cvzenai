import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface SocketUser {
  userId: number;
  userType: 'recruiter' | 'candidate';
  sessionId?: number;
  displayName?: string;
}

export function sessionSocketHandler(io: Server, socket: Socket): void {
  let socketUser: SocketUser | null = null;

  // Authenticate socket connection
  socket.on('authenticate', async (data: { token: string }) => {
    try {
      const decoded = jwt.verify(data.token, process.env.JWT_SECRET!) as any;
      
      socketUser = {
        userId: parseInt(decoded.userId || decoded.id),
        userType: decoded.type || 'candidate'
      };

      socket.emit('authenticated', { success: true });
      logger.info(`Socket authenticated: ${socket.id}, user: ${socketUser.userId}`);
    } catch (error) {
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
      logger.error(`Socket authentication failed: ${socket.id}`, error as Error);
    }
  });

  // Join session room
  socket.on('join-session', async (data: { sessionId: number, displayName: string }) => {
    if (!socketUser) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const roomId = `session-${data.sessionId}`;
      
      // Join the room
      await socket.join(roomId);
      
      socketUser.sessionId = data.sessionId;
      socketUser.displayName = data.displayName;

      // Notify other participants
      socket.to(roomId).emit('participant-joined', {
        userId: socketUser.userId,
        userType: socketUser.userType,
        displayName: socketUser.displayName
      });

      // Confirm join to the user
      socket.emit('session-joined', {
        sessionId: data.sessionId,
        roomId: roomId
      });

      logger.info(`User ${socketUser.userId} joined session ${data.sessionId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join session' });
      logger.error(`Failed to join session: ${socket.id}`, error as Error);
    }
  });

  // Leave session room
  socket.on('leave-session', async () => {
    if (!socketUser || !socketUser.sessionId) {
      return;
    }

    const roomId = `session-${socketUser.sessionId}`;
    
    // Leave the room
    await socket.leave(roomId);

    // Notify other participants
    socket.to(roomId).emit('participant-left', {
      userId: socketUser.userId,
      userType: socketUser.userType
    });

    logger.info(`User ${socketUser.userId} left session ${socketUser.sessionId}`);
    socketUser.sessionId = undefined;
  });

  // WebRTC signaling events (placeholder)
  socket.on('webrtc-offer', (data) => {
    if (!socketUser || !socketUser.sessionId) return;
    
    const roomId = `session-${socketUser.sessionId}`;
    socket.to(roomId).emit('webrtc-offer', {
      ...data,
      from: socketUser.userId
    });
  });

  socket.on('webrtc-answer', (data) => {
    if (!socketUser || !socketUser.sessionId) return;
    
    const roomId = `session-${socketUser.sessionId}`;
    socket.to(roomId).emit('webrtc-answer', {
      ...data,
      from: socketUser.userId
    });
  });

  socket.on('webrtc-ice-candidate', (data) => {
    if (!socketUser || !socketUser.sessionId) return;
    
    const roomId = `session-${socketUser.sessionId}`;
    socket.to(roomId).emit('webrtc-ice-candidate', {
      ...data,
      from: socketUser.userId
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socketUser && socketUser.sessionId) {
      const roomId = `session-${socketUser.sessionId}`;
      socket.to(roomId).emit('participant-left', {
        userId: socketUser.userId,
        userType: socketUser.userType
      });
    }
  });
}