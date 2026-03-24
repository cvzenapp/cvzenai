-- Add duration_minutes column to mock_test_sessions if it doesn't exist
ALTER TABLE mock_test_sessions 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60;

-- Update existing sessions to have proper duration based on test level
UPDATE mock_test_sessions 
SET duration_minutes = CASE 
  WHEN test_level = 'basic' THEN 30
  WHEN test_level = 'moderate' THEN 45  
  WHEN test_level = 'complex' THEN 60
  ELSE 60
END
WHERE duration_minutes = 60; -- Only update default values