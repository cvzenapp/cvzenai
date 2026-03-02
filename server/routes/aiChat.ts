import { Router, Request, Response } from "express";
import { z } from "zod";
import unifiedAuth from "../middleware/unifiedAuth.js";
import { aiService } from "../services/aiService.js";
import { aiMemoryService } from "../services/aiMemoryService.js";
import multer from 'multer';
import { fileProcessingService } from "../services/fileProcessingService.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory for processing
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types for resume analysis
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'));
    }
  }
});

// Validation schemas
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  type: z.enum(['general_chat', 'resume_analysis', 'career_advice', 'job_search', 'interview_prep']).optional(),
  usePremium: z.boolean().optional(),
  context: z.object({
    userProfile: z.object({
      skills: z.array(z.string()).optional(),
      experience: z.array(z.any()).optional(),
      location: z.string().optional(),
      jobTitle: z.string().optional(),
    }).optional(),
    resumeData: z.any().optional(),
    jobPreferences: z.any().optional(),
  }).optional(),
});

interface JobResult {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
  description: string;
  requirements: string[];
  matchScore: number;
  postedDate: string;
}

interface ResumeAdvice {
  type: 'improvement' | 'template' | 'section' | 'general';
  title: string;
  suggestions: string[];
  actionItems?: string[];
}

interface ChatResponse {
  success: boolean;
  response: {
    type: 'text' | 'jobs' | 'resume_advice' | 'analysis';
    content: string;
    jobResults?: JobResult[];
    resumeAdvice?: ResumeAdvice;
    analysis?: {
      strengths?: string[];
      improvements?: string[];
      score?: number;
      skillsExtracted?: string[];
      careerLevel?: string;
      industryFocus?: string[];
      roleTargets?: string[];
    };
    suggestions?: string[];
    actionItems?: string[];
    memoryUpdated?: boolean;
    contextUsed?: string[];
  };
}

