-- Job Matching System Database Schema
-- Creates tables for job discovery, applications, alerts, and analytics

-- Job opportunities table
CREATE TABLE IF NOT EXISTS job_opportunities (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT DEFAULT '[]', -- JSON array of required skills/qualifications
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'USD',
  location TEXT NOT NULL,
  remote INTEGER DEFAULT 0, -- Boolean: 0 = false, 1 = true
  type TEXT CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')) DEFAULT 'full-time',
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')) DEFAULT 'mid',
  industry TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise')) DEFAULT 'medium',
  posted_date TEXT NOT NULL DEFAULT (datetime('now')),
  expiry_date TEXT,
  status TEXT CHECK (status IN ('active', 'filled', 'expired')) DEFAULT 'active',
  application_count INTEGER DEFAULT 0,
  external_id TEXT, -- For integration with external job boards
  source TEXT DEFAULT 'internal', -- 'internal', 'linkedin', 'indeed', etc.
  metadata TEXT DEFAULT '{}', -- JSON for additional job data
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Job applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  resume_version TEXT, -- Reference to specific resume version
  cover_letter TEXT,
  customizations TEXT DEFAULT '[]', -- JSON array of resume customizations
  status TEXT CHECK (status IN ('submitted', 'reviewed', 'interview', 'offer', 'rejected', 'withdrawn')) DEFAULT 'submitted',
  applied_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_updated TEXT NOT NULL DEFAULT (datetime('now')),
  external_application_id TEXT, -- For tracking external applications
  recruiter_notes TEXT,
  interview_scheduled_at TEXT,
  offer_details TEXT, -- JSON for offer information
  rejection_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (job_id) REFERENCES job_opportunities(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(job_id, user_id) -- Prevent duplicate applications
);

-- Application timeline events
CREATE TABLE IF NOT EXISTS application_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  type TEXT CHECK (type IN ('submitted', 'reviewed', 'interview_scheduled', 'interview_completed', 'offer_made', 'rejected', 'withdrawn')) NOT NULL,
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT DEFAULT '{}', -- JSON for event-specific data
  created_by TEXT, -- System, recruiter, or candidate
  FOREIGN KEY (application_id) REFERENCES job_applications(id) ON DELETE CASCADE
);

-- Job alerts table
CREATE TABLE IF NOT EXISTS job_alerts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  filters TEXT NOT NULL, -- JSON object with search filters
  frequency TEXT CHECK (frequency IN ('immediate', 'daily', 'weekly')) DEFAULT 'daily',
  is_active INTEGER DEFAULT 1, -- Boolean: 0 = false, 1 = true
  last_triggered TEXT,
  match_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Job alert matches (for tracking which jobs matched which alerts)
CREATE TABLE IF NOT EXISTS job_alert_matches (
  id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  match_score REAL DEFAULT 0,
  matched_at TEXT DEFAULT (datetime('now')),
  notified INTEGER DEFAULT 0, -- Whether user was notified
  FOREIGN KEY (alert_id) REFERENCES job_alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (job_id) REFERENCES job_opportunities(id),
  UNIQUE(alert_id, job_id)
);

-- User job searches (for analytics and recommendations)
CREATE TABLE IF NOT EXISTS user_job_searches (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  search_query TEXT,
  filters TEXT DEFAULT '{}', -- JSON object with applied filters
  results_count INTEGER DEFAULT 0,
  clicked_jobs TEXT DEFAULT '[]', -- JSON array of job IDs clicked
  applied_jobs TEXT DEFAULT '[]', -- JSON array of job IDs applied to
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Job match scores (for caching match calculations)
CREATE TABLE IF NOT EXISTS job_match_scores (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  job_id TEXT NOT NULL,
  match_score REAL NOT NULL,
  match_reasons TEXT DEFAULT '[]', -- JSON array of match reasons
  skills_matched TEXT DEFAULT '[]', -- JSON array of matched skills
  skills_missing TEXT DEFAULT '[]', -- JSON array of missing skills
  calculated_at TEXT DEFAULT (datetime('now')),
  resume_version TEXT, -- Which resume version was used for calculation
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES job_opportunities(id),
  UNIQUE(user_id, job_id, resume_version)
);

-- Saved jobs table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  job_id TEXT NOT NULL,
  notes TEXT,
  saved_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES job_opportunities(id),
  UNIQUE(user_id, job_id)
);

-- Job recommendations (for tracking recommendation performance)
CREATE TABLE IF NOT EXISTS job_recommendations (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  job_id TEXT NOT NULL,
  recommendation_type TEXT CHECK (recommendation_type IN ('personalized', 'trending', 'similar', 'location')) DEFAULT 'personalized',
  score REAL DEFAULT 0,
  reasons TEXT DEFAULT '[]', -- JSON array of recommendation reasons
  shown_at TEXT DEFAULT (datetime('now')),
  clicked INTEGER DEFAULT 0,
  applied INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES job_opportunities(id)
);

