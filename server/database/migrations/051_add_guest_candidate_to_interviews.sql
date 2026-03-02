-- Add support for guest candidates in interview invitations
-- Guest candidates don't have user accounts but can still be invited to interviews

ALTER TABLE interview_invitations
  -- Make candidate_id nullable to support guest candidates
  ALTER COLUMN candidate_id DROP NOT NULL,
  
  -- Make resume_id nullable to support guest candidates (who may not have resumes in our system)
  ALTER COLUMN resume_id DROP NOT NULL,
  
  -- Add guest candidate fields
  ADD COLUMN IF NOT EXISTS guest_candidate_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS guest_candidate_email VARCHAR(255),
  
  -- Add constraint to ensure either candidate_id OR guest fields are present
  ADD CONSTRAINT check_candidate_or_guest 
    CHECK (
      (candidate_id IS NOT NULL AND guest_candidate_name IS NULL AND guest_candidate_email IS NULL) OR
      (candidate_id IS NULL AND guest_candidate_name IS NOT NULL AND guest_candidate_email IS NOT NULL)
    );

-- Add index for guest candidate email lookups
CREATE INDEX IF NOT EXISTS idx_interview_invitations_guest_email 
  ON interview_invitations(guest_candidate_email) 
  WHERE guest_candidate_email IS NOT NULL;

-- Add comment
COMMENT ON COLUMN interview_invitations.guest_candidate_name IS 'Name of guest candidate (for candidates without CVZen accounts)';
COMMENT ON COLUMN interview_invitations.guest_candidate_email IS 'Email of guest candidate (for candidates without CVZen accounts)';