// POST /api/ai-chat/message
router.post("/message", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = chatMessageSchema.parse(req.body);
    const { message, type = 'general_chat', usePremium = false, context } = validatedData;
    
    // Get user information for personalization
    const user = (req as any).user;
    
    // Fetch user's active resume for personalized context
    let activeResumeData = null;
    try {
      const { getDatabase } = await import('../database/connection.js');
      const db = await getDatabase();
      const resumeResult = await db.query(`
        SELECT * FROM resumes 
        WHERE user_id = $1 AND is_active = true 
        ORDER BY updated_at DESC LIMIT 1
      `, [user.id]);
      
      if (resumeResult.rows.length > 0) {
        const resume = resumeResult.rows[0];
        activeResumeData = {
          title: resume.title,
          summary: resume.summary || '',
          objective: resume.objective || '',
          skills: typeof resume.skills === 'string' ? JSON.parse(resume.skills) : (resume.skills || []),
          experience: typeof resume.experience === 'string' ? JSON.parse(resume.experience) : (resume.experience || []),
          education: typeof resume.education === 'string' ? JSON.parse(resume.education) : (resume.education || []),
          projects: typeof resume.projects === 'string' ? JSON.parse(resume.projects) : (resume.projects || []),
          certifications: typeof resume.certifications === 'string' ? JSON.parse(resume.certifications) : (resume.certifications || [])
        };
      }
    } catch (resumeError) {
      console.error('Error fetching active resume:', resumeError);
    }
    
    // Determine the type of AI request based on message content if not specified
    let aiType = type;
    if (type === 'general_chat') {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
        aiType = 'resume_analysis';
      } else if (lowerMessage.includes('career') || lowerMessage.includes('advice')) {
        aiType = 'career_advice';
      } else if (lowerMessage.includes('job') || lowerMessage.includes('search')) {
        aiType = 'job_search';
      } else if (lowerMessage.includes('interview')) {
        aiType = 'interview_prep';
      }
    }
    
    // Handle job search with Tavily
    if (aiType === 'job_search') {
      try {
        // Extract job search parameters from the message
        const jobParams = aiService.extractJobSearchParams(message);
        console.log('🔍 Extracted job search params:', jobParams);
        
        // Search for jobs using Tavily
        const jobs = await aiService.searchJobsWithTavily(jobParams);
        
        // Generate AI response with job results
        const aiResponse = await aiService.generateResponse({
          type: aiType,
          content: `Based on your search for "${jobParams.query}"${jobParams.location ? ` in ${jobParams.location}` : ''}, I found ${jobs.length} relevant job opportunities. Here's what I found:`,
          usePremium: usePremium,
          context: {
            userProfile: {
              ...context?.userProfile,
              userId: user?.id,
              email: user?.email
            },
            resumeData: activeResumeData || context?.resumeData,
            jobPreferences: context?.jobPreferences,
            userId: user?.id
          }
        });
        
        const chatResponse: ChatResponse = {
          success: true,
          response: {
            type: 'jobs',
            content: aiResponse.response,
            jobResults: jobs,
            suggestions: aiResponse.suggestions,
            actionItems: aiResponse.actionItems,
            memoryUpdated: aiResponse.memoryUpdated,
            contextUsed: aiResponse.contextUsed
          }
        };
        
        console.log(`✅ Job search completed - User ${user?.id}: Found ${jobs.length} jobs`);
        return res.json(chatResponse);
        
      } catch (jobSearchError) {
        console.error('Job search error:', jobSearchError);
        // Fall back to regular AI response if Tavily fails
      }
    }
    
    // Use AI service for intelligent responses with memory integration
    const aiResponse = await aiService.generateResponse({
      type: aiType,
      content: message,
      usePremium: usePremium,
      context: {
        userProfile: {
          ...context?.userProfile,
          userId: user?.id,
          email: user?.email
        },
        resumeData: activeResumeData || context?.resumeData,
        jobPreferences: context?.jobPreferences,
        userId: user?.id // Add userId for memory integration
      }
    });
    
    // Format response based on type
    let responseType: 'text' | 'jobs' | 'resume_analysis' | 'analysis' = 'text';
    let additionalData: any = {};
    
    if (aiType === 'resume_analysis' && aiResponse.analysis) {
      responseType = 'analysis';
      additionalData.analysis = aiResponse.analysis;
    }
    
    const chatResponse: ChatResponse = {
      success: true,
      response: {
        type: responseType,
        content: aiResponse.response,
        suggestions: aiResponse.suggestions,
        actionItems: aiResponse.actionItems,
        memoryUpdated: aiResponse.memoryUpdated,
        contextUsed: aiResponse.contextUsed,
        ...additionalData
      }
    };
    
    // Log the interaction (optional - for analytics)
    console.log(`AI Chat - User ${user?.id}: ${message} (Type: ${aiType}, Premium: ${usePremium}, Memory: ${aiResponse.memoryUpdated})`);
    
    res.json(chatResponse);
    
  } catch (error) {
    console.error("AI Chat error:", error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request format",
        errors: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to process your message. Please try again."
    });
  }
});

