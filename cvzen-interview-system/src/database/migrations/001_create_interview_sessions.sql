-- Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY,
    cvzen_interview_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    recruiter_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    room_id VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_cvzen_id ON interview_sessions(cvzen_interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_recruiter ON interview_sessions(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_room_id ON interview_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_token ON interview_sessions(session_token);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON interview_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();