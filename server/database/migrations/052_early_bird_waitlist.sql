-- Early Bird Waitlist table
CREATE TABLE IF NOT EXISTS early_bird_waitlist (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  contact VARCHAR(50),
  company_name VARCHAR(255),
  company_size VARCHAR(50),
  use_case TEXT,
  interested_features TEXT[],
  additional_info TEXT,
  source VARCHAR(100) DEFAULT 'landing_page',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  notified_at TIMESTAMP
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_early_bird_email ON early_bird_waitlist(email);
CREATE INDEX IF NOT EXISTS idx_early_bird_status ON early_bird_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_early_bird_created ON early_bird_waitlist(created_at DESC);

-- Add comment
COMMENT ON TABLE early_bird_waitlist IS 'Stores early bird signup and enterprise waitlist information';
