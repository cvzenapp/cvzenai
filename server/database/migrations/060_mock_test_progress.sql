-- Mock Test Progress Tracking for Badge System
-- Tracks up to 3 attempts per level with score labels computed at display time

CREATE TABLE IF NOT EXISTS mock_test_progress (
  id SERIAL PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_id INTEGER REFERENCES interview_invitations(id) ON DELETE CASCADE, -- nullable for generic use
  test_level VARCHAR(20) NOT NULL CHECK (test_level IN ('basic', 'moderate', 'complex')),
  
  -- Attempt 1
  attempt_1_score DECIMAL(5,2),
  attempt_1_session_id INTEGER REFERENCES mock_test_sessions(id) ON DELETE SET NULL,
  attempt_1_completed_at TIMESTAMP,
  
  -- Attempt 2
  attempt_2_score DECIMAL(5,2),
  attempt_2_session_id INTEGER REFERENCES mock_test_sessions(id) ON DELETE SET NULL,
  attempt_2_completed_at TIMESTAMP,
  
  -- Attempt 3
  attempt_3_score DECIMAL(5,2),
  attempt_3_session_id INTEGER REFERENCES mock_test_sessions(id) ON DELETE SET NULL,
  attempt_3_completed_at TIMESTAMP,
  
  -- Computed fields (automatically calculated)
  best_score DECIMAL(5,2) GENERATED ALWAYS AS (
    GREATEST(
      COALESCE(attempt_1_score, 0),
      COALESCE(attempt_2_score, 0),
      COALESCE(attempt_3_score, 0)
    )
  ) STORED,
  
  current_attempts INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN attempt_3_score IS NOT NULL THEN 3
      WHEN attempt_2_score IS NOT NULL THEN 2
      WHEN attempt_1_score IS NOT NULL THEN 1
      ELSE 0
    END
  ) STORED,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create separate unique constraints for different cases
-- For records with interview_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_mock_test_progress_with_interview 
ON mock_test_progress(candidate_id, interview_id, test_level) 
WHERE interview_id IS NOT NULL;

-- For records without interview_id (generic tests)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mock_test_progress_without_interview 
ON mock_test_progress(candidate_id, test_level) 
WHERE interview_id IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mock_test_progress_candidate ON mock_test_progress(candidate_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_progress_interview ON mock_test_progress(interview_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_progress_level ON mock_test_progress(test_level);
CREATE INDEX IF NOT EXISTS idx_mock_test_progress_best_score ON mock_test_progress(best_score);

-- Comments for documentation
COMMENT ON TABLE mock_test_progress IS 'Tracks candidate progress across mock test levels with up to 3 attempts each';
COMMENT ON COLUMN mock_test_progress.interview_id IS 'Optional interview context - null for generic mock tests';
COMMENT ON COLUMN mock_test_progress.best_score IS 'Automatically computed highest score across all attempts';
COMMENT ON COLUMN mock_test_progress.current_attempts IS 'Automatically computed number of completed attempts';