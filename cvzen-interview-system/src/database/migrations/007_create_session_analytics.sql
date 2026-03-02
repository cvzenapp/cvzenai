-- Session Analytics Table
CREATE TABLE IF NOT EXISTS session_analytics (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
    participant_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_analytics_session ON session_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_participant ON session_analytics(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_analytics_event ON session_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_session_analytics_timestamp ON session_analytics(timestamp);

-- Index for event data queries
CREATE INDEX IF NOT EXISTS idx_session_analytics_event_data ON session_analytics USING GIN (event_data);