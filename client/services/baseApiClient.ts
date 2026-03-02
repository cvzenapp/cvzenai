/**
 * Base API Client
 * Provides unified authentication and request handling for all API services
 */

import { AuthError, AuthErrorHandler, AuthErrorType } from './authErrorHandler';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | AuthError;
  message?: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  retries?: number;
  skipTokenRefresh?: boolean;
}

export class BaseApiClient {
  protected baseUrl: string;
  private maxRetries = 2; // Reduced from 3 to prevent excessive retries
  private refreshPromise: Promise<boolean> | null = null;
  private tokenExpirationBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  private failedRequestCount = 0;
  private maxFailedRequests = 5; // Reduced from 10 to trigger circuit breaker sooner
  private lastRequestTime = 0;
  private minRequestInterval = 200; // Increased from 100ms to 200ms
  private pendingRequests = new Map<string, Promise<ApiResponse<any>>>();
  private requestAttempts = new Map<string, number>(); // Track attempts per endpoint

  constructor(baseUrl: string = '/api') {
    // In production on Netlify, ensure we use the correct API path
    if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
      // Netlify redirects /api/* to /.netlify/functions/api/*
      this.baseUrl = baseUrl;
    } else {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Reset the circuit breaker (useful for recovery)
   */
  public resetCircuitBreaker(): void {
    this.failedRequestCount = 0;
  }

  /**
   * Get authentication headers consistently across all API calls
   */
  protected getAuthHeaders(): Record<string, string> {
    // Try both job seeker and recruiter tokens
    const token = localStorage.getItem("authToken") || localStorage.getItem("recruiter_token");
    console.log('🔐 BaseApiClient - Getting auth headers:', {
      hasToken: !!token,
      tokenValue: token,
      tokenType: typeof token,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none',
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
      hasAuthToken: !!localStorage.getItem("authToken"),
      hasRecruiterToken: !!localStorage.getItem("recruiter_token")
    });
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Check if token is expired or will expire soon
   */
  private isTokenExpired(): boolean {
    try {
      // Try both job seeker and recruiter tokens
      const token = localStorage.getItem("authToken") || localStorage.getItem("recruiter_token");
      if (!token) {
        console.log('🔐 No token found in localStorage');
        return true;
      }

      // Check if token is a JWT (has 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        // Not a JWT token, assume it's valid for now
        console.log('🔐 Token is not a JWT format (not 3 parts), assuming valid');
        return false;
      }

      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(tokenParts[1]));
      
      if (!payload.exp) {
        console.log('🔐 JWT token has no expiration (exp), assuming valid');
        return false;
      }
      
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const isExpired = currentTime >= (expirationTime - this.tokenExpirationBuffer);
      
      if (isExpired) {
        console.log('🔐 Token is expired or expiring soon:', {
          expiresAt: new Date(expirationTime).toISOString(),
          currentTime: new Date(currentTime).toISOString(),
          bufferMinutes: this.tokenExpirationBuffer / 60000
        });
      }

      return isExpired;
    } catch (error) {
      console.error('❌ Error checking token expiration:', error);
      console.log('🔐 Assuming token is valid due to parse error (prevents infinite loops)');
      return false; // Don't assume expired if we can't parse - prevents infinite loops
    }
  }

