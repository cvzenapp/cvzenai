-- Resume Builder Database Schema
-- Designed for scalability, normalization, and performance

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    location VARCHAR(255),
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    email_verified BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    website TEXT,
    industry VARCHAR(100),
    size_range VARCHAR(50), -- e.g., '1-10', '11-50', '51-200', etc.
    location VARCHAR(255),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recruiters table
CREATE TABLE recruiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT 0,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    phone VARCHAR(20),
    linkedin_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- Resume templates table
CREATE TABLE resume_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    preview_image_url TEXT,
    category VARCHAR(100),
    is_premium BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User resumes table
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id INTEGER,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    content TEXT, -- JSON content of the resume
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    is_public BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (template_id) REFERENCES resume_templates(id),
    UNIQUE(user_id, slug)
);

-- Job positions table
CREATE TABLE job_positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Recruiter responses table
CREATE TABLE recruiter_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recruiter_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    resume_id INTEGER NOT NULL,
    job_position_id INTEGER,
    status VARCHAR(50) NOT NULL, -- interested, shortlisted, interview_scheduled, rejected
    message TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    interview_date DATE,
    interview_time TIME,
    interview_type VARCHAR(20), -- phone, video, onsite
    meeting_link TEXT,
    location TEXT,
    notes TEXT,
    upvotes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id)
);

-- User interactions with recruiter responses (upvotes, likes)
CREATE TABLE response_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    response_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL, -- upvote, like, refer
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (response_id) REFERENCES recruiter_responses(id),
    UNIQUE(user_id, response_id, interaction_type)
);

-- Resume views tracking
CREATE TABLE resume_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    viewer_ip VARCHAR(45),
    viewer_user_agent TEXT,
    viewer_id INTEGER, -- if logged in user
    referrer TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (viewer_id) REFERENCES users(id)
);

-- Resume downloads tracking
CREATE TABLE resume_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    downloader_ip VARCHAR(45),
    downloader_user_agent TEXT,
    downloader_id INTEGER, -- if logged in user
    download_format VARCHAR(10) DEFAULT 'pdf',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resume_id) REFERENCES resumes(id),
    FOREIGN KEY (downloader_id) REFERENCES users(id)
);

-- User activities table
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- view, download, edit, share, shortlist, interview, refer
    entity_type VARCHAR(50), -- resume, response, etc.
    entity_id INTEGER,
    description TEXT NOT NULL,
    metadata TEXT, -- JSON for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Enhanced Referrals table
CREATE TABLE referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    referee_email VARCHAR(255) NOT NULL,
    referee_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, contacted, interviewed, hired, rejected, expired, declined
    personal_message TEXT,
    reward_amount DECIMAL(10,2) DEFAULT 30.00,
    referral_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    referee_user_id INTEGER, -- Links to users table when referee creates account
    metadata TEXT, -- JSON for additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Referral status history table
CREATE TABLE referral_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referral_id INTEGER NOT NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by_user_id INTEGER,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Rewards table for tracking earnings and payments
CREATE TABLE rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    referral_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, earned, paid, reversed
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    payment_method VARCHAR(100),
    transaction_id VARCHAR(255),
    reversed_at DATETIME,
    reversal_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referral_id) REFERENCES referrals(id) ON DELETE CASCADE
);

-- Referral program configuration table
CREATE TABLE referral_program_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User sessions (for authentication)
CREATE TABLE user_sessions (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Database optimization indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active, created_at);

CREATE INDEX idx_resumes_user ON resumes(user_id, status);
CREATE INDEX idx_resumes_public ON resumes(is_public, status, created_at);
CREATE INDEX idx_resumes_slug ON resumes(user_id, slug);

CREATE INDEX idx_recruiters_company ON recruiters(company_id, is_active);
CREATE INDEX idx_recruiters_email ON recruiters(email);

CREATE INDEX idx_responses_user ON recruiter_responses(user_id, status, created_at);
CREATE INDEX idx_responses_recruiter ON recruiter_responses(recruiter_id, created_at);
CREATE INDEX idx_responses_resume ON recruiter_responses(resume_id);

CREATE INDEX idx_interactions_user ON response_interactions(user_id, interaction_type);
CREATE INDEX idx_interactions_response ON response_interactions(response_id, interaction_type);

CREATE INDEX idx_views_resume ON resume_views(resume_id, created_at);
CREATE INDEX idx_views_user ON resume_views(viewer_id, created_at);

CREATE INDEX idx_downloads_resume ON resume_downloads(resume_id, created_at);
CREATE INDEX idx_downloads_user ON resume_downloads(downloader_id, created_at);

CREATE INDEX idx_activities_user ON activities(user_id, activity_type, created_at);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);

-- Referral system indexes
CREATE INDEX idx_referrals_user ON referrals(referrer_id, status);
CREATE INDEX idx_referrals_email ON referrals(referee_email);
CREATE INDEX idx_referrals_token ON referrals(referral_token);
CREATE INDEX idx_referrals_status ON referrals(status, created_at);
CREATE INDEX idx_referrals_expires ON referrals(expires_at);

