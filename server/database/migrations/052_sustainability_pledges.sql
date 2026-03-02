-- Create sustainability pledges table
CREATE TABLE IF NOT EXISTS sustainability_pledges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  contact VARCHAR(50),
  pledge_date TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active',
  certificate_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_sustainability_pledges_email ON sustainability_pledges(email);

-- Create index on pledge_date for analytics
CREATE INDEX IF NOT EXISTS idx_sustainability_pledges_date ON sustainability_pledges(pledge_date);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_sustainability_pledges_status ON sustainability_pledges(status);