// POST /api/ai-chat/stream - Streaming chat endpoint
router.post("/stream", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = chatMessageSchema.parse(req.body);
    const { message, type = 'general_chat', usePremium = false, context } = validatedData;
    
    // Get user information for personalization
    const user = (req as any).user;
    
    // Fetch user's active resume for personalized context
    let activeResumeData = null;
    try {
      const { getDatabase } = await import('../database/connection.js');
      const db = await getDatabase();
      const resumeResult = await db.query(`
        SELECT * FROM resumes 
        WHERE user_id = $1 AND is_active = true 
        ORDER BY updated_at DESC LIMIT 1
      `, [user.id]);
      
      if (resumeResult.rows.length > 0) {
        const resume = resumeResult.rows[0];
        activeResumeData = {
          title: resume.title,
          summary: resume.summary || '',
          objective: resume.objective || '',
          skills: typeof resume.skills === 'string' ? JSON.parse(resume.skills) : (resume.skills || []),
          experience: typeof resume.experience === 'string' ? JSON.parse(resume.experience) : (resume.experience || []),
          education: typeof resume.education === 'string' ? JSON.parse(resume.education) : (resume.education || []),
          projects: typeof resume.projects === 'string' ? JSON.parse(resume.projects) : (resume.projects || []),
          certifications: typeof resume.certifications === 'string' ? JSON.parse(resume.certifications) : (resume.certifications || [])
        };
      }
    } catch (resumeError) {
      console.error('Error fetching active resume:', resumeError);
    }
    
    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stream connected' })}\n\n`);

    // Determine the type of AI request based on message content if not specified
    let aiType = type;
    if (type === 'general_chat') {
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
        aiType = 'resume_analysis';
      } else if (lowerMessage.includes('career') || lowerMessage.includes('advice')) {
        aiType = 'career_advice';
      } else if (lowerMessage.includes('job') || lowerMessage.includes('search')) {
        aiType = 'job_search';
      } else if (lowerMessage.includes('interview')) {
        aiType = 'interview_prep';
      }
    }

    try {
      // Send typing indicator
      res.write(`data: ${JSON.stringify({ type: 'typing', message: 'AI is thinking...' })}\n\n`);

      // Handle job search with Tavily
      if (aiType === 'job_search') {
        try {
          res.write(`data: ${JSON.stringify({ type: 'typing', message: 'Searching for jobs...' })}\n\n`);
          
          // Extract job search parameters from the message
          const jobParams = aiService.extractJobSearchParams(message);
          console.log('🔍 Extracted job search params:', jobParams);
          
          // Search for jobs using Tavily
          const jobs = await aiService.searchJobsWithTavily(jobParams);
          
          // Stream the job results
          res.write(`data: ${JSON.stringify({ 
            type: 'jobs',
            jobResults: jobs,
            content: `I found ${jobs.length} relevant job opportunities for you. Here are the details:`,
            isComplete: false
          })}\n\n`);
          
          // Generate AI commentary on the results
          await aiService.generateStreamingResponse({
            type: aiType,
            content: `Provide brief insights and recommendations for these ${jobs.length} job opportunities: ${jobs.slice(0, 3).map(j => j.title).join(', ')}`,
            usePremium: usePremium,
            context: {
              userProfile: {
                ...context?.userProfile,
                userId: user?.id,
                email: user?.email
              },
              resumeData: activeResumeData || context?.resumeData,
              jobPreferences: context?.jobPreferences,
              userId: user?.id
            }
          }, (chunk) => {
            res.write(`data: ${JSON.stringify({ 
              type: 'chunk', 
              content: chunk.content,
              isComplete: chunk.isComplete,
              suggestions: chunk.suggestions,
              actionItems: chunk.actionItems
            })}\n\n`);
          });
          
          // Send completion signal
          res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
          res.end();
          return;
          
        } catch (jobSearchError) {
          console.error('Job search error in streaming:', jobSearchError);
          // Fall back to regular streaming response
        }
      }

      // Use AI service for streaming response
      await aiService.generateStreamingResponse({
        type: aiType,
        content: message,
        usePremium: usePremium,
        context: {
          userProfile: {
            ...context?.userProfile,
            userId: user?.id,
            email: user?.email
          },
          resumeData: activeResumeData || context?.resumeData,
          jobPreferences: context?.jobPreferences,
          userId: user?.id
        }
      }, (chunk) => {
        // Stream each chunk as it's generated
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: chunk.content,
          isComplete: chunk.isComplete,
          suggestions: chunk.suggestions,
          actionItems: chunk.actionItems,
          analysis: chunk.analysis,
          memoryUpdated: chunk.memoryUpdated,
          contextUsed: chunk.contextUsed
        })}\n\n`);
      });

      // Send completion signal
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      
    } catch (error) {
      console.error("Streaming AI Chat error:", error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Failed to process your message. Please try again.' 
      })}\n\n`);
    }

    res.end();
    
  } catch (error) {
    console.error("AI Chat streaming error:", error);
    
    if (error instanceof z.ZodError) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: "Invalid request format",
        errors: error.errors
      }));
      return;
    }
    
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: "Failed to process your message. Please try again."
    }));
  }
});

