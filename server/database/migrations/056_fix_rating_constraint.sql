-- Fix rating constraint to allow NULL values and change to DECIMAL type
-- This allows feedback to be stored even when no rating is provided
-- and supports decimal ratings like 7.5, 8.2, etc.

ALTER TABLE interview_feedback 
DROP CONSTRAINT IF EXISTS interview_feedback_rating_check;

-- Change rating column from INTEGER to DECIMAL(3,1) to support one decimal place
ALTER TABLE interview_feedback 
ALTER COLUMN rating TYPE DECIMAL(3,1);

-- Add updated constraint for decimal ratings
ALTER TABLE interview_feedback 
ADD CONSTRAINT interview_feedback_rating_check 
CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 10.0));

-- Update comment to reflect that rating can be NULL and is decimal
COMMENT ON COLUMN interview_feedback.rating IS 'Overall interview rating from 1.0-10.0 (decimal), can be NULL if no rating provided';