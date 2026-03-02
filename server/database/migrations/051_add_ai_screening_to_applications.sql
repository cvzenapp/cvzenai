-- Add AI screening fields to job_applications table

-- Add ai_score column (0-100)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'ai_score'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100);
    END IF;
END $$;

-- Add ai_recommendation column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'ai_recommendation'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN ai_recommendation VARCHAR(50);
    END IF;
END $$;

-- Add ai_reasoning column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'ai_reasoning'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN ai_reasoning TEXT;
    END IF;
END $$;

-- Add ai_strengths column (JSON array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'ai_strengths'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN ai_strengths JSONB;
    END IF;
END $$;

-- Add ai_concerns column (JSON array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'ai_concerns'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN ai_concerns JSONB;
    END IF;
END $$;

-- Add ai_screened_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_applications' AND column_name = 'ai_screened_at'
    ) THEN
        ALTER TABLE job_applications ADD COLUMN ai_screened_at TIMESTAMP;
    END IF;
END $$;

-- Create index for ai_score for faster filtering
CREATE INDEX IF NOT EXISTS idx_job_applications_ai_score ON job_applications(ai_score DESC) WHERE ai_score IS NOT NULL;

-- Create index for ai_recommendation
CREATE INDEX IF NOT EXISTS idx_job_applications_ai_recommendation ON job_applications(ai_recommendation) WHERE ai_recommendation IS NOT NULL;

-- Add comment
COMMENT ON COLUMN job_applications.ai_score IS 'AI-generated match score (0-100)';
COMMENT ON COLUMN job_applications.ai_recommendation IS 'AI recommendation: Highly Recommended, Recommended, Maybe, Not Recommended';
COMMENT ON COLUMN job_applications.ai_reasoning IS 'AI explanation for the score and recommendation';
COMMENT ON COLUMN job_applications.ai_strengths IS 'JSON array of candidate strengths identified by AI';
COMMENT ON COLUMN job_applications.ai_concerns IS 'JSON array of concerns identified by AI';
COMMENT ON COLUMN job_applications.ai_screened_at IS 'Timestamp when AI screening was performed';
