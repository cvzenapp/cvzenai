/**
 * Authentication Initializer Component
 * Handles authentication state initialization on app startup
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthInitializer: React.FC<AuthInitializerProps> = ({ 
  children, 
  fallback 
}) => {
  const { isLoading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Wait for initial auth state to be determined
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  // Show loading state during initialization
  if (!isInitialized || isLoading) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;