  /**
   * Check if token will expire soon (within buffer time)
   */
  private isTokenExpiringSoon(): boolean {
    try {
      // Try both job seeker and recruiter tokens
      const token = localStorage.getItem("authToken") || localStorage.getItem("recruiter_token");
      if (!token) return false;

      // Check if token is a JWT (has 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        // Not a JWT token, assume it's not expiring soon
        return false;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000;
      const currentTime = Date.now();

      return currentTime >= (expirationTime - this.tokenExpirationBuffer);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!localStorage.getItem("authToken");
  }

  /**
   * Get stored user data
   */
  public getStoredUser(): any | null {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check if we're on a public page that shouldn't clear auth
   */
  private isPublicPage(): boolean {
    if (typeof window === 'undefined' || !window.location) return false;
    
    const currentPath = window.location.pathname;
    const publicPaths = ['/shared/resume/', '/shared/'];
    
    return publicPaths.some(path => currentPath.startsWith(path));
  }

  /**
   * Clear authentication data (only if not on public page)
   */
  public clearAuth(): void {
    // Don't clear auth on public pages - user might be viewing shared content while logged in
    if (this.isPublicPage()) {
      console.log('⏭️ Skipping auth clear - on public page:', window.location.pathname);
      return;
    }
    
    // Don't clear auth if we're just having temporary API issues
    // Only clear on explicit logout or confirmed auth failures
    console.log('🚨 clearAuth() called - this will log out the user');
    console.trace('Stack trace to see what triggered clearAuth:');
    
    // Clear job seeker auth
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId"); // Quick signup userId
    
    // Clear recruiter auth (all possible keys)
    localStorage.removeItem("recruiter_token");
    localStorage.removeItem("recruiter_user");
    localStorage.removeItem("recruiterAuthToken");
    localStorage.removeItem("recruiterUser");
    
    // Clear redirect path
    localStorage.removeItem("redirectAfterLogin");
    
    // Clear all customization and template CSS from DOM
    const customizationStyle = document.getElementById('customization-styles');
    if (customizationStyle) {
      customizationStyle.remove();
    }
    const templateStyle = document.getElementById('template-customization-styles');
    if (templateStyle) {
      templateStyle.remove();
    }
  }

  /**
   * Store authentication data
   */
  public storeAuth(token: string, user: any): void {
    try {
      if (!token || typeof token !== 'string' || token === 'null' || token === 'undefined') {
        console.error('❌ Invalid token provided to storeAuth:', { token, type: typeof token });
        throw new Error('Invalid token: token must be a non-empty string');
      }

      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));

      const storedToken = localStorage.getItem("authToken");
      if (!storedToken || storedToken !== token) {
        console.error('❌ Failed to store auth token in localStorage');
        throw new Error('Failed to store authentication data');
      }
    } catch (error) {
      console.error('❌ Error storing auth data:', error);
      throw error;
    }
  }

  /**
   * Handle token refresh with proper concurrency control
   */
  private async handleTokenRefresh(): Promise<boolean> {
    // If a refresh is already in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Start a new refresh operation
    this.refreshPromise = this.performTokenRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Clear the promise when done
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh operation
   */
  private async performTokenRefresh(): Promise<boolean> {
    try {
      // Use the current token for refresh request
      const currentToken = localStorage.getItem("authToken");
      if (!currentToken) {
        return false;
      }

      // Determine the correct refresh endpoint based on the base URL
      let refreshEndpoint = '/refresh';
      if (this.baseUrl.includes('/jobseeker/auth')) {
        refreshEndpoint = '/api/auth/refresh';
      } else if (this.baseUrl.includes('/recruiter/auth')) {
        refreshEndpoint = '/api/recruiter/auth/refresh';
      } else if (this.baseUrl.includes('/auth')) {
        refreshEndpoint = '/api/auth/refresh';
      } else {
        // Default fallback - try jobseeker auth first
        refreshEndpoint = '/api/auth/refresh';
      }

      const response = await fetch(refreshEndpoint, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.token) {
          this.storeAuth(data.data.token, data.data.user);
          return true;
        } else if (data.token) {
          // Handle different response formats
          this.storeAuth(data.token, data.user);
          return true;
        }
      }

      // If refresh failed, clear auth data
      if (response.status === 401 || response.status === 403) {
        // Don't clear auth if we're on dashboard - could be temporary issue
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        const isOnDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');
        
        if (!isOnDashboard) {
          this.clearAuth();
        } else {
          console.log('⏭️ Token refresh got 401/403 on dashboard, not clearing auth');
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Don't clear auth on network errors, only on auth errors
    }

    return false;
  }

  /**
   * Proactively refresh token if it's expiring soon
   */
  private async refreshTokenIfNeeded(): Promise<void> {
    if (this.isTokenExpiringSoon() && !this.refreshPromise) {
      try {
        await this.handleTokenRefresh();
      } catch (error) {
        console.error('Proactive token refresh failed:', error);
      }
    }
  }

  /**
   * Make HTTP request with unified error handling and authentication
   */
  public async makeRequest<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, retries = this.maxRetries, skipTokenRefresh = false, ...requestConfig } = config;

    // Throttle requests to prevent rapid-fire API calls
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    // Prevent duplicate simultaneous requests to the same endpoint
    const requestKey = `${requestConfig.method || 'GET'}:${endpoint}`;
    if (this.pendingRequests.has(requestKey)) {
      console.log('🔄 Reusing pending request for:', requestKey);
      return this.pendingRequests.get(requestKey)!;
    }

    // Track attempts per endpoint to prevent runaway retries
    const attemptCount = this.requestAttempts.get(requestKey) || 0;
    if (attemptCount >= 5) { // Max 5 attempts per endpoint in a short time
      console.error('🚨 Too many attempts for endpoint:', requestKey, 'count:', attemptCount);
      return {
        success: false,
        error: 'Too many retry attempts for this endpoint',
        message: 'Request temporarily blocked due to excessive retries'
      };
    }
    this.requestAttempts.set(requestKey, attemptCount + 1);

    // Create and store the request promise
    const requestPromise = this.executeRequest<T>(endpoint, config);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // Reset attempt counter on success
      if (result.success) {
        this.requestAttempts.delete(requestKey);
      }
      
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(requestKey);
      
      // Reset attempt counter after 30 seconds
      setTimeout(() => {
        this.requestAttempts.delete(requestKey);
      }, 30000);
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, retries = this.maxRetries, skipTokenRefresh = false, ...requestConfig } = config;

