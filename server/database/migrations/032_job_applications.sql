-- Update job_applications table with missing columns from remote server
-- The table was created in migration 011, this adds the missing columns

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add shared_token column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'shared_token'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN shared_token VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- Create index for shared_token if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_job_applications_shared_token ON job_applications(shared_token);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS job_applications_updated_at_trigger ON job_applications;
CREATE TRIGGER job_applications_updated_at_trigger
    BEFORE UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_job_applications_updated_at();

-- Add comment to table
COMMENT ON TABLE job_applications IS 'Stores job applications from candidates to job postings';
