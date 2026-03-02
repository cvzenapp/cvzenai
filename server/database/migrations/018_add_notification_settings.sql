-- Add notification settings columns to recruiter_profiles table

ALTER TABLE recruiter_profiles 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS candidate_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS interview_reminders BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN recruiter_profiles.email_notifications IS 'Whether recruiter wants to receive email notifications';
COMMENT ON COLUMN recruiter_profiles.candidate_updates IS 'Whether recruiter wants notifications about candidate activity';
COMMENT ON COLUMN recruiter_profiles.interview_reminders IS 'Whether recruiter wants interview reminder notifications';
