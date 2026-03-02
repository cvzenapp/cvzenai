/**
 * Authentication Error Boundary
 * Catches and handles authentication-related errors in React components
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AuthError, AuthErrorHandler, AuthErrorType } from '../services/authErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: (error: AuthError, retry: () => void) => ReactNode;
  onError?: (error: AuthError, errorInfo: ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error: AuthError | null;
  errorInfo: ErrorInfo | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Convert any error to AuthError
    const authError = AuthErrorBoundary.convertToAuthError(error);
    
    return {
      hasError: true,
      error: authError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const authError = AuthErrorBoundary.convertToAuthError(error, this.props.context);
    
    // Log the error
    AuthErrorHandler.logError(authError, 'error');
    
    // Update state with error info
    this.setState({
      error: authError,
      errorInfo
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(authError, errorInfo);
    }

    // Handle authentication errors that require re-login
    if (AuthErrorHandler.requiresReauth(authError)) {
      this.handleAuthenticationFailure(authError);
    }
  }

  /**
   * Convert generic Error to AuthError
   */
  private static convertToAuthError(error: Error, context?: string): AuthError {
    // If it's already an AuthError, return as is
    if (AuthErrorHandler.isAuthError(error)) {
      return error as AuthError;
    }

    // Try to determine error type from error message
    let errorType: AuthErrorType = AuthErrorType.UNKNOWN_ERROR;
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorType = AuthErrorType.UNAUTHORIZED;
    } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
      errorType = AuthErrorType.UNAUTHORIZED;
    } else if (error.message.includes('token') && error.message.includes('expired')) {
      errorType = AuthErrorType.TOKEN_EXPIRED;
    } else if (error.message.includes('token') && error.message.includes('invalid')) {
      errorType = AuthErrorType.TOKEN_INVALID;
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = AuthErrorType.NETWORK_ERROR;
    } else if (error.message.includes('timeout')) {
      errorType = AuthErrorType.TIMEOUT_ERROR;
    }

    return AuthErrorHandler.createError(errorType, context, { originalError: error.message }, error);
  }

  /**
   * Handle authentication failures that require user action
   */
  private handleAuthenticationFailure(error: AuthError): void {
    // Clear any stored authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // Redirect to login if we're not already there
    if (typeof window !== 'undefined' && window.location) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Store current path for redirect after login
        localStorage.setItem('redirectAfterLogin', currentPath);
        
        // Small delay to allow error display before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  }

  /**
   * Retry the failed operation
   */
  private handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default error UI
      return <DefaultAuthErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Default fallback component for authentication errors
 */
interface DefaultAuthErrorFallbackProps {
  error: AuthError;
  onRetry: () => void;
}

const DefaultAuthErrorFallback: React.FC<DefaultAuthErrorFallbackProps> = ({ error, onRetry }) => {
  const isRetryable = AuthErrorHandler.isRetryable(error);
  const requiresReauth = AuthErrorHandler.requiresReauth(error);
  const isTemporary = AuthErrorHandler.isTemporary(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="mx-auto h-12 w-12 text-red-500">
            {requiresReauth ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : isTemporary ? (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Error Title */}
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {requiresReauth ? 'Authentication Required' : 
             isTemporary ? 'Temporary Issue' : 
             'Something Went Wrong'}
          </h2>

          {/* Error Message */}
          <p className="mt-2 text-sm text-gray-600">
            {AuthErrorHandler.getUserMessage(error)}
          </p>

          {/* Error Details (in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 font-mono">
                <div><strong>Type:</strong> {error.type}</div>
                <div><strong>Message:</strong> {error.message}</div>
                <div><strong>Context:</strong> {error.context || 'Unknown'}</div>
                <div><strong>Timestamp:</strong> {error.timestamp.toISOString()}</div>
                {error.details && (
                  <div><strong>Details:</strong> {JSON.stringify(error.details, null, 2)}</div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            {requiresReauth ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  You will be redirected to login in a moment...
                </p>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go to Login
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {isRetryable && (
                  <button
                    onClick={onRetry}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Refresh Page
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Go Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Higher-order component to wrap components with authentication error boundary
 */
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string,
  fallback?: (error: AuthError, retry: () => void) => ReactNode
) {
  const WrappedComponent = (props: P) => (
    <AuthErrorBoundary context={context} fallback={fallback}>
      <Component {...props} />
    </AuthErrorBoundary>
  );

  WrappedComponent.displayName = `withAuthErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default AuthErrorBoundary;