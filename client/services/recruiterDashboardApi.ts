// Recruiter Dashboard API service for managing candidates and interviews

const API_BASE = "/api/recruiter/dashboard";

export interface RecruiterStats {
  totalCandidatesContacted: number;
  totalResponsesReceived: number;
  totalInterviewsScheduled: number;
  totalHires: number;
  responseRate: number;
  avgTimeToResponse: number;
  thisWeekContacts: number;
  thisWeekResponses: number;
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  avatar: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary: string;
  experience: string;
  education: string;
  skills: string[];
  resumeUrl: string;
  isShortlisted: boolean;
  isLiked: boolean;
  upvotes: number;
  views: number;
  lastActive: string;
  salaryExpectation?: string;
  availability: "immediate" | "2weeks" | "1month" | "3months";
  rating: number;
}

export interface CandidateSearchParams {
  query?: string;
  location?: string;
  experience?: string;
  availability?: string;
  skills?: string;
  page?: number;
  limit?: number;
}

export interface CandidateSearchResult {
  candidates: Candidate[];
  totalCount: number;
  page: number;
  limit: number;
}

export interface ScheduledInterview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateAvatar: string;
  position: string;
  date: string;
  time: string;
  type: "phone" | "video" | "onsite";
  status: "scheduled" | "completed" | "cancelled";
  meetingLink?: string;
  location?: string;
  notes?: string;
}

export interface ShortlistedCandidate {
  id: string;
  name: string;
  title: string;
  avatar: string;
  shortlistedAt: string;
}

export interface ScheduleInterviewRequest {
  resumeId: string;
  position: string;
  date: string;
  time: string;
  type: "phone" | "video" | "onsite";
  meetingLink?: string;
  location?: string;
  notes?: string;
}

export interface ShortlistRequest {
  resumeId: string;
  position: string;
  message: string;
}

export interface LikeRequest {
  resumeId: string;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  level: "entry" | "mid" | "senior" | "executive";
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  applicationsCount: number;
  viewsCount: number;
  createdAt: string;
}

export interface CreateJobPostingRequest {
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  level: "entry" | "mid" | "senior" | "executive";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
}

export interface UpdateJobPostingRequest extends CreateJobPostingRequest {
  isActive?: boolean;
}

class RecruiterDashboardApiService {
  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    // Get token from localStorage or auth service
    const token = localStorage.getItem("recruiter_token");

    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
      ...options,
    });

    let data;
    try {
      data = await response.json();
    } catch (error) {
      // Handle cases where response is not JSON
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      throw new Error("Invalid JSON response");
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
          data.message ||
          `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return data;
  }

  async getStats(): Promise<RecruiterStats> {
    return this.fetchApi<RecruiterStats>("/stats");
  }

  async searchCandidates(
    params: CandidateSearchParams = {},
  ): Promise<CandidateSearchResult> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/candidates/search${queryString ? `?${queryString}` : ""}`;

    return this.fetchApi<CandidateSearchResult>(endpoint);
  }

  async getCandidateDetails(candidateId: string): Promise<Candidate> {
    return this.fetchApi<Candidate>(`/candidates/${candidateId}`);
  }

  async shortlistCandidate(
    candidateId: string,
    request: ShortlistRequest,
  ): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(
      `/candidates/${candidateId}/shortlist`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async likeCandidate(
    candidateId: string,
    request: LikeRequest,
  ): Promise<{ success: boolean; liked: boolean }> {
    return this.fetchApi<{ success: boolean; liked: boolean }>(
      `/candidates/${candidateId}/like`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async scheduleInterview(
    candidateId: string,
    request: ScheduleInterviewRequest,
  ): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(
      `/candidates/${candidateId}/schedule`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async getInterviews(): Promise<ScheduledInterview[]> {
    return this.fetchApi<ScheduledInterview[]>("/interviews");
  }

  async getShortlistedCandidates(): Promise<ShortlistedCandidate[]> {
    return this.fetchApi<ShortlistedCandidate[]>("/shortlisted");
  }

  // Utility methods for candidate actions
  async toggleShortlist(
    candidateId: string,
    resumeId: string,
    position: string,
    message: string,
  ): Promise<boolean> {
    try {
      const result = await this.shortlistCandidate(candidateId, {
        resumeId,
        position,
        message,
      });
      return result.success;
    } catch (error) {
      console.error("Toggle shortlist error:", error);
      return false;
    }
  }

  async toggleLike(candidateId: string, resumeId: string): Promise<boolean> {
    try {
      const result = await this.likeCandidate(candidateId, { resumeId });
      return result.liked;
    } catch (error) {
      console.error("Toggle like error:", error);
      return false;
    }
  }

  async createSchedule(
    candidateId: string,
    schedule: ScheduleInterviewRequest,
  ): Promise<boolean> {
    try {
      const result = await this.scheduleInterview(candidateId, schedule);
      return result.success;
    } catch (error) {
      console.error("Create schedule error:", error);
      return false;
    }
  }

  // Job posting methods
  async getJobPostings(): Promise<JobPosting[]> {
    return this.fetchApi<JobPosting[]>("/jobs");
  }

  async createJobPosting(jobData: CreateJobPostingRequest): Promise<{ success: boolean; job: JobPosting }> {
    return this.fetchApi<{ success: boolean; job: JobPosting }>("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    });
  }

  async updateJobPosting(jobId: string, jobData: UpdateJobPostingRequest): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(jobData),
    });
  }

  async deleteJobPosting(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/jobs/${jobId}`, {
      method: "DELETE",
    });
  }
}

export const recruiterDashboardApi = new RecruiterDashboardApiService();
