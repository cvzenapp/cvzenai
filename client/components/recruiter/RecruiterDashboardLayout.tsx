import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Users,
  FileText,
  Calendar,
  Building2,
  Users2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Bell,
  User,
  Briefcase,
  CreditCard,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import RecruiterChatInterface from '@/components/dashboard/RecruiterChatInterface';
import ApplicationsManager from '@/components/recruiter/ApplicationsManager';
import { InterviewsDashboard } from '@/components/interviews/InterviewsDashboard';
import { RecruiterCompanyPortfolio } from '@/components/recruiter/RecruiterCompanyPortfolio';
import { RecruiterTeamsManager } from '@/components/recruiter/RecruiterTeamsManager';
import JobPostingManager from '@/components/company/JobPostingManager';
import CandidatesManager from '@/components/candidates/CandidatesManager';
import RecruiterSettings from '@/components/recruiter/RecruiterSettings';
import { RecruiterSubscriptionDashboard } from '@/components/subscription/RecruiterSubscriptionDashboard';
import { RecruiterPlanSelector } from '@/components/subscription/RecruiterPlanSelector';
import { subscriptionApi } from '@/services/subscriptionApi';
import type { CompanySubscription } from '@shared/subscription';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  comingSoon?: boolean;
}

const menuItems: MenuItem[] = [
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'candidates', label: 'Candidates', icon: Users, badge: 12 },
  { id: 'applications', label: 'Applications', icon: FileText, badge: 8 },
  { id: 'interviews', label: 'Interviews', icon: Calendar, badge: 3 },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'team', label: 'Teams', icon: Users2 },
  { id: 'subscription', label: 'Subscription', icon: Package },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface RecruiterDashboardLayoutProps {
  children?: React.ReactNode;
  defaultView?: string;
}

