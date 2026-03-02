-- Migration: Create recruiter_responses table for shortlist and like functionality
-- This table tracks recruiter interactions with candidates

CREATE TABLE IF NOT EXISTS recruiter_responses (
  id SERIAL PRIMARY KEY,
  recruiter_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  resume_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'viewed',
  message TEXT,
  upvotes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure unique combination of recruiter, user, and resume
  CONSTRAINT unique_recruiter_user_resume UNIQUE (recruiter_id, user_id, resume_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_recruiter_responses_recruiter ON recruiter_responses(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_responses_user ON recruiter_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_responses_resume ON recruiter_responses(resume_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_responses_status ON recruiter_responses(status);

-- Add some sample data for testing
INSERT INTO recruiter_responses (recruiter_id, user_id, resume_id, status, message) 
VALUES
(1, 53, 1, 'viewed', 'Profile viewed'),
(1, 54, 2, 'shortlisted', 'Interested candidate'),
(1, 55, 3, 'liked', 'Great profile')
ON CONFLICT (recruiter_id, user_id, resume_id) DO NOTHING;

-- Create activities table if it doesn't exist (for activity tracking)
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON activities(entity_type, entity_id);