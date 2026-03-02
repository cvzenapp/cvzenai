/**
 * Recruiter Authentication related types and interfaces
 */

export interface Recruiter {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  avatar?: string;
  phone?: string;
  linkedinUrl?: string;
  emailNotifications?: boolean;
  candidateUpdates?: boolean;
  interviewReminders?: boolean;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  isActive: boolean;
  company?: Company;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  website?: string;
  industry?: string;
  sizeRange?: string;
  location?: string;
  description?: string;
  foundedYear?: number;
  employeeCount?: number;
  companyType?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  specialties?: string[];
  benefits?: string[];
  companyValues?: string;
  workEnvironment?: string;
  assets?: CompanyAsset[];
  clients?: CompanyClient[];
  projects?: CompanyProject[];
  awards?: CompanyAward[];
  achievements?: CompanyAchievement[];
  teamMembers?: CompanyTeamMember[];
  cultureValues?: CompanyCultureValue[];
  testimonials?: CompanyTestimonial[];
}

export interface CompanyAsset {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size?: number;
  uploadedAt: string;
}

export interface CompanyClient {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export interface CompanyProject {
  id: string;
  title: string;
  description: string;
  image?: string;
  technologies?: string[];
  link?: string;
  date?: string;
}

export interface CompanyAward {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description?: string;
  image?: string;
}

export interface CompanyAchievement {
  id: string;
  title: string;
  description: string;
  metric?: string;
  icon?: string;
  date?: string;
}

export interface CompanyTeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  linkedin?: string;
  email?: string;
}

export interface CompanyCultureValue {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface CompanyTestimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  photo?: string;
  rating?: number;
}

export interface RecruiterLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RecruiterRegisterRequest {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle: string;
  phone?: string;
  linkedinUrl?: string;

  // Agreement
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
}

export interface RecruiterAuthResponse {
  success: boolean;
  recruiter?: Recruiter;
  token?: string;
  message?: string;
  errors?: Record<string, string>;
  requiresLogin?: boolean;
}

export interface CompanySearchResult {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  location?: string;
  verified: boolean;
}

export interface RecruiterPasswordResetRequest {
  email: string;
}

export interface RecruiterPasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface RecruiterUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  avatar?: string;
  phone?: string;
  linkedinUrl?: string;
  emailNotifications?: boolean;
  candidateUpdates?: boolean;
  interviewReminders?: boolean;
}

export interface CompanyUpdateRequest {
  name?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  coverImagePosition?: string;
  website?: string;
  industry?: string;
  sizeRange?: string;
  location?: string;
  description?: string;
  foundedYear?: number;
  employeeCount?: number;
  companyType?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };
  specialties?: string[];
  benefits?: string[];
  companyValues?: string;
  workEnvironment?: string;
  assets?: CompanyAsset[];
  clients?: CompanyClient[];
  projects?: CompanyProject[];
  awards?: CompanyAward[];
  achievements?: CompanyAchievement[];
  teamMembers?: CompanyTeamMember[];
  cultureValues?: CompanyCultureValue[];
  testimonials?: CompanyTestimonial[];
}

export interface RecruiterSecuritySettings {
  twoFactorEnabled: boolean;
  loginAttempts: RecruiterLoginAttempt[];
  lastLogin?: string;
  sessionTimeout: number;
}

export interface RecruiterLoginAttempt {
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

export interface RecruiterStats {
  totalCandidatesContacted: number;
  totalResponsesReceived: number;
  totalInterviewsScheduled: number;
  totalHires: number;
  responseRate: number;
  avgTimeToResponse: number;
}

export const COMPANY_SIZE_RANGES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1001-5000 employees",
  "5001-10000 employees",
  "10000+ employees",
] as const;

export const COMPANY_TYPES = [
  "Startup",
  "SME",
  "Enterprise",
  "Corporation",
  "Non-profit",
  "Government",
  "Agency",
  "Consulting",
] as const;

export const WORK_ENVIRONMENTS = [
  "Remote",
  "Hybrid",
  "On-site",
] as const;

export const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Consulting",
  "Media & Entertainment",
  "Real Estate",
  "Government",
  "Non-profit",
  "Energy",
  "Transportation",
  "Telecommunications",
  "Food & Beverage",
  "Human Resources",
  "Other",
] as const;

export const JOB_TITLES = [
  "Recruiter",
  "Senior Recruiter",
  "Technical Recruiter",
  "Talent Acquisition Specialist",
  "Talent Acquisition Manager",
  "Head of Talent Acquisition",
  "VP of Talent",
  "Chief People Officer",
  "HR Manager",
  "HR Director",
  "Hiring Manager",
  "Other",
] as const;
