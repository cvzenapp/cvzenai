-- Add is_active column to resumes table
-- Only one resume per user should be active at a time

ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_resumes_user_active ON resumes(user_id, is_active);

-- Set the most recently updated resume as active for each user
-- and mark others as inactive
WITH ranked_resumes AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM resumes
)
UPDATE resumes
SET is_active = CASE 
  WHEN id IN (SELECT id FROM ranked_resumes WHERE rn = 1) THEN true
  ELSE false
END;

COMMENT ON COLUMN resumes.is_active IS 'Indicates if this is the active/primary resume for the user';
