// Dashboard API service for fetching real data from backend

const API_BASE = "/api/dashboard";

export interface DashboardStats {
  totalResumes: number;
  totalViews: number;
  totalDownloads: number;
  profileViews: number;
  avgRating: number;
  completionRate: number;
  recruiterResponses: number;
  shortlistCount: number;
  upvotesReceived: number;
  likesReceived: number;
  interviewsScheduled: number;
  referralCount: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  resumeName?: string;
  recruiterName?: string;
  company?: string;
  metadata?: any;
}

export interface RecruiterResponse {
  id: string;
  recruiterName: string;
  company: string;
  position: string;
  avatar: string;
  status: "interested" | "shortlisted" | "interview_scheduled" | "rejected";
  message: string;
  timestamp: string;
  resumeId: string;
  resumeName: string;
  jobTitle?: string;
  interviewDate?: string;
  interviewTime?: string;
  interviewType?: "phone" | "video" | "onsite";
  salary?: string;
  upvotes: number;
  hasUpvoted: boolean;
}

export interface ResumeItem {
  id: string;
  name: string;
  template: string;
  lastModified: string;
  status: "draft" | "published" | "archived";
  views: number;
  downloads: number;
  thumbnail: string;
  isPublic: boolean;
}

export interface ReferralData {
  stats: {
    totalReferred: number;
    successfulReferrals: number;
    pendingReferrals: number;
    rewardsEarned: number;
  };
  referrals: Array<{
    id: string;
    name: string;
    email: string;
    position: string;
    company: string;
    status: string;
    reward_amount: number;
    createdAt: string;
  }>;
}

class DashboardApiService {
  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Dashboard API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    return this.fetchApi<DashboardStats>(`/stats/${userId}`);
  }

  async getActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return this.fetchApi<Activity[]>(`/activities/${userId}?limit=${limit}`);
  }

  async getRecruiterResponses(userId: string): Promise<RecruiterResponse[]> {
    return this.fetchApi<RecruiterResponse[]>(`/recruiter-responses/${userId}`);
  }

  async getResumes(userId: string): Promise<ResumeItem[]> {
    return this.fetchApi<ResumeItem[]>(`/resumes/${userId}`);
  }

  async getReferralData(userId: string): Promise<ReferralData> {
    return this.fetchApi<ReferralData>(`/referrals/${userId}`);
  }

  async toggleUpvote(
    userId: string,
    responseId: string,
  ): Promise<{ hasUpvoted: boolean }> {
    return this.fetchApi<{ hasUpvoted: boolean }>(
      `/upvote/${userId}/${responseId}`,
      {
        method: "POST",
      },
    );
  }
}

export const dashboardApi = new DashboardApiService();
