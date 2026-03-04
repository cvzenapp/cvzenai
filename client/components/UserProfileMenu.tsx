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
  LayoutDashboard, 
  LogOut, 
  ChevronDown
} from "lucide-react";
import { unifiedAuthService } from "@/services/unifiedAuthService";

interface UserProfileMenuProps {
  userName: string;
  className?: string;
}

export default function UserProfileMenu({ userName, className = "" }: UserProfileMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const user = unifiedAuthService.getStoredUser();

  const handleDashboard = () => {
    navigate('/dashboard');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await unifiedAuthService.logout();
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout even if API call fails
      localStorage.clear();
      navigate('/');
    }
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
                src={user?.avatar} 
                alt={userName}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                {userName}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{userName}</p>
              {user?.email && (
                <p className="text-xs text-slate-500">{user.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDashboard} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
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