// GET /api/ai-chat/suggestions
router.get("/suggestions", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Get user memory to personalize suggestions
    const userMemory = await aiMemoryService.getUserMemory(user.id);
    
    // Generate personalized quick action suggestions based on user profile
    const baseSuggestions = [
      {
        icon: 'Search',
        label: 'Find Jobs',
        query: 'Show me frontend developer jobs in San Francisco',
        category: 'job_search'
      },
      {
        icon: 'FileText',
        label: 'Resume Help',
        query: 'How can I improve my resume for tech jobs?',
        category: 'resume'
      },
      {
        icon: 'TrendingUp',
        label: 'Career Advice',
        query: 'What skills should I learn to advance my career?',
        category: 'career'
      },
      {
        icon: 'Briefcase',
        label: 'Interview Tips',
        query: 'Give me tips for technical interviews',
        category: 'interview'
      },
      {
        icon: 'DollarSign',
        label: 'Salary Guide',
        query: 'How should I negotiate my salary?',
        category: 'compensation'
      }
    ];
    
    // Personalize suggestions based on user memory
    let suggestions = [...baseSuggestions];
    
    if (userMemory) {
      // Customize job search suggestion based on user's target roles
      if (userMemory.jobTitles && userMemory.jobTitles.length > 0) {
        suggestions[0].query = `Show me ${userMemory.jobTitles[0]} jobs${userMemory.locations && userMemory.locations.length > 0 ? ` in ${userMemory.locations[0]}` : ''}`;
      }
      
      // Customize resume help based on career stage
      if (userMemory.careerStage) {
        suggestions[1].query = `How can I improve my resume as a ${userMemory.careerStage}-level professional?`;
      }
      
      // Customize career advice based on goals
      if (userMemory.careerGoals) {
        suggestions[2].query = `Given my goal of ${userMemory.careerGoals}, what should I focus on?`;
      }
      
      // Add industry-specific suggestions
      if (userMemory.industries && userMemory.industries.length > 0) {
        suggestions.push({
          icon: 'Target',
          label: `${userMemory.industries[0]} Trends`,
          query: `What are the latest trends in ${userMemory.industries[0]}?`,
          category: 'industry'
        });
      }
    }
    
    res.json({
      success: true,
      suggestions,
      userMemory: userMemory ? {
        careerStage: userMemory.careerStage,
        interactionCount: userMemory.interactionCount,
        lastInteraction: userMemory.updatedAt
      } : null
    });
    
  } catch (error) {
    console.error("AI Chat suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load suggestions"
    });
  }
});

// POST /api/ai-chat/analyze-resume
router.post("/analyze-resume", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const { resumeContent, resumeData, usePremium = false } = req.body;
    
    if (!resumeContent && !resumeData) {
      return res.status(400).json({
        success: false,
        message: "Resume content or data is required"
      });
    }
    
    const user = (req as any).user;
    
    // Analyze the resume using AI service with memory integration
    const analysis = await aiService.generateResponse({
      type: 'resume_analysis',
      content: `Please analyze this resume and provide detailed feedback:\n\n${resumeContent || JSON.stringify(resumeData)}`,
      usePremium: usePremium,
      context: {
        userProfile: {
          userId: user?.id,
          email: user?.email,
          userType: user?.userType
        },
        resumeData: resumeData,
        userId: user?.id // Add userId for memory integration
      }
    });
    
    res.json({
      success: true,
      response: {
        type: 'analysis',
        content: analysis.response,
        analysis: analysis.analysis,
        suggestions: analysis.suggestions,
        actionItems: analysis.actionItems,
        memoryUpdated: analysis.memoryUpdated,
        contextUsed: analysis.contextUsed
      }
    });
    
  } catch (error) {
    console.error("Resume analysis error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze resume. Please try again."
    });
  }
});

