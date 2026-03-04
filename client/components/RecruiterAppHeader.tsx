import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import CVZenLogo from "./CVZenLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Building2, Settings, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

interface RecruiterAppHeaderProps {
  children?: React.ReactNode;
  onSettingsClick?: () => void;
}

export default function RecruiterAppHeader({ children, onSettingsClick }: RecruiterAppHeaderProps) {
  const navigate = useNavigate();
  const [recruiter, setRecruiter] = useState<any>(null);

  useEffect(() => {
    // Load recruiter from localStorage
    const recruiterData = localStorage.getItem('recruiter');
    if (recruiterData) {
      try {
        setRecruiter(JSON.parse(recruiterData));
      } catch (error) {
        console.error('Failed to parse recruiter data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear recruiter auth data
    localStorage.removeItem('recruiterToken');
    localStorage.removeItem('recruiter');
    navigate('/recruiter/login');
  };

  const handleSettings = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      // Default behavior - could navigate to settings page
      navigate('/recruiter/dashboard?tab=settings');
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/recruiter/dashboard" className="flex items-center gap-3">
            <CVZenLogo className="h-14 sm:h-16 md:h-20 w-auto" showCaption={true} />
            <div className="flex items-center gap-2">
              <div className="h-6 w-px bg-slate-600"></div>
              <span className="text-lg font-semibold text-slate-200">
                Recruiter Portal
              </span>
            </div>
          </Link>

          {/* Middle content slot */}
          <div className="flex items-center flex-1 mx-8">
            {children}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-slate-800">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={recruiter?.avatar}
                      alt={recruiter?.firstName || 'Recruiter'}
                    />
                    <AvatarFallback>
                      {recruiter?.firstName?.[0] || 'R'}
                      {recruiter?.lastName?.[0] || 'R'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {recruiter?.firstName} {recruiter?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {recruiter?.jobTitle}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
