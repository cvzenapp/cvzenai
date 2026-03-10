-- Simplify interview_feedback table structure
-- Drop unnecessary columns and keep only essential ones

-- First, backup any existing data (optional)
-- CREATE TABLE interview_feedback_backup AS SELECT * FROM interview_feedback;

-- Drop the existing table and recreate with simplified structure
DROP TABLE IF EXISTS interview_feedback CASCADE;

-- Create simplified interview_feedback table
CREATE TABLE interview_feedback (
  id SERIAL PRIMARY KEY,
  interview_id INTEGER NOT NULL REFERENCES interview_invitations(id) ON DELETE CASCADE,
  provided_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) CHECK (rating >= 1.0 AND rating <= 10.0), -- Overall rating out of 10 with one decimal place
  feedback_text TEXT,
  hiring_status VARCHAR(20) CHECK (hiring_status IN ('hired', 'rejected', 'hold')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interview_feedback_interview_id ON interview_feedback(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_provided_by ON interview_feedback(provided_by);
CREATE INDEX IF NOT EXISTS idx_interview_feedback_hiring_status ON interview_feedback(hiring_status);

-- Add comments for documentation
COMMENT ON TABLE interview_feedback IS 'Simplified interview feedback from recruiters';
COMMENT ON COLUMN interview_feedback.rating IS 'Overall interview rating from 1.0-10.0 with one decimal place';
COMMENT ON COLUMN interview_feedback.hiring_status IS 'Final hiring decision: hired, rejected, or hold';
COMMENT ON COLUMN interview_feedback.feedback_text IS 'Recruiter feedback text for the candidate';