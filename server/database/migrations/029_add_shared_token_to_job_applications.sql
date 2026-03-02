-- Add shared_token column to job_applications table
-- This allows recruiters to view candidate resumes via shareable links

ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS shared_token VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_shared_token ON job_applications(shared_token);

-- Add comment for documentation
COMMENT ON COLUMN job_applications.shared_token IS 'Unique slug for sharing candidate resume with recruiters (e.g., john-doe-a1b2)';
