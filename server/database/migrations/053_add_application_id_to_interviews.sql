-- Add application_id and interview_round to interview_invitations table
-- This allows us to directly link interviews to job applications and track rounds

ALTER TABLE interview_invitations 
ADD COLUMN application_id INTEGER REFERENCES job_applications(id);

ALTER TABLE interview_invitations 
ADD COLUMN interview_round INTEGER DEFAULT 1 CHECK (interview_round >= 1 AND interview_round <= 10);

ALTER TABLE interview_invitations 
ADD COLUMN interview_round_type VARCHAR(100);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_interview_invitations_application 
  ON interview_invitations(application_id);

CREATE INDEX IF NOT EXISTS idx_interview_invitations_round 
  ON interview_invitations(interview_round);

-- Add comments
COMMENT ON COLUMN interview_invitations.application_id IS 'Reference to the job application this interview is for';
COMMENT ON COLUMN interview_invitations.interview_round IS 'Interview round number (1, 2, 3, etc.)';
COMMENT ON COLUMN interview_invitations.interview_round_type IS 'Type of interview round (Technical, HR, Coding, etc.)';