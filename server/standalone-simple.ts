import express from "express";
import cors from "cors";
import jwt from 'jsonwebtoken';
import type { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Simple auth middleware
function authenticateUser(req: Request): { userId: number; userType: string } | null {
  const token = req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.userId) {
      return {
        userId: parseInt(decoded.userId),
        userType: decoded.type || 'job_seeker'
      };
    }
    return null;
  } catch (error) {
    console.error("JWT verification failed:", error.message);
    return null;
  }
}

// Interview routes
app.get("/api/interviews/my-interviews", (req: Request, res: Response) => {
  const auth = authenticateUser(req);
  
  if (!auth) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  console.log('✅ Interview auth successful:', { userId: auth.userId, userType: auth.userType });

  // Return mock data
  const mockInterviews = auth.userType === 'recruiter' ? [
    {
      id: 1,
      recruiterId: auth.userId,
      candidateId: 2,
      resumeId: 1,
      title: "Frontend Developer Interview",
      description: "Technical interview for React developer position",
      interviewType: "video_call",
      proposedDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      timezone: "UTC",
      meetingLink: "https://meet.google.com/abc-def-ghi",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      candidate: {
        id: 2,
        name: "Alex Morgan",
        email: "john@example.com"
      },
      resume: {
        id: 1,
        title: "John's Resume"
      }
    }
  ] : [
    {
      id: 1,
      recruiterId: 2,
      candidateId: auth.userId,
      resumeId: 1,
      title: "Frontend Developer Interview",
      description: "Technical interview for React developer position",
      interviewType: "video_call",
      proposedDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      timezone: "UTC",
      meetingLink: "https://meet.google.com/abc-def-ghi",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recruiter: {
        id: 2,
        name: "Tech Recruiter",
        email: "recruiter@company.com",
        company: "Tech Company Inc"
      },
      resume: {
        id: 1,
        title: "My Resume"
      }
    }
  ];

  res.json({
    success: true,
    data: mockInterviews,
    message: `Mock data for ${auth.userType} user ${auth.userId}`
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🎯 Interviews endpoint: http://localhost:${PORT}/api/interviews/my-interviews`);
});