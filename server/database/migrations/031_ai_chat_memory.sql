-- AI Chat Memory System
-- Stores conversation history, resume analysis, and contextual memory

-- Chat sessions table - groups related conversations
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'user', -- 'user' or 'recruiter'
    session_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Individual chat messages
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    user_id UUID NOT NULL,
    
    -- Message content
    message_type TEXT NOT NULL DEFAULT 'user', -- 'user' or 'assistant'
    content TEXT NOT NULL,
    
    -- AI processing metadata
    ai_type TEXT, -- 'general_chat', 'resume_analysis', 'career_advice', etc.
    use_premium BOOLEAN DEFAULT false,
    processing_time_ms INTEGER,
    
    -- Context and memory
    context_data JSONB, -- JSON object of context used
    memory_references JSONB, -- JSON array of memory IDs referenced
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Resume memory - stores analyzed resume data and insights
CREATE TABLE IF NOT EXISTS ai_resume_memory (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    resume_id INTEGER,
    
    -- Resume content and analysis
    resume_content TEXT, -- Full resume text/JSON
    resume_hash TEXT, -- Hash to detect changes
    
    -- AI analysis results
    analysis_summary TEXT,
    strengths JSONB, -- JSON array
    improvements JSONB, -- JSON array
    skills_extracted JSONB, -- JSON array of detected skills
    experience_summary TEXT,
    career_level TEXT, -- 'entry', 'mid', 'senior', 'executive'
    
    -- Scoring and metrics
    overall_score INTEGER, -- 1-100
    ats_score INTEGER, -- ATS compatibility score
    completeness_score INTEGER,
    
    -- Contextual insights
    industry_focus JSONB, -- JSON array of detected industries
    role_targets JSONB, -- JSON array of target roles
    salary_range TEXT, -- Estimated salary range
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User profile memory - aggregated insights about the user
CREATE TABLE IF NOT EXISTS ai_user_memory (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    
    -- Career profile
    career_stage TEXT, -- 'student', 'entry_level', 'experienced', 'senior', 'executive'
    primary_skills JSONB, -- JSON array of top skills
    industries JSONB, -- JSON array of industries
    job_titles JSONB, -- JSON array of target job titles
    locations JSONB, -- JSON array of preferred locations
    
    -- Preferences and goals
    career_goals TEXT, -- Long-term career objectives
    job_search_status TEXT, -- 'active', 'passive', 'not_looking'
    salary_expectations TEXT, -- Salary range expectations
    work_preferences JSONB, -- JSON: remote, hybrid, onsite preferences
    
    -- AI interaction patterns
    common_questions JSONB, -- JSON array of frequently asked question types
    preferred_ai_style TEXT, -- 'detailed', 'concise', 'conversational'
    interaction_count INTEGER DEFAULT 0,
    
    -- Memory metadata
    last_resume_analysis TIMESTAMP,
    last_job_search TIMESTAMP,
    last_career_advice TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversation context - stores important context from conversations
CREATE TABLE IF NOT EXISTS ai_conversation_context (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id INTEGER,
    
    -- Context type and content
    context_type TEXT NOT NULL, -- 'resume_feedback', 'job_search_criteria', 'career_goal', 'skill_gap', etc.
    context_key TEXT NOT NULL, -- Unique identifier for this context
    context_value JSONB NOT NULL, -- The actual context data (JSON)
    
    -- Relevance and usage
    importance_score INTEGER DEFAULT 50, -- 1-100, how important this context is
    usage_count INTEGER DEFAULT 0, -- How many times this context has been referenced
    last_used TIMESTAMP,
    
    -- Expiration and lifecycle
    expires_at TIMESTAMP, -- When this context becomes stale
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_active ON ai_chat_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_resume_memory_user_id ON ai_resume_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_resume_memory_hash ON ai_resume_memory(resume_hash);

CREATE INDEX IF NOT EXISTS idx_ai_user_memory_user_id ON ai_user_memory(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_conversation_context_user_id ON ai_conversation_context(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_context_type ON ai_conversation_context(context_type);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_context_key ON ai_conversation_context(context_key);
CREATE INDEX IF NOT EXISTS idx_ai_conversation_context_active ON ai_conversation_context(is_active);