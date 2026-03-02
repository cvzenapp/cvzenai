import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  UpdateProfileRequest,
  User,
} from "../../shared/auth";

const API_BASE = "/api/auth";

class AuthApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Auth API error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<any>("/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    // Transform the response to match the old format
    const authResponse: AuthResponse = {
      success: response.success,
      user: response.user ? {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || `${response.user.firstName} ${response.user.lastName}`,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt,
        emailVerified: response.user.emailVerified
      } : undefined,
      token: response.token,
      message: response.message
    };

    if (authResponse.success && authResponse.token) {
      localStorage.setItem("authToken", authResponse.token);
      localStorage.setItem("user", JSON.stringify(authResponse.user));
    }

    return authResponse;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Pass the data directly - it already has firstName and lastName
    const jobSeekerData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword,
      acceptTerms: userData.acceptTerms
    };

    const response = await this.makeRequest<any>("/register", {
      method: "POST",
      body: JSON.stringify(jobSeekerData),
    });

    // Transform the response to match the old format
    const authResponse: AuthResponse = {
      success: response.success,
      user: response.user ? {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || `${response.user.firstName} ${response.user.lastName}`,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt,
        emailVerified: response.user.emailVerified
      } : undefined,
      token: response.token,
      message: response.message
    };

    if (authResponse.success && authResponse.token) {
      localStorage.setItem("authToken", authResponse.token);
      localStorage.setItem("user", JSON.stringify(authResponse.user));
    }

    return authResponse;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest("/logout", {
        method: "POST",
      });
    } finally {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.makeRequest<{ user: User }>("/me");
      return response.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/refresh", {
      method: "POST",
    });
  }

  // Password management
  async requestPasswordReset(
    data: PasswordResetRequest,
  ): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async confirmPasswordReset(
    data: PasswordResetConfirm,
  ): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/change-password", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Profile management
  async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>("/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });

    if (response.success && response.user) {
      localStorage.setItem("user", JSON.stringify(response.user));
    }

    return response;
  }

  // Email verification
  async resendVerificationEmail(): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/resend-verification", {
      method: "POST",
    });
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>("/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken");
  }

  getStoredUser(): User | null {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  clearAuth(): void {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  }
}

export const authApi = new AuthApiService();
