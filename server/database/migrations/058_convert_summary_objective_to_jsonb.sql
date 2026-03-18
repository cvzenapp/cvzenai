-- Migration: Convert summary and objective columns to JSONB for optimization tracking
-- This allows storing original text + optimized text + optimization status

-- Step 1: Add temporary JSONB columns
ALTER TABLE resumes ADD COLUMN summary_new JSONB;
ALTER TABLE resumes ADD COLUMN objective_new JSONB;

-- Step 2: Migrate existing data to new JSONB format
UPDATE resumes SET 
  summary_new = CASE 
    WHEN summary IS NOT NULL AND summary != '' THEN 
      jsonb_build_object(
        'content', summary,
        'content_optimized', null,
        'is_optimized', false
      )
    ELSE NULL
  END,
  objective_new = CASE 
    WHEN objective IS NOT NULL AND objective != '' THEN 
      jsonb_build_object(
        'content', objective,
        'content_optimized', null,
        'is_optimized', false
      )
    ELSE NULL
  END;

-- Step 3: Drop old columns and rename new ones
ALTER TABLE resumes DROP COLUMN summary;
ALTER TABLE resumes DROP COLUMN objective;
ALTER TABLE resumes RENAME COLUMN summary_new TO summary;
ALTER TABLE resumes RENAME COLUMN objective_new TO objective;

-- Step 4: Add indexes for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_resumes_summary_optimized ON resumes USING GIN ((summary->'is_optimized'));
CREATE INDEX IF NOT EXISTS idx_resumes_objective_optimized ON resumes USING GIN ((objective->'is_optimized'));

-- Step 5: Add comments for documentation
COMMENT ON COLUMN resumes.summary IS 'JSONB containing: content (original), content_optimized (AI-optimized), is_optimized (boolean)';
COMMENT ON COLUMN resumes.objective IS 'JSONB containing: content (original), content_optimized (AI-optimized), is_optimized (boolean)';