export default function RecruiterDashboardLayout({ 
  children, 
  defaultView = 'assistant' 
}: RecruiterDashboardLayoutProps) {
  const [activeView, setActiveView] = useState(defaultView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [subscription, setSubscription] = useState<CompanySubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const navigate = useNavigate();

  // Get recruiter info from localStorage
  const recruiterData = localStorage.getItem('recruiter_user');
  const recruiter = recruiterData ? JSON.parse(recruiterData) : null;
  
  console.log('Recruiter data:', recruiter); // Debug log
  
  const recruiterName = recruiter 
    ? `${recruiter.firstName || ''} ${recruiter.lastName || ''}`.trim() || recruiter.email
    : 'Recruiter';
  const recruiterInitials = recruiterName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Load subscription data
  useEffect(() => {
    const loadSubscription = async () => {
      if (!recruiter?.id) {
        setLoadingSubscription(false);
        return;
      }

      try {
        const sub = await subscriptionApi.getCompanySubscription(recruiter.id);
        setSubscription(sub);
      } catch (error) {
        console.error('Error loading subscription:', error);
      } finally {
        setLoadingSubscription(false);
      }
    };

    loadSubscription();
  }, [recruiter?.id]);

  const handleLogout = () => {
    localStorage.removeItem('recruiter_token');
    localStorage.removeItem('recruiter_user');
    navigate('/');
  };

  const handleMenuClick = (itemId: string) => {
    if (menuItems.find(item => item.id === itemId)?.comingSoon) {
      return;
    }
    setActiveView(itemId);
    setMobileMenuOpen(false);
  };

  const handleNavigateToInterviews = () => {
    setSuccessMessage('Interview scheduled successfully!');
    setShowSuccessToast(true);
    setActiveView('interviews');
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 5000);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'assistant':
        return (
          <div className="h-full flex flex-col">
            <RecruiterChatInterface />
          </div>
        );
      case 'candidates':
        return (
          <div className="p-6 overflow-auto">
            <CandidatesManager />
          </div>
        );
      case 'applications':
        return (
          <div className="p-6 overflow-auto">
            <ApplicationsManager onNavigateToInterviews={handleNavigateToInterviews} />
          </div>
        );
      case 'interviews':
        return (
          <div className="p-6 overflow-auto">
            <InterviewsDashboard userType="recruiter" />
          </div>
        );
      case 'jobs':
        return (
          <div className="p-6 overflow-auto">
            <JobPostingManager />
          </div>
        );
      case 'company':
        return (
          <div className="overflow-auto h-full">
            <RecruiterCompanyPortfolio />
          </div>
        );
      case 'team':
        return (
          <div className="p-6 overflow-auto">
            <RecruiterTeamsManager />
          </div>
        );
      case 'subscription':
        return (
          <div className="p-6 overflow-auto h-full pb-24">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">
                Select a subscription plan to unlock premium features
              </p>
            </div>
            <RecruiterPlanSelector 
              onSelectPlan={async (planId, billingCycle) => {
                try {
                  setLoadingSubscription(true);
                  
                  const result = await subscriptionApi.createCompanySubscription({
                    companyId: recruiter.id,
                    planId,
                    billingCycle
                  });
                  
                  if (result.paymentUrl) {
                    window.location.href = result.paymentUrl;
                  } else if (result.subscription) {
                    setSubscription(result.subscription);
                    setActiveView('billing');
                  }
                } catch (error) {
                  console.error('Error selecting plan:', error);
                  alert('Failed to create subscription. Please try again.');
                } finally {
                  setLoadingSubscription(false);
                }
              }}
            />
          </div>
        );
      case 'billing':
        return (
          <div className="p-6 overflow-auto h-full">
            {loadingSubscription ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : !recruiter?.id ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please log in to access billing
                </p>
                <Button onClick={() => navigate('/recruiter/login')}>
                  Log In
                </Button>
              </div>
            ) : subscription ? (
              <RecruiterSubscriptionDashboard 
                companyId={recruiter.id} 
                subscription={subscription}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
                <p className="text-muted-foreground mb-4">
                  Subscribe to a plan to view billing information
                </p>
                <Button onClick={() => setActiveView('subscription')}>
                  View Plans
                </Button>
              </div>
            )}
          </div>
        );
      case 'analytics':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Analytics</h2>
            <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6 overflow-auto">
            <RecruiterSettings />
          </div>
        );
      default:
        return children || (
          <div className="h-full flex flex-col">
            <RecruiterChatInterface />
          </div>
        );
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="h-16 border-b bg-slate-900 border-slate-800 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-slate-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <button
            onClick={() => navigate('/recruiter')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/assets/cvzen_cap.svg" 
              alt="CVZen Logo" 
              className="h-8 sm:h-9 md:h-10 w-auto"
            />
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-slate-800">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-white hover:bg-slate-800">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={recruiter?.avatar} />
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {recruiterInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline font-normal">{recruiterName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-normal">{recruiterName}</p>
                  {recruiter?.email && (
                    <p className="text-xs text-slate-500 font-normal">{recruiter.email}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveView('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside
          className={cn(
            "hidden lg:flex flex-col border-r bg-card transition-all duration-300 shrink-0",
            sidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Sidebar content */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  disabled={item.comingSoon}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-background text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    item.comingSoon && "opacity-50 cursor-not-allowed",
                    sidebarCollapsed && "justify-center"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                      {item.comingSoon && (
                        <Badge variant="outline" className="ml-auto text-xs">
                          Soon
                        </Badge>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Collapse button */}
          <div className="p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-center"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  sidebarCollapsed && "rotate-180"
                )}
              />
            </Button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r z-50 lg:hidden">
              <nav className="p-3 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      disabled={item.comingSoon}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-brand-background text-white"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        item.comingSoon && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="secondary">{item.badge}</Badge>
                      )}
                      {item.comingSoon && (
                        <Badge variant="outline" className="text-xs">Soon</Badge>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-hidden bg-background">
          {renderContent()}
        </main>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium">{successMessage}</p>
              <p className="text-sm text-green-100 mt-1">View it in the Interviews tab</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="flex-shrink-0 text-green-100 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