    // Circuit breaker: if too many requests have failed, stop making requests
    if (this.failedRequestCount >= this.maxFailedRequests) {
      console.error('🚨 Circuit breaker activated: too many failed requests', {
        failedCount: this.failedRequestCount,
        maxFailed: this.maxFailedRequests,
        endpoint
      });
      return {
        success: false,
        error: 'Too many failed requests. Please refresh the page.',
        message: 'Service temporarily unavailable'
      };
    }

    // Check token expiration before making the request (unless skipping auth)
    if (!skipAuth && !skipTokenRefresh) {
      if (this.isTokenExpired()) {
        // Token is expired, try to refresh
        const refreshed = await this.handleTokenRefresh();
        if (!refreshed) {
          // Refresh failed, redirect to login
          this.clearAuth();
          this.redirectToLogin();
          const authError = AuthErrorHandler.createError(
            AuthErrorType.TOKEN_EXPIRED,
            `api_request_${endpoint}`,
            { endpoint, skipAuth, skipTokenRefresh }
          );
          return {
            success: false,
            error: authError,
            message: AuthErrorHandler.getUserMessage(authError)
          };
        }
      } else {
        // Proactively refresh if token is expiring soon
        await this.refreshTokenIfNeeded();
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    console.log('🌐 API Request:', {
      endpoint,
      baseUrl: this.baseUrl,
      constructedUrl: url,
      startsWithHttp: endpoint.startsWith('http')
    });

    const headers = {
      ...(skipAuth ? { "Content-Type": "application/json" } : this.getAuthHeaders()),
      ...(requestConfig.headers || {}),
    };

    let lastError: AuthError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      console.log(`🔄 API Request attempt ${attempt + 1}/${retries + 1} for ${endpoint}`);
      console.log('url', url);
      try {
        const response = await fetch(url, {
          ...requestConfig,
          headers,
        });

        // Handle 401 - Unauthorized
        if (response.status === 401 && !skipAuth && !skipTokenRefresh) {
          console.log(`🔐 Got 401 on attempt ${attempt + 1}, skipAuth: ${skipAuth}, skipTokenRefresh: ${skipTokenRefresh}`);
          console.log('🔐 Current auth state:', {
            hasToken: !!localStorage.getItem('authToken'),
            hasUser: !!localStorage.getItem('user'),
            tokenPrefix: localStorage.getItem('authToken')?.substring(0, 20) + '...',
            url: url,
            headers: headers,
            currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
          });
          
          // Don't clear auth if we're on dashboard - could be a temporary API issue
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          const isOnDashboard = currentPath === '/dashboard' || currentPath.startsWith('/dashboard/');
          
          // Only attempt refresh on first attempt to avoid infinite loops
          if (attempt === 0) {
            const refreshed = await this.handleTokenRefresh();
            if (refreshed) {
              // Retry with new token
              const newHeaders = {
                ...this.getAuthHeaders(),
                ...(requestConfig.headers || {}),
              };
              const retryResponse = await fetch(url, {
                ...requestConfig,
                headers: newHeaders,
              });

              if (retryResponse.ok) {
                const data = await retryResponse.json();
                return this.normalizeResponse<T>(data);
              } else if (retryResponse.status === 401) {
                // Still getting 401 after refresh
                if (!isOnDashboard) {
                  // Only clear auth and redirect if not on dashboard
                  console.log('🔐 Still getting 401 after token refresh - auth is invalid');
                  this.clearAuth();
                  this.redirectToLogin();
                } else {
                  console.log('⏭️ Got 401 on dashboard, not clearing auth - might be temporary API issue');
                }
                const authError = AuthErrorHandler.createError(
                  AuthErrorType.UNAUTHORIZED,
                  `api_request_${endpoint}`,
                  { endpoint, attempt: 'retry_after_refresh' }
                );
                return {
                  success: false,
                  error: authError,
                  message: AuthErrorHandler.getUserMessage(authError)
                };
              }
            } else {
              // Refresh failed
              if (!isOnDashboard) {
                // Only clear auth and redirect if not on dashboard
                this.clearAuth();
                this.redirectToLogin();
              } else {
                console.log('⏭️ Token refresh failed on dashboard, not clearing auth - might be temporary issue');
              }
              const authError = AuthErrorHandler.createError(
                AuthErrorType.TOKEN_REFRESH_FAILED,
                `api_request_${endpoint}`,
                { endpoint, attempt }
              );
              return {
                success: false,
                error: authError,
                message: AuthErrorHandler.getUserMessage(authError)
              };
            }
          } else {
            // Multiple 401s
            if (!isOnDashboard) {
              // Only clear auth and redirect if not on dashboard
              this.clearAuth();
              this.redirectToLogin();
            } else {
              console.log('⏭️ Multiple 401s on dashboard, not clearing auth - might be temporary API issue');
            }
            const authError = AuthErrorHandler.createError(
              AuthErrorType.UNAUTHORIZED,
              `api_request_${endpoint}`,
              { endpoint, attempt, multiple_401s: true }
            );
            return {
              success: false,
              error: authError,
              message: AuthErrorHandler.getUserMessage(authError)
            };
          }
        }

        if (response.ok) {
          console.log('📥 API Response OK:', {
            url,
            status: response.status,
            statusText: response.statusText
          });
          const data = await response.json();
          console.log('✅ API Response Data:', data);
          // Reset failed request counter on success
          this.failedRequestCount = 0;
          return this.normalizeResponse<T>(data);
        }

        // Handle other HTTP errors with proper error parsing
        const errorData = await response.json().catch(() => null);
        const authError = AuthErrorHandler.parseHttpError(
          response,
          errorData,
          `api_request_${endpoint}`
        );

        // Don't retry on client errors (4xx) except 401 which is handled above
        if (response.status >= 400 && response.status < 500 && response.status !== 401) {
          AuthErrorHandler.logError(authError, 'warn');
          return {
            success: false,
            error: authError,
            message: AuthErrorHandler.getUserMessage(authError),
            errors: errorData?.errors
          };
        }

        // For server errors (5xx), don't increment failed request counter for interview endpoints
        // This prevents circuit breaker from triggering due to database connectivity issues
        if (response.status >= 500 && !endpoint.includes('/interviews/')) {
          this.failedRequestCount++;
        }

        lastError = authError;

      } catch (error) {
        const authError = AuthErrorHandler.parseNetworkError(
          error as Error,
          `api_request_${endpoint}`
        );
        lastError = authError;

        // Increment failed request counter
        this.failedRequestCount++;

        // Don't retry on network errors if this is the last attempt
        if (attempt === retries) {
          break;
        }

        // Check circuit breaker before retrying
        if (this.failedRequestCount >= this.maxFailedRequests) {
          console.error('🚨 Circuit breaker triggered during retry, stopping attempts');
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = AuthErrorHandler.calculateRetryDelay(attempt);
        console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 2}`);
        await new Promise(resolve => setTimeout(resolve, delay));

        AuthErrorHandler.logError(authError, 'warn');
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      AuthErrorHandler.logError(lastError, 'error');
      return {
        success: false,
        error: lastError,
        message: AuthErrorHandler.getUserMessage(lastError)
      };
    }

    // Fallback error
    const fallbackError = AuthErrorHandler.createError(
      AuthErrorType.UNKNOWN_ERROR,
      `api_request_${endpoint}`,
      { endpoint, retries, maxRetries: this.maxRetries }
    );

    AuthErrorHandler.logError(fallbackError, 'error');
    return {
      success: false,
      error: fallbackError,
      message: AuthErrorHandler.getUserMessage(fallbackError)
    };
  }

  /**
   * Redirect to login page when authentication fails
   */
  private redirectToLogin(): void {
    if (typeof window !== 'undefined' && window.location) {
      try {
        // IMPORTANT: Don't redirect if we're on a public/shared page
        // Public pages should not trigger authentication redirects
        if (this.isPublicPage()) {
          console.log('⏭️ Skipping redirect - on public page:', window.location.pathname);
          // Don't redirect - user might be a logged-in recruiter viewing a shared resume
          // clearAuth() will also be skipped automatically due to isPublicPage() check
          return;
        }
        
        // Don't redirect if we're just switching tabs in the dashboard
        // This prevents the interview tab from logging out users
        const currentPath = window.location.pathname;
        if (currentPath === '/dashboard' || currentPath.startsWith('/dashboard/')) {
          console.log('⏭️ Skipping redirect - on dashboard page, might be temporary API issue');
          // Don't clear auth on dashboard - could be a temporary API issue
          return;
        }
        
        // Log why we're redirecting
        console.log('🚨 REDIRECT TO LOGIN TRIGGERED');
        console.trace('Stack trace:'); // This will show where the redirect was called from

        // Store the current path to redirect back after login
        const fullPath = currentPath + window.location.search;
        const redirectPath = fullPath !== '/login' && fullPath !== '/register' ? fullPath : null;
        
        // Clear auth data (this is effectively a logout)
        this.clearAuth();
        
        // Store redirect path AFTER clearing auth
        if (redirectPath) {
          localStorage.setItem('redirectAfterLogin', redirectPath);
          console.log('📍 Will redirect back to:', redirectPath);
        }
        
        // Show user-friendly message
        console.log('🔐 Session expired or invalid. You have been logged out.');
        console.log('💡 If your password was recently changed, please log in with your new password.');

        window.location.href = '/login';
      } catch (error) {
        // Ignore navigation errors in test environment
        console.log('Navigation not available in test environment');
      }
    }
  }

  /**
   * Normalize API responses to consistent format
   */
  private normalizeResponse<T>(data: any): ApiResponse<T> {
    // If response already has success field, use it
    if (typeof data.success === 'boolean') {
      // For auth responses with user and token at root level, keep them there
      if (data.user && data.token) {
        return {
          success: data.success,
          user: data.user,
          token: data.token,
          error: data.error,
          message: data.message,
          errors: data.errors,
          timestamp: new Date().toISOString()
        } as any;
      }

      return {
        success: data.success,
        data: data.data || data.user || data,
        error: data.error,
        message: data.message,
        errors: data.errors,
        timestamp: new Date().toISOString()
      };
    }

    // Otherwise, assume success if we got data
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  public async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...(config || {}), method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...(config || {}),
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      ...(config || {}),
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...(config || {}), method: 'DELETE' });
  }
}