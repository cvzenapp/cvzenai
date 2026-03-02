-- Migration: Add resume upvotes functionality (UUID version)
-- Fixed to use UUID for user_id to match users table

-- Create resume_upvotes table
CREATE TABLE IF NOT EXISTS resume_upvotes (
  id SERIAL PRIMARY KEY,
  resume_id INTEGER NOT NULL,
  user_id UUID,
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
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resumes' AND column_name = 'upvotes_count'
    ) THEN
        ALTER TABLE resumes ADD COLUMN upvotes_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing resumes to have upvotes_count = 0
UPDATE resumes SET upvotes_count = 0 WHERE upvotes_count IS NULL;

COMMENT ON TABLE resume_upvotes IS 'Tracks upvotes for resumes from users and anonymous visitors';
