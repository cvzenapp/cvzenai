import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { unifiedAuthService } from "@/services/unifiedAuthService";
import { useEffect, useState } from "react";

interface AppHeaderProps {
  children?: React.ReactNode;
  onToggleSidebar?: () => void;
  showToggle?: boolean;
}

export default function AppHeader({ children, onToggleSidebar, showToggle = false }: AppHeaderProps) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const user = unifiedAuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      // Clear auth data
      unifiedAuthService.logout();
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Navigate to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if there's an error
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="w-full px-3 sm:px-4 md:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
            {showToggle && onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden text-white p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-all"
                aria-label="Toggle sidebar"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/assets/cvzen_logo.png" 
                alt="CVZen Logo" 
                className="h-8 sm:h-9 md:h-10 w-auto"
              />
            </Link>
            {children}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            <h1 className="hidden md:flex text-sm md:text-base lg:text-xl font-normal text-white items-center gap-2 mr-2 sm:mr-4">
              {`Welcome back, ${currentUser?.name || 'User'}! 👋`}
            </h1>
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 hover:text-white cursor-pointer hidden sm:block" />
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-400 hover:text-red-300 hover:bg-slate-800 border-slate-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-7 sm:h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-1" />
                  <span className="hidden sm:inline">Logging out...</span>
                </>
              ) : (
                'Logout'
              )}
            </Button>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium">
              {currentUser?.name?.substring(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
