-- Session Recordings Table
CREATE TABLE IF NOT EXISTS session_recordings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
    recording_type VARCHAR(20) NOT NULL CHECK (recording_type IN ('audio', 'video', 'screen')),
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    format VARCHAR(10) CHECK (format IN ('webm', 'mp4', 'wav', 'mp3')),
    quality VARCHAR(20) CHECK (quality IN ('low', 'medium', 'high')),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_recordings_session ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_type ON session_recordings(recording_type);
CREATE INDEX IF NOT EXISTS idx_session_recordings_status ON session_recordings(status);
CREATE INDEX IF NOT EXISTS idx_session_recordings_started ON session_recordings(started_at);