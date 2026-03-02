-- Remove duplicate unique constraint on resumes.id
-- The id column should only have PRIMARY KEY constraint, not an additional UNIQUE constraint

DO $ 
BEGIN
    -- Drop resumes_id_unique constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'resumes_id_unique' 
        AND conrelid = 'resumes'::regclass
    ) THEN
        ALTER TABLE resumes DROP CONSTRAINT resumes_id_unique;
        RAISE NOTICE 'Dropped resumes_id_unique constraint';
    END IF;
    
    -- Ensure primary key exists on id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'resumes_pkey' 
        AND conrelid = 'resumes'::regclass
    ) THEN
        ALTER TABLE resumes ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key on resumes.id';
    END IF;
END $;
