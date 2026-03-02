-- Add recruiter_feedback column to job_applications table
-- This stores feedback from recruiters after completing interviews

DO $$ 
BEGIN
    -- Add recruiter_feedback column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'recruiter_feedback'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN recruiter_feedback TEXT;
        COMMENT ON COLUMN job_applications.recruiter_feedback IS 'Feedback from recruiter after interview completion';
    END IF;
END $$;
