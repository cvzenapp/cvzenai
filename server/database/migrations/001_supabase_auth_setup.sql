-- Supabase Authentication System Setup
-- This migration creates the custom profile tables and RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles for job seekers
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  size_range TEXT,
  location TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recruiter profiles
CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_company_id ON recruiter_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recruiter_profiles
CREATE POLICY "Recruiters can view own profile" ON recruiter_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can insert own profile" ON recruiter_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Recruiters can update own profile" ON recruiter_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Recruiters can delete own profile" ON recruiter_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for companies
CREATE POLICY "Anyone can view companies" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Recruiters can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recruiter_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Recruiters can update own company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM recruiter_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recruiter_profiles_updated_at 
  BEFORE UPDATE ON recruiter_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate company slug
CREATE OR REPLACE FUNCTION generate_company_slug(company_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(company_name, '[^a-zA-Z0-9]+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Function to detect user type
CREATE OR REPLACE FUNCTION get_user_type(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = user_uuid) THEN
    RETURN 'job_seeker';
  ELSIF EXISTS (SELECT 1 FROM recruiter_profiles WHERE user_id = user_uuid) THEN
    RETURN 'recruiter';
  ELSE
    RETURN 'unknown';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;