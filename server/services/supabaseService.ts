import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create Supabase client with service role key for server-side operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  location?: string;
  bio?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  size_range?: string;
  location?: string;
  description?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecruiterProfile {
  id: string;
  user_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  job_title: string;
  phone?: string;
  linkedin_url?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

// Authentication service
export class SupabaseAuthService {
  static async createUser(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });

    if (error) throw error;
    return data;
  }

  static async getUserById(userId: string) {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    return data;
  }

  static async updateUser(userId: string, updates: any) {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, updates);
    if (error) throw error;
    return data;
  }

  static async deleteUser(userId: string) {
    const { data, error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    return data;
  }

  static async verifyJWT(token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data;
  }
}

// User profile service
export class UserProfileService {
  static async createProfile(userId: string, profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        ...profileData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProfile(userId: string) {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

// Company service
export class CompanyService {
  static async createCompany(companyData: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getCompany(companyId: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getCompanyBySlug(slug: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async searchCompanies(query: string, limit: number = 10): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async updateCompany(companyId: string, updates: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static generateSlug(companyName: string): string {
    return companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

// Recruiter profile service
export class RecruiterProfileService {
  static async createProfile(
    userId: string, 
    companyId: string, 
    profileData: Omit<RecruiterProfile, 'id' | 'user_id' | 'company_id' | 'created_at' | 'updated_at' | 'company'>
  ) {
    const { data, error } = await supabase
      .from('recruiter_profiles')
      .insert({
        user_id: userId,
        company_id: companyId,
        ...profileData
      })
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async getProfile(userId: string): Promise<RecruiterProfile | null> {
    const { data, error } = await supabase
      .from('recruiter_profiles')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateProfile(userId: string, updates: Partial<RecruiterProfile>) {
    const { data, error } = await supabase
      .from('recruiter_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select(`
        *,
        company:companies(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteProfile(userId: string) {
    const { error } = await supabase
      .from('recruiter_profiles')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

// Utility functions
export class SupabaseUtils {
  static async getUserType(userId: string): Promise<'job_seeker' | 'recruiter' | 'unknown'> {
    // Check if user has a job seeker profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (userProfile) return 'job_seeker';

    // Check if user has a recruiter profile
    const { data: recruiterProfile } = await supabase
      .from('recruiter_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (recruiterProfile) return 'recruiter';

    return 'unknown';
  }

  static async isEmailTaken(email: string): Promise<boolean> {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    return data.users.some(user => user.email === email);
  }
}

export default supabase;