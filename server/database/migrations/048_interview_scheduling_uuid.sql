-- Interview Scheduling System (UUID version)
-- This migration adds tables for interview scheduling between recruiters and candidates

-- Interview invitations table
CREATE TABLE IF NOT EXISTS interview_invitations (
  id SERIAL PRIMARY KEY,
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  job_posting_id INTEGER REFERENCES job_postings(id) ON DELETE SET NULL,
  
  -- Interview details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  interview_type VARCHAR(50) DEFAULT 'video_call', -- 'video_call', 'phone', 'in_person', 'technical'
  
  -- Scheduling
  proposed_datetime TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  timezone VARCHAR(100) DEFAULT 'UTC',
  
  -- Meeting details
  meeting_link VARCHAR(500),
  meeting_location TEXT,
  meeting_instructions TEXT,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'rescheduled', 'completed', 'cancelled'
  candidate_response TEXT,
  recruiter_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(recruiter_id, candidate_id, resume_id, proposed_datetime)
);

-- Interview reschedule requests table
CREATE TABLE IF NOT EXISTS interview_reschedule_requests (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interview_invitations(id) ON DELETE CASCADE,
  requested_by VARCHAR(50) NOT NULL, -- 'recruiter' or 'candidate'
  
  -- New proposed time
  new_proposed_datetime TIMESTAMP NOT NULL,
  new_duration_minutes INTEGER,
  reason TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  response_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

-- Interview feedback table (for post-interview notes)
CREATE TABLE IF NOT EXISTS interview_feedback (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interview_invitations(id) ON DELETE CASCADE,
  provided_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Feedback content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
  
  feedback_text TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  
  -- Decision
  recommendation VARCHAR(50), -- 'hire', 'no_hire', 'maybe', 'next_round'
  next_steps TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_invitations_recruiter ON interview_invitations(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_invitations_candidate ON interview_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_invitations_resume ON interview_invitations(resume_id);
CREATE INDEX IF NOT EXISTS idx_interview_invitations_status ON interview_invitations(status);
CREATE INDEX IF NOT EXISTS idx_interview_invitations_datetime ON interview_invitations(proposed_datetime);

CREATE INDEX IF NOT EXISTS idx_reschedule_requests_interview ON interview_reschedule_requests(interview_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_requests_status ON interview_reschedule_requests(status);

CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_provider ON interview_feedback(provided_by);

-- Add comments for documentation
COMMENT ON TABLE interview_invitations IS 'Stores interview invitations sent by recruiters to candidates';
COMMENT ON TABLE interview_reschedule_requests IS 'Handles requests to reschedule interviews';
COMMENT ON TABLE interview_feedback IS 'Stores post-interview feedback and ratings';

COMMENT ON COLUMN interview_invitations.interview_type IS 'Type of interview: video_call, phone, in_person, technical';
COMMENT ON COLUMN interview_invitations.status IS 'Current status: pending, accepted, declined, rescheduled, completed, cancelled';
COMMENT ON COLUMN interview_reschedule_requests.requested_by IS 'Who requested the reschedule: recruiter or candidate';
COMMENT ON COLUMN interview_feedback.recommendation IS 'Final recommendation: hire, no_hire, maybe, next_round';