// GET /api/ai-chat/memory/profile
router.get("/memory/profile", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const userMemory = await aiMemoryService.getUserMemory(user.id);
    
    res.json({
      success: true,
      profile: userMemory
    });
    
  } catch (error) {
    console.error("Get user memory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load user profile memory"
    });
  }
});

// GET /api/ai-chat/memory/resumes
router.get("/memory/resumes", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const resumeMemories = await aiMemoryService.getUserResumeMemories(user.id);
    
    res.json({
      success: true,
      resumes: resumeMemories.map(resume => ({
        id: resume.id,
        analysisSummary: resume.analysisSummary,
        overallScore: resume.overallScore,
        careerLevel: resume.careerLevel,
        skillsExtracted: resume.skillsExtracted,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }))
    });
    
  } catch (error) {
    console.error("Get resume memories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load resume analysis history"
    });
  }
});

// GET /api/ai-chat/memory/sessions
router.get("/memory/sessions", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Get recent chat sessions (you'll need to add this method to aiMemoryService)
    // For now, let's get the active session and its history
    const activeSession = await aiMemoryService.getOrCreateActiveSession(user.id);
    const chatHistory = await aiMemoryService.getChatHistory(activeSession.id, 20);
    
    res.json({
      success: true,
      activeSession: {
        id: activeSession.id,
        sessionName: activeSession.sessionName,
        createdAt: activeSession.createdAt,
        updatedAt: activeSession.updatedAt
      },
      recentMessages: chatHistory.slice(-10) // Last 10 messages
    });
    
  } catch (error) {
    console.error("Get chat sessions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load chat history"
    });
  }
});

// POST /api/ai-chat/memory/context
router.post("/memory/context", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { contextType, contextKey, contextValue, importanceScore } = req.body;
    
    if (!contextType || !contextKey || !contextValue) {
      return res.status(400).json({
        success: false,
        message: "contextType, contextKey, and contextValue are required"
      });
    }
    
    const context = await aiMemoryService.saveContext(
      user.id,
      contextType,
      contextKey,
      contextValue,
      { importanceScore: importanceScore || 50 }
    );
    
    res.json({
      success: true,
      context: {
        id: context.id,
        contextType: context.contextType,
        contextKey: context.contextKey,
        importanceScore: context.importanceScore,
        createdAt: context.createdAt
      }
    });
    
  } catch (error) {
    console.error("Save context error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save context"
    });
  }
});

// GET /api/ai-chat/memory/contexts
router.get("/memory/contexts", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { type } = req.query;
    
    const contexts = await aiMemoryService.getUserContexts(user.id, type as string);
    
    res.json({
      success: true,
      contexts: contexts.map(ctx => ({
        id: ctx.id,
        contextType: ctx.contextType,
        contextKey: ctx.contextKey,
        contextValue: ctx.contextValue,
        importanceScore: ctx.importanceScore,
        usageCount: ctx.usageCount,
        lastUsed: ctx.lastUsed,
        createdAt: ctx.createdAt
      }))
    });
    
  } catch (error) {
    console.error("Get contexts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load contexts"
    });
  }
});

