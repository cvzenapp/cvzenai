/**
 * Authentication Error Handling Demo
 * Demonstrates the comprehensive error handling system in action
 */

import React, { useState } from 'react';
import { AuthErrorHandler, AuthErrorType, AuthError } from '../services/authErrorHandler';
import { AuthErrorNotification, useAuthErrorNotification } from './AuthErrorNotification';
import { AuthErrorBoundary } from './AuthErrorBoundary';

// Demo component that can simulate different error types
const ErrorSimulator: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorType, setErrorType] = useState<AuthErrorType>(AuthErrorType.NETWORK_ERROR);
  const { error, showError, clearError } = useAuthErrorNotification();

  const simulateError = () => {
    const authError = AuthErrorHandler.createError(
      errorType,
      'demo_simulation',
      { userAction: 'button_click', timestamp: new Date().toISOString() }
    );
    
    showError(authError);
  };

  const simulateComponentError = () => {
    setShouldThrow(true);
  };

  const resetComponentError = () => {
    setShouldThrow(false);
  };

  if (shouldThrow) {
    const error = AuthErrorHandler.createError(errorType, 'component_error');
    throw error;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Error Handling Demo
        </h2>
        <p className="text-gray-600 mb-6">
          This demo showcases the comprehensive error handling system for authentication operations.
        </p>

        {/* Error Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Error Type:
          </label>
          <select
            value={errorType}
            onChange={(e) => setErrorType(e.target.value as AuthErrorType)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value={AuthErrorType.NETWORK_ERROR}>Network Error</option>
            <option value={AuthErrorType.INVALID_CREDENTIALS}>Invalid Credentials</option>
            <option value={AuthErrorType.TOKEN_EXPIRED}>Token Expired</option>
            <option value={AuthErrorType.EMAIL_ALREADY_EXISTS}>Email Already Exists</option>
            <option value={AuthErrorType.SERVER_ERROR}>Server Error</option>
            <option value={AuthErrorType.RATE_LIMITED}>Rate Limited</option>
            <option value={AuthErrorType.VALIDATION_ERROR}>Validation Error</option>
          </select>
        </div>

        {/* Demo Actions */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              1. Error Notification Demo
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Shows user-friendly error notifications with appropriate actions.
            </p>
            <button
              onClick={simulateError}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Simulate Error Notification
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              2. Error Boundary Demo
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Shows how React error boundaries catch and handle authentication errors.
            </p>
            <div className="space-x-2">
              <button
                onClick={simulateComponentError}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Trigger Component Error
              </button>
              <button
                onClick={resetComponentError}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Reset Component
              </button>
            </div>
          </div>
        </div>

        {/* Error Information Display */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Error Type Information
          </h3>
          <ErrorTypeInfo errorType={errorType} />
        </div>
      </div>

      {/* Error Notification */}
      <AuthErrorNotification
        error={error}
        onDismiss={clearError}
        onRetry={() => {
          console.log('Retry action triggered');
          clearError();
        }}
        autoHide={true}
        autoHideDelay={10000}
      />
    </div>
  );
};

// Component to display error type information
const ErrorTypeInfo: React.FC<{ errorType: AuthErrorType }> = ({ errorType }) => {
  const error = AuthErrorHandler.createError(errorType, 'info_display');
  
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">Type:</span> {error.type}
      </div>
      <div>
        <span className="font-medium">User Message:</span> {error.userMessage}
      </div>
      <div>
        <span className="font-medium">Technical Message:</span> {error.message}
      </div>
      <div>
        <span className="font-medium">Retryable:</span> {error.retryable ? 'Yes' : 'No'}
      </div>
      <div>
        <span className="font-medium">Requires Re-auth:</span> {AuthErrorHandler.requiresReauth(error) ? 'Yes' : 'No'}
      </div>
      <div>
        <span className="font-medium">Temporary:</span> {AuthErrorHandler.isTemporary(error) ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

// Main demo component wrapped with error boundary
const AuthErrorDemo: React.FC = () => {
  return (
    <AuthErrorBoundary context="auth_error_demo">
      <ErrorSimulator />
    </AuthErrorBoundary>
  );
};

export default AuthErrorDemo;