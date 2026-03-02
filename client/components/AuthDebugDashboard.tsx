/**
 * Authentication Debug Dashboard
 * Provides visual debugging tools for authentication flow in development mode
 * Requirements: 6.2, 6.3
 */

import React, { useState, useEffect } from 'react';
import { authLogger, AuthLogEntry, AuthDebugInfo, AuthLogLevel, AuthOperation } from '../services/authLogger';
import { useAuth } from '../contexts/AuthContext';

interface AuthDebugDashboardProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export const AuthDebugDashboard: React.FC<AuthDebugDashboardProps> = ({ 
  isVisible = false, 
  onClose 
}) => {
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'logs' | 'performance' | 'storage'>('overview');
  const [logFilter, setLogFilter] = useState<AuthLogLevel | 'all'>('all');
  const [operationFilter, setOperationFilter] = useState<AuthOperation | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const auth = useAuth();

  // Refresh debug info
  const refreshDebugInfo = () => {
    setDebugInfo(authLogger.getDebugInfo());
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!isVisible) return;

    refreshDebugInfo();

    if (autoRefresh) {
      const interval = setInterval(refreshDebugInfo, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, autoRefresh]);

  // Filter logs based on selected filters
  const getFilteredLogs = (): AuthLogEntry[] => {
    if (!debugInfo) return [];

    let logs = debugInfo.authStateHistory;

    if (logFilter !== 'all') {
      logs = logs.filter(log => log.level === logFilter);
    }

    if (operationFilter !== 'all') {
      logs = logs.filter(log => log.operation === operationFilter);
    }

    return logs.reverse(); // Show newest first
  };

  // Export logs for debugging
  const handleExportLogs = () => {
    const logsData = authLogger.exportLogs();
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const handleClearLogs = () => {
    authLogger.clearLogs();
    refreshDebugInfo();
  };

  // Test authentication operations
  const testOperations = {
    testTokenValidation: async () => {
      authLogger.info(AuthOperation.TOKEN_VALIDATION, 'Manual token validation test triggered');
      await auth.ensureValidToken();
    },
    testTokenRefresh: async () => {
      authLogger.info(AuthOperation.TOKEN_REFRESH, 'Manual token refresh test triggered');
      await auth.refreshToken();
    },
    testUserFetch: async () => {
      authLogger.info(AuthOperation.USER_FETCH, 'Manual user fetch test triggered');
      await auth.getCurrentUser();
    }
  };

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">🔐 Authentication Debug Dashboard</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh
            </label>
            <button
              onClick={refreshDebugInfo}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Refresh
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'logs', label: 'Logs' },
              { key: 'performance', label: 'Performance' },
              { key: 'storage', label: 'Storage' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  selectedTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Auth State */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Current Authentication State</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl ${auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
                      {auth.isAuthenticated ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">Authenticated</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl ${debugInfo?.tokenExists ? 'text-green-600' : 'text-red-600'}`}>
                      {debugInfo?.tokenExists ? '🎫' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">Token Exists</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl ${debugInfo?.userExists ? 'text-green-600' : 'text-red-600'}`}>
                      {debugInfo?.userExists ? '👤' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">User Data</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl ${debugInfo?.storageAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {debugInfo?.storageAvailable ? '💾' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600">Storage</div>
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Session Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Session ID:</strong> {debugInfo?.sessionId}</div>
                  <div><strong>Token Expiry:</strong> {debugInfo?.tokenExpiry || 'N/A'}</div>
                  <div><strong>Last Activity:</strong> {debugInfo?.lastActivity || 'N/A'}</div>
                  <div><strong>Current User:</strong> {auth.user?.email || 'Not logged in'}</div>
                </div>
              </div>

              {/* Test Operations */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Test Operations</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={testOperations.testTokenValidation}
                    className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Test Token Validation
                  </button>
                  <button
                    onClick={testOperations.testTokenRefresh}
                    className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Test Token Refresh
                  </button>
                  <button
                    onClick={testOperations.testUserFetch}
                    className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                  >
                    Test User Fetch
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'logs' && (
            <div className="space-y-4">
              {/* Log Controls */}
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value as any)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Levels</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                  </select>
                  <select
                    value={operationFilter}
                    onChange={(e) => setOperationFilter(e.target.value as any)}
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="all">All Operations</option>
                    {Object.values(AuthOperation).map(op => (
                      <option key={op} value={op}>{op.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleExportLogs}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    Export Logs
                  </button>
                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Clear Logs
                  </button>
                </div>
              </div>

              {/* Log Entries */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getFilteredLogs().map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 text-sm ${
                      log.level === 'error' ? 'bg-red-50 border-red-500' :
                      log.level === 'warn' ? 'bg-yellow-50 border-yellow-500' :
                      log.level === 'info' ? 'bg-blue-50 border-blue-500' :
                      'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.level === 'error' ? 'bg-red-200 text-red-800' :
                          log.level === 'warn' ? 'bg-yellow-200 text-yellow-800' :
                          log.level === 'info' ? 'bg-blue-200 text-blue-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                          {log.operation.replace('_', ' ').toUpperCase()}
                        </span>
                        {log.duration && (
                          <span className="px-2 py-1 bg-green-200 text-green-700 rounded text-xs">
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="font-medium">{log.message}</div>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-600">Details</summary>
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                    {log.error && (
                      <div className="mt-2 text-xs text-red-600">
                        <strong>Error:</strong> {log.error.message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {debugInfo?.performanceMetrics.averageLoginTime || 0}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Login Time</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {debugInfo?.performanceMetrics.averageTokenRefreshTime || 0}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Refresh Time</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {((debugInfo?.performanceMetrics.failureRate || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Failure Rate</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Recent Error Logs</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {authLogger.getErrorLogs().slice(-10).reverse().map((log, index) => (
                    <div key={index} className="bg-red-50 p-2 rounded border-l-4 border-red-500">
                      <div className="text-sm font-medium">{log.message}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Local Storage Contents</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Auth Token:</strong> {localStorage.getItem('authToken') ? '[PRESENT]' : '[MISSING]'}
                  </div>
                  <div>
                    <strong>User Data:</strong> {localStorage.getItem('user') ? '[PRESENT]' : '[MISSING]'}
                  </div>
                  <div>
                    <strong>Last Activity:</strong> {localStorage.getItem('lastAuthActivity') || '[NONE]'}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Storage Operations</h3>
                <div className="space-y-2">
                  {authLogger.getLogsByOperation(AuthOperation.STORAGE_ACCESS).slice(-5).reverse().map((log, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      {' - '}
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthDebugDashboard;