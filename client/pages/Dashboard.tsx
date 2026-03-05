import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AppHeader from "@/components/AppHeader";
// Removed useAuth to prevent flickering
import { resumeApi, ResumeData } from "@/services/resumeApi";
// Removed unifiedAuthService to prevent auth interference
// Removed static import to prevent chunking conflicts - now using dynamic import
import { activityApi, ActivityItem } from "@/services/activityApi";
import { recruiterInteractionsApi, RecruiterInteraction } from "@/services/recruiterInteractionsApi";
import { toast } from "sonner";

// JobData type for type safety
interface JobData {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  type?: string;
  description?: string;
  requirements?: string[];
  postedDate?: string;
  matchScore?: number;
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ReferralForm from "@/components/ReferralForm";
import { ReferralDashboard } from "@/components/ReferralDashboard";
import { RewardsDashboard } from "@/components/RewardsDashboard";
import JobMatchingDashboard from "@/components/JobMatchingDashboard";
import JobDiscovery from "@/components/JobDiscovery";
import JobApplicationManager from "@/components/JobApplicationManager";
import { InterviewsDashboard } from "@/components/interviews/InterviewsDashboard";
import JobSeekerChatInterface from "@/components/dashboard/JobSeekerChatInterface";
import ResumeImportModal from "@/components/dashboard/ResumeImportModal";
import { ATSScoreDisplay } from "@/components/ATSScoreDisplay";
import { atsApi } from "@/services/atsApi";
import { FakeJobDetector } from "@/components/dashboard/FakeJobDetector";
import { JobSeekerSubscriptionDashboard } from "@/components/subscription/JobSeekerSubscriptionDashboard";
import { JobSeekerPlanSelector } from "@/components/subscription/JobSeekerPlanSelector";
import { JobSeekerUsageTracker } from "@/components/subscription/JobSeekerUsageTracker";
import { subscriptionApi } from "@/services/subscriptionApi";
import type { UserSubscription } from "@shared/subscription";
import { CreateReferralRequest } from "@shared/referrals";
import {
  FileText,
  Plus,
  Search,
  Bell,
  Settings,
  Eye,
  Upload,
  Download,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Activity,
  TrendingUp,
  Calendar,
  Edit,
  AlertCircle,
  CheckCircle,
  Trash2,
  Menu,
  X,
  Shield,
  CreditCard,
  Package,
} from "lucide-react";

interface SavedResume {
  id: string;
  name: string;
  personalInfo?: {
    name?: string;
    title?: string;
    email?: string;
    phone?: string;
  };
  experience?: any[];
  education?: any[];
  skills?: any[];
  summary?: string;
  template?: string;
  lastUpdated: string;
  status: 'draft' | 'active' | 'archived';
  isActive?: boolean;
  atsScore?: {
    overallScore: number;
    scores: {
      completeness: number;
      formatting: number;
      keywords: number;
      experience: number;
      education: number;
      skills: number;
    };
    suggestions: string[];
    strengths: string[];
    scoredAt?: string;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  
  // CRITICAL: Check and clear invalid tokens on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token === 'null' || token === 'undefined' || token === '') {
      console.log('🧹 Detected invalid token on dashboard load, clearing auth');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/');
      return;
    }
  }, [navigate]);
  
  // Get user directly from localStorage - memoize to prevent infinite re-renders
  const [currentUser] = useState(() => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : {};
    } catch (error) {
      return {};
    }
  });
  const isAuthenticated = !!(localStorage.getItem('authToken') && localStorage.getItem('user'));
  const [activeTab, setActiveTab] = useState("ai-chat");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [jobRecommendations, setJobRecommendations] = useState<JobData[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedATSScore, setSelectedATSScore] = useState<SavedResume['atsScore'] | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [showATSModal, setShowATSModal] = useState(false);
  const [isImprovingATS, setIsImprovingATS] = useState(false);
  const [improvementResult, setImprovementResult] = useState<{
    success: boolean;
    message: string;
    improvements?: string[];
    oldScore?: number;
    newScore?: number;
  } | null>(null);
  const [stats, setStats] = useState({
    totalResumes: 0,
    totalViews: 0,
    downloads: 0,
    recruiterResponses: 0,
    shortlistCount: 0,
    upvotesReceived: 0,
    likesReceived: 0,
    referralCount: 0,
    profileViews: 0,
    profileStrength: 85,
  });
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionUsage, setSubscriptionUsage] = useState<any[]>([]);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    mobile: currentUser?.mobile || '',
    avatar: currentUser?.avatar || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');

  // Password last changed state
  const [passwordLastChanged, setPasswordLastChanged] = useState<string>('Never');

  // Update profile data when user changes (after login)
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setProfileData({
          name: user?.name || '',
          email: user?.email || '',
          mobile: user?.mobile || '',
          avatar: user?.avatar || '',
        });
        
        // Calculate profile strength based on resume data
        // We'll update this when resumes are loaded
        // For now, calculate based on user profile data
        let strength = 0;
        const checks = [
          { condition: user?.name && user.name.trim() !== '', weight: 25 },
          { condition: user?.email, weight: 25 },
          { condition: user?.mobile, weight: 25 },
          { condition: user?.avatar, weight: 25 },
        ];
        
        checks.forEach(check => {
          if (check.condition) strength += check.weight;
        });
        
        setStats(prev => ({ ...prev, profileStrength: strength }));
        
        // Calculate password last changed
        if (user?.passwordChangedAt) {
          const changedDate = new Date(user.passwordChangedAt);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - changedDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            setPasswordLastChanged('Today');
          } else if (diffDays === 1) {
            setPasswordLastChanged('Yesterday');
          } else if (diffDays < 30) {
            setPasswordLastChanged(`${diffDays} days ago`);
          } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            setPasswordLastChanged(`${months} month${months > 1 ? 's' : ''} ago`);
          } else {
            const years = Math.floor(diffDays / 365);
            setPasswordLastChanged(`${years} year${years > 1 ? 's' : ''} ago`);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []); // Run once on mount to get latest user data

  // Change password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');

  // ProtectedRoute already handles authentication redirect - no need to duplicate

  // Load resumes from API on component mount
  useEffect(() => {
    const loadResumes = async () => {
      setIsLoadingResumes(true);
      try {
        const response = await resumeApi.getUserResumes();
        
        if (response.success) {
          // Handle different response formats
          let resumeData = [];
          if (Array.isArray(response.data)) {
            resumeData = response.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            resumeData = response.data.data;
          } else if (response.data) {
            resumeData = [response.data];
          }
          
          const formattedResumes: SavedResume[] = resumeData
            .filter(resume => resume.id) // Only include resumes with valid IDs
            .map(resume => ({
            id: resume.id,
            name: resume.title || `${resume.personalInfo?.name || 'Untitled'} Resume`,
            personalInfo: {
              name: resume.personalInfo?.name || `${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}`.trim(),
              title: resume.personalInfo?.summary || 'Professional',
              email: resume.personalInfo?.email,
              phone: resume.personalInfo?.phone
            },
            experience: resume.experience || [],
            education: resume.education || [],
            skills: resume.skills || [],
            summary: resume.summary || resume.personalInfo?.summary || '',
            template: resume.templateId || 'default',
            lastUpdated: new Date(resume.updatedAt).toLocaleDateString(),
            status: resume.status === 'published' ? 'active' : resume.status as 'draft' | 'active' | 'archived',
            isActive: resume.isActive === true,
            atsScore: resume.atsScore
          }));

          console.log('📊 Initial load - Raw resume data:', resumeData.map(r => ({ 
            id: r.id, 
            title: r.title, 
            isActive: r.isActive,
            isActiveType: typeof r.isActive
          })));
          console.log('📊 Initial load - Formatted resumes:', formattedResumes.map(r => ({ 
            id: r.id, 
            name: r.name, 
            isActive: r.isActive 
          })));

          setResumes(formattedResumes);
          
          // Calculate profile strength based on resume data
          if (formattedResumes.length > 0) {
            const resume = formattedResumes[0]; // Use first resume
            let resumeStrength = 0;
            
            // Basic info (25%)
            if (resume.personalInfo?.name && resume.personalInfo.name.trim() !== '') resumeStrength += 15;
            if (resume.personalInfo?.email && resume.personalInfo.email.trim() !== '') resumeStrength += 5;
            if (resume.personalInfo?.phone && resume.personalInfo.phone.trim() !== '') resumeStrength += 5;
            
            // Work experience (25%)
            if (resume.experience && resume.experience.length > 0) resumeStrength += 25;
            
            // Education (20%)
            if (resume.education && resume.education.length > 0) resumeStrength += 20;
            
            // Skills (20%)
            if (resume.skills && resume.skills.length > 0) resumeStrength += 20;
            
            // Summary/Objective (10%)
            if (resume.summary && resume.summary.trim() !== '') resumeStrength += 10;
            
            setStats(prev => ({
              ...prev,
              totalResumes: formattedResumes.length,
              profileStrength: resumeStrength
            }));
          } else {
            setStats(prev => ({
              ...prev,
              totalResumes: formattedResumes.length,
              profileStrength: 0
            }));
          }
        } else {
          // Fallback to localStorage if API fails
          loadResumesFromLocalStorage();
        }
      } catch (error) {
        console.log('🔍 Dashboard - API call failed:', error);
        
        // For now, always fall back to localStorage instead of redirecting
        // This allows us to test the Dashboard functionality even with auth issues
        loadResumesFromLocalStorage();
        
        // TODO: Re-enable auth redirect after fixing token validation
        // if (error?.message?.includes('Authentication') || error?.message?.includes('401')) {
        //   localStorage.removeItem('authToken');
        //   localStorage.removeItem('user');
        //   navigate('/login');
        //   return;
        // }
      } finally {
        setIsLoadingResumes(false);
      }
    };

    const loadResumesFromLocalStorage = () => {
      const savedResumes: SavedResume[] = [];
      
      // Get all localStorage keys
      const allKeys = Object.keys(localStorage);
      
      // Filter for resume keys (excluding template and other metadata keys)
      const resumeKeys = allKeys.filter(key => 
        key.startsWith('resume-') && 
        !key.includes('-template') && 
        !key.includes('-customized-template') &&
        !key.includes('-backup')
      );
      
      resumeKeys.forEach(key => {
        try {
          const resumeData = localStorage.getItem(key);
          if (resumeData) {
            const parsed = JSON.parse(resumeData);
            const templateKey = `${key}-template`;
            const template = localStorage.getItem(templateKey) || 'default';
            
            // Create resume entry
            const resume: SavedResume = {
              id: key,
              name: parsed.personalInfo?.name 
                ? `${parsed.personalInfo.name}'s Resume`
                : `Resume ${key.replace('resume-', '')}`,
              personalInfo: parsed.personalInfo,
              template: template,
              lastUpdated: new Date().toLocaleDateString(),
              status: 'active'
            };
            
            savedResumes.push(resume);
          }
        } catch (error) {
          console.error(`Error parsing resume ${key}:`, error);
        }
      });
      
      setResumes(savedResumes);
      setStats(prev => ({
        ...prev,
        totalResumes: savedResumes.length
      }));
    };

    // Job recommendations are now loaded by JobMatchingDashboard component
    // Removed duplicate loadJobRecommendations() call to prevent multiple API requests
    
    loadResumes();
    loadDashboardStats();
    loadSubscription();
    loadRecentActivity();
  }, []);

  // Add event listener to refresh when window gains focus (user returns from builder)
  useEffect(() => {
    const handleFocus = () => {
      // Only reload if the tab is visible and user is authenticated
      if (!document.hidden && isAuthenticated) {
        loadRecentActivity();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]); // Only depend on isAuthenticated to prevent infinite loops

  const handleCreateResume = () => {
    // Navigate to builder without edit parameter - starts with empty fields
    navigate("/builder");
  };

  const refreshResumes = async () => {
    setIsLoadingResumes(true);
    try {
      const response = await resumeApi.getUserResumes();
      
      if (response.success) {
        let resumeData = [];
        if (Array.isArray(response.data)) {
          resumeData = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          resumeData = response.data.data;
        } else if (response.data) {
          resumeData = [response.data];
        }
        
        const formattedResumes: SavedResume[] = resumeData
          .filter(resume => resume.id) // Only include resumes with valid IDs
          .map(resume => ({
          id: resume.id,
          name: resume.title || `${resume.personalInfo?.name || 'Untitled'} Resume`,
          personalInfo: {
            name: resume.personalInfo?.name || `${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}`.trim(),
            title: resume.personalInfo?.summary || 'Professional',
            email: resume.personalInfo?.email,
            phone: resume.personalInfo?.phone
          },
          experience: resume.experience || [],
          education: resume.education || [],
          skills: resume.skills || [],
          summary: resume.summary || resume.personalInfo?.summary || '',
          template: resume.templateId || 'default',
          lastUpdated: new Date(resume.updatedAt).toLocaleDateString(),
          status: resume.status === 'published' ? 'active' : resume.status as 'draft' | 'active' | 'archived',
          isActive: resume.isActive === true,
          atsScore: resume.atsScore
        }));

        setResumes(formattedResumes);
        setStats(prev => ({
          ...prev,
          totalResumes: formattedResumes.length
        }));
      }
    } catch (error) {
      console.error('Failed to refresh resumes:', error);
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleResumeAction = (action: string, resumeId: string) => {
    switch (action) {
      case "view":
        navigate(`/resume/${resumeId}`);
        break;
      case "edit":
        navigate(`/builder?edit=true&id=${resumeId}`);
        break;
      case "duplicate":
        // TODO: Implement duplicate functionality
        console.log("Duplicate resume:", resumeId);
        break;
      case "delete":
        handleDeleteResume(resumeId);
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  const handleToggleActive = async (resumeId: string, currentState: boolean) => {
    console.log('🔄 Toggle clicked - Resume ID:', resumeId, 'Current State:', currentState);
    
    // Count how many active resumes exist
    const activeCount = resumes.filter(r => r.isActive).length;
    console.log('📊 Active resume count:', activeCount);
    
    // If trying to deactivate and it's the only active resume, block it
    if (currentState && activeCount === 1) {
      console.log('⚠️ Blocked: Cannot deactivate the only active resume');
      toast.info('At least one resume must be active. Please activate another resume first.');
      return;
    }

    // If trying to deactivate and there are multiple active resumes, allow it
    if (currentState && activeCount > 1) {
      console.log('✅ Proceeding to deactivate resume (multiple active exist):', resumeId);
    } else {
      // Activating an inactive resume (this will automatically deactivate others)
      console.log('✅ Proceeding to activate resume:', resumeId);
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Determine the action based on current state
      const newState = !currentState;
      console.log('🎯 Setting resume to:', newState ? 'active' : 'inactive');

      const response = await fetch(`/api/resume/${resumeId}/set-active`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: newState })
      });

      if (!response.ok) {
        throw new Error('Failed to update resume state');
      }

      toast.success(newState ? 'Resume activated successfully!' : 'Resume deactivated successfully!');

      // Refresh resumes list to show updated active states
      const resumesResponse = await fetch('/api/resumes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resumesResponse.ok) {
        const data = await resumesResponse.json();
        console.log('📥 Fetched resumes data:', data);
        
        let resumeData = [];
        
        if (Array.isArray(data)) {
          resumeData = data;
        } else if (data.data && Array.isArray(data.data)) {
          resumeData = data.data;
        } else if (data.resumes && Array.isArray(data.resumes)) {
          resumeData = data.resumes;
        }

        console.log('📋 Resume data array:', resumeData.map(r => ({ id: r.id, title: r.title, isActive: r.isActive })));

        const formattedResumes: SavedResume[] = resumeData
          .filter(resume => resume.id) // Only include resumes with valid IDs
          .map(resume => ({
          id: resume.id,
          name: resume.title || `${resume.personalInfo?.name || 'Untitled'} Resume`,
          personalInfo: {
            name: resume.personalInfo?.name || `${resume.personalInfo?.firstName || ''} ${resume.personalInfo?.lastName || ''}`.trim(),
            title: resume.personalInfo?.summary || 'Professional',
            email: resume.personalInfo?.email,
            phone: resume.personalInfo?.phone
          },
          experience: resume.experience || [],
          education: resume.education || [],
          skills: resume.skills || [],
          summary: resume.summary || resume.personalInfo?.summary || '',
          template: resume.templateId || 'default',
          lastUpdated: new Date(resume.updatedAt).toLocaleDateString(),
          status: resume.status === 'published' ? 'active' : resume.status as 'draft' | 'active' | 'archived',
          isActive: resume.isActive === true,
          atsScore: resume.atsScore
        }));

        console.log('✅ Formatted resumes with isActive:', formattedResumes.map(r => ({ 
          id: r.id, 
          name: r.name, 
          isActive: r.isActive,
          rawIsActive: resumeData.find(raw => raw.id === r.id)?.isActive
        })));
        setResumes(formattedResumes);
      }
    } catch (error) {
      console.error('Error toggling resume active state:', error);
    }
  };

  const handleDeleteResume = (resumeId: string) => {
    const resume = resumes.find(r => r.id === resumeId);
    
    if (resume?.isActive) {
      alert('Cannot delete the active resume. Please activate another resume first.');
      return;
    }

    setResumeToDelete(resumeId);
    setDeleteConfirmOpen(true);
  };

  const handleCalculateATS = async (resumeId: string) => {
    try {
      const result = await atsApi.calculateScore(Number(resumeId));
      
      if (result.success && result.data?.atsScore) {
        // Update the resume in state with the new ATS score
        setResumes(resumes.map(r => 
          r.id === resumeId 
            ? { ...r, atsScore: result.data.atsScore }
            : r
        ));
      } else {
        console.error('Failed to calculate ATS score:', result.error);
      }
    } catch (error) {
      console.error('Error calculating ATS score:', error);
    }
  };

  const handleImproveATS = async () => {
    if (!selectedResumeId) return;

    setIsImprovingATS(true);
    setImprovementResult(null); // Clear previous result
    
    try {
      const result = await atsApi.improveResume(Number(selectedResumeId));
      
      if (result.success && result.data) {
        // Set success result
        setImprovementResult({
          success: true,
          message: 'Resume improved successfully!',
          improvements: result.data.improvements,
          oldScore: result.data.oldScore,
          newScore: result.data.newScore
        });
        
        // Update the resume in state with new ATS score
        if (result.data.newATSScore) {
          setResumes(resumes.map(r => 
            r.id === selectedResumeId 
              ? { ...r, atsScore: result.data.newATSScore }
              : r
          ));
          setSelectedATSScore(result.data.newATSScore);
        }
        
        // Refresh resumes to get updated data
        await refreshResumes();
      } else {
        setImprovementResult({
          success: false,
          message: typeof result.error === 'string' ? result.error : 'Failed to improve resume. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error improving ATS score:', error);
      setImprovementResult({
        success: false,
        message: 'Failed to improve resume. Please try again.'
      });
    } finally {
      setIsImprovingATS(false);
    }
  };

  const confirmDelete = async () => {
    if (!resumeToDelete) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/resume/${resumeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }

      // Remove from local state
      setResumes(resumes.filter(r => r.id !== resumeToDelete));
      setDeleteConfirmOpen(false);
      setResumeToDelete(null);
      
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume. Please try again.');
    }
  };

  const handleReferralSubmit = async (referralData: CreateReferralRequest) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to create referrals');
      }

      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(referralData)
      });

      if (!response.ok) {
        throw new Error('Failed to create referral');
      }

      const result = await response.json();
      console.log('Referral created successfully:', result);
      
      // You could show a success message here
      // toast.success('Referral created successfully!');
      
      // Optionally refresh the referrals dashboard or switch to it
      // setActiveTab('referrals');
      
    } catch (error) {
      console.error('Error creating referral:', error);
      // You could show an error message here
      // toast.error('Failed to create referral. Please try again.');
      throw error; // Re-throw so the form can handle the error
    }
  };

  // Profile handlers
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setProfileSaveMessage('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileSaveMessage('Image size must be less than 5MB');
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileSaveMessage('');

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Update profile with new avatar
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            avatar: base64String
          })
        });

        if (response.ok) {
          const result = await response.json();
          setProfileData({...profileData, avatar: base64String});
          
          // Update localStorage
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.avatar = base64String;
          localStorage.setItem('user', JSON.stringify(user));
          
          setProfileSaveMessage('Profile photo updated successfully!');
        } else {
          setProfileSaveMessage('Failed to update profile photo');
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setProfileSaveMessage('Error uploading photo');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      setProfileSaveMessage('');

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.name,
          mobile: profileData.mobile
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.name = profileData.name;
        user.mobile = profileData.mobile;
        localStorage.setItem('user', JSON.stringify(user));
        
        setProfileSaveMessage('Profile updated successfully!');
        
        // Clear message after 3 seconds
        setTimeout(() => setProfileSaveMessage(''), 3000);
      } else {
        const error = await response.json();
        setProfileSaveMessage(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileSaveMessage('Error saving profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsChangingPassword(true);
      setPasswordChangeMessage('');

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordChangeMessage('All fields are required');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordChangeMessage('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordChangeMessage('Password must be at least 8 characters');
        return;
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const result = await response.json();

      if (response.ok) {
        setPasswordChangeMessage('Password changed successfully! Logging out and Redirecting to login...');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        console.log('✅ Password changed, logging out in 2 seconds...');
        
        // Show success message, then logout after 2 seconds
        setTimeout(() => {
          console.log('🔐 Logging out and redirecting...');
          
          // Clear all auth data
          localStorage.clear(); // Clear everything for security
          
          // Use React Router navigate
          navigate('/login?message=password_changed', { replace: true });
        }, 2000);
      } else {
        setPasswordChangeMessage(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordChangeMessage('Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };



  // Load dashboard stats
  const loadDashboardStats = async () => {
    // TEMPORARILY DISABLED - causing auth token clearing issues
    // This endpoint may be returning 401 which triggers auth clearing
    // TODO: Fix the /api/dashboard/stats endpoint or remove this call
    return;
    
    /* try {
      const userId = currentUser?.id;
      if (!userId) return;

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/dashboard/stats/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(prev => ({
          ...prev,
          totalResumes: data.totalResumes || 0,
          totalViews: data.totalViews || 0,
          downloads: data.totalDownloads || 0,
          recruiterResponses: data.recruiterResponses || 0,
          shortlistCount: data.shortlistCount || 0,
          upvotesReceived: data.upvotesReceived || 0,
          likesReceived: data.likesReceived || 0,
          referralCount: data.referralCount || 0,
          profileViews: data.profileViews || 0
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } */
  };

  // Load subscription
  const loadSubscription = async () => {
    if (!currentUser?.id) {
      setLoadingSubscription(false);
      return;
    }

    try {
      const sub = await subscriptionApi.getUserSubscription(currentUser.id);
      setSubscription(sub);
      
      // Load usage data if subscription exists
      if (sub) {
        try {
          const usage = await subscriptionApi.getUserUsage(currentUser.id);
          setSubscriptionUsage(usage);
        } catch (usageError) {
          console.error('Error loading usage:', usageError);
          setSubscriptionUsage([]);
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  // Load real activity data
  const loadRecentActivity = async () => {
    // TEMPORARILY DISABLED - causing auth issues
    // setIsLoadingActivity(true);
    // try {
    //   const response = await activityApi.getRecentActivity();
    //   if (response.success) {
    //     setRecentActivity(response.data.activities);
    //   }
    // } catch (error) {
    //   console.error('Error loading recent activity:', error);
    //   // Keep empty array on error
    // } finally {
    //   setIsLoadingActivity(false);
    // }
    setIsLoadingActivity(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader 
        showToggle={true}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Overlay for mobile */}
        {isMobileSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          bg-white border-r border-gray-200 overflow-y-auto
          transform transition-all duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
          w-64
          mt-16 lg:mt-0
        `}>
          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab('ai-chat');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'ai-chat'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "AI Chat" : ""}
            >
              <MessageSquare className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">AI Chat</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'overview'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Overview" : ""}
            >
              <TrendingUp className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Overview</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('resumes');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'resumes'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "My Resumes" : ""}
            >
              <FileText className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">My Resumes</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('jobs');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'jobs'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Jobs" : ""}
            >
              <Search className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Jobs</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('fake-job-detector');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'fake-job-detector'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Fake Job Detector" : ""}
            >
              <Shield className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Fake Job Detector</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('recruiters');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'recruiters'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Recruiters" : ""}
            >
              <UserPlus className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Recruiters</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('referrals');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'referrals'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Referrals" : ""}
            >
              <ThumbsUp className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Referrals</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('interviews');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'interviews'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Interviews" : ""}
            >
              <Calendar className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Interviews</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('subscription');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'subscription'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Subscription" : ""}
            >
              <CreditCard className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Subscription</span>}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-lg text-left transition-all ${
                activeTab === 'settings'
                  ? 'bg-brand-background text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={isSidebarCollapsed ? "Settings" : ""}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span className="font-normal">Settings</span>}
            </button>
            
            {/* Desktop Toggle Button at Bottom */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex w-full items-center justify-center px-4 py-2 mt-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-all border-t pt-4"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-normal text-gray-600">Total Resumes</p>
                          <p className="text-2xl font-normal text-gray-900">{stats.totalResumes}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-normal text-gray-600">Profile Views</p>
                          <p className="text-2xl font-normal text-gray-900">{stats.totalViews}</p>
                        </div>
                        <Eye className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-normal text-gray-600">Recruiter Responses</p>
                          <p className="text-2xl font-normal text-gray-900">{stats.recruiterResponses}</p>
                        </div>
                        <UserPlus className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-normal text-gray-600">Profile Strength</p>
                          <p className="text-2xl font-normal text-gray-900">{stats.profileStrength}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI Chat Preview */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardHeader>
                      {/* <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        AI Career Assistant
                      </CardTitle> */}
                      <p className="text-sm text-gray-600">
                        Get instant career advice, resume tips, and job search guidance powered by AI
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => setActiveTab('ai-chat')} 
                        className="w-full bg-brand-background hover:bg-brand-background/90"
                      >
                        Start AI Chat Session
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Quick Resume Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-600" />
                        Resume Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={handleCreateResume} 
                        className="w-full" 
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Resume
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('resumes')} 
                        className="w-full" 
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View All Resumes
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'ai-chat' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* <div className="mb-6"> */}
                    {/* <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                      AI Career Assistant
                    </h2> */}
                    {/* <p className="text-gray-600 mt-2">
                      Get personalized career advice, resume analysis, job search strategies, and interview preparation tips powered by advanced AI.
                    </p> */}
                  {/* </div> */}
                  <JobSeekerChatInterface />
                </div>
              </div>
            )}

            {activeTab === 'resumes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-normal text-gray-900">My Resumes</h2>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowImportModal(true)} variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Import Resume
                    </Button>
                    <Button onClick={handleCreateResume} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Resume
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {resumes.length > 0 ? (
                    resumes.map((resume) => (
                      <Card key={resume.id} className="bg-white shadow-sm">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <h3 className="font-normal text-gray-900 text-lg">{resume.name}</h3>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Switch
                                    id={`active-${resume.id}`}
                                    checked={resume.isActive || false}
                                    onCheckedChange={() => handleToggleActive(resume.id, resume.isActive || false)}
                                    title={resume.isActive ? "Active Resume" : "Set as Active"}
                                  />
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleResumeAction("view", resume.id)}
                                    title="View Resume"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleResumeAction("edit", resume.id)}
                                    title="Edit Resume"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteResume(resume.id)}
                                    title="Delete Resume"
                                    disabled={resume.isActive}
                                    className={resume.isActive ? "opacity-50 cursor-not-allowed" : "hover:bg-red-50 hover:text-red-600 hover:border-red-300"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {resume.personalInfo?.title && (
                                <p className="text-sm text-blue-600 mb-1">{resume.personalInfo.title}</p>
                              )}
                              <p className="text-sm text-gray-500 mb-3">
                                Template: {resume.template} • Last updated {resume.lastUpdated}
                              </p>
                              {resume.atsScore && (
                                <div 
                                  className="mt-3 pt-3 border-t border-gray-200 cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors"
                                  onClick={() => {
                                    setSelectedATSScore(resume.atsScore);
                                    setSelectedResumeId(resume.id);
                                    setShowATSModal(true);
                                  }}
                                  title="Click to view detailed ATS breakdown"
                                >
                                  <ATSScoreDisplay atsScore={resume.atsScore} compact={true} />
                                </div>
                              )}
                              {!resume.atsScore && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCalculateATS(resume.id)}
                                    className="w-full"
                                  >
                                    Calculate ATS Score
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="bg-white shadow-sm">
                      <CardContent className="p-6 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-normal text-gray-900 mb-2">No resumes yet</h3>
                        <p className="text-gray-500 mb-4">Create your first resume to get started</p>
                        <Button onClick={handleCreateResume} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Your First Resume
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <JobMatchingDashboard 
                  userId={currentUser?.id?.toString() || ''}
                  resumeData={resumes.length > 0 ? resumes[0] : null}
                />
            )}

            {activeTab === 'fake-job-detector' && (
              <div className="space-y-6">
                <FakeJobDetector />
              </div>
            )}

            {activeTab === 'recruiters' && (
              <RecruiterInteractionsTab userId={currentUser?.id} />
            )}

            {activeTab === 'referrals' && (
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-normal text-gray-900">Referrals & Rewards</h2>
                  </div>
                  
                  {/* Referral System Tabs */}
                  <Tabs defaultValue="dashboard" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="dashboard">My Referrals</TabsTrigger>
                      <TabsTrigger value="create">Create Referral</TabsTrigger>
                      <TabsTrigger value="rewards">Rewards</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="dashboard">
                      <ReferralDashboard userId={currentUser?.id?.toString() || '0'} />
                    </TabsContent>
                    
                    <TabsContent value="create">
                      <Card className="bg-white shadow-sm">
                        <CardHeader>
                          <CardTitle>Create New Referral</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ReferralForm onSubmit={handleReferralSubmit} />
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="rewards">
                      <RewardsDashboard userId={currentUser?.id ? currentUser?.id?.toString() : 0} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}

            {activeTab === 'interviews' && (
              <div>
                {(() => {
                  const hasRecruiterToken = !!localStorage.getItem('recruiter_token');
                  const hasAuthToken = !!localStorage.getItem('authToken');
                  const userType = hasRecruiterToken ? 'recruiter' : 'job_seeker';
                  
                  console.log('🔍 Dashboard Interviews Tab Debug:', {
                    hasRecruiterToken,
                    hasAuthToken,
                    userType,
                    recruiterTokenPreview: localStorage.getItem('recruiter_token')?.substring(0, 30) + '...',
                    authTokenPreview: localStorage.getItem('authToken')?.substring(0, 30) + '...'
                  });
                  
                  return <InterviewsDashboard userType={userType} />;
                })()}
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Subscription & Billing</h2>
                  <p className="text-gray-600">
                    Manage your subscription, track usage, and view billing history
                  </p>
                </div>

                {!subscription ? (
                  <div className="space-y-6">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-blue-900">Choose Your Plan</h3>
                            <p className="text-sm text-blue-700 mt-1">
                              Select a subscription plan to unlock premium features and accelerate your job search.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <JobSeekerPlanSelector 
                      onSelectPlan={async (planId: string, billingCycle: 'monthly' | 'yearly') => {
                        try {
                          const result = await subscriptionApi.createUserSubscription({
                            userId: currentUser.id,
                            planId,
                            billingCycle
                          });
                          
                          if (result.paymentUrl) {
                            window.location.href = result.paymentUrl;
                          } else if (result.subscription) {
                            setSubscription(result.subscription);
                            toast.success('Subscription activated successfully!');
                          }
                        } catch (error) {
                          console.error('Error selecting plan:', error);
                          toast.error('Failed to create subscription. Please try again.');
                        }
                      }}
                    />
                  </div>
                ) : (
                  <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview" className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Overview
                      </TabsTrigger>
                      <TabsTrigger value="usage" className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Usage
                      </TabsTrigger>
                      <TabsTrigger value="billing" className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Billing
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Current Subscription</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h3 className="font-semibold text-lg">{subscription.plan?.displayName}</h3>
                                <p className="text-sm text-gray-600">
                                  {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  // Show plan selector in a modal or switch to a different view
                                  toast.info('Plan change feature coming soon!');
                                }}
                              >
                                Change Plan
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="usage">
                      <Card>
                        <CardHeader>
                          <CardTitle>Usage Analytics</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {loadingSubscription ? (
                            <div className="flex items-center justify-center p-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                          ) : (
                            <JobSeekerUsageTracker 
                              subscription={subscription} 
                              usage={subscriptionUsage} 
                            />
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="billing">
                      {loadingSubscription ? (
                        <div className="flex items-center justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <JobSeekerSubscriptionDashboard 
                          userId={currentUser.id.toString()} 
                          subscription={subscription} 
                        />
                      )}
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Profile Settings */}
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={profileData.avatar || "/placeholder-avatar.jpg"} alt={profileData.name || "User"} />
                          <AvatarFallback className="text-lg">
                            {profileData.name ? profileData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-normal text-slate-900">
                            {profileData.name || 'User'}
                          </h3>
                          <p className="text-sm text-slate-600">{profileData.email || 'user@example.com'}</p>
                          <div className="mt-2">
                            <input
                              type="file"
                              id="avatar-upload"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarChange}
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              disabled={isSavingProfile}
                            >
                              Change Photo
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-normal text-slate-700">
                            Full Name
                          </label>
                          <Input 
                            value={profileData.name || ''} 
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="mt-1" 
                          />
                        </div>
                        <div>
                          <label className="text-sm font-normal text-slate-700">
                            Email
                          </label>
                          <Input 
                            value={profileData.email || ''} 
                            readOnly
                            disabled
                            className="mt-1 bg-gray-50 cursor-not-allowed" 
                            title="Email cannot be changed"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-normal text-slate-700">
                            Mobile Number
                          </label>
                          <Input 
                            value={profileData.mobile || ''} 
                            onChange={(e) => setProfileData({...profileData, mobile: e.target.value})}
                            placeholder="+1 (555) 000-0000"
                            className="mt-1" 
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="w-full"
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </Button>
                      {profileSaveMessage && (
                        <p className={`text-sm ${profileSaveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                          {profileSaveMessage}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Preferences */}
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle>Preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-normal text-slate-900">
                              Email Notifications
                            </p>
                            <p className="text-sm text-slate-600">
                              Get notified about resume views and downloads
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-normal text-slate-900">
                              Public Profile
                            </p>
                            <p className="text-sm text-slate-600">
                              Allow others to discover your resumes
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Settings
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-normal text-slate-900">
                              Download Quality
                            </p>
                            <p className="text-sm text-slate-600">
                              Set default PDF export quality
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            High Quality
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Account Security */}
                  <Card className="bg-white shadow-sm lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Account Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-normal text-slate-900">Password</h4>
                          <p className="text-sm text-slate-600">
                            Last updated {passwordLastChanged}
                          </p>
                          <Button variant="outline" onClick={() => setIsChangePasswordOpen(true)}>Change Password</Button>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-normal text-slate-900">
                            Two-Factor Authentication
                          </h4>
                          <p className="text-sm text-slate-600">
                            Add an extra layer of security
                          </p>
                          <Button variant="outline">Enable 2FA</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-normal">Current Password</label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-normal">New Password</label>
              <Input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-normal">Confirm New Password</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
              />
            </div>
            {passwordChangeMessage && (
              <div className={`p-3 rounded-md ${passwordChangeMessage.includes('success') || passwordChangeMessage.includes('Redirecting') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-sm font-medium ${passwordChangeMessage.includes('success') || passwordChangeMessage.includes('Redirecting') ? 'text-green-800' : 'text-red-800'}`}>
                  {passwordChangeMessage}
                </p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || passwordChangeMessage.includes('Redirecting')}
                className="flex-1"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordChangeMessage('');
                }}
                disabled={isChangingPassword || passwordChangeMessage.includes('Redirecting')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setResumeToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Import Modal */}
      <ResumeImportModal 
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(resumeId) => {
          setShowImportModal(false);
          // Refresh resumes list
          refreshResumes();
          // Navigate to resume builder to edit the imported resume
          navigate(`/builder?edit=true&id=${resumeId}`);
        }}
      />

      {/* ATS Score Details Modal */}
      <Dialog open={showATSModal} onOpenChange={(open) => {
        setShowATSModal(open);
        if (!open) {
          setImprovementResult(null); // Clear result when closing
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ATS Score Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown of your resume's ATS compatibility score
            </DialogDescription>
          </DialogHeader>
          
          {/* Improvement Result Feedback */}
          {improvementResult && (
            <div className={`p-4 rounded-lg border ${
              improvementResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {improvementResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    improvementResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {improvementResult.success ? '✅ Resume Improved!' : 'Improvement Failed'}
                  </h4>
                  
                  {improvementResult.success && improvementResult.oldScore && improvementResult.newScore && (
                    <div className="mb-2 text-sm font-normal text-green-800">
                      Score: {improvementResult.oldScore} → {improvementResult.newScore} 
                      <span className={`ml-2 ${
                        improvementResult.newScore > improvementResult.oldScore 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        ({improvementResult.newScore > improvementResult.oldScore ? '+' : ''}{improvementResult.newScore - improvementResult.oldScore} points)
                      </span>
                    </div>
                  )}
                  
                  <p className={`text-sm ${
                    improvementResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {improvementResult.message}
                  </p>
                  
                  {improvementResult.success && improvementResult.improvements && improvementResult.improvements.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {improvementResult.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                          <span className="text-green-600">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {selectedATSScore && (
            <ATSScoreDisplay 
              atsScore={selectedATSScore} 
              compact={false}
              onImprove={handleImproveATS}
              isImproving={isImprovingATS}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Recruiter Interactions Tab Component
function RecruiterInteractionsTab({ userId }: { userId?: string }) {
  const [interactions, setInteractions] = useState<RecruiterInteraction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadInteractions();
    }
  }, [userId]);

  const loadInteractions = async () => {
    try {
      setLoading(true);
      const response = await recruiterInteractionsApi.getInteractions(parseInt(userId!));
      if (response.success) {
        setInteractions(response.data);
      }
    } catch (error) {
      console.error('Failed to load recruiter interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'upvote':
        return '👍';
      case 'shortlist':
      case 'shortlisted':
        return '⭐';
      case 'view':
      case 'viewed':
        return '👁️';
      case 'download':
      case 'downloaded':
        return '📥';
      case 'liked':
        return '❤️';
      case 'interested':
        return '🎯';
      case 'contacted':
        return '📞';
      default:
        return '📋';
    }
  };

  const getActionText = (actionType: string) => {
    switch (actionType) {
      case 'upvote':
        return 'upvoted your resume';
      case 'shortlist':
      case 'shortlisted':
        return 'shortlisted your resume';
      case 'view':
      case 'viewed':
        return 'viewed your resume';
      case 'download':
      case 'downloaded':
        return 'downloaded your resume';
      case 'liked':
        return 'liked your resume';
      case 'interested':
        return 'showed interest in your resume';
      case 'contacted':
        return 'contacted you about your resume';
      default:
        return 'interacted with your resume';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'upvote':
        return 'bg-blue-100 text-blue-800';
      case 'shortlist':
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800';
      case 'view':
      case 'viewed':
        return 'bg-green-100 text-green-800';
      case 'download':
      case 'downloaded':
        return 'bg-orange-100 text-orange-800';
      case 'liked':
        return 'bg-red-100 text-red-800';
      case 'interested':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-normal text-gray-900">Recruiter Interactions</h2>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-gray-500">Loading interactions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (interactions.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-normal text-gray-900">Recruiter Interactions</h2>
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-gray-500">No recruiter interactions yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Share your resume with recruiters to start seeing interactions here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-normal text-gray-900">Recruiter Interactions</h2>
      <div className="space-y-4">
        {interactions.map((interaction) => (
          <Card key={interaction.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-2xl">{getActionIcon(interaction.actionType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={getActionColor(interaction.actionType)}>
                      {interaction.actionType.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-gray-500">{interaction.timestamp}</span>
                  </div>
                  <p className="text-gray-900">
                    <span className="font-normal">{interaction.recruiter.name}</span>
                    {interaction.recruiter.company && (
                      <span className="text-gray-600"> from {interaction.recruiter.company}</span>
                    )}
                    {interaction.recruiter.position && (
                      <span className="text-gray-500"> ({interaction.recruiter.position})</span>
                    )}
                    <span className="text-gray-700"> {getActionText(interaction.actionType)}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Resume: <span className="font-normal">{interaction.resumeTitle}</span>
                  </p>
                  {interaction.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">
                      Note: "{interaction.notes}"
                    </p>
                  )}
                  {interaction.viewCount && interaction.viewCount > 1 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Viewed {interaction.viewCount} times
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}