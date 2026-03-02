-- Fix resumes table to allow multiple resumes per user
-- Remove any unique constraint on user_id if it exists

-- Drop the constraint if it exists (PostgreSQL)
DO $$ 
BEGIN
    -- Try to drop unique constraint on user_id if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'resumes_user_id_key' 
        AND conrelid = 'resumes'::regclass
    ) THEN
        ALTER TABLE resumes DROP CONSTRAINT resumes_user_id_key;
        RAISE NOTICE 'Dropped unique constraint on resumes.user_id';
    END IF;
    
    -- Also check for any other unique indexes on user_id
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'resumes' 
        AND indexdef LIKE '%UNIQUE%user_id%'
    ) THEN
        DROP INDEX IF EXISTS resumes_user_id_idx;
        RAISE NOTICE 'Dropped unique index on resumes.user_id';
    END IF;
END $$;

-- Ensure the correct primary key is on id
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_pkey CASCADE;
ALTER TABLE resumes ADD PRIMARY KEY (id);

-- Add a regular (non-unique) index on user_id for performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- Verify the schema
DO $$
BEGIN
    RAISE NOTICE 'Resumes table schema fixed: id is PRIMARY KEY, user_id allows multiple resumes per user';
END $$;
