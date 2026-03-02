-- Migration: Add referee follow-up system tables
-- Version: 003
-- Date: 2025-01-08

-- Follow-up sequences table
CREATE TABLE IF NOT EXISTS follow_up_sequences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    sequence_type TEXT NOT NULL CHECK (sequence_type IN ('non_responder', 'onboarding', 'job_matching')),
    current_step INTEGER NOT NULL DEFAULT 1,
    total_steps INTEGER NOT NULL,
    next_follow_up_at TIMESTAMP NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Referee profiles table
CREATE TABLE IF NOT EXISTS referee_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    referral_id INTEGER NOT NULL,
    profile_completion_score INTEGER NOT NULL DEFAULT 0,
    skills TEXT NOT NULL DEFAULT '[]', -- JSON array
    experience TEXT,
    preferences TEXT NOT NULL DEFAULT '{}', -- JSON object
    onboarding_completed BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    UNIQUE(user_id, referral_id)
);

-- Job matches table (for tracking job recommendations)
CREATE TABLE IF NOT EXISTS job_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referee_user_id INTEGER NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    match_score INTEGER NOT NULL, -- 0-100
    match_reasons TEXT NOT NULL DEFAULT '[]', -- JSON array
    job_description TEXT,
    requirements TEXT NOT NULL DEFAULT '[]', -- JSON array
    salary_range TEXT, -- JSON object with min/max
    location TEXT,
    remote_allowed BOOLEAN NOT NULL DEFAULT 0,
    viewed BOOLEAN NOT NULL DEFAULT 0,
    applied BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referee_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback collections table
CREATE TABLE IF NOT EXISTS feedback_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('declined_referral', 'interview_feedback', 'general')),
    feedback TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    suggestions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Referee engagement tracking
CREATE TABLE IF NOT EXISTS referee_engagement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referee_user_id INTEGER NOT NULL,
    engagement_type TEXT NOT NULL CHECK (engagement_type IN ('email_open', 'email_click', 'profile_update', 'job_view', 'job_apply')),
    engagement_data TEXT, -- JSON object with additional data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referee_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_referral_id ON follow_up_sequences(referral_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_next_follow_up ON follow_up_sequences(next_follow_up_at, completed);
CREATE INDEX IF NOT EXISTS idx_referee_profiles_user_id ON referee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_referee_user_id ON job_matches(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_match_score ON job_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_collections_referral_id ON feedback_collections(referral_id);
CREATE INDEX IF NOT EXISTS idx_referee_engagement_user_id ON referee_engagement(referee_user_id);
CREATE INDEX IF NOT EXISTS idx_referee_engagement_type ON referee_engagement(engagement_type, created_at);