import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LayoutDashboard, 
  LogOut, 
  Settings,
  Building2,
  ChevronDown
} from "lucide-react";
import { recruiterAuthApi } from "@/services/recruiterAuthApi";

interface RecruiterProfileMenuProps {
  recruiterName: string;
  className?: string;
}

export default function RecruiterProfileMenu({ recruiterName, className = "" }: RecruiterProfileMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // Get recruiter data from localStorage (support both key formats)
  const getRecruiterData = () => {
    try {
      // Try new format first (from RecruiterAuthModal)
      let recruiterUser = localStorage.getItem('recruiterUser');
      if (recruiterUser) {
        return JSON.parse(recruiterUser);
      }
      
      // Fallback to old format (from recruiterAuthApi)
      recruiterUser = localStorage.getItem('recruiter_user');
      if (recruiterUser) {
        return JSON.parse(recruiterUser);
      }
    } catch (error) {
      console.error("Error parsing recruiter user:", error);
    }
    return null;
  };

  const recruiterData = getRecruiterData();

  const handleDashboard = () => {
    navigate('/recruiter/dashboard');
    setIsOpen(false);
  };

  const handleSettings = () => {
    // Navigate to dashboard settings tab
    navigate('/recruiter/dashboard?tab=settings');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Use the recruiterAuthApi logout method (clears all localStorage keys)
      await recruiterAuthApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    // Reload the page to reset the UI state
    window.location.reload();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 h-auto p-2 bg-white/90 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg hover:bg-white/95 transition-all duration-200"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={recruiterData?.avatar} 
                alt={recruiterName}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(recruiterName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                {recruiterName}
              </span>
              <span className="text-xs text-slate-500 truncate max-w-[120px]">
                {recruiterData?.company?.name || 'Recruiter'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{recruiterName}</p>
              <p className="text-xs text-slate-500">
                {recruiterData?.jobTitle || 'Recruiter'} 
                {recruiterData?.company?.name && ` at ${recruiterData.company.name}`}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}