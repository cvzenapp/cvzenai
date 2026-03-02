-- Session Participants Table
CREATE TABLE IF NOT EXISTS session_participants (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('recruiter', 'candidate')),
    display_name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    connection_status VARCHAR(20) DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'reconnecting')),
    audio_enabled BOOLEAN DEFAULT true,
    video_enabled BOOLEAN DEFAULT true,
    screen_sharing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_status ON session_participants(connection_status);

-- Unique constraint to prevent duplicate participants
CREATE UNIQUE INDEX IF NOT EXISTS idx_session_participants_unique 
    ON session_participants(session_id, user_id) 
    WHERE left_at IS NULL;