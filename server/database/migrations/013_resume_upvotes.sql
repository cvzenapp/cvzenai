-- Migration: Add resume upvotes functionality
-- Created: 2024-11-14

-- Create resume_upvotes table
CREATE TABLE IF NOT EXISTS resume_upvotes (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL,
  user_id INTEGER,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_upvotes_resume_id ON resume_upvotes(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_upvotes_ip ON resume_upvotes(ip_address);
CREATE UNIQUE INDEX IF NOT EXISTS idx_resume_upvotes_unique ON resume_upvotes(resume_id, ip_address);

-- Add upvotes_count column to resumes table if it doesn't exist
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS upvotes_count INTEGER DEFAULT 0;

-- Update existing resumes to have upvotes_count = 0
UPDATE resumes SET upvotes_count = 0 WHERE upvotes_count IS NULL;
