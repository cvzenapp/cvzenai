import React, { useState, useEffect } from 'react';

export const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [apiTest, setApiTest] = useState<string>('');

  useEffect(() => {
    // Check localStorage tokens
    const authToken = localStorage.getItem('authToken');
    const recruiterToken = localStorage.getItem('recruiter_token');
    const userStr = localStorage.getItem('user');
    
    let user = null;
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = { error: 'Failed to parse user object' };
    }

    let authTokenPayload = null;
    if (authToken) {
      try {
        const parts = authToken.split('.');
        if (parts.length === 3) {
          authTokenPayload = JSON.parse(atob(parts[1]));
        }
      } catch (e) {
        authTokenPayload = { error: 'Failed to decode token' };
      }
    }

    let recruiterTokenPayload = null;
    if (recruiterToken) {
      try {
        const parts = recruiterToken.split('.');
        if (parts.length === 3) {
          recruiterTokenPayload = JSON.parse(atob(parts[1]));
        }
      } catch (e) {
        recruiterTokenPayload = { error: 'Failed to decode token' };
      }
    }

    setDebugInfo({
      authToken: {
        exists: !!authToken,
        length: authToken?.length,
        parts: authToken?.split('.').length,
        preview: authToken?.substring(0, 50) + '...',
        payload: authTokenPayload
      },
      recruiterToken: {
        exists: !!recruiterToken,
        length: recruiterToken?.length,
        parts: recruiterToken?.split('.').length,
        preview: recruiterToken?.substring(0, 50) + '...',
        payload: recruiterTokenPayload
      },
      user
    });
  }, []);

  const testAPI = async () => {
    setApiTest('Testing...');
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch('/api/interviews', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const text = await response.text();
      setApiTest(`Status: ${response.status}\nResponse: ${text}`);
    } catch (error: any) {
      setApiTest(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Authentication Debug Info</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium">Auth Token:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.authToken, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium">Recruiter Token:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.recruiterToken, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium">User Object:</h4>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>
        
        <div>
          <button 
            onClick={testAPI}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {/* Test API Call */}
          </button>
          {apiTest && (
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {apiTest}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};