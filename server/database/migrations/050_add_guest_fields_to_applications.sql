-- Add guest application fields to job_applications table
ALTER TABLE job_applications 
ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS guest_email VARCHAR(255);

-- Make user_id and resume_id nullable for guest applications
ALTER TABLE job_applications 
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN resume_id DROP NOT NULL;

-- Add check constraint to ensure either user_id or guest_email is present
ALTER TABLE job_applications
ADD CONSTRAINT check_user_or_guest CHECK (
  (user_id IS NOT NULL) OR (guest_email IS NOT NULL)
);
