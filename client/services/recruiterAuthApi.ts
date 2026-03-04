import {
  RecruiterAuthResponse,
  RecruiterLoginRequest,
  RecruiterRegisterRequest,
  RecruiterPasswordResetRequest,
  RecruiterPasswordResetConfirm,
  RecruiterUpdateProfileRequest,
  Recruiter,
  CompanySearchResult,
  COMPANY_SIZE_RANGES,
  INDUSTRIES,
  JOB_TITLES,
} from "../../shared/recruiterAuth";

const API_BASE_URL = "/api/recruiter/auth";

class RecruiterAuthApiService {
  private token: string | null = null;
  private recruiter: Recruiter | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("recruiter_token");
      const recruiterData = localStorage.getItem("recruiter_user");
      if (recruiterData) {
        try {
          this.recruiter = JSON.parse(recruiterData);
        } catch (e) {
          localStorage.removeItem("recruiter_user");
        }
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
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

    // Handle both 200 and 201 as success for registration
    if (!response.ok && response.status !== 201) {
      throw new Error(
        data.message || `HTTP ${response.status}: ${response.statusText}`,
      );
    }

    return data;
  }

  async login(
    credentials: RecruiterLoginRequest,
  ): Promise<RecruiterAuthResponse> {
    try {
      const response = await this.request<RecruiterAuthResponse>("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      if (response.success && response.token && response.recruiter) {
        this.token = response.token;
        this.recruiter = response.recruiter;

        // Store in localStorage
        localStorage.setItem("recruiter_token", response.token);
        localStorage.setItem(
          "recruiter_user",
          JSON.stringify(response.recruiter),
        );
      }

      return response;
    } catch (error) {
      console.error("Recruiter login error:", error);
      throw error;
    }
  }

  async register(
    data: RecruiterRegisterRequest,
  ): Promise<RecruiterAuthResponse> {
    try {
      const response = await this.request<RecruiterAuthResponse>("/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      if (response.success && response.token && response.recruiter) {
        this.token = response.token;
        this.recruiter = response.recruiter;

        // Store in localStorage
        localStorage.setItem("recruiter_token", response.token);
        localStorage.setItem(
          "recruiter_user",
          JSON.stringify(response.recruiter),
        );
      }

      return response;
    } catch (error) {
      console.error("Recruiter registration error:", error);
      throw error;
    }
  }

  // async logout(): Promise<void> {
  //   try {
  //     await this.request("/logout", {
  //       method: "POST",
  //     });
  //   } catch (error) {
  //     console.error("Recruiter logout error:", error);
  //   } finally {
  //     // Clear local state regardless of API response
  //     this.token = null;
  //     this.recruiter = null;
      
  //     // Clear ALL possible recruiter auth keys (various naming conventions used over time)
  //     localStorage.removeItem("recruiter_token");
  //     localStorage.removeItem("recruiter_user");
  //     localStorage.removeItem("recruiterAuthToken");
  //     localStorage.removeItem("recruiterUser");
      
  //     // Clear job seeker auth (in case of mixed sessions)
  //     localStorage.removeItem("authToken");
  //     localStorage.removeItem("user");
      
  //     // Clear redirect path
  //     localStorage.removeItem("redirectAfterLogin");
      
  //     // Clear notification settings
  //     localStorage.removeItem("recruiterNotificationSettings");
  //   }
  // }

  async forgotPassword(
    data: RecruiterPasswordResetRequest,
  ): Promise<{ success: boolean; message: string }> {
    return this.request("/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resetPassword(
    data: RecruiterPasswordResetConfirm,
  ): Promise<RecruiterAuthResponse> {
    return this.request("/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProfile(): Promise<Recruiter> {
    const response = await this.request<{
      success: boolean;
      recruiter: Recruiter;
    }>("/profile");

    if (response.success && response.recruiter) {
      this.recruiter = response.recruiter;
      localStorage.setItem(
        "recruiter_user",
        JSON.stringify(response.recruiter),
      );
      return response.recruiter;
    }

    throw new Error("Failed to fetch profile");
  }

  async updateProfile(
    data: RecruiterUpdateProfileRequest,
  ): Promise<RecruiterAuthResponse> {
    const response = await this.request<RecruiterAuthResponse>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (response.success && response.recruiter) {
      this.recruiter = response.recruiter;
      localStorage.setItem(
        "recruiter_user",
        JSON.stringify(response.recruiter),
      );
    }

    return response;
  }

  async searchCompanies(query: string): Promise<CompanySearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      return await this.request<CompanySearchResult[]>(
        `/companies/search?q=${encodeURIComponent(query)}`,
      );
    } catch (error) {
      console.error("Company search error:", error);
      return [];
    }
  }

  async getConstants(): Promise<{
    companySizeRanges: typeof COMPANY_SIZE_RANGES;
    industries: typeof INDUSTRIES;
    jobTitles: typeof JOB_TITLES;
  }> {
    return this.request("/constants");
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.recruiter;
  }

  getCurrentRecruiter(): Recruiter | null {
    return this.recruiter;
  }

  /**
   * Refresh authentication state from localStorage
   * This should be called after login to ensure state is synchronized
   */
  refreshAuthState(): void {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("recruiter_token");
      const recruiterData = localStorage.getItem("recruiter_user");
      if (recruiterData) {
        try {
          this.recruiter = JSON.parse(recruiterData);
        } catch (e) {
          localStorage.removeItem("recruiter_user");
          this.recruiter = null;
        }
      } else {
        this.recruiter = null;
      }
    }
  }

  clearAuth(): void {
    this.token = null;
    this.recruiter = null;
    
    // Clear old format keys
    localStorage.removeItem("recruiter_token");
    localStorage.removeItem("recruiter_user");
    
    // Clear new format keys (from RecruiterAuthModal)
    localStorage.removeItem("recruiter_token");
    localStorage.removeItem("recruiterUser");
    
    // Clear notification settings
    localStorage.removeItem("recruiterNotificationSettings");
  }

  getToken(): string | null {
    return this.token;
  }
}

export const recruiterAuthApi = new RecruiterAuthApiService();
