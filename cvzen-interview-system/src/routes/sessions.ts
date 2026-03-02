import { Router } from 'express';
import { sessionController } from '../controllers/sessionController';
import { authenticateToken, requireRecruiter, requireAnyUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Session Management Routes
router.post('/create', 
  authenticateToken, 
  requireRecruiter, 
  asyncHandler(sessionController.createSession)
);

router.get('/:sessionId', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.getSession)
);

router.put('/:sessionId/start', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.startSession)
);

router.put('/:sessionId/end', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.endSession)
);

router.get('/by-cvzen-id/:cvzenInterviewId', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.getSessionByCvzenId)
);

// Participant Management Routes
router.post('/:sessionId/join', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.joinSession)
);

router.delete('/:sessionId/leave', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.leaveSession)
);

router.get('/:sessionId/participants', 
  authenticateToken, 
  requireAnyUser, 
  asyncHandler(sessionController.getParticipants)
);

export default router;