/**
 * Client-side Referee Follow-up Service
 * Handles referee onboarding, job matching, and feedback collection
 */

export interface RefereeProfile {
  id: number;
  userId: number;
  referralId: number;
  profileCompletionScore: number;
  skills: string[];
  experience: string;
  preferences: {
    jobTypes: string[];
    locations: string[];
    salaryRange?: { min: number; max: number };
    remoteWork: boolean;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobMatch {
  id: number;
  refereeUserId: number;
  jobTitle: string;
  companyName: string;
  matchScore: number;
  matchReasons: string[];
  jobDescription: string;
  requirements: string[];
  salaryRange?: { min: number; max: number };
  location: string;
  remoteAllowed: boolean;
  createdAt: string;
}

export interface JobMatchAnalytics {
  totalMatches: number;
  averageMatchScore: number;
  viewedMatches: number;
  appliedMatches: number;
  topSkillMatches: string[];
  engagementRate: number;
}

export interface OnboardingStatus {
  userId: number;
  profileCreated: boolean;
  skillsAdded: boolean;
  preferencesSet: boolean;
  onboardingCompleted: boolean;
  completionPercentage: number;
  nextStep: string;
  estimatedTimeToComplete: string;
}

export interface ConversionMetrics {
  totalReferrals: number;
  responseRate: number;
  interestRate: number;
  accountCreationRate: number;
  profileCompletionRate: number;
  jobMatchEngagementRate: number;
}

export interface FeedbackData {
  referralId: number;
  feedbackType: 'declined_referral' | 'interview_feedback' | 'general';
  feedback: string;
  rating?: number;
  suggestions?: string;
}

export interface CreateProfileData {
  userId: number;
  referralId: number;
  skills: string[];
  experience: string;
  preferences: {
    jobTypes: string[];
    locations: string[];
    salaryRange?: { min: number; max: number };
    remoteWork: boolean;
  };
}

export class RefereeFollowUpService {
  private baseUrl = '/api/referee';

  /**
   * Create referee profile
   */
  async createProfile(profileData: CreateProfileData): Promise<RefereeProfile> {
    const response = await fetch(`${this.baseUrl}/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to create profile');
    }

    return data.data;
  }

  /**
   * Update referee profile
   */
  async updateProfile(userId: number, updates: Partial<CreateProfileData>): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data.data;
  }

  /**
   * Get job matches for referee
   */
  async getJobMatches(userId: number, limit: number = 10): Promise<{ matches: JobMatch[]; total: number }> {
    const response = await fetch(`${this.baseUrl}/${userId}/job-matches?limit=${limit}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get job matches');
    }

    return data.data;
  }

  /**
   * Track job match engagement
   */
  async trackJobMatchEngagement(
    userId: number, 
    jobMatchId: number, 
    engagementType: 'viewed' | 'applied'
  ): Promise<{ userId: number; jobMatchId: number; engagementType: string; trackedAt: string }> {
    const response = await fetch(`${this.baseUrl}/${userId}/job-matches/${jobMatchId}/engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ engagementType })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to track engagement');
    }

    return data.data;
  }

  /**
   * Get job match analytics
   */
  async getJobMatchAnalytics(userId: number): Promise<JobMatchAnalytics> {
    const response = await fetch(`${this.baseUrl}/${userId}/analytics`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get analytics');
    }

    return data.data;
  }

  /**
   * Submit feedback
   */
  async submitFeedback(feedbackData: FeedbackData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(feedbackData)
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to submit feedback');
    }

    return data.data;
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId: number): Promise<OnboardingStatus> {
    const response = await fetch(`${this.baseUrl}/${userId}/onboarding`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get onboarding status');
    }

    return data.data;
  }

  /**
   * Get conversion metrics (admin only)
   */
  async getConversionMetrics(): Promise<ConversionMetrics> {
    const response = await fetch(`${this.baseUrl}/metrics/conversion`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get conversion metrics');
    }

    return data.data;
  }

  /**
   * Initialize follow-up sequence
   */
  async initializeFollowUpSequence(
    referralId: number, 
    sequenceType: 'non_responder' | 'onboarding' | 'job_matching'
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/follow-up/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ referralId, sequenceType })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to initialize follow-up sequence');
    }

    return data.data;
  }

  /**
   * Process due follow-ups (admin only)
   */
  async processDueFollowUps(): Promise<{ processedCount: number; processedAt: string }> {
    const response = await fetch(`${this.baseUrl}/follow-up/process`, {
      method: 'POST'
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to process follow-ups');
    }

    return data.data;
  }

  /**
   * Helper method to format salary range
   */
  formatSalaryRange(salaryRange?: { min: number; max: number }): string {
    if (!salaryRange) return 'Not specified';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return `${formatter.format(salaryRange.min)} - ${formatter.format(salaryRange.max)}`;
  }

  /**
   * Helper method to calculate profile completion percentage
   */
  calculateProfileCompletion(profile: Partial<RefereeProfile>): number {
    let score = 0;
    const maxScore = 4;

    if (profile.skills && profile.skills.length > 0) score++;
    if (profile.experience && profile.experience.trim()) score++;
    if (profile.preferences?.jobTypes && profile.preferences.jobTypes.length > 0) score++;
    if (profile.preferences?.locations && profile.preferences.locations.length > 0) score++;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Helper method to get match score color
   */
  getMatchScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * Helper method to get match score label
   */
  getMatchScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Poor Match';
  }

  /**
   * Helper method to format engagement rate
   */
  formatEngagementRate(rate: number): string {
    return `${rate.toFixed(1)}%`;
  }

  /**
   * Helper method to get next onboarding step
   */
  getNextOnboardingStep(status: OnboardingStatus): string {
    if (!status.profileCreated) return 'Create your profile';
    if (!status.skillsAdded) return 'Add your skills';
    if (!status.preferencesSet) return 'Set job preferences';
    if (!status.onboardingCompleted) return 'Complete onboarding';
    return 'Onboarding complete';
  }

  /**
   * Helper method to validate profile data
   */
  validateProfileData(profileData: CreateProfileData): string[] {
    const errors: string[] = [];

    if (!profileData.skills || profileData.skills.length === 0) {
      errors.push('At least one skill is required');
    }

    if (!profileData.experience || profileData.experience.trim().length === 0) {
      errors.push('Experience description is required');
    }

    if (!profileData.preferences.jobTypes || profileData.preferences.jobTypes.length === 0) {
      errors.push('At least one job type preference is required');
    }

    if (!profileData.preferences.locations || profileData.preferences.locations.length === 0) {
      if (!profileData.preferences.remoteWork) {
        errors.push('Either specify locations or enable remote work preference');
      }
    }

    if (profileData.preferences.salaryRange) {
      const { min, max } = profileData.preferences.salaryRange;
      if (min >= max) {
        errors.push('Minimum salary must be less than maximum salary');
      }
      if (min < 0 || max < 0) {
        errors.push('Salary values must be positive');
      }
    }

    return errors;
  }

  /**
   * Helper method to get feedback type label
   */
  getFeedbackTypeLabel(feedbackType: string): string {
    const labels = {
      'declined_referral': 'Declined Referral',
      'interview_feedback': 'Interview Feedback',
      'general': 'General Feedback'
    };
    return labels[feedbackType as keyof typeof labels] || feedbackType;
  }
}

export const refereeFollowUpService = new RefereeFollowUpService();