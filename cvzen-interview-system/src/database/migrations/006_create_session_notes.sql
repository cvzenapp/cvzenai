-- Session Notes Table
CREATE TABLE IF NOT EXISTS session_notes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL,
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('recruiter', 'candidate')),
    note_type VARCHAR(20) DEFAULT 'general' CHECK (note_type IN ('general', 'technical', 'behavioral', 'feedback')),
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_notes_session ON session_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_author ON session_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_session_notes_type ON session_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_session_notes_timestamp ON session_notes(timestamp);

-- Update timestamp trigger for notes
CREATE TRIGGER update_session_notes_updated_at 
    BEFORE UPDATE ON session_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();