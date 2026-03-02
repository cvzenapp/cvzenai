-- Session Chat Table
CREATE TABLE IF NOT EXISTS session_chat (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('recruiter', 'candidate', 'system')),
    sender_name VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
    content TEXT NOT NULL,
    file_url VARCHAR(500),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_chat_session ON session_chat(session_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_sender ON session_chat(sender_id);
CREATE INDEX IF NOT EXISTS idx_session_chat_timestamp ON session_chat(timestamp);
CREATE INDEX IF NOT EXISTS idx_session_chat_type ON session_chat(message_type);