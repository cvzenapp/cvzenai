-- Remove UNIQUE constraint from job_applications.shared_token
-- The same resume (share_token) can be used to apply to multiple jobs

-- Drop the unique constraint
ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_shared_token_key;

-- The index idx_job_applications_shared_token can remain for query performance
-- It's just a regular index, not a unique index

COMMENT ON COLUMN job_applications.shared_token IS 'Share token from resume_shares - not unique as same resume can apply to multiple jobs';
