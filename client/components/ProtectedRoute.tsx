/**
 * Protected Route Component
 * Simple, immediate authentication check without complex state management
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Simple loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Verifying authentication...</p>
    </div>
  </div>
);

// Check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    console.log('🔍 Checking token expiration for:', token.substring(0, 50) + '...');
    
    // Check if token is a JWT (has 3 parts)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.log('⚠️ Token is not JWT format (not 3 parts), treating as valid:', tokenParts.length, 'parts');
      return false; // Not a JWT, assume valid (could be a simple token)
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const isExpired = currentTime >= expirationTime;
    
    console.log('🔍 Token expiration details:', {
      currentTime: new Date(currentTime).toISOString(),
      expirationTime: new Date(expirationTime).toISOString(),
      isExpired,
      timeUntilExpiry: expirationTime - currentTime,
      payload: payload
    });
    
    return isExpired;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    console.log('⚠️ Token parsing failed, assuming valid to prevent blocking user');
    return false; // Don't assume expired if we can't parse - let server decide
  }
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    // Add a small delay to prevent flickering
    const checkAuth = async () => {
      // Give time for any localStorage updates to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('user');
      
      console.log('🔐 ProtectedRoute check:', { 
        token: token ? `EXISTS (${token.substring(0, 20)}...)` : 'MISSING (null)', 
        user: user ? 'EXISTS' : 'MISSING (null)',
        location: location.pathname,
        tokenType: typeof token,
        userType: typeof user,
        tokenExpired: token ? isTokenExpired(token) : 'N/A'
      });
      
      // Check if we have both token and user data
      if (!token || !user) {
        console.log('❌ Redirecting to login - missing auth data');
        setShouldRedirect(true);
        setIsChecking(false);
        return;
      }
      
      // Check if token is expired
      if (isTokenExpired(token)) {
        console.log('⏰ Token expired - redirecting to login');
        // Clear expired token
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setShouldRedirect(true);
        setIsChecking(false);
        return;
      }
      
      console.log('✅ Auth check passed, rendering protected content');
      setIsChecking(false);
    };
    
    checkAuth();
  }, [location.pathname]);
  
  // Show loading while checking
  if (isChecking) {
    return <LoadingSpinner />;
  }
  
  // Redirect if auth check failed
  if (shouldRedirect) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;