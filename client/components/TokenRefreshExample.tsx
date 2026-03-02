/**
 * Token Refresh Example Component
 * Demonstrates how to use the automatic token refresh functionality
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { useApiWithTokenRefresh } from '../hooks/useApiWithTokenRefresh';
import { resumeApi } from '../services/resumeApi';

export const TokenRefreshExample: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{
    isExpired: boolean;
    expiration: Date | null;
    timeUntilExpiration: number | null;
  }>({
    isExpired: false,
    expiration: null,
    timeUntilExpiration: null
  });

  // Use token refresh hook for monitoring
  const {
    isTokenExpired,
    getTokenExpiration,
    getTimeUntilExpiration,
    refreshToken
  } = useTokenRefresh({
    onRefreshSuccess: () => {
      console.log('Token refreshed successfully');
      updateTokenInfo();
    },
    onRefreshFailure: (error) => {
      console.error('Token refresh failed:', error);
      setError(`Token refresh failed: ${error}`);
    }
  });

  // Use API hook for making authenticated calls
  const { callApi } = useApiWithTokenRefresh();

  // Update token information
  const updateTokenInfo = () => {
    setTokenInfo({
      isExpired: isTokenExpired(),
      expiration: getTokenExpiration(),
      timeUntilExpiration: getTimeUntilExpiration()
    });
  };

  // Update token info periodically
  useEffect(() => {
    if (isAuthenticated) {
      updateTokenInfo();
      const interval = setInterval(updateTokenInfo, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Load resumes with automatic token refresh
  const loadResumes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the API hook to ensure token is valid
      const result = await callApi(
        () => resumeApi.getUserResumes(),
        {
          onAuthFailure: (error) => setError(`Authentication failed: ${error}`)
        }
      );

      if (result.success) {
        setResumes(result.data || []);
      } else {
        setError(result.error || 'Failed to load resumes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Manually refresh token
  const handleManualRefresh = async () => {
    setError(null);
    const success = await refreshToken();
    if (success) {
      updateTokenInfo();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-800">Please log in to see token refresh functionality.</p>
      </div>
    );
  }

  const formatTimeUntilExpiration = (milliseconds: number | null): string => {
    if (milliseconds === null) return 'Unknown';
    if (milliseconds <= 0) return 'Expired';
    
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    return `${minutes} minute(s)`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Token Refresh Example</h2>
      
      {/* User Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">User Information</h3>
        <p className="text-blue-800">
          Logged in as: <strong>{user?.name || user?.email}</strong>
        </p>
      </div>

      {/* Token Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Token Information</h3>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Status:</span>{' '}
            <span className={tokenInfo.isExpired ? 'text-red-600' : 'text-green-600'}>
              {tokenInfo.isExpired ? 'Expired' : 'Valid'}
            </span>
          </p>
          <p>
            <span className="font-medium">Expires:</span>{' '}
            {tokenInfo.expiration ? tokenInfo.expiration.toLocaleString() : 'Unknown'}
          </p>
          <p>
            <span className="font-medium">Time until expiration:</span>{' '}
            {formatTimeUntilExpiration(tokenInfo.timeUntilExpiration)}
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh Token Manually
        </button>
      </div>

      {/* API Call Example */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">API Call with Auto Token Refresh</h3>
        <p className="text-gray-600 mb-4">
          This demonstrates making API calls that automatically refresh tokens when needed.
        </p>
        
        <button
          onClick={loadResumes}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Resumes (with Auto Token Refresh)'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {resumes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Loaded Resumes:</h4>
            <ul className="space-y-1">
              {resumes.map((resume, index) => (
                <li key={resume.id || index} className="text-sm text-gray-600">
                  • {resume.title || `Resume ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Implementation Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">How It Works</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Tokens are automatically checked for expiration before API calls</li>
          <li>• If a token is expired or expiring soon (within 5 minutes), it's automatically refreshed</li>
          <li>• If an API call returns 401, the token is refreshed and the call is retried once</li>
          <li>• If token refresh fails, the user is redirected to login</li>
          <li>• Multiple concurrent requests share the same refresh operation to avoid race conditions</li>
        </ul>
      </div>
    </div>
  );
};

export default TokenRefreshExample;