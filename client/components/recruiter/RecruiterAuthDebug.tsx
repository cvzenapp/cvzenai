import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const RecruiterAuthDebug: React.FC = () => {
  const [authState, setAuthState] = useState<{
    hasToken: boolean;
    tokenPreview: string;
    hasUser: boolean;
    userName: string;
    allKeys: string[];
  } | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('recruiter_token');
      const userStr = localStorage.getItem('recruiter_user');
      let user = null;
      
      try {
        if (userStr) {
          user = JSON.parse(userStr);
        }
      } catch (e) {
        console.error('Failed to parse recruiter_user:', e);
      }

      setAuthState({
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'NO TOKEN',
        hasUser: !!user,
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'NO USER',
        allKeys: Object.keys(localStorage).filter(k => k.includes('recruiter') || k.includes('token'))
      });
    };

    checkAuth();
    
    // Check every 2 seconds
    const interval = setInterval(checkAuth, 2000);
    
    return () => clearInterval(interval);
  }, []);

  if (!authState) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Recruiter Auth Debug
      </h3>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          {authState.hasToken ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="font-medium">Token:</span>
          <span className="text-gray-600 truncate">{authState.tokenPreview}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {authState.hasUser ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="font-medium">User:</span>
          <span className="text-gray-600">{authState.userName}</span>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="font-medium mb-1">LocalStorage Keys:</div>
          <div className="text-gray-600 space-y-1">
            {authState.allKeys.length > 0 ? (
              authState.allKeys.map(key => (
                <div key={key} className="truncate">• {key}</div>
              ))
            ) : (
              <div className="text-red-600">No auth keys found!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
