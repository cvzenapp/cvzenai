/**
 * Authentication Error Notification Component
 * Displays user-friendly error notifications for authentication failures
 */

import React, { useState, useEffect } from 'react';
import { AuthError, AuthErrorHandler, AuthErrorType } from '../services/authErrorHandler';

interface AuthErrorNotificationProps {
  error: AuthError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  position?: 'top' | 'bottom' | 'center';
}

export const AuthErrorNotification: React.FC<AuthErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  autoHide = false,
  autoHideDelay = 5000,
  position = 'top'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      setIsClosing(false);

      // Auto-hide for non-critical errors
      if (autoHide && !AuthErrorHandler.requiresReauth(error)) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onDismiss?.();
    }, 300); // Animation duration
  };

  const handleRetry = () => {
    handleDismiss();
    onRetry?.();
  };

  if (!error || !isVisible) {
    return null;
  }

  const isRetryable = AuthErrorHandler.isRetryable(error);
  const requiresReauth = AuthErrorHandler.requiresReauth(error);
  const isTemporary = AuthErrorHandler.isTemporary(error);

  const getNotificationStyle = () => {
    if (requiresReauth) return 'bg-red-50 border-red-200 text-red-800';
    if (isTemporary) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const getIconColor = () => {
    if (requiresReauth) return 'text-red-400';
    if (isTemporary) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getIcon = () => {
    if (requiresReauth) {
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (isTemporary) {
      return (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const positionClasses = {
    top: 'top-4 left-1/2 transform -translate-x-1/2',
    bottom: 'bottom-4 left-1/2 transform -translate-x-1/2',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 max-w-md w-full mx-auto px-4`}>
      <div
        className={`
          ${getNotificationStyle()}
          border rounded-lg shadow-lg p-4 transition-all duration-300 ease-in-out
          ${isClosing ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}
        `}
      >
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 ${getIconColor()}`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {getErrorTitle(error.type)}
            </h3>
            <p className="mt-1 text-sm">
              {AuthErrorHandler.getUserMessage(error)}
            </p>

            {/* Actions */}
            <div className="mt-3 flex space-x-2">
              {isRetryable && onRetry && (
                <button
                  onClick={handleRetry}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                >
                  Try Again
                </button>
              )}
              
              {requiresReauth && (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current rounded"
                >
                  Go to Login
                </button>
              )}
            </div>
          </div>

          {/* Close button */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
                ${getIconColor()} hover:bg-black hover:bg-opacity-10
              `}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Get user-friendly error title based on error type
 */
function getErrorTitle(errorType: AuthErrorType): string {
  switch (errorType) {
    case AuthErrorType.NETWORK_ERROR:
    case AuthErrorType.CONNECTION_ERROR:
      return 'Connection Problem';
    
    case AuthErrorType.TIMEOUT_ERROR:
      return 'Request Timeout';
    
    case AuthErrorType.INVALID_CREDENTIALS:
      return 'Login Failed';
    
    case AuthErrorType.TOKEN_EXPIRED:
    case AuthErrorType.SESSION_EXPIRED:
      return 'Session Expired';
    
    case AuthErrorType.TOKEN_INVALID:
    case AuthErrorType.UNAUTHORIZED:
      return 'Authentication Required';
    
    case AuthErrorType.TOKEN_REFRESH_FAILED:
      return 'Session Refresh Failed';
    
    case AuthErrorType.EMAIL_ALREADY_EXISTS:
      return 'Email Already Registered';
    
    case AuthErrorType.WEAK_PASSWORD:
      return 'Password Too Weak';
    
    case AuthErrorType.INVALID_EMAIL:
      return 'Invalid Email';
    
    case AuthErrorType.REGISTRATION_FAILED:
      return 'Registration Failed';
    
    case AuthErrorType.SERVER_ERROR:
      return 'Server Error';
    
    case AuthErrorType.SERVICE_UNAVAILABLE:
      return 'Service Unavailable';
    
    case AuthErrorType.RATE_LIMITED:
      return 'Too Many Attempts';
    
    case AuthErrorType.VALIDATION_ERROR:
    case AuthErrorType.MISSING_FIELDS:
      return 'Validation Error';
    
    case AuthErrorType.CONCURRENT_LOGIN:
      return 'Account In Use';
    
    default:
      return 'Error';
  }
}

/**
 * Hook to manage error notifications
 */
export function useAuthErrorNotification() {
  const [error, setError] = useState<AuthError | null>(null);

  const showError = (error: AuthError) => {
    setError(error);
    AuthErrorHandler.logError(error);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    error,
    showError,
    clearError
  };
}

export default AuthErrorNotification;