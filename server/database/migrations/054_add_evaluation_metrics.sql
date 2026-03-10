-- Add evaluation metrics column to interview_invitations table
-- This will store evaluation points as JSON with scoring capability

ALTER TABLE interview_invitations 
ADD COLUMN evaluation_metrics JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on JSON queries
CREATE INDEX idx_interview_invitations_evaluation_metrics 
ON interview_invitations USING GIN (evaluation_metrics);

-- Add comment to explain the column
COMMENT ON COLUMN interview_invitations.evaluation_metrics IS 
'JSON array of evaluation metrics with scoring: [{"id": 1, "metric": "Technical skills", "score": null, "checked": true}]';