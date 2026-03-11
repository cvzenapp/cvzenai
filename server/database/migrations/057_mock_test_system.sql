-- Mock Test System for Interview Preparation
-- This migration adds tables for AI-generated mock tests based on job descriptions and candidate profiles

-- Mock test sessions table
CREATE TABLE IF NOT EXISTS mock_test_sessions (
  id SERIAL PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interview_id INTEGER NOT NULL REFERENCES interview_invitations(id) ON DELETE CASCADE,
  
  -- Test configuration
  test_level VARCHAR(20) NOT NULL CHECK (test_level IN ('basic', 'moderate', 'complex')),
  job_description TEXT NOT NULL,
  candidate_resume TEXT NOT NULL,
  candidate_skills TEXT[] NOT NULL,
  
  -- Test metadata
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  candidate_score INTEGER DEFAULT 0,
  percentage_score DECIMAL(5,2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'in_progress', 'completed', 'expired')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Mock test questions table
CREATE TABLE IF NOT EXISTS mock_test_questions (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES mock_test_sessions(id) ON DELETE CASCADE,
  
  -- Question details
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'single_selection', 'objective', 'coding')),
  question_category VARCHAR(50), -- e.g., 'technical', 'behavioral', 'domain_specific'
  difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('basic', 'moderate', 'complex')),
  
  -- Options (for MCQ and single selection)
  options JSONB, -- Array of option objects: [{"id": "A", "text": "Option text", "is_correct": false}]
  
  -- Correct answer
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  
  -- Scoring
  points INTEGER NOT NULL DEFAULT 1,
  
  -- Question order
  question_order INTEGER NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mock test responses table (candidate answers)
CREATE TABLE IF NOT EXISTS mock_test_responses (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES mock_test_sessions(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES mock_test_questions(id) ON DELETE CASCADE,
  
  -- Response details
  candidate_answer TEXT,
  selected_options JSONB, -- For MCQ: array of selected option IDs
  
  -- Evaluation
  is_correct BOOLEAN DEFAULT FALSE,
  points_earned INTEGER DEFAULT 0,
  ai_feedback TEXT, -- AI-generated feedback for the answer
  
  -- Timestamps
  answered_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(session_id, question_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_candidate ON mock_test_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_interview ON mock_test_sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_status ON mock_test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_mock_test_sessions_level ON mock_test_sessions(test_level);

CREATE INDEX IF NOT EXISTS idx_mock_test_questions_session ON mock_test_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_questions_type ON mock_test_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_mock_test_questions_order ON mock_test_questions(session_id, question_order);

CREATE INDEX IF NOT EXISTS idx_mock_test_responses_session ON mock_test_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_mock_test_responses_question ON mock_test_responses(question_id);

-- Add comments for documentation
COMMENT ON TABLE mock_test_sessions IS 'Stores mock test sessions generated for interview preparation';
COMMENT ON TABLE mock_test_questions IS 'Stores AI-generated questions for mock tests';
COMMENT ON TABLE mock_test_responses IS 'Stores candidate responses to mock test questions';

COMMENT ON COLUMN mock_test_sessions.test_level IS 'Difficulty level: basic, moderate, complex';
COMMENT ON COLUMN mock_test_questions.question_type IS 'Type of question: mcq, single_selection, objective, coding';
COMMENT ON COLUMN mock_test_questions.options IS 'JSON array of options for MCQ/single selection questions';
COMMENT ON COLUMN mock_test_responses.selected_options IS 'JSON array of selected option IDs for MCQ questions';