-- User job preferences (for better recommendations)
CREATE TABLE IF NOT EXISTS user_job_preferences (
  user_id INTEGER PRIMARY KEY,
  preferred_locations TEXT DEFAULT '[]', -- JSON array of preferred locations
  remote_preference TEXT CHECK (remote_preference IN ('remote_only', 'hybrid', 'onsite', 'no_preference')) DEFAULT 'no_preference',
  preferred_job_types TEXT DEFAULT '[]', -- JSON array of preferred job types
  preferred_industries TEXT DEFAULT '[]', -- JSON array of preferred industries
  salary_expectations TEXT DEFAULT '{}', -- JSON object with min/max salary expectations
  experience_level TEXT,
  availability TEXT CHECK (availability IN ('immediate', '2_weeks', '1_month', '3_months', 'not_looking')) DEFAULT 'not_looking',
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_opportunities_status ON job_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_posted_date ON job_opportunities(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_location ON job_opportunities(location);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_remote ON job_opportunities(remote);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_type ON job_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_industry ON job_opportunities(industry);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_experience_level ON job_opportunities(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_opportunities_salary ON job_opportunities(salary_min, salary_max);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON job_applications(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_application_events_timestamp ON application_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_job_alerts_user_id ON job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_active ON job_alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_job_alert_matches_alert_id ON job_alert_matches(alert_id);
CREATE INDEX IF NOT EXISTS idx_job_alert_matches_job_id ON job_alert_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_alert_matches_matched_at ON job_alert_matches(matched_at);

CREATE INDEX IF NOT EXISTS idx_user_job_searches_user_id ON user_job_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_job_searches_created_at ON user_job_searches(created_at);

CREATE INDEX IF NOT EXISTS idx_job_match_scores_user_id ON job_match_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_job_match_scores_job_id ON job_match_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_job_match_scores_score ON job_match_scores(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_at ON saved_jobs(saved_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_recommendations_user_id ON job_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_shown_at ON job_recommendations(shown_at);

-- Insert sample job opportunities for testing
INSERT OR IGNORE INTO job_opportunities (
  id, title, company, description, requirements, salary_min, salary_max, 
  location, remote, type, experience_level, industry, company_size
) VALUES 
(
  'job_001',
  'Senior Frontend Developer',
  'TechCorp Inc',
  'We are looking for a Senior Frontend Developer to join our growing team. You will be responsible for building user-facing features using React and TypeScript.',
  '["React", "TypeScript", "JavaScript", "HTML", "CSS", "Git"]',
  80000, 120000,
  'San Francisco, CA',
  1,
  'full-time',
  'senior',
  'Technology',
  'medium'
),
(
  'job_002',
  'Full Stack Engineer',
  'StartupXYZ',
  'Join our fast-paced startup as a Full Stack Engineer. Work with modern technologies including Node.js, React, and PostgreSQL.',
  '["Node.js", "React", "PostgreSQL", "JavaScript", "Express", "REST APIs"]',
  70000, 100000,
  'Austin, TX',
  1,
  'full-time',
  'mid',
  'Technology',
  'startup'
),
(
  'job_003',
  'DevOps Engineer',
  'CloudSolutions Ltd',
  'We need a DevOps Engineer to help us scale our infrastructure. Experience with AWS, Docker, and Kubernetes required.',
  '["AWS", "Docker", "Kubernetes", "Linux", "CI/CD", "Terraform"]',
  90000, 130000,
  'Seattle, WA',
  1,
  'full-time',
  'senior',
  'Technology',
  'large'
),
(
  'job_004',
  'Product Manager',
  'InnovateCorp',
  'Looking for a Product Manager to drive product strategy and work closely with engineering and design teams.',
  '["Product Strategy", "Agile", "User Research", "Analytics", "Roadmapping"]',
  95000, 140000,
  'New York, NY',
  0,
  'full-time',
  'senior',
  'Technology',
  'large'
),
(
  'job_005',
  'Junior Software Developer',
  'CodeAcademy',
  'Entry-level position for new graduates. Great opportunity to learn and grow in a supportive environment.',
  '["JavaScript", "Python", "Git", "Problem Solving", "Learning Mindset"]',
  50000, 70000,
  'Remote',
  1,
  'full-time',
  'entry',
  'Education',
  'medium'
),
(
  'job_006',
  'Data Scientist',
  'DataDriven Analytics',
  'Join our data science team to build machine learning models and derive insights from large datasets.',
  '["Python", "Machine Learning", "SQL", "Statistics", "Pandas", "Scikit-learn"]',
  85000, 125000,
  'Boston, MA',
  1,
  'full-time',
  'mid',
  'Technology',
  'medium'
),
(
  'job_007',
  'UX Designer',
  'DesignStudio',
  'We are seeking a talented UX Designer to create intuitive and engaging user experiences for our products.',
  '["Figma", "User Research", "Prototyping", "Wireframing", "Design Systems"]',
  65000, 95000,
  'Los Angeles, CA',
  1,
  'full-time',
  'mid',
  'Design',
  'small'
),
(
  'job_008',
  'Backend Developer',
  'ServerSide Solutions',
  'Backend Developer position focusing on API development and database optimization using Java and Spring Boot.',
  '["Java", "Spring Boot", "MySQL", "REST APIs", "Microservices", "Docker"]',
  75000, 105000,
  'Chicago, IL',
  0,
  'full-time',
  'mid',
  'Technology',
  'medium'
),
(
  'job_009',
  'Mobile App Developer',
  'MobileFirst',
  'Develop cross-platform mobile applications using React Native. Experience with iOS and Android development preferred.',
  '["React Native", "JavaScript", "iOS", "Android", "Mobile Development", "Redux"]',
  70000, 100000,
  'Miami, FL',
  1,
  'full-time',
  'mid',
  'Technology',
  'startup'
),
(
  'job_010',
  'Marketing Manager',
  'GrowthCorp',
  'Lead our marketing efforts including digital marketing, content strategy, and campaign management.',
  '["Digital Marketing", "Content Strategy", "Analytics", "SEO", "Social Media", "Campaign Management"]',
  60000, 85000,
  'Denver, CO',
  1,
  'full-time',
  'mid',
  'Marketing',
  'medium'
);