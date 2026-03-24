/**
 * Unified Authentication Service
 * Centralizes all authentication logic with consistent token handling
 */

import { BaseApiClient, ApiResponse } from './baseApiClient';
import { AuthError, AuthErrorHandler, AuthErrorType } from './authErrorHandler';
import { authLogger, AuthOperation } from './authLogger';
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

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isValidated: boolean; // Track whether token has been validated with server
}

export type AuthStateChangeCallback = (state: AuthState) => void;

class UnifiedAuthService extends BaseApiClient {
  private authStateCallbacks: Set<AuthStateChangeCallback> = new Set();
  private currentState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isValidated: false
  };

  constructor() {
    super('/api/auth');
    // Initialize auth state from localStorage on startup
    this.initializeAuth();
    this.setupStorageListener();
  }

  private isInitializing = false;

  /**
   * Initialize authentication state from storage
   */
  private async initializeAuth(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    return authLogger.logOperation(
      AuthOperation.STATE_CHANGE,
      'Authentication initialization',
      async () => {
        this.setLoading(true);
        
        try {
          const token = localStorage.getItem("authToken");
          const userData = localStorage.getItem("user");
          
          authLogger.debug(AuthOperation.STORAGE_ACCESS, 'Reading auth data from storage', {
            hasToken: !!token,
            hasUserData: !!userData
          });
          
          if (token && userData) {
            try {
              const user = JSON.parse(userData);
              
              // Set initial state with token but not authenticated until validated
              this.updateAuthState({
                user,
                token,
                isAuthenticated: false, // Don't set to true until validated
                isLoading: true, // Keep loading until validation completes
                isValidated: false
              });
              
              authLogger.info(AuthOperation.STATE_CHANGE, 'Auth data found in storage, validating...', {
                userId: user.id,
                email: user.email
              });
              
              // Set authenticated state immediately without server validation
              this.updateAuthState({
                isAuthenticated: true,
                isLoading: false,
                isValidated: true
              });
            } catch (parseError) {
              authLogger.error(AuthOperation.STORAGE_ACCESS, 'Error parsing stored user data', {}, parseError as Error);
              this.clearAuthState();
            }
          } else {
            authLogger.debug(AuthOperation.STATE_CHANGE, 'No stored auth data found');
            this.updateAuthState({
              isLoading: false,
              isValidated: true // No token to validate
            });
          }
        } catch (error) {
          authLogger.error(AuthOperation.STATE_CHANGE, 'Auth initialization error', {}, error as Error);
          this.clearAuthState();
        } finally {
          this.isInitializing = false;
        }
      }
    );
  }

  private isValidating = false;

  /**
   * Validate token with server (used during initialization)
   */
  private async validateTokenWithServer(): Promise<void> {
    // Prevent multiple simultaneous validations
    if (this.isValidating) {
      return;
    }

    this.isValidating = true;

    try {
      authLogger.info(AuthOperation.STATE_CHANGE, 'Validating token with server...');
      
      // First check if token is expired locally
      if (this.isTokenExpired()) {
        authLogger.info(AuthOperation.STATE_CHANGE, 'Token expired locally, attempting refresh...');
        
        // Try to refresh the token
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          authLogger.warn(AuthOperation.STATE_CHANGE, 'Token refresh failed, clearing auth state');
          this.clearAuthState();
          return;
        }
        
        authLogger.info(AuthOperation.STATE_CHANGE, 'Token refreshed successfully');
      }

      // Then validate with server
      const currentUser = await this.getCurrentUser();
      if (currentUser) {
        // Token is valid, set authenticated state
        this.updateAuthState({
          isAuthenticated: true,
          isLoading: false,
          isValidated: true
        });
        authLogger.info(AuthOperation.STATE_CHANGE, 'Token validation successful', {
          userId: currentUser.id,
          email: currentUser.email
        });
      } else {
        authLogger.warn(AuthOperation.STATE_CHANGE, 'Token validation failed, clearing auth state');
        this.clearAuthState();
      }
    } catch (error) {
      authLogger.error(AuthOperation.STATE_CHANGE, 'Token validation error', {}, error as Error);
      
      // Only clear auth state for actual authentication errors, not network errors
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        console.log('🧹 Clearing auth state due to authentication error during validation');
        this.clearAuthState();
      } else {
        console.log('⚠️ Network/server error during token validation, keeping auth state');
      }
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Validate token with server in background (for periodic checks)
   */
  private async validateTokenInBackground(): Promise<void> {
    // Only run background validation if already authenticated and validated
    if (this.isValidating || !this.currentState.isAuthenticated || !this.currentState.isValidated) {
      return;
    }

    this.isValidating = true;

    try {
      // First check if token is expired locally
      if (this.isTokenExpired()) {
        // Try to refresh the token
        const refreshResult = await this.refreshToken();
        if (!refreshResult.success) {
          this.clearAuthState();
          return;
        }
      }

      // Then validate with server
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        this.clearAuthState();
      }
    } catch (error) {
      console.error('Background token validation failed:', error);
      // Don't clear auth state immediately on network errors during background validation
      // Only clear if it's an authentication error (401)
      if (error instanceof Error && error.message.includes('401')) {
        this.clearAuthState();
      }
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Setup storage event listener for cross-tab synchronization
   */
  private setupStorageListener(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === 'authToken' || event.key === 'user') {
        // Auth state changed in another tab
        if (!event.newValue) {
          // Token or user was removed
          this.clearAuthState();
        } else if (event.key === 'authToken' && event.newValue) {
          // Token was updated, reinitialize
          this.initializeAuth();
        }
      }
    });

  }

  /**
   * Subscribe to authentication state changes
   */
  public onAuthStateChange(callback: AuthStateChangeCallback): () => void {
    this.authStateCallbacks.add(callback);
    
    // Immediately call with current state
    callback(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.authStateCallbacks.delete(callback);
    };
  }

  /**
   * Get current authentication state
   */
  public getAuthState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Ensure authentication state is properly initialized
   * Call this method when navigating to protected pages
   */
  public async ensureAuthState(): Promise<boolean> {
    if (this.currentState.isLoading || !this.currentState.isValidated) {
      // Wait for initialization and validation to complete
      return new Promise((resolve) => {
        const checkState = () => {
          if (!this.currentState.isLoading && this.currentState.isValidated) {
            resolve(this.currentState.isAuthenticated);
          } else {
            setTimeout(checkState, 50);
          }
        };
        checkState();
      });
    }

    if (!this.currentState.isAuthenticated) {
      // Try to initialize from storage if not already authenticated
      await this.initializeAuth();
    }

    return this.currentState.isAuthenticated;
  }

  /**
   * Update authentication state and notify subscribers
   */
  private updateAuthState(newState: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.authStateCallbacks.forEach(callback => callback(this.currentState));
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean): void {
    this.updateAuthState({ isLoading });
  }

  /**
   * Clear authentication state
   */
  private clearAuthState(): void {
    this.clearAuth();
    this.updateAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isValidated: true // Set to true so login page doesn't keep loading
    });
  }

  /**
   * Store authentication data and update state
   */
  private persistAuthState(user: User, token: string): void {
    this.storeAuth(token, user);
    this.updateAuthState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      isValidated: true
    });
  }

  // Authentication methods

  /**
   * Login user
   */
  public async login(credentials: LoginRequest): Promise<AuthResponse> {
    return authLogger.logOperation(
      AuthOperation.LOGIN,
      'User login',
      async () => {
        this.setLoading(true);
        
        authLogger.info(AuthOperation.LOGIN, 'Login attempt started', {
          email: credentials.email
        });
        
        try {
          const response = await AuthErrorHandler.withRetry(
            async () => {
              const result = await this.post<AuthResponse>("/login", credentials, { skipAuth: true });
              
              if (!result.success) {
                return {
                  success: false,
                  message: result.message || 'Login failed'
                };
              }
              
              return result;
            },
            'login',
            { maxRetries: 2 }
          );
          
          // Auth responses now have user and token at root level (not wrapped in data)
          const user = (response as any).data?.user || (response as any).user;
          const token = (response as any).data?.token || (response as any).token;

          if (response.success && user && token) {
            const authResponse: AuthResponse = {
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.name || `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim(),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                emailVerified: user.emailVerified || false
              },
              token: token,
              message: response.data?.message || response.message
            };

            authLogger.info(AuthOperation.LOGIN, 'Login successful', {
              userId: authResponse.user.id,
              email: authResponse.user.email
            });

            this.persistAuthState(authResponse.user, authResponse.token);
            return authResponse;
          }
          
          this.setLoading(false);
          authLogger.warn(AuthOperation.LOGIN, 'Login failed - invalid response format');
          return {
            success: false,
            message: response.message || 'Login failed'
          };
        } catch (error) {
          this.setLoading(false);
          
          if (error instanceof Error && 'type' in error) {
            const authError = error as unknown as AuthError;
            authLogger.error(AuthOperation.LOGIN, 'Login failed with auth error', {
              errorType: authError.type
            }, new Error(authError.message));
            AuthErrorHandler.logError(authError);
            return {
              success: false,
              message: AuthErrorHandler.getUserMessage(authError)
            };
          }
          
          const authError = AuthErrorHandler.parseNetworkError(error as Error, 'login');
          authLogger.error(AuthOperation.LOGIN, 'Login failed with network error', {}, new Error(authError.message));
          AuthErrorHandler.logError(authError);
          return {
            success: false,
            message: AuthErrorHandler.getUserMessage(authError)
          };
        }
      }
    );
  }

  /**
   * Register new user
   */
  public async register(userData: RegisterRequest): Promise<AuthResponse> {
    this.setLoading(true);
    
    try {
      // Pass the data directly - it already has firstName and lastName
      const jobSeekerData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
        acceptTerms: userData.acceptTerms
      };

      const response = await AuthErrorHandler.withRetry(
        async () => {
          const result = await this.post<AuthResponse>("/register", jobSeekerData, { skipAuth: true });
          
          if (!result.success) {
            // Create appropriate error based on response
            let errorType = AuthErrorType.REGISTRATION_FAILED;
            
            // Check both message and error fields for error details
            const errorMessage = (result.message || (typeof result.error === 'string' ? result.error : '') || '').toLowerCase();
            
            if (errorMessage.includes('already exists')) {
              errorType = AuthErrorType.EMAIL_ALREADY_EXISTS;
            } else if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
              errorType = AuthErrorType.INVALID_EMAIL;
            } else if (errorMessage.includes('password')) {
              errorType = AuthErrorType.WEAK_PASSWORD;
            } else if (errorMessage.includes('validation') || result.errors) {
              errorType = AuthErrorType.VALIDATION_ERROR;
            }
            
            const authError = AuthErrorHandler.createError(
              errorType,
              'registration',
              { response: result, errors: result.errors }
            );
            
            throw authError;
          }
          
          return result;
        },
        'registration',
        { maxRetries: 2 } // Limit retries for registration attempts
      );
      
      if (response.success && response.data?.user && response.data?.token) {
        // Transform response to match expected format
        const authResponse: AuthResponse = {
          success: true,
          user: {
            id: response.data.user.id,
            email: response.data.user.email,
            name: response.data.user.name || `${(response.data.user as any).firstName || ''} ${(response.data.user as any).lastName || ''}`.trim(),
            createdAt: response.data.user.createdAt,
            updatedAt: response.data.user.updatedAt,
            emailVerified: response.data.user.emailVerified || false
          },
          token: response.data.token,
          message: response.data.message || response.message
        };

        this.persistAuthState(authResponse.user, authResponse.token);
        return authResponse;
      }
      
      this.setLoading(false);
      return {
        success: false,
        message: typeof response.error === 'string' ? response.error : response.message || 'Registration failed',
        errors: response.errors
      };
    } catch (error) {
      this.setLoading(false);
      
      if (error instanceof Error && 'type' in error) {
        const authError = error as unknown as AuthError;
        AuthErrorHandler.logError(authError);
        return {
          success: false,
          message: AuthErrorHandler.getUserMessage(authError),
          errors: authError.details?.errors,
          error: authError.message
        };
      }
      
      const authError = AuthErrorHandler.parseNetworkError(error as Error, 'registration');
      AuthErrorHandler.logError(authError);
      return {
        success: false,
        message: AuthErrorHandler.getUserMessage(authError),
        error: authError.message
      };
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      await this.post("/logout");
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthState();
    }
  }

  /**
   * Get current user from server
   */
  public async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.get<{ user: User }>("/me");
      
      if (response.success && response.data?.user) {
        const user = response.data.user;
        this.updateAuthState({ user });
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      
      // Only clear auth state for actual authentication errors (401/403)
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        console.log('🧹 Clearing auth state due to authentication error');
        this.clearAuthState();
      } else {
        console.log('⚠️ Network/server error during getCurrentUser, keeping auth state');
      }
      
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await AuthErrorHandler.withRetry(
        async () => {
          const result = await this.post<AuthResponse>("/refresh", undefined, { skipTokenRefresh: true });
          
          if (!result.success) {
            const authError = AuthErrorHandler.createError(
              AuthErrorType.TOKEN_REFRESH_FAILED,
              'token_refresh',
              { response: result }
            );
            throw authError;
          }
          
          return result;
        },
        'token_refresh',
        { maxRetries: 1 } // Only retry once for token refresh
      );
      
      if (response.success && response.data?.token && response.data?.user) {
        this.persistAuthState(response.data.user, response.data.token);
        return {
          success: true,
          user: response.data.user,
          token: response.data.token,
          message: response.data.message || response.message
        };
      }
      
      this.clearAuthState();
      return {
        success: false,
        message: typeof response.error === 'string' ? response.error : response.message || 'Token refresh failed'
      };
    } catch (error) {
      if (error instanceof Error && 'type' in error) {
        const authError = error as unknown as AuthError;
        AuthErrorHandler.logError(authError);
        this.clearAuthState();
        return {
          success: false,
          message: AuthErrorHandler.getUserMessage(authError),
          error: authError
        };
      }
      
      const authError = AuthErrorHandler.parseNetworkError(error as Error, 'token_refresh');
      AuthErrorHandler.logError(authError);
      this.clearAuthState();
      return {
        success: false,
        message: AuthErrorHandler.getUserMessage(authError),
        error: authError.message
      };
    }
  }

  /**
   * Check if current token is expired or expiring soon
   */
  public isTokenExpired(): boolean {
    try {
      const token = this.currentState.token || localStorage.getItem("authToken");
      if (!token) return true;

      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
      
      // Check if token is expired or will expire within buffer time
      return currentTime >= (expirationTime - bufferTime);
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired if we can't parse
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(): Date | null {
    try {
      const token = this.currentState.token || localStorage.getItem("authToken");
      if (!token) return null;

      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Ensure token is valid and refresh if needed
   */
  public async ensureValidToken(): Promise<boolean> {
    if (!this.currentState.isAuthenticated) {
      return false;
    }

    if (this.isTokenExpired()) {
      const refreshResult = await this.refreshToken();
      return refreshResult.success;
    }

    return true;
  }

  // Password management

  /**
   * Request password reset
   */
  public async requestPasswordReset(data: PasswordResetRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>("/forgot-password", data, { skipAuth: true });
    return {
      success: response.success,
      message: response.data?.message || response.message || (typeof response.error === 'string' ? response.error : 'Password reset request failed')
    };
  }

  /**
   * Confirm password reset
   */
  public async confirmPasswordReset(data: PasswordResetConfirm): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>("/reset-password", data, { skipAuth: true });
    return {
      success: response.success,
      message: response.data?.message || response.message || (typeof response.error === 'string' ? response.error : 'Password reset failed')
    };
  }

  /**
   * Change password
   */
  public async changePassword(data: ChangePasswordRequest): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>("/change-password", data);
    return {
      success: response.success,
      message: response.data?.message || response.message || (typeof response.error === 'string' ? response.error : 'Password change failed')
    };
  }

  // Profile management

  /**
   * Update user profile
   */
  public async updateProfile(data: UpdateProfileRequest): Promise<AuthResponse> {
    const response = await this.put<AuthResponse>("/profile", data);
    
    if (response.success && response.data?.user) {
      this.updateAuthState({ user: response.data.user });
    }
    
    return {
      success: response.success,
      user: response.data?.user,
      message: response.data?.message || response.message || (typeof response.error === 'string' ? response.error : 'Profile update failed')
    };
  }

  // Email verification

  /**
   * Resend verification email
   */
  public async resendVerificationEmail(): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>("/resend-verification");
    return {
      success: response.success,
      message: response.data?.message || response.message || (typeof response.error === 'string' ? response.error : 'Failed to resend verification email')
    };
  }

  /**
   * Verify email with token
   */
  public async verifyEmail(token: string): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>("/verify-email", { token }, { skipAuth: true });
    return {
      success: response.success,
      message: response.data?.message || response.message || (typeof response.error === 'string' ? response.error : 'Email verification failed')
    };
  }

  // Utility methods

  /**
   * Check if user is authenticated (override base method to use state)
   */
  public isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  /**
   * Get authentication headers for API calls
   */
  public getAuthHeaders(): Record<string, string> {
    const token = this.currentState.token || localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Get stored user (override base method to use state)
   */
  public getStoredUser(): User | null {
    return this.currentState.user;
  }

  /**
   * Check if user is authenticated using localStorage (for compatibility)
   */
  public isAuthenticatedFromStorage(): boolean {
    return super.isAuthenticated();
  }

  /**
   * Get stored user from localStorage (for compatibility)
   */
  public getStoredUserFromStorage(): any | null {
    return super.getStoredUser();
  }
}

// Export singleton instance
export const unifiedAuthService = new UnifiedAuthService();
export default unifiedAuthService;