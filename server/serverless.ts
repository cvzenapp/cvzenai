import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
dotenv.config();

// Import routes for serverless
import authRouter from "./routes/auth";
import aiChatRouter from "./routes/aiChat";
import { getDatabase, closeDatabase } from "./database/connection";

export function createServerlessApp() {
  const app = express();

  // Add request logging for debugging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
      headers: req.headers,
      query: req.query,
      body: req.body
    });
    next();
  });

  // Middleware
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000', 
      'http://localhost:8080',
      'https://cvzen.com',
      'https://www.cvzen.com',
      'https://cvzen.in',
      'https://www.cvzen.in',
      'https://cvzen.netlify.app',
      'https://main--cvzen.netlify.app',
      /https:\/\/.*--cvzen\.netlify\.app$/,
      /https:\/\/.*\.cvzen\.com$/,
      /https:\/\/.*\.cvzen\.in$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check endpoints
  app.get("/api/ping", (_req, res) => {
    res.json({ 
      message: "Hello from Serverless Express with AI!",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      features: ["auth", "ai-chat"]
    });
  });

  // AI Chat health check
  app.get("/api/ai-chat/health", (_req, res) => {
    res.json({
      success: true,
      message: "AI Chat service is available",
      localModel: {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.LOCAL_MODEL_NAME || 'phi3:mini'
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Simple test login endpoint to bypass auth router issues
  app.post("/api/test-login", (req, res) => {
    console.log('Test login endpoint hit:', req.body);
    res.json({
      success: true,
      message: "Test login endpoint working",
      body: req.body,
      timestamp: new Date().toISOString()
    });
  });

  // Debug endpoint to check if serverless function is working
  app.all("/api/debug", (req, res) => {
    res.json({
      success: true,
      message: "Serverless function is working!",
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body,
      query: req.query,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasOllamaUrl: !!process.env.OLLAMA_URL,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        isNetlify: !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)
      },
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/health", async (_req, res) => {
    try {
      const db = await getDatabase();
      const result = await db.query('SELECT 1 as test');
      
      if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        await closeDatabase(db);
      }
      
      res.json({ 
        status: "healthy",
        database: "connected",
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        test_query: result.rows[0],
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        features: ["auth", "ai-chat", "database"]
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ 
        status: "unhealthy",
        error: error.message,
        environment: process.env.NODE_ENV || "development",
        timestamp: new Date().toISOString(),
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET
      });
    }
  });

  // Simple auth test endpoint
  app.post("/api/auth/test", (req, res) => {
    console.log('Auth test endpoint hit:', req.body);
    res.json({
      success: true,
      message: "Auth test endpoint working",
      body: req.body,
      timestamp: new Date().toISOString()
    });
  });

  // Authentication routes
  app.use("/api/auth", authRouter);
  
  // AI Chat routes
  app.use("/api/ai-chat", aiChatRouter);

  // Catch-all for debugging
  app.use('*', (req, res) => {
    console.log('Catch-all route hit:', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      url: req.url
    });
    
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ 
        success: false, 
        error: 'API route not found',
        path: req.path,
        method: req.method,
        originalUrl: req.originalUrl,
        availableRoutes: ['/api/ping', '/api/health', '/api/auth/*', '/api/ai-chat/*']
      });
    } else {
      // For non-API routes, return a simple response instead of HTML
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        message: 'This is a serverless API function, not a web page'
      });
    }
  });

  return app;
}