// POST /api/ai-chat/upload - File upload endpoint
router.post("/upload", unifiedAuth.requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const user = (req as any).user;
    const file = req.file;

    console.log(`File upload - User: ${user.id}, File: ${file.originalname}, Size: ${file.size}, Type: ${file.mimetype}`);

    // Process the file based on type
    let extractedText = '';
    
    try {
      extractedText = await fileProcessingService.extractTextFromFile(file.buffer, file.mimetype);
      extractedText = fileProcessingService.cleanText(extractedText);

      // Validate extracted text
      const validation = fileProcessingService.validateResumeContent(extractedText);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Get resume metadata
      const metadata = fileProcessingService.extractResumeMetadata(extractedText);

      // Generate a unique file ID for this upload
      const fileId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        success: true,
        fileId: fileId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        content: extractedText.substring(0, 1000), // Return first 1000 chars as preview
        fullContent: extractedText, // Full content for analysis
        metadata: metadata,
        message: 'File uploaded and processed successfully'
      });

    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      return res.status(400).json({
        success: false,
        error: 'Failed to extract text from file. Please ensure the file is not corrupted and contains readable text.'
      });
    }

  } catch (error) {
    console.error("File upload error:", error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File too large. Maximum size is 5MB.'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'File upload failed'
    });
  }
});

// POST /api/ai-chat/analyze-file - Analyze uploaded file
router.post("/analyze-file", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const { fileContent, fileName, analysisType = 'resume_analysis' } = req.body;
    
    if (!fileContent) {
      return res.status(400).json({
        success: false,
        error: 'File content is required'
      });
    }

    const user = (req as any).user;

    // Use AI service to analyze the file content
    const analysis = await aiService.generateResponse({
      type: analysisType as any,
      content: `Please analyze this resume file (${fileName}) and provide detailed feedback including ATS score, strengths, improvements, and recommendations:\n\n${fileContent}`,
      usePremium: false, // Can be made configurable
      context: {
        userProfile: {
          userId: user?.id,
          email: user?.email,
          userType: user?.userType
        },
        resumeData: {
          fileName: fileName,
          source: 'file_upload'
        },
        userId: user?.id
      }
    });

    res.json({
      success: true,
      analysis: {
        type: 'file_analysis',
        fileName: fileName,
        content: analysis.response,
        analysis: analysis.analysis,
        suggestions: analysis.suggestions,
        actionItems: analysis.actionItems,
        memoryUpdated: analysis.memoryUpdated,
        contextUsed: analysis.contextUsed
      }
    });

  } catch (error) {
    console.error("File analysis error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze file. Please try again."
    });
  }
});

// GET /api/ai-chat/sessions - Get all sessions for user
router.get("/sessions", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sessions = await aiMemoryService.getAllUserSessions(user.id, 'user');
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    res.status(500).json({ success: false, error: "Failed to load sessions" });
  }
});

// POST /api/ai-chat/sessions - Create new session
router.post("/sessions", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;
    const session = await aiMemoryService.createNewSession(user.id, 'user', name || 'New Chat');
    res.json({ success: true, session });
  } catch (error) {
    console.error("Create session error:", error);
    res.status(500).json({ success: false, error: "Failed to create session" });
  }
});

// PUT /api/ai-chat/sessions/:id/activate - Switch to session
router.put("/sessions/:id/activate", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sessionId = parseInt(req.params.id);
    await aiMemoryService.switchToSession(user.id, 'user', sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error("Switch session error:", error);
    res.status(500).json({ success: false, error: "Failed to switch session" });
  }
});

// DELETE /api/ai-chat/sessions/:id - Delete session
router.delete("/sessions/:id", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sessionId = parseInt(req.params.id);
    await aiMemoryService.deleteSession(user.id, 'user', sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    res.status(500).json({ success: false, error: "Failed to delete session" });
  }
});

// PUT /api/ai-chat/sessions/:id/name - Update session name
router.put("/sessions/:id/name", unifiedAuth.requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const sessionId = parseInt(req.params.id);
    const { name } = req.body;
    await aiMemoryService.updateSessionName(user.id, 'user', sessionId, name);
    res.json({ success: true });
  } catch (error) {
    console.error("Update session name error:", error);
    res.status(500).json({ success: false, error: "Failed to update session name" });
  }
});

export default router;