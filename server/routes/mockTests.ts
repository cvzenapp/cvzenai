import express from 'express';
import { MockTestService } from '../services/mockTestService';
import { requireAuth } from '../middleware/unifiedAuth';

export function createMockTestRoutes() {
  const router = express.Router();
  const mockTestService = new MockTestService();

  // Generate a new mock test
  router.post('/generate', requireAuth, async (req, res) => {
    try {
      const { interviewId, testLevel } = req.body;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!interviewId || !testLevel) {
        return res.status(400).json({ 
          error: 'Interview ID and test level are required' 
        });
      }

      if (!['basic', 'moderate', 'complex'].includes(testLevel)) {
        return res.status(400).json({ 
          error: 'Invalid test level. Must be basic, moderate, or complex' 
        });
      }

      // Check if user has already reached maximum attempts for this level
      const progress = await mockTestService.getMockTestProgress(
        candidateId,
        parseInt(interviewId) === 0 ? null : parseInt(interviewId)
      );
      
      const levelProgress = progress.find(p => p.testLevel === testLevel);
      if (levelProgress && levelProgress.currentAttempts >= 3) {
        return res.status(400).json({ 
          error: `Maximum attempts (3) reached for ${testLevel} level` 
        });
      }

      const session = await mockTestService.generateMockTest(
        candidateId,
        parseInt(interviewId),
        testLevel
      );

      res.json({
        success: true,
        session
      });

    } catch (error: any) {
      console.error('Error generating mock test:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to generate mock test' 
      });
    }
  });

  // Get mock test session details
  router.get('/session/:sessionId', requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const session = await mockTestService.getMockTestSession(
        parseInt(sessionId),
        candidateId
      );

      if (!session) {
        return res.status(404).json({ error: 'Mock test session not found' });
      }

      res.json({
        success: true,
        session
      });

    } catch (error: any) {
      console.error('Error fetching mock test session:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch mock test session' 
      });
    }
  });

  // Get next question for dynamic generation
  router.get('/session/:sessionId/next-question', requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const questionData = await mockTestService.getNextQuestion(
        parseInt(sessionId),
        candidateId
      );

      res.json({
        success: true,
        ...questionData
      });

    } catch (error: any) {
      console.error('Error getting next question:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get next question' 
      });
    }
  });

  // Get mock test questions
  router.get('/session/:sessionId/questions', requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Verify session belongs to candidate
      const session = await mockTestService.getMockTestSession(
        parseInt(sessionId),
        candidateId
      );

      if (!session) {
        return res.status(404).json({ error: 'Mock test session not found' });
      }

      const questions = await mockTestService.getMockTestQuestions(parseInt(sessionId));

      // Don't send correct answers and explanations until test is completed
      const sanitizedQuestions = questions.map(q => ({
        id: q.id,
        sessionId: q.sessionId,
        questionText: q.questionText,
        questionType: q.questionType,
        questionCategory: q.questionCategory,
        difficultyLevel: q.difficultyLevel,
        options: q.options ? q.options.map(opt => ({
          id: opt.id,
          text: opt.text
          // Don't include isCorrect
        })) : undefined,
        points: q.points,
        questionOrder: q.questionOrder
      }));

      res.json({
        success: true,
        questions: sanitizedQuestions
      });

    } catch (error: any) {
      console.error('Error fetching mock test questions:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch mock test questions' 
      });
    }
  });

  // Submit answer to a question
  router.post('/session/:sessionId/answer', requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { questionId, answer } = req.body;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!questionId || answer === undefined || answer === null) {
        return res.status(400).json({ 
          error: 'Question ID and answer are required' 
        });
      }

      const response = await mockTestService.submitAnswer(
        parseInt(sessionId),
        parseInt(questionId),
        candidateId,
        answer
      );

      res.json({
        success: true,
        response: {
          id: response.id,
          questionId: response.questionId,
          isCorrect: response.isCorrect,
          pointsEarned: response.pointsEarned,
          answeredAt: response.answeredAt
        }
      });

    } catch (error: any) {
      console.error('Error submitting answer:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to submit answer' 
      });
    }
  });

  // Complete mock test and get results
  router.post('/session/:sessionId/complete', requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const session = await mockTestService.completeMockTest(
        parseInt(sessionId),
        candidateId
      );

      res.json({
        success: true,
        session
      });

    } catch (error: any) {
      console.error('Error completing mock test:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to complete mock test' 
      });
    }
  });

  // Get mock test results (only after completion)
  router.get('/session/:sessionId/results', requireAuth, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const data = await mockTestService.getMockTestResults(
        parseInt(sessionId),
        candidateId
      );

      if (data.session.status !== 'completed') {
        return res.status(400).json({ 
          error: 'Mock test must be completed to view results' 
        });
      }

      res.json({
        success: true,
        results: data.results // Return the formatted results object
      });

    } catch (error: any) {
      console.error('Error fetching mock test results:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch mock test results' 
      });
    }
  });

  // Get candidate's mock test history
  router.get('/my-tests', requireAuth, async (req, res) => {
    try {
      const candidateId = req.user?.id;
      const { interviewId } = req.query;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const tests = await mockTestService.getCandidateMockTests(
        candidateId,
        interviewId ? parseInt(interviewId as string) : undefined
      );

      res.json({
        success: true,
        tests
      });

    } catch (error: any) {
      console.error('Error fetching candidate mock tests:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch mock tests' 
      });
    }
  });

  // Get available test levels for an interview
  router.get('/interview/:interviewId/levels', requireAuth, async (req, res) => {
    try {
      const { interviewId } = req.params;
      const candidateId = req.user?.id;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get progress for this interview to determine attempts
      const progress = await mockTestService.getMockTestProgress(
        candidateId,
        parseInt(interviewId)
      );

      // Get existing tests for this interview
      const existingTests = await mockTestService.getCandidateMockTests(
        candidateId,
        parseInt(interviewId)
      );

      // Create progress map for easy lookup
      const progressMap = new Map(progress.map(p => [p.testLevel, p]));

      const availableLevels = ['basic', 'moderate', 'complex'].map(level => {
        const levelProgress = progressMap.get(level as any);
        const hasAttempts = levelProgress && levelProgress.currentAttempts > 0;
        const canRetake = !levelProgress || levelProgress.currentAttempts < 3;
        
        console.log(`[MOCK TEST] Level ${level}: hasAttempts=${hasAttempts}, canRetake=${canRetake}, currentAttempts=${levelProgress?.currentAttempts || 0}`);
        
        return {
          level,
          completed: hasAttempts,
          available: canRetake, // Always available if under 3 attempts
          attempts: levelProgress?.currentAttempts || 0,
          bestScore: levelProgress?.bestScore || 0,
          attempt1Score: levelProgress?.attempt1Score || null,
          attempt2Score: levelProgress?.attempt2Score || null,
          attempt3Score: levelProgress?.attempt3Score || null
        };
      });

      res.json({
        success: true,
        levels: availableLevels,
        existingTests: existingTests.map(test => ({
          id: test.id,
          testLevel: test.testLevel,
          status: test.status,
          percentageScore: test.percentageScore,
          createdAt: test.createdAt,
          completedAt: test.completedAt
        }))
      });

    } catch (error: any) {
      console.error('Error fetching test levels:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to fetch test levels' 
      });
    }
  });

  // Get mock test progress for candidate
  router.get('/progress', requireAuth, async (req, res) => {
    try {
      const candidateId = req.user?.id;
      const { interviewId } = req.query;

      if (!candidateId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const progress = await mockTestService.getMockTestProgress(
        candidateId,
        interviewId ? parseInt(interviewId as string) : undefined
      );

      res.json({
        success: true,
        progress
      });

    } catch (error: any) {
      console.error('Error getting mock test progress:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get mock test progress' 
      });
    }
  });

  return router;
}