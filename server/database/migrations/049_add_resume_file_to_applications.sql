-- Add resume file URL column to job_applications table
-- This allows candidates to upload a resume file when applying

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'resume_file_url'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN resume_file_url TEXT;
    END IF;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_applications_resume_file ON job_applications(resume_file_url) WHERE resume_file_url IS NOT NULL;

-- Add comment
COMMENT ON COLUMN job_applications.resume_file_url IS 'URL to uploaded resume file (PDF, DOC, DOCX)';
