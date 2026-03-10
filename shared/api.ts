/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Resume data types
 */
export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  avatar?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  current: boolean | false;
  description: string;
  technologies?: string[];
  companyLogo?: string;
  companyUrl?: string;
  location?: string;
  employmentType?:
    | "Full-time"
    | "Part-time"
    | "Contract"
    | "Freelance"
    | "Internship";
  achievements?: string[];
  keyMetrics?: {
    metric: string;
    value: string;
    description?: string;
  }[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  description?: string;
  achievements?: string[];
  coursework?: string[];
  image?: string;
  institutionUrl?: string;
  location?: string;
}

export interface Project {
  id: string;
  name: string;
  title: string;
  description: string;
  technologies: string[];
  startDate: string;
  endDate?: string;
  url?: string;
  link?: string;
  github?: string;
  images?: string[];
  status?: string;
  achievements?: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-100 proficiency level
  category: string;
  yearsOfExperience?: number;
  endorsements?: number;
  isCore?: boolean;
  proficiency?: number; // Changed from 'any' to 'number' for better type safety
}

export interface Certification {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
  url?: string;
  description?: string;
}

/**
 * ATS (Applicant Tracking System) Score
 */
export interface ATSScore {
  overallScore: number;
  scores: {
    completeness: number;
    formatting: number;
    keywords: number;
    experience: number;
    education: number;
    skills: number;
  };
  suggestions: string[];
  strengths: string[];
  scoredAt?: string;
}

export interface Resume {
  id: string;
  personalInfo: PersonalInfo;
  summary: string;
  objective: string;
  skills: Skill[];
  experiences: Experience[];
  education: Education[];
  projects: Project[];
  certifications?: Certification[];
  jobPreferences?: any; // Job preferences data for shared resumes
  upvotes: number;
  rating: number;
  isShortlisted: boolean;
  atsScore?: ATSScore;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interview Scheduling Types
 */
export interface InterviewInvitation {
  id: number;
  recruiterId: number;
  candidateId?: number; // Optional for guest candidates
  resumeId?: number; // Optional for guest candidates
  jobPostingId?: number;
  applicationId?: number;
  interviewRound?: number;
  
  // Guest candidate fields
  guestCandidateName?: string;
  guestCandidateEmail?: string;
  
  title: string;
  description?: string;
  interviewType: 'video_call' | 'phone' | 'in_person' | 'technical';
  interviewRoundType?: string;
  
  proposedDatetime: string;
  durationMinutes: number;
  timezone: string;
  
  meetingLink?: string;
  meetingLocation?: string;
  meetingInstructions?: string;
  
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled' | 'completed' | 'cancelled';
  candidateResponse?: string;
  recruiterNotes?: string;
  evaluationMetrics?: Array<{
    id: number;
    metric: string;
    score: string | null;
    checked: boolean;
  }>;
  
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  
  // Feedback fields from job_applications
  applicationStatus?: 'pending' | 'under_review' | 'accepted' | 'rejected';
  recruiterFeedback?: string;
  
  // Populated fields
  candidate?: {
    id: number;
    name: string;
    email: string;
  };
  recruiter?: {
    id: number;
    name: string;
    email: string;
    company?: string;
  };
  resume?: {
    id: number;
    title: string;
  };
  jobPosting?: {
    id: number;
    title: string;
    company: string;
  };
}

export interface InterviewRescheduleRequest {
  id: number;
  interviewId: number;
  requestedBy: 'recruiter' | 'candidate';
  
  newProposedDatetime: string;
  newDurationMinutes?: number;
  reason?: string;
  
  status: 'pending' | 'accepted' | 'declined';
  responseMessage?: string;
  
  createdAt: string;
  respondedAt?: string;
}

export interface InterviewFeedback {
  id: number;
  interviewId: number;
  providedBy: number;
  
  rating?: number; // Overall rating 1.0-10.0 (decimal)
  feedbackText?: string;
  hiringStatus?: 'hired' | 'rejected' | 'hold';
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateInterviewRequest {
  candidateId?: number; // Optional for guest candidates
  resumeId?: number; // Optional for guest candidates
  jobPostingId?: number;
  applicationId?: number; // Link to job application
  
  // Guest candidate fields (required if candidateId is not provided)
  guestCandidateName?: string;
  guestCandidateEmail?: string;
  
  title: string;
  description?: string;
  interviewType: 'video_call' | 'phone' | 'in_person' | 'technical';
  interviewRoundType?: string; // e.g., "Technical", "HR", "Coding", "Final"
  
  proposedDatetime: string;
  durationMinutes?: number;
  timezone?: string;
  
  meetingLink?: string;
  meetingLocation?: string;
  meetingInstructions?: string;
  
  recruiterNotes?: string;
  evaluationMetrics?: Array<{
    id: number;
    metric: string;
    score: string | null;
    checked: boolean;
  }>;
}

export interface RespondToInterviewRequest {
  interviewId: number;
  status: 'accepted' | 'declined';
  candidateResponse?: string;
}

export interface RescheduleInterviewRequest {
  interviewId: number;
  newProposedDatetime: string;
  newDurationMinutes?: number;
  reason?: string;
}
/**
 * Job Search API types
 */
export interface JobSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  domain: string;
  score?: number;
}

export interface JobDetails {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  jobType?: string;
  url: string;
  extractedAt: string;
}

export interface JobSearchResponse {
  success: boolean;
  data?: {
    results: JobSearchResult[];
    query: string;
    totalResults: number;
  };
  error?: string;
}

export interface JobCrawlResponse {
  success: boolean;
  data?: JobDetails;
  error?: string;
}

export interface JobSearchAndCrawlResponse {
  success: boolean;
  data?: {
    searchResults: JobSearchResult[];
    detailedJobs: JobDetails[];
    query: string;
  };
  error?: string;
}

/**
 * Sustainability Pledge types
 */
export interface PledgeSubmission {
  name: string;
  email: string;
  contact?: string;
}

export interface PledgeResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    email: string;
  };
}

// Legacy waitlist types (deprecated - use Pledge types)
export interface WaitlistSubmission {
  name: string;
  email: string;
  contact?: string;
  companyName?: string;
  companySize?: string;
  useCase?: string;
  interestedFeatures?: string[];
  additionalInfo?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    email: string;
  };
}
