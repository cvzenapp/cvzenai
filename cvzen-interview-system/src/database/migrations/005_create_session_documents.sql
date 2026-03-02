-- Session Documents Table
CREATE TABLE IF NOT EXISTS session_documents (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES interview_sessions(id) ON DELETE CASCADE,
    uploaded_by INTEGER NOT NULL,
    uploader_type VARCHAR(20) NOT NULL CHECK (uploader_type IN ('recruiter', 'candidate')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) CHECK (document_type IN ('resume', 'portfolio', 'test', 'other')),
    is_shared BOOLEAN DEFAULT true,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_documents_session ON session_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_session_documents_uploader ON session_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_session_documents_type ON session_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_session_documents_uploaded ON session_documents(uploaded_at);