CREATE INDEX idx_referral_history_referral ON referral_status_history(referral_id, created_at);
CREATE INDEX idx_referral_history_status ON referral_status_history(new_status, created_at);

CREATE INDEX idx_rewards_user ON rewards(user_id, status);
CREATE INDEX idx_rewards_referral ON rewards(referral_id);
CREATE INDEX idx_rewards_status ON rewards(status, earned_at);

CREATE INDEX idx_referral_config_key ON referral_program_config(config_key);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_timestamp
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_companies_timestamp
    AFTER UPDATE ON companies
BEGIN
    UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_recruiters_timestamp
    AFTER UPDATE ON recruiters
BEGIN
    UPDATE recruiters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_resumes_timestamp
    AFTER UPDATE ON resumes
BEGIN
    UPDATE resumes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_responses_timestamp
    AFTER UPDATE ON recruiter_responses
BEGIN
    UPDATE recruiter_responses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_referrals_timestamp
    AFTER UPDATE ON referrals
BEGIN
    UPDATE referrals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_rewards_timestamp
    AFTER UPDATE ON rewards
BEGIN
    UPDATE rewards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_referral_config_timestamp
    AFTER UPDATE ON referral_program_config
BEGIN
    UPDATE referral_program_config SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Resume sharing table
CREATE TABLE resume_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Template customizations table
CREATE TABLE template_customizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id VARCHAR(100) NOT NULL, -- References template config ID
    name VARCHAR(255) NOT NULL,
    
    -- Color customization (JSON)
    colors TEXT NOT NULL, -- JSON: {primary, secondary, accent, text, background}
    
    -- Typography customization (JSON)
    typography TEXT NOT NULL, -- JSON: {fontFamily, fontSize, lineHeight, fontWeight}
    
    -- Layout customization (JSON)
    layout TEXT NOT NULL, -- JSON: {style, spacing, borderRadius, showBorders}
    
    -- Section customization (JSON)
    sections TEXT NOT NULL, -- JSON: {showProfileImage, showSkillBars, showRatings, order}
    
    -- Metadata
    is_default BOOLEAN DEFAULT 0, -- User's default customization for this template
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, template_id, name) -- Prevent duplicate names per user per template
);

-- Template usage tracking
CREATE TABLE template_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id VARCHAR(100) NOT NULL,
    customization_id INTEGER,
    usage_type VARCHAR(50) NOT NULL, -- 'preview', 'apply', 'download', 'save'
    session_id VARCHAR(255), -- Track user session
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customization_id) REFERENCES template_customizations(id) ON DELETE SET NULL
);

-- Template favorites/bookmarks
CREATE TABLE template_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    template_id VARCHAR(100) NOT NULL,
    customization_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (customization_id) REFERENCES template_customizations(id) ON DELETE CASCADE,
    UNIQUE(user_id, template_id, customization_id)
);

-- Template sharing (for sharing customized templates)
CREATE TABLE template_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customization_id INTEGER NOT NULL,
    shared_by_user_id INTEGER NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    is_public BOOLEAN DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    expires_at DATETIME, -- NULL for permanent shares
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customization_id) REFERENCES template_customizations(id) ON DELETE CASCADE,
    FOREIGN KEY (shared_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for template customization performance
CREATE INDEX idx_customizations_user_template ON template_customizations(user_id, template_id);
CREATE INDEX idx_customizations_user_default ON template_customizations(user_id, is_default, is_active);
CREATE INDEX idx_customizations_template ON template_customizations(template_id, is_active);

CREATE INDEX idx_usage_user ON template_usage(user_id, usage_type, created_at);
CREATE INDEX idx_usage_template ON template_usage(template_id, usage_type, created_at);
CREATE INDEX idx_usage_session ON template_usage(session_id, created_at);

CREATE INDEX idx_favorites_user ON template_favorites(user_id, created_at);
CREATE INDEX idx_favorites_template ON template_favorites(template_id, created_at);

CREATE INDEX idx_shares_token ON template_shares(share_token);
CREATE INDEX idx_shares_user ON template_shares(shared_by_user_id, is_public);
CREATE INDEX idx_shares_public ON template_shares(is_public, created_at);

-- Resume sharing indexes
CREATE INDEX idx_resume_shares_token ON resume_shares(share_token);
CREATE INDEX idx_resume_shares_resume ON resume_shares(resume_id, is_active);
CREATE INDEX idx_resume_shares_user ON resume_shares(user_id, created_at);
CREATE INDEX idx_resume_shares_expires ON resume_shares(expires_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_resume_shares_timestamp
    AFTER UPDATE ON resume_shares
BEGIN
    UPDATE resume_shares SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_customizations_timestamp
    AFTER UPDATE ON template_customizations
BEGIN
    UPDATE template_customizations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
