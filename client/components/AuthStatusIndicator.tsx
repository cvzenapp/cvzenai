/**
 * Authentication Status Indicator Component
 * Shows current authentication state with proper loading states and error handling
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, RefreshCw, LogOut, User } from 'lucide-react';

interface AuthStatusIndicatorProps {
  showDetails?: boolean;
  showActions?: boolean;
  className?: string;
}

export const AuthStatusIndicator: React.FC<AuthStatusIndicatorProps> = ({
  showDetails = false,
  showActions = false,
  className = ''
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    logout, 
    refreshToken,
    isTokenExpired,
    getTokenExpiration 
  } = useAuth();

  const handleRefreshToken = async () => {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-gray-600">Checking authentication...</span>
      </div>
    );
  }

  if (!showDetails) {
    // Simple badge indicator
    return (
      <Badge 
        variant={isAuthenticated ? "default" : "destructive"}
        className={`flex items-center gap-1 ${className}`}
      >
        {isAuthenticated ? (
          <>
            <CheckCircle className="h-3 w-3" />
            Authenticated
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" />
            Not Authenticated
          </>
        )}
      </Badge>
    );
  }

  // Detailed card view
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isAuthenticated ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Authentication Status: Active
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              Authentication Status: Inactive
            </>
          )}
        </CardTitle>
        <CardDescription>
          Current authentication state and user information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            {/* User Information */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">{user.name}</p>
                <p className="text-sm text-green-700">{user.email}</p>
              </div>
            </div>

            {/* Token Status */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Token Status</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge 
                    variant={isTokenExpired() ? "destructive" : "default"}
                    className="ml-2"
                  >
                    {isTokenExpired() ? "Expired" : "Valid"}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Expires:</span>
                  <span className="ml-2 font-mono text-xs">
                    {getTokenExpiration()?.toLocaleString() || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Token Expiration Warning */}
            {isTokenExpired() && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  Your session has expired. Please refresh your token or log in again.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshToken}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh Token
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-900 font-medium">Not authenticated</p>
            <p className="text-red-700 text-sm">Please log in to access protected features.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthStatusIndicator;