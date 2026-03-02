/**
 * Authentication Debug Toggle
 * Simple component to toggle debug mode and show debug dashboard
 * Requirements: 6.2, 6.3
 */

import React, { useState } from 'react';
import { useAuthDebug } from '../hooks/useAuthDebug';
import { AuthDebugDashboard } from './AuthDebugDashboard';

interface AuthDebugToggleProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showInProduction?: boolean;
}

export const AuthDebugToggle: React.FC<AuthDebugToggleProps> = ({ 
  position = 'bottom-right',
  showInProduction = false
}) => {
  const [showDashboard, setShowDashboard] = useState(false);
  const { isDebugMode, toggleDebugMode, debugInfo } = useAuthDebug();

  // Don't show in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getStatusColor = () => {
    if (!debugInfo) return 'bg-gray-500';
    
    const errorCount = debugInfo.authStateHistory.filter(log => log.level === 'error').length;
    const recentErrors = debugInfo.authStateHistory
      .filter(log => log.level === 'error')
      .filter(log => Date.now() - new Date(log.timestamp).getTime() < 60000); // Last minute
    
    if (recentErrors.length > 0) return 'bg-red-500 animate-pulse';
    if (errorCount > 0) return 'bg-yellow-500';
    if (debugInfo.isAuthenticated) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (!debugInfo) return 'Loading...';
    
    const recentErrors = debugInfo.authStateHistory
      .filter(log => log.level === 'error')
      .filter(log => Date.now() - new Date(log.timestamp).getTime() < 60000);
    
    if (recentErrors.length > 0) return `${recentErrors.length} recent errors`;
    if (debugInfo.isAuthenticated) return 'Authenticated';
    return 'Not authenticated';
  };

  return (
    <>
      <div className={`fixed ${positionClasses[position]} z-40 flex flex-col items-end gap-2`}>
        {/* Debug Mode Toggle */}
        <button
          onClick={toggleDebugMode}
          className={`px-3 py-2 rounded-lg text-white text-sm font-medium shadow-lg transition-all ${
            isDebugMode 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
          title={`${isDebugMode ? 'Disable' : 'Enable'} auth debug mode`}
        >
          🔐 {isDebugMode ? 'Debug ON' : 'Debug OFF'}
        </button>

        {/* Status Indicator (only when debug mode is on) */}
        {isDebugMode && (
          <button
            onClick={() => setShowDashboard(true)}
            className={`px-3 py-2 rounded-lg text-white text-sm shadow-lg transition-all ${getStatusColor()}`}
            title={`Auth Status: ${getStatusText()}`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>{getStatusText()}</span>
            </div>
          </button>
        )}

        {/* Quick Actions (only when debug mode is on) */}
        {isDebugMode && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setShowDashboard(true)}
              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded shadow"
              title="Open debug dashboard"
            >
              📊 Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Debug Dashboard */}
      {showDashboard && (
        <AuthDebugDashboard
          isVisible={showDashboard}
          onClose={() => setShowDashboard(false)}
        />
      )}
    </>
  );
};

export default AuthDebugToggle;