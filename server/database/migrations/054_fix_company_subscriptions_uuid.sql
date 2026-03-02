-- Fix company_subscriptions to use UUID for company_id
-- This allows using recruiter user IDs as company identifiers

-- Drop foreign key constraint if it exists
ALTER TABLE company_subscriptions 
  DROP CONSTRAINT IF EXISTS fk_company;

-- Change company_id to UUID type
ALTER TABLE company_subscriptions 
  ALTER COLUMN company_id TYPE UUID USING company_id::text::uuid;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_subscriptions_company_id 
  ON company_subscriptions(company_id);
