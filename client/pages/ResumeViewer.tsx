import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { unifiedAuthService } from "@/services/unifiedAuthService";
import { Resume } from "@shared/api";
import {
  getTemplateConfig,
  type TemplateCategory,
  type TemplateConfig,
} from "@/services/templateService";
import { getTemplateCategoryFromId } from "@/services/templateContentInitializer";
import { reactPdfService } from "@/services/reactPdfService";
import { TemplateCustomizationService, type TemplateCustomization } from "@/services/templateCustomizationService";

import TemplateRenderer from "@/components/templates/TemplateRenderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import TemplateSwitcher from "@/components/TemplateSwitcher";
import ResumeDisplay from "@/components/ResumeDisplay";
import { CustomizationTrigger as NewCustomizationTrigger } from "@/components/customization";
import { CustomizationTrigger } from "@/components/templates/customization/CustomizationTrigger";
import { TemplateCustomizationPanel } from "@/components/templates/customization/TemplateCustomizationPanel";
import { Download, Palette, Mail, Calendar, Share2 } from "lucide-react";
import { ProfessionalSummaryEditModal } from "@/components/resume/ProfessionalSummaryEditModal";
import { SkillsEditModal } from "@/components/resume/SkillsEditModal";
import { CareerObjectiveEditModal } from "@/components/resume/CareerObjectiveEditModal";
import { ProjectsEditModal } from "@/components/resume/ProjectsEditModal";
import { EducationEditModal } from "@/components/resume/EducationEditModal";
import { PersonalInfoEditModal } from "@/components/resume/PersonalInfoEditModal";
import { ExperienceEditModal } from "@/components/resume/ExperienceEditModal";
import { CertificationsEditModal } from "@/components/resume/CertificationsEditModal";
import { JobPreferencesModal } from "@/components/resume/JobPreferencesModal";
import { resumeUpdateApi } from "@/services/resumeUpdateApi";
// Removed unused import

export default function ResumeViewer() {
  const { id, shareToken } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvotes, setUpvotes] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");



  // Content caching for performance
  const [contentCache, setContentCache] = useState<Map<string, Resume>>(new Map());

  // Template customization state
  const [customizedTemplateConfig, setCustomizedTemplateConfig] = useState<TemplateConfig | null>(null);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [currentCustomization, setCurrentCustomization] = useState<TemplateCustomization | null>(null);
  
  // User information state
  const [userName, setUserName] = useState<string>("");
  
  // Edit modal states
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingObjective, setIsEditingObjective] = useState(false);
  const [isEditingProjects, setIsEditingProjects] = useState(false);
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [isEditingExperience, setIsEditingExperience] = useState(false);
  const [isEditingCertifications, setIsEditingCertifications] = useState(false);
  const [isEditingJobPreferences, setIsEditingJobPreferences] = useState(false);
  const [showEditButtons, setShowEditButtons] = useState(false);
  
  // Check if current user owns this resume
  const isResumeOwner = () => {
    if (shareToken) return false; // Shared resumes are not editable
    
    // For now, assume user owns the resume if they're authenticated and viewing their own resume
    // This is a temporary solution - ideally we should get userId from the resume data
    const currentUserId = user?.id || localStorage.getItem('userId');
    return !!currentUserId && !shareToken;
  };
  
  // Template detection from URL parameters - moved to top
  const templateParam = searchParams.get("template");
  const isPreviewMode = searchParams.get("preview") === "true";
  console.log("🔍 TEMPLATE PARAM FROM URL:", templateParam);
  console.log("👁️ PREVIEW MODE:", isPreviewMode);
  
  // Handle both template categories and template IDs
  let templateConfig: TemplateConfig;
  let actualTemplateCategory: TemplateCategory;
  
  try {
    if (templateParam) {
      // First, try to use it as a template category
      try {
        templateConfig = getTemplateConfig(templateParam as TemplateCategory);
        actualTemplateCategory = templateParam as TemplateCategory;
        console.log("✅ TEMPLATE PARAM IS A CATEGORY:", templateParam);
      } catch {
        // If that fails, try to convert template ID to category
        const categoryFromId = getTemplateCategoryFromId(templateParam);
        if (categoryFromId) {
          templateConfig = getTemplateConfig(categoryFromId as TemplateCategory);
          actualTemplateCategory = categoryFromId as TemplateCategory;
          console.log("🔄 CONVERTED TEMPLATE ID TO CATEGORY:", templateParam, "->", categoryFromId);
        } else {
          throw new Error("Could not resolve template");
        }
      }
    } else {
      templateConfig = getTemplateConfig("technology");
      actualTemplateCategory = "technology";
    }
  } catch (error) {
    console.warn("⚠️ Could not get template config for:", templateParam, "- using default");
    templateConfig = getTemplateConfig("technology");
    actualTemplateCategory = "technology";
  }
  
  console.log("📋 TEMPLATE CONFIG:", templateConfig);
  console.log("🎯 ACTUAL TEMPLATE CATEGORY:", actualTemplateCategory);

  // Initialize customized template config when template config changes
  useEffect(() => {
    setCustomizedTemplateConfig(templateConfig);
  }, [templateConfig]);

  // Load and apply new customization system settings
  useEffect(() => {
    const loadAndApplyCustomization = async () => {
      // Skip customization loading for shared resumes (no authentication needed)
      // Check both shareToken param and URL path for shared resume indicators
      const isSharedResume = !!shareToken || window.location.pathname.includes('/share/');
      
      if (isSharedResume) {
        console.log('⏭️ Skipping customization load for shared resume (shareToken or /share/ path detected)');
        return;
      }
      
      try {
        const { customizationService } = await import('@/services/customizationService');
        // Always load settings (will return defaults if none saved)
        const settings = await customizationService.loadSettings(user?.id ? Number(user.id) : undefined);
        // Always apply settings to ensure defaults are set
        customizationService.applySettings(settings);
        console.log('✅ Customization settings loaded and applied:', settings);
      } catch (error) {
        console.error('Failed to load customization settings:', error);
        // Apply defaults even if loading fails
        try {
          const { customizationService } = await import('@/services/customizationService');
          const defaults = customizationService.getDefaultSettings();
          customizationService.applySettings(defaults);
          console.log('✅ Applied default customization settings');
        } catch (err) {
          console.error('Failed to apply default settings:', err);
        }
      }
    };
    
    loadAndApplyCustomization();
  }, [user?.id, shareToken]);

  // Remove the old CSS application system - now handled by currentCustomization useEffect

  // Load resume data with template-specific content
  useEffect(() => {
    const loadResumeData = async () => {
      try {
        // IMPORTANT: For shared resumes, skip ALL authentication checks
        // Shared resumes are public and don't require login
        const isSharedResume = !!shareToken;
        
        // If we already have a resume loaded and this is a shared resume, don't reload
        if (resume && isSharedResume) {
          console.log("✅ Shared resume already loaded, skipping reload");
          return;
        }
        
        setLoading(true);
        setError(null);

        // Check if this is a shared resume request
        if (isSharedResume) {
          console.log("🔗 LOADING SHARED RESUME WITH TOKEN:", shareToken);
          console.log("🔗 Full URL:", `/api/resume-sharing/resume/${shareToken}`);
          try {
            const response = await fetch(`/api/resume-sharing/resume/${shareToken}`);
            console.log("📡 Response status:", response.status);
            console.log("📡 Response ok:", response.ok);
            
            if (response.ok) {
              const sharedData = await response.json();
              console.log("📦 Shared data received:", sharedData);
              
              if (sharedData.success && sharedData.data) {
                const sharedResume = sharedData.data;
                
                // Convert shared resume format to Resume interface format
                const userResumeData = {
                  id: sharedResume.id,
                  personalInfo: {
                    name: sharedResume.personalInfo?.name || `${sharedResume.personalInfo?.firstName || ''} ${sharedResume.personalInfo?.lastName || ''}`.trim(),
                    title: sharedResume.personalInfo?.title || "Professional",
                    email: sharedResume.personalInfo?.email || '',
                    phone: sharedResume.personalInfo?.phone || '',
                    location: sharedResume.personalInfo?.location || '',
                    website: sharedResume.personalInfo?.portfolioUrl || sharedResume.personalInfo?.website || '',
                    linkedin: sharedResume.personalInfo?.linkedinUrl || sharedResume.personalInfo?.linkedin || '',
                    github: sharedResume.personalInfo?.githubUrl || sharedResume.personalInfo?.github || '',
                    avatar: sharedResume.personalInfo?.avatar || ''
                  },
                  summary: sharedResume.summary || sharedResume.personalInfo?.summary || "",
                  objective: sharedResume.objective || "",
                  skills: sharedResume.skills || [],
                  experiences: sharedResume.experiences || sharedResume.experience || [],
                  education: sharedResume.education || [],
                  projects: sharedResume.projects || [],
                  certifications: sharedResume.certifications || [],
                  upvotes: sharedResume.upvotes || 0,
                  rating: sharedResume.rating || 0,
                  isShortlisted: false,
                  createdAt: sharedResume.createdAt,
                  updatedAt: sharedResume.updatedAt
                };
                
                console.log("🔍 USER RESUME DATA SUMMARY:", userResumeData.summary);
                console.log("🔍 USER RESUME DATA SUMMARY LENGTH:", userResumeData.summary?.length);
                console.log("🔍 USER RESUME DATA EXPERIENCES COUNT:", userResumeData.experiences?.length);
                console.log("🔍 USER RESUME DATA EXPERIENCES:", userResumeData.experiences);
                
                // Apply template customization if available
                if (sharedData.data.templateCustomization) {
                  console.log("🎨 Applying template customization from shared resume:", sharedData.data.templateCustomization);
                  setCurrentCustomization(sharedData.data.templateCustomization);
                } else {
                  console.log("ℹ️ No template customization found for shared resume");
                }
                
                setResume(userResumeData);
                setUserName(userResumeData.personalInfo.name || "User");
                setUpvotes(userResumeData.upvotes);
                setHasUpvoted(false);
                
                // Load actual upvote count and status from API
                console.log('🔍 SHARED RESUME: Calling loadUpvoteStatus with ID:', sharedResume.id);
                await loadUpvoteStatus(sharedResume.id);
                
                // Load shortlist status using the dedicated function
                console.log('🔍 SHARED RESUME: Calling loadShortlistStatus with ID:', sharedResume.id, 'token:', shareToken?.substring(0, 10) + '...');
                await loadShortlistStatus(sharedResume.id, shareToken);
                
                setLoading(false);
                return;
              }
            } else {
              const errorText = await response.text();
              console.error("Failed to fetch shared resume:", response.status, errorText);
              setError(`Failed to load shared resume. The link may be expired or invalid. (Status: ${response.status})`);
              setLoading(false);
              return;
            }
          } catch (sharedError) {
            console.error("Error fetching shared resume:", sharedError);
            setError("Failed to load shared resume. Please check your connection.");
            setLoading(false);
            return;
          }
        }
        
        // If shareToken was provided but we couldn't load the shared resume, stop here
        // Don't fall through to authenticated user resume loading
        if (shareToken) {
          console.log("❌ Shared resume loading failed, stopping execution");
          setError("Unable to load shared resume. The link may be invalid or expired.");
          setLoading(false);
          return;
        }

        // Always load from database API (same as ResumeBuilder)
        // This eliminates localStorage complexity and ensures data consistency
        console.log("LOADING USER RESUME DATA FROM DATABASE");
        
        let userResumeData = null;
        
        try {
          // Check if we should attempt API call - either service says authenticated OR we have tokens in storage
          const isAuth = unifiedAuthService.isAuthenticated();
          const hasTokenInStorage = !!localStorage.getItem('authToken');
          
          console.log('🔍 API call decision:', {
            isAuth,
            hasTokenInStorage,
            shouldCallAPI: isAuth || hasTokenInStorage
          });
          
          if (isAuth || hasTokenInStorage) {
            console.log("🔍 FETCHING USER'S ACTUAL RESUME FROM API...");
            
            // Get headers - try service first, fallback to direct localStorage access
            let headers;
            if (isAuth) {
              headers = unifiedAuthService.getAuthHeaders();
            } else {
              // Fallback: construct headers directly from localStorage
              const token = localStorage.getItem('authToken');
              headers = {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
              };
            }
            
            console.log('🔍 Using headers:', {
              hasAuth: !!headers.Authorization,
              authPrefix: headers.Authorization ? headers.Authorization.substring(0, 20) + '...' : 'none'
            });
            
            // If we have a specific resume ID, use the singular endpoint
            const url = id ? `/api/resume/${id}` : "/api/resumes";
            const response = await fetch(url, {
              headers
            });
            
            if (response.ok) {
              const resumesData = await response.json();
              if (resumesData.success) {
                // For singular endpoint, data is the resume object; for plural, it's an array
                const targetResume = id ? resumesData.data : resumesData.data?.[0];
                
                console.log(`🔍 Looking for resume ID: ${id} (type: ${typeof id})`);
                if (id) {
                  console.log(`🎯 Found target resume: ${targetResume ? targetResume.title : 'NOT FOUND'}`);
                } else {
                  console.log(`📋 Available resume IDs: ${resumesData.data?.map(r => `${r.id} (${typeof r.id})`).join(', ')}`);
                  console.log(`🎯 Found target resume: ${targetResume ? targetResume.title : 'NOT FOUND'}`);
                }
                
                if (targetResume) {
                  // console.log("🔍 DEBUG: Target resume personalInfo:", targetResume.personalInfo);
                  // console.log("🔍 DEBUG: Target resume summary:", targetResume.summary);
                  // console.log("🔍 DEBUG: Target resume personalInfo.title:", targetResume.personalInfo.title);
                  // console.log("🔍 DEBUG: Target resume personalInfo.summary:", targetResume.personalInfo.summary);
                  // // Convert database resume format to Resume interface format
                  userResumeData = {
                    id: targetResume.id,
                    personalInfo: {
                      name: targetResume.personalInfo?.name || `${targetResume.personalInfo?.firstName || ''} ${targetResume.personalInfo?.lastName || ''}`.trim(),
                      title: targetResume.personalInfo?.title || (() => {
                        // Extract title from summary if it starts with "Updated:" or similar patterns
                        const summary = targetResume.summary || targetResume.personalInfo?.summary || "";
                        if (summary) {
                          // Handle "Updated: Title" format
                          if (summary.startsWith("Updated:")) {
                            const titleMatch = summary.match(/Updated:\s*(.+?)(?:\s+with\s+|\s*$)/i);
                            if (titleMatch) {
                              return titleMatch[1].trim();
                            }
                          }
                          
                          // Handle direct title format (first sentence)
                          const firstSentence = summary.split('.')[0].trim();
                          if (firstSentence && firstSentence.length < 100) {
                            return firstSentence;
                          }
                        }
                        
                        return "Professional";
                      })(),
                      email: targetResume.personalInfo?.email || '',
                      phone: targetResume.personalInfo?.phone || '',
                      location: targetResume.personalInfo?.location || '',
                      website: targetResume.personalInfo?.portfolioUrl || targetResume.personalInfo?.website || '',
                      linkedin: targetResume.personalInfo?.linkedinUrl || targetResume.personalInfo?.linkedin || '',
                      github: targetResume.personalInfo?.githubUrl || targetResume.personalInfo?.github || '',
                      avatar: targetResume.personalInfo?.avatar || ''
                    },
                    summary: targetResume.summary || targetResume.personalInfo?.summary || "",
                    objective: targetResume.objective || "",
                    skills: targetResume.skills || [],
                    experiences: targetResume.experiences || targetResume.experience || [],
                    education: targetResume.education || [],
                    projects: targetResume.projects || [],
                    certifications: targetResume.certifications || [],
                    upvotes: 127,
                    rating: 4.8,
                    isShortlisted: false,
                    createdAt: targetResume.createdAt,
                    updatedAt: targetResume.updatedAt
                  };
                  console.log(`✅ LOADED ACTUAL RESUME: ${userResumeData.personalInfo.name}`);
                  console.log("🔍 RESUME DATA DETAILS:");
                  console.log("- ID:", userResumeData.id);
                  console.log("- Name:", userResumeData.personalInfo.name);
                  console.log("- Email:", userResumeData.personalInfo.email);
                  console.log("- Summary:", userResumeData.summary);
                  console.log("- Summary length:", userResumeData.summary?.length);
                  console.log("- Skills count:", userResumeData.skills?.length);
                  console.log("- Experience count:", userResumeData.experiences?.length);
                }
              }
            } else {
              console.warn("Failed to fetch resume from API:", response.status);
              // Log response details for debugging
              try {
                const errorData = await response.text();
                console.warn("API Error Response:", errorData);
              } catch (e) {
                console.warn("Could not read error response");
              }
              
              // If authenticated endpoint failed and we have an ID, try public endpoint
              // This handles recruiters viewing candidate resumes
              if (id && response.status === 404) {
                console.log("🔄 Trying public endpoint as fallback...");
                try {
                  const publicResponse = await fetch(`/api/resume/public/${id}`);
                  if (publicResponse.ok) {
                    const resumeData = await publicResponse.json();
                    if (resumeData.success && resumeData.data) {
                      const targetResume = resumeData.data;
                      userResumeData = {
                        id: targetResume.id,
                        personalInfo: {
                          name: targetResume.personalInfo?.name || `${targetResume.personalInfo?.firstName || ''} ${targetResume.personalInfo?.lastName || ''}`.trim(),
                          title: targetResume.personalInfo?.title || "Professional",
                          email: targetResume.personalInfo?.email || '',
                          phone: targetResume.personalInfo?.phone || '',
                          location: targetResume.personalInfo?.location || '',
                          website: targetResume.personalInfo?.portfolioUrl || targetResume.personalInfo?.website || '',
                          linkedin: targetResume.personalInfo?.linkedinUrl || targetResume.personalInfo?.linkedin || '',
                          github: targetResume.personalInfo?.githubUrl || targetResume.personalInfo?.github || '',
                          avatar: targetResume.personalInfo?.avatar || ''
                        },
                        summary: targetResume.summary || targetResume.personalInfo?.summary || "",
                        objective: targetResume.objective || "",
                        skills: targetResume.skills || [],
                        experiences: targetResume.experiences || targetResume.experience || [],
                        education: targetResume.education || [],
                        projects: targetResume.projects || [],
                        upvotes: 0,
                        rating: 0,
                        isShortlisted: false,
                        createdAt: targetResume.createdAt,
                        updatedAt: targetResume.updatedAt
                      };
                      console.log(`✅ LOADED RESUME VIA PUBLIC ENDPOINT (fallback): ${userResumeData.personalInfo.name}`);
                    }
                  }
                } catch (publicError) {
                  console.warn("Error fetching resume from public endpoint:", publicError);
                }
              }
            }
          } else {
            console.log("🚫 No authentication - trying public endpoint");
            // Try public endpoint for recruiters viewing candidate resumes
            if (id) {
              try {
                const response = await fetch(`/api/resume/public/${id}`);
                if (response.ok) {
                  const resumeData = await response.json();
                  if (resumeData.success && resumeData.data) {
                    const targetResume = resumeData.data;
                    userResumeData = {
                      id: targetResume.id,
                      personalInfo: {
                        name: targetResume.personalInfo?.name || `${targetResume.personalInfo?.firstName || ''} ${targetResume.personalInfo?.lastName || ''}`.trim(),
                        title: targetResume.personalInfo?.title || "Professional",
                        email: targetResume.personalInfo?.email || '',
                        phone: targetResume.personalInfo?.phone || '',
                        location: targetResume.personalInfo?.location || '',
                        website: targetResume.personalInfo?.portfolioUrl || targetResume.personalInfo?.website || '',
                        linkedin: targetResume.personalInfo?.linkedinUrl || targetResume.personalInfo?.linkedin || '',
                        github: targetResume.personalInfo?.githubUrl || targetResume.personalInfo?.github || '',
                        avatar: targetResume.personalInfo?.avatar || ''
                      },
                      summary: targetResume.summary || targetResume.personalInfo?.summary || "",
                      objective: targetResume.objective || "",
                      skills: targetResume.skills || [],
                      experiences: targetResume.experiences || targetResume.experience || [],
                      education: targetResume.education || [],
                      projects: targetResume.projects || [],
                      upvotes: 0,
                      rating: 0,
                      isShortlisted: false,
                      createdAt: targetResume.createdAt,
                      updatedAt: targetResume.updatedAt
                    };
                    console.log(`✅ LOADED RESUME VIA PUBLIC ENDPOINT: ${userResumeData.personalInfo.name}`);
                  }
                }
              } catch (publicError) {
                console.warn("Error fetching resume from public endpoint:", publicError);
              }
            }
          }
        } catch (apiError) {
          console.warn("Error fetching resume from API:", apiError);
        }

        // Clear any old localStorage data that might be interfering
        if (userResumeData) {
          console.log("✅ USING API DATA - CLEARING OLD LOCALSTORAGE DATA");
          // Clear old resume data to prevent conflicts
          localStorage.removeItem("1");
          localStorage.removeItem("2");
          localStorage.removeItem("resume-3");
        } else {
          console.log("⚠️ NO API DATA FOUND - THIS SHOULD NOT HAPPEN FOR LOGGED IN USERS");
          console.log("🔍 Checking if user is authenticated...");
          const isAuth = unifiedAuthService.isAuthenticated();
          const user = unifiedAuthService.getStoredUser();
          console.log(`Is authenticated: ${isAuth}`);
          console.log(`User exists: ${!!user}`);
          if (user) {
          try {
            // user is already a User object, no need to parse
            console.log(`User data: ${user.name || user.email}`);
          } catch (e) {
            console.log("Could not access user data");
          }
        }
        }

        if (userResumeData) {
          // Use user's actual data
          setResume(userResumeData);
          
          // Set user name for display
          setUserName(userResumeData.personalInfo.name || "User");
          
          console.log("✅ USING USER'S ACTUAL RESUME DATA");
          console.log("📊 Projects count:", userResumeData.projects?.length);
          console.log("🖼️ Project images:", userResumeData.projects?.map(p => ({ title: p.title, images: p.images?.length || 0 })));
          
          // Set default interaction state
          setUpvotes(userResumeData.upvotes || 127);
          setIsShortlisted(userResumeData.isShortlisted || false);
          setHasUpvoted(false);
          
          // Load actual upvote status from API
          loadUpvoteStatus(userResumeData.id);
          setLoading(false);
          return; // Exit early - don't run the template content fallback code
        }

        // If we reach here, it means no API data was found
        // For shared resumes (shareToken), don't require authentication - it's public
        if (shareToken) {
          console.log("⚠️ Shared resume data not loaded - showing error (no auth required)");
          setLoading(false);
          setError("Resume not found or link expired");
          return;
        }
        
        // This should NOT happen for authenticated users
        console.log("🚨 CRITICAL: NO API DATA FOUND FOR AUTHENTICATED USER!");
        console.log("🔍 This suggests an authentication or API issue");
        
        // Check authentication status
        const isAuth = unifiedAuthService.isAuthenticated();
        const user = unifiedAuthService.getStoredUser();
        
        // Also check localStorage directly for fallback authentication
        const hasTokenInStorage = !!localStorage.getItem('authToken');
        const hasUserInStorage = !!localStorage.getItem('user');
        
        console.log('🔍 Auth status check:', {
          isAuth,
          hasUser: !!user,
          hasTokenInStorage,
          hasUserInStorage
        });
        
        if (!isAuth && !hasTokenInStorage) {
          console.log("❌ User is not properly authenticated - redirecting to login");
          window.location.href = '/';
          return;
        }
        
        // If we have tokens in storage but service says not authenticated, 
        // try to initialize the auth service
        if (!shareToken && !isAuth && hasTokenInStorage && hasUserInStorage) {
          console.log("🔄 Found tokens in storage but service not initialized, trying to recover...");
          try {
            const storedUser = JSON.parse(localStorage.getItem('user') || localStorage.getItem('recruiter_user') || '{}');
            console.log("🔄 Attempting to use stored auth data for this session");
            // Continue with localStorage fallback instead of redirecting
          } catch (e) {
            console.log("❌ Could not parse stored user data - redirecting to login");
            window.location.href = '/';
            return;
          }
        }
        
        // Try localStorage as final fallback for preview functionality
        console.log("🔍 Trying localStorage as final fallback for resume ID:", id);
        
        // Try multiple localStorage keys
        const possibleKeys = [id, `resume-${id}`, "1"];
        let localStorageData = null;
        let usedKey = null;
        
        for (const key of possibleKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.personalInfo) {
                localStorageData = parsed;
                usedKey = key;
                console.log(`✅ Found resume data in localStorage under key: ${key}`);
                break;
              }
            } catch (e) {
              console.log(`❌ Invalid JSON in localStorage key: ${key}`);
            }
          }
        }
        
        if (localStorageData) {
          console.log("✅ Using localStorage data for preview");
          
          // Convert localStorage format to Resume interface format
          const resumeFromStorage: Resume = {
            id: localStorageData.id || id,
            personalInfo: localStorageData.personalInfo,
            summary: localStorageData.summary || "",
            objective: localStorageData.objective || "",
            skills: localStorageData.skills || [],
            experiences: localStorageData.experiences || [],
            education: localStorageData.education || [],
            projects: localStorageData.projects || [],
            certifications: localStorageData.certifications || [],
            upvotes: 127,
            rating: 4.8,
            isShortlisted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setResume(resumeFromStorage);
          setUpvotes(127);
          setIsShortlisted(false);
          setHasUpvoted(false);
          
          // Try to load upvote status if we have a resume ID
          const resumeId = searchParams.get('id');
          if (resumeId) {
            loadUpvoteStatus(resumeId);
          }
          setLoading(false);
          return;
        }
        
        // If user is authenticated but no resume data found anywhere, show error
        setError("Could not load your resume data. Please try logging out and logging back in.");
        setLoading(false);
        return;
      } catch (error) {
        console.error("Error loading resume data:", error);
        setError("Failed to load resume data. Please try again.");
        setLoading(false);
      }
    };

    loadResumeData();
  }, [id, shareToken]); // Only reload when resume ID or share token changes

  // Refresh shortlist status periodically and on window focus for shared resumes
  useEffect(() => {
    if (!shareToken || !resume?.id) {
      return; // Only for shared resumes
    }

    // Only refresh when window gains focus (user switches back to tab)
    // Removed polling interval - status only changes when user clicks shortlist button
    const handleFocus = () => {
      loadShortlistStatus(resume.id, shareToken);
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [shareToken, resume?.id]); // Removed isShortlisted from dependencies

  // Load upvote status from API
  const loadUpvoteStatus = async (resumeId: string | number) => {
    try {
      console.log('📊 [UPVOTE API] Loading upvote status for resume:', resumeId);
      console.log('📊 [UPVOTE API] Making request to:', `/api/resume-upvotes/${resumeId}`);
      
      const response = await fetch(`/api/resume-upvotes/${resumeId}`);
      
      console.log('📊 [UPVOTE API] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('⚠️ [UPVOTE API] Failed to load upvote status:', response.status, errorText);
        return;
      }
      
      const result = await response.json();
      console.log('📊 [UPVOTE API] Response data:', result);
      
      if (result.success) {
        setUpvotes(result.data.upvotes);
        setHasUpvoted(result.data.hasUpvoted);
        console.log('✅ [UPVOTE API] Upvote status loaded successfully:', {
          upvotes: result.data.upvotes,
          hasUpvoted: result.data.hasUpvoted
        });
      } else {
        console.warn('⚠️ [UPVOTE API] API returned success=false:', result);
      }
      
    } catch (error) {
      console.error('❌ [UPVOTE API] Error loading upvote status:', error);
      console.error('❌ [UPVOTE API] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  // Load shortlist status from API
  const loadShortlistStatus = async (resumeId: string | number, shareTokenParam: string) => {
    try {
      console.log('📋 [SHORTLIST API] Loading shortlist status for resume:', resumeId, 'shareToken:', shareTokenParam?.substring(0, 10) + '...');
      
      // Only check shortlist status for recruiters
      const recruiterToken = localStorage.getItem('recruiter_token');
      if (!recruiterToken) {
        console.log('ℹ️ [SHORTLIST API] Skipping shortlist status check - user is not a recruiter');
        setIsShortlisted(false);
        return;
      }
      
      console.log('🔍 [SHORTLIST API] Recruiter token found, checking status...');
      const { shortlistApi } = await import('../services/shortlistApi');
      const statusResponse = await shortlistApi.checkStatus(Number(resumeId), shareTokenParam);
      
      console.log('📡 [SHORTLIST API] API response:', {
        success: statusResponse.success,
        isShortlisted: statusResponse.data?.isShortlisted,
        notes: statusResponse.data?.notes,
        requiresAuth: statusResponse.data?.requiresAuth
      });
      
      if (statusResponse.success) {
        const newStatus = statusResponse.data.isShortlisted;
        console.log('✅ [SHORTLIST API] Shortlist status loaded:', newStatus, '(current:', isShortlisted, ')');
        
        // Always update to ensure UI reflects current state
        console.log('🔄 [SHORTLIST API] Updating shortlist status to:', newStatus);
        setIsShortlisted(newStatus);
      } else {
        console.error('❌ [SHORTLIST API] Failed to load shortlist status:', statusResponse);
      }
      
    } catch (error) {
      console.error('❌ [SHORTLIST API] Error loading shortlist status:', error);
      console.error('❌ [SHORTLIST API] Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  const handleUpvote = async () => {
    try {
      // Get the resume ID from the URL or resume data
      const resumeId = searchParams.get('id') || resume?.id;
      
      if (!resumeId) {
        console.error('No resume ID available for upvote');
        return;
      }
      
      console.log('👍 Sending upvote request for resume:', resumeId);
      
      const response = await fetch(`/api/resume-upvotes/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUpvotes(result.data.upvotes);
        setHasUpvoted(result.data.hasUpvoted);
        console.log('✅ Upvote updated:', result.data);
      } else {
        throw new Error(result.error || 'Failed to update upvote');
      }
      
    } catch (error) {
      console.error('❌ Error updating upvote:', error);
      // Fallback to local state update if API fails
      setHasUpvoted(!hasUpvoted);
      setUpvotes(hasUpvoted ? upvotes - 1 : upvotes + 1);
    }
  };

  const handleShortlist = async () => {
    if (!resume?.id) {
      console.error('❌ No resume ID available');
      return;
    }

    // Get shareToken from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const shareTokenFromUrl = urlParams.get('shareToken') || window.location.pathname.split('/').pop();
    
    if (!shareTokenFromUrl) {
      console.error('❌ No share token available');
      return;
    }

    try {
      // Import the shortlist API
      const { shortlistApi } = await import('../services/shortlistApi');
      
      if (isShortlisted) {
        // Remove from shortlist
        const response = await shortlistApi.remove(Number(resume.id), shareTokenFromUrl);
        if (response.success) {
          setIsShortlisted(false);
          console.log('✅ Removed from shortlist');
        }
      } else {
        // Add to shortlist
        const response = await shortlistApi.add(Number(resume.id), shareTokenFromUrl);
        if (response.success) {
          setIsShortlisted(true);
          console.log('✅ Added to shortlist');
        }
      }
    } catch (error: any) {
      console.error('❌ Error toggling shortlist:', error);
      
      // Check if it's a circuit breaker error
      if (error.message?.includes('Circuit breaker')) {
        alert('Too many failed requests. Please refresh the page and try again.');
        return;
      }
      
      // If unauthorized, show message
      if (error.response?.status === 401 || error.error?.includes('authentication')) {
        alert('Please log in as a recruiter to shortlist resumes');
      } else {
        alert('Failed to update shortlist. Please try again.');
      }
    }
  };

  const handleShare = async () => {
    if (!resume) {
      console.error('❌ No resume data available for sharing');
      return;
    }
    
    try {
      // First, ensure current customizations are saved before sharing
      if (currentCustomization && currentCustomization.id !== -1) {
        console.log('💾 Saving current customizations before sharing...');
        try {
          await TemplateCustomizationService.updateCustomization(
            currentCustomization.id,
            { ...currentCustomization, isDefault: true }
          );
          console.log('✅ Customizations saved before sharing');
        } catch (customizationError) {
          console.warn('⚠️ Failed to save customizations before sharing:', customizationError);
          // Continue with sharing even if customization save fails
        }
      } else if (currentCustomization) {
        // Create new customization if it doesn't exist yet
        console.log('💾 Creating new customization before sharing...');
        try {
          const savedCustomization = await TemplateCustomizationService.createCustomization(
            templateConfig.id,
            { ...currentCustomization, isDefault: true }
          );
          setCurrentCustomization(savedCustomization);
          console.log('✅ New customization created before sharing');
        } catch (customizationError) {
          console.warn('⚠️ Failed to create customization before sharing:', customizationError);
          // Continue with sharing even if customization creation fails
        }
      }
      
      console.log('🔗 Generating share link for resume:', resume.id);
      console.log('🔍 Resume data:', { id: resume.id, name: resume.personalInfo?.name });
      
      // Get auth headers
      const headers = unifiedAuthService.getAuthHeaders();
      console.log('🔍 Auth headers:', headers);
      console.log('🔍 Auth service status:', {
        isAuthenticated: unifiedAuthService.isAuthenticated(),
        hasToken: !!localStorage.getItem('authToken'),
        hasUser: !!localStorage.getItem('user')
      });
      
      const response = await fetch(`/api/resume-sharing/generate/${resume.id}`, {
        method: 'POST',
        headers
      });
      
      console.log('🔍 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🔍 API Response:', result);
      
      // Check if the response has the expected structure
      if (result.success === true && result.data && result.data.shareUrl) {
        const shareUrl = result.data.shareUrl;
        
        // Try native sharing first
        if (navigator.share) {
          try {
            await navigator.share({
              title: `${resume.personalInfo.name}'s Resume`,
              text: `Check out ${resume.personalInfo.name}'s professional resume`,
              url: shareUrl,
            });
            console.log('✅ Shared via native sharing');
            return;
          } catch (error) {
            // User cancelled or sharing failed, fall back to clipboard
          }
        }
        
        // Fallback to clipboard
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('Share link copied to clipboard!\n\nYou can now share this link with recruiters or anyone you want to view your resume.');
          console.log('✅ Share link copied to clipboard');
        } catch (clipboardError) {
          console.warn('⚠️ Clipboard access failed, using fallback:', clipboardError);
          // Fallback: Create a temporary input element to copy the text
          const textArea = document.createElement('textarea');
          textArea.value = shareUrl;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            console.log('✅ Share link copied using fallback method!');
            alert('Share link copied to clipboard!\n\nYou can now share this link with recruiters or anyone you want to view your resume.');
          } catch (fallbackError) {
            console.error('❌ Both clipboard methods failed:', fallbackError);
            alert(`Share link generated: ${shareUrl}\n\nPlease copy this link manually.`);
          } finally {
            document.body.removeChild(textArea);
          }
        }
      } else {
        console.error('Invalid response format. Expected: { success: true, data: { shareUrl: string } }, got:', result);
        throw new Error('Invalid response format from server');
      }
      
    } catch (error) {
      console.error('❌ Error generating share link:', error);
      alert('Failed to generate share link. Please try again.');
    }
  };

  // Template customization handlers using API-based TemplateCustomizationService
  const handleCustomizationChange = (customization: TemplateCustomization) => {
    setCurrentCustomization(customization);
    console.log("Template customization changed:", customization);
  };

  const handleCustomizationSave = async (customization: TemplateCustomization) => {
    try {
      // Ensure the customization is marked as default for this template
      const customizationWithDefault = {
        ...customization,
        isDefault: true
      };
      
      // Save the customization as default
      let savedCustomization;
      if (customization.id === -1) {
        // Create new customization
        savedCustomization = await TemplateCustomizationService.createCustomization(
          templateConfig.id,
          customizationWithDefault
        );
      } else {
        // Update existing customization
        savedCustomization = await TemplateCustomizationService.updateCustomization(
          customization.id,
          { ...customizationWithDefault, isDefault: true }
        );
      }
      
      setIsCustomizationOpen(false);
      setCurrentCustomization(savedCustomization);
      
      console.log("✅ Template customization saved as default:", savedCustomization);
    } catch (error) {
      console.error("❌ Failed to save template customization:", error);
    }
  };

  const handleCustomizationApply = async (customization: TemplateCustomization) => {
    try {
      // Apply and save the customization as default
      const customizationWithDefault = {
        ...customization,
        isDefault: true
      };
      
      // Save the customization as default
      let appliedCustomization;
      if (customization.id === -1) {
        // Create new customization
        appliedCustomization = await TemplateCustomizationService.createCustomization(
          templateConfig.id,
          customizationWithDefault
        );
      } else {
        // Update existing customization
        appliedCustomization = await TemplateCustomizationService.updateCustomization(
          customization.id,
          { ...customizationWithDefault, isDefault: true }
        );
      }
      
      setCurrentCustomization(appliedCustomization);
      setIsCustomizationOpen(false);
      console.log("✅ Applied and saved template customization as default:", appliedCustomization);
    } catch (error) {
      console.error("❌ Failed to apply template customization:", error);
    }
  };

  const handleCustomizationPreview = (customization: TemplateCustomization) => {
    // Apply the customization temporarily for preview
    setCurrentCustomization(customization);
    console.log("Previewing template customization:", customization);
  };

  // Handle resume section updates
  const handleResumeUpdate = (updatedResumeData: Resume) => {
    console.log("Resume updated:", updatedResumeData);
    console.log("Personal info updated:", updatedResumeData.personalInfo);
    setResume(updatedResumeData);
  };

  const handleSummaryUpdate = async (newSummary: string) => {
    if (!resume?.id) throw new Error("No resume ID available");
    
    const result = await resumeUpdateApi.updateProfessionalSummary(resume.id, newSummary);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update summary');
    }
  };

  const handleSkillsUpdate = async (newSkills: any[]) => {
    if (!resume?.id) throw new Error("No resume ID available");
    
    const result = await resumeUpdateApi.updateSkills(resume.id, newSkills);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update skills');
    }
  };

  const handleObjectiveUpdate = async (newObjective: string) => {
    if (!resume?.id) throw new Error("No resume ID available");
    
    const result = await resumeUpdateApi.updateObjective(resume.id, newObjective);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update objective');
    }
  };

  const handleProjectsUpdate = async (newProjects: any[]) => {
    if (!resume?.id) throw new Error("No resume ID available");
    
    console.log('🔍 handleProjectsUpdate called with:', newProjects);
    const result = await resumeUpdateApi.updateProjects(resume.id, newProjects);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update projects');
    }
  };

  const handleEducationUpdate = async (newEducation: any[]) => {
    console.log('🔍 handleEducationUpdate called with:', newEducation);
    if (!resume?.id) throw new Error("No resume ID available");
    
    console.log('🔍 Calling resumeUpdateApi.updateEducation with resumeId:', resume.id);
    const result = await resumeUpdateApi.updateEducation(resume.id, newEducation);
    console.log('🔍 API result:', result);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update education');
    }
  };

  const handleCertificationsUpdate = async (newCertifications: any[]) => {
    console.log('🔍 handleCertificationsUpdate called with:', newCertifications);
    if (!resume?.id) throw new Error("No resume ID available");
    
    console.log('🔍 Calling resumeUpdateApi.updateCertifications with resumeId:', resume.id);
    const result = await resumeUpdateApi.updateCertifications(resume.id, newCertifications);
    console.log('🔍 API result:', result);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update certifications');
    }
  };

  const handleExperienceUpdate = async (newExperience: any[]) => {
    if (!resume?.id) throw new Error("No resume ID available");
    
    const result = await resumeUpdateApi.updateExperiences(resume.id, newExperience);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update experience');
    }
  };

  const handlePersonalInfoUpdate = async (newPersonalInfo: any) => {
    if (!resume?.id) throw new Error("No resume ID available");
    
    const result = await resumeUpdateApi.updatePersonalInfo(resume.id, newPersonalInfo);
    if (result.success) {
      handleResumeUpdate(result.data);
    } else {
      throw new Error(result.error || 'Failed to update personal info');
    }
  };

  // Template customization loading disabled - using resume-specific customizations only
  // The customizationService (loaded in earlier useEffect) handles resume-specific customizations
  // which are stored in resume_customizations table

  // Apply customization when currentCustomization changes
  useEffect(() => {
    if (currentCustomization) {
      try {
        // Apply the customization CSS variables
        const styleId = 'template-customization-styles';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }

        const cssString = TemplateCustomizationService.generateCustomCSS(currentCustomization);
      
      // Enhanced CSS with better template integration and layout controls
      const enhancedCSS = `
        ${cssString}
        
        /* Template color utility classes */
        .template-primary-text { color: var(--template-primary-color) !important; }
        .template-secondary-text { color: var(--template-secondary-color) !important; }
        .template-accent-text { color: var(--template-accent-color) !important; }
        .template-text { color: var(--template-primary-color) !important; }
        
        .template-bg { background-color: var(--template-background-color) !important; }
        .template-primary-bg { background-color: var(--template-primary-color) !important; }
        .template-secondary-bg { background-color: var(--template-secondary-color) !important; }
        .template-accent-bg { background-color: var(--template-accent-color) !important; }
        
        .template-primary-bg-10 { background-color: rgba(from var(--template-primary-color) r g b / 0.1) !important; }
        .template-primary-bg-20 { background-color: rgba(from var(--template-primary-color) r g b / 0.2) !important; }
        .template-primary-bg-30 { background-color: rgba(from var(--template-primary-color) r g b / 0.3) !important; }
        .template-bg-30 { background-color: rgba(from var(--template-background-color) r g b / 0.3) !important; }
        
        .template-primary-border { border-color: var(--template-primary-color) !important; }
        .template-secondary-border { border-color: var(--template-secondary-color) !important; }
        .template-primary-border-20 { border-color: rgba(from var(--template-primary-color) r g b / 0.2) !important; }
        .template-secondary-border-20 { border-color: rgba(from var(--template-secondary-color) r g b / 0.2) !important; }
        .template-secondary-border-30 { border-color: rgba(from var(--template-secondary-color) r g b / 0.3) !important; }
        
        .template-primary-ring { --tw-ring-color: var(--template-primary-color) !important; }
        
        /* Fallback for browsers that don't support rgba(from ...) */
        @supports not (background-color: rgba(from white r g b / 0.1)) {
          .template-primary-bg-10 { background-color: var(--template-primary-color); opacity: 0.1; }
          .template-primary-bg-20 { background-color: var(--template-primary-color); opacity: 0.2; }
          .template-primary-bg-30 { background-color: var(--template-primary-color); opacity: 0.3; }
          .template-bg-30 { background-color: var(--template-background-color); opacity: 0.3; }
          .template-primary-border-20 { border-color: var(--template-primary-color); opacity: 0.2; }
          .template-secondary-border-20 { border-color: var(--template-secondary-color); opacity: 0.2; }
          .template-secondary-border-30 { border-color: var(--template-secondary-color); opacity: 0.3; }
        }
        
        /* Apply customizations to template elements */
        #resume-template-container {
          font-family: var(--template-font-family) !important;
          color: var(--template-primary-color) !important;
          background-color: var(--template-background-color) !important;
          font-size: var(--template-font-size) !important;
          line-height: var(--template-line-height) !important;
        }
        
        #resume-template-container h1,
        #resume-template-container h2,
        #resume-template-container h3,
        #resume-template-container h4,
        #resume-template-container h5,
        #resume-template-container h6 {
          font-family: var(--template-font-family) !important;
          font-weight: var(--template-font-weight) !important;
        }
        
        /* Layout Controls - Target the actual grid structure in templates */
        
        /* Single Column Layout */
        ${currentCustomization.layout.style === 'single-column' ? `
          /* Force single column layout with maximum specificity */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
            display: block !important;
            grid-template-columns: none !important;
          }
          
          /* Reset all column spans for single column */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div {
            grid-column: unset !important;
            width: 100% !important;
            margin-bottom: var(--template-spacing) !important;
            order: unset !important;
          }
        ` : ''}
        
        /* Two Column Layout */
        ${currentCustomization.layout.style === 'two-column' ? `
          /* Force two equal columns */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: var(--template-spacing) !important;
          }
          
          /* First column (sidebar content) */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:first-child {
            grid-column: 1 !important;
            order: 1 !important;
          }
          
          /* Second column (main content) */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:last-child {
            grid-column: 2 !important;
            order: 2 !important;
          }
        ` : ''}
        
        /* Sidebar Layout (Default - 3 column grid) */
        ${currentCustomization.layout.style === 'sidebar' ? `
          /* Enhanced sidebar layout */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
            display: grid !important;
            grid-template-columns: 380px 1fr !important;
            gap: calc(var(--template-spacing) * 1.5) !important;
          }
          
          /* Sidebar styling */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:first-child {
            grid-column: 1 !important;
            order: 1 !important;
            background: linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05)) !important;
            padding: var(--template-spacing) !important;
            border-radius: var(--template-border-radius) !important;
            ${currentCustomization.layout.showBorders ? 'border: 1px solid rgba(100, 116, 139, 0.3) !important;' : ''}
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
          }
          
          /* Main content area */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:last-child {
            grid-column: 2 !important;
            order: 2 !important;
          }
        ` : ''}
        
        /* Color Applications */
        #resume-template-container .text-blue-600,
        #resume-template-container .text-blue-500,
        #resume-template-container .text-primary {
          color: var(--template-primary-color) !important;
        }
        
        #resume-template-container .bg-blue-600,
        #resume-template-container .bg-blue-500,
        #resume-template-container .bg-primary {
          background-color: var(--template-primary-color) !important;
        }
        
        #resume-template-container .text-green-400,
        #resume-template-container .text-green-500,
        #resume-template-container .text-accent {
          color: var(--template-accent-color) !important;
        }
        
        #resume-template-container .bg-green-400,
        #resume-template-container .bg-green-500,
        #resume-template-container .bg-accent {
          background-color: var(--template-accent-color) !important;
        }
        
        #resume-template-container .text-gray-600,
        #resume-template-container .text-gray-500,
        #resume-template-container .text-secondary {
          color: var(--template-secondary-color) !important;
        }
        
        #resume-template-container .border-blue-600,
        #resume-template-container .border-blue-500,
        #resume-template-container .border-primary {
          border-color: var(--template-primary-color) !important;
        }
        
        #resume-template-container .border-green-400,
        #resume-template-container .border-green-500,
        #resume-template-container .border-accent {
          border-color: var(--template-accent-color) !important;
        }
        
        /* Progress bars and skill indicators */
        #resume-template-container .bg-gradient-to-r {
          background: linear-gradient(to right, var(--template-primary-color), var(--template-accent-color)) !important;
        }
        
        /* Section spacing and borders */
        #resume-template-container .section {
          margin-bottom: var(--template-spacing) !important;
          border-radius: var(--template-border-radius) !important;
          ${currentCustomization.layout.showBorders ? `border: 1px solid var(--template-secondary-color) !important;` : ''}
          padding: var(--template-spacing) !important;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1023px) {
          /* Force mobile layout regardless of customization */
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
            display: block !important;
            grid-template-columns: none !important;
          }
          
          #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div {
            width: 100% !important;
            grid-column: unset !important;
            order: unset !important;
            margin-bottom: 1rem !important;
          }
        }
      `;
      
      styleElement.textContent = enhancedCSS;
      
      console.log("Template customization applied:", currentCustomization);
      console.log("Layout style applied:", currentCustomization.layout.style);
      } catch (error) {
        console.error('❌ Error applying template customization:', error);
        console.log('Customization object:', currentCustomization);
      }
    }
  }, [currentCustomization]);

  const handleDownloadPDF = async () => {
    console.log("PDF download requested. Resume:", resume);
    console.log("Template config:", customizedTemplateConfig || templateConfig);

    if (!resume) {
      alert("Resume data is not available. Please try again.");
      return;
    }

    try {
      const configToUse = customizedTemplateConfig || templateConfig;
      const fileName = `${resume.personalInfo?.name?.replace(/\s+/g, "_") || "resume"}-${configToUse.name.replace(/\s+/g, "_")}.pdf`;

      // Map template categories to our PDF template types
      let templateType: "technology" | "design" | "management" = "technology";
      if (configToUse.category === "design") {
        templateType = "design";
      } else if (configToUse.category === "management") {
        templateType = "management";
      }

      // Generate clean PDF with proper data and formatting
      await reactPdfService.generateResumePDF(resume, {
        filename: fileName,
        templateType: templateType,
      });
      
      // Track download if this is a shared resume
      if (shareToken) {
        try {
          await fetch(`/api/resume-sharing/download/${shareToken}`, {
            method: 'POST'
          });
          console.log('📥 Download tracked for shared resume');
        } catch (trackingError) {
          console.warn('Failed to track download:', trackingError);
          // Don't show error to user - tracking failure shouldn't affect download
        }
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-600">Loading resume profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-slate-600">Resume not found</p>
        </div>
      </div>
    );
  }

  // Use shared ResumeDisplay component
  return (
    <>
      <ResumeDisplay
        key={`resume-${resume.id}-${resume.personalInfo?.github || 'no-github'}-${resume.updatedAt || Date.now()}-${JSON.stringify(resume.experiences?.length || 0)}`}
        resume={resume}
        templateConfig={customizedTemplateConfig || templateConfig}
        mode={shareToken ? "shared" : "preview"}
        upvotes={upvotes}
        hasUpvoted={hasUpvoted}
        isShortlisted={isShortlisted}
        onUpvote={handleUpvote}
        onShortlist={handleShortlist}
        userName={userName}
        onShare={handleShare}
        onDownloadPDF={handleDownloadPDF}
        currentCustomization={currentCustomization}
        onCustomizationChange={handleCustomizationChange}
        onCustomizationSave={handleCustomizationSave}
        shareToken={shareToken}
        setIsEditingPersonalInfo={setIsEditingPersonalInfo}
        setIsEditingSummary={setIsEditingSummary}
        setIsEditingObjective={setIsEditingObjective}
        setIsEditingSkills={setIsEditingSkills}
        setIsEditingProjects={setIsEditingProjects}
        setIsEditingEducation={setIsEditingEducation}
        setIsEditingExperience={setIsEditingExperience}
        setIsEditingCertifications={setIsEditingCertifications}
        setIsEditingJobPreferences={setIsEditingJobPreferences}
      />
      
      {/* Edit Modals - Only show for resume owner */}
      {isResumeOwner() && (
        <>
          <ProfessionalSummaryEditModal
            isOpen={isEditingSummary}
            onClose={() => setIsEditingSummary(false)}
            currentSummary={resume?.summary || ''}
            onSave={handleSummaryUpdate}
            resumeData={resume}
          />
          
          <SkillsEditModal
            isOpen={isEditingSkills}
            onClose={() => setIsEditingSkills(false)}
            currentSkills={resume?.skills || []}
            onSave={handleSkillsUpdate}
            resumeData={resume}
          />
          
          <CareerObjectiveEditModal
            isOpen={isEditingObjective}
            onClose={() => setIsEditingObjective(false)}
            currentObjective={resume?.objective || ''}
            onSave={handleObjectiveUpdate}
            resumeData={resume}
          />
          
          <ProjectsEditModal
            isOpen={isEditingProjects}
            onClose={() => setIsEditingProjects(false)}
            currentProjects={resume?.projects || []}
            onSave={handleProjectsUpdate}
            resumeId={resume?.id}
          />
          
          <EducationEditModal
            isOpen={isEditingEducation}
            onClose={() => setIsEditingEducation(false)}
            currentEducation={resume?.education || []}
            onSave={handleEducationUpdate}
            resumeData={resume}
          />
          
          <PersonalInfoEditModal
            isOpen={isEditingPersonalInfo}
            onClose={() => setIsEditingPersonalInfo(false)}
            currentPersonalInfo={resume?.personalInfo || {
              name: "",
              title: "",
              email: "",
              phone: "",
              location: "",
              website: "",
              linkedin: "",
              github: "",
              avatar: ""
            }}
            onSave={handlePersonalInfoUpdate}
          />
          
          <ExperienceEditModal
            isOpen={isEditingExperience}
            onClose={() => setIsEditingExperience(false)}
            currentExperiences={resume?.experiences || []}
            onSave={handleExperienceUpdate}
            resumeData={resume}
          />
          
          {/* Floating Edit Buttons */}
          
        </>
      )}
      
      {/* New Customization Button - Only show for authenticated users viewing their own resume */}
      {!shareToken && (() => {
        // Get userId from multiple sources (supports both regular and quick signup)
        let userId: string | undefined;
        
        if (user?.id) {
          // From AuthContext (regular signup)
          userId = String(user.id);
        } else {
          // Check direct userId storage (quick signup)
          const directUserId = localStorage.getItem('userId');
          if (directUserId) {
            userId = directUserId;
          } else {
            // Fallback to user object (regular signup)
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser);
                userId = parsed.id ? String(parsed.id) : undefined;
              } catch (e) {
                console.error('Failed to parse stored user:', e);
              }
            }
          }
        }
        
        console.log('🎨 CustomizationTrigger userId:', userId, 'resumeId:', resume?.id);
        
        return (
          <NewCustomizationTrigger 
            userId={userId}
            resumeId={resume?.id ? Number(resume.id) : undefined}
          />
        );
      })()}
      
      {/* Edit Modals - Only show for resume owner */}
      {isResumeOwner() && (
        <>
          <ProfessionalSummaryEditModal
            isOpen={isEditingSummary}
            onClose={() => setIsEditingSummary(false)}
            currentSummary={resume?.summary || ''}
            onSave={handleSummaryUpdate}
            resumeData={resume}
          />
          
          <SkillsEditModal
            isOpen={isEditingSkills}
            onClose={() => setIsEditingSkills(false)}
            currentSkills={resume?.skills || []}
            onSave={handleSkillsUpdate}
            resumeData={resume}
          />

          <CareerObjectiveEditModal
            isOpen={isEditingObjective}
            onClose={() => setIsEditingObjective(false)}
            currentObjective={resume?.objective || ''}
            onSave={handleObjectiveUpdate}
            resumeData={resume}
          />

          <ProjectsEditModal
            isOpen={isEditingProjects}
            onClose={() => setIsEditingProjects(false)}
            currentProjects={resume?.projects || []}
            onSave={handleProjectsUpdate}
            resumeId={resume?.id}
          />

          <EducationEditModal
            isOpen={isEditingEducation}
            onClose={() => setIsEditingEducation(false)}
            currentEducation={resume?.education || []}
            onSave={handleEducationUpdate}
            resumeData={resume}
          />

          <PersonalInfoEditModal
            isOpen={isEditingPersonalInfo}
            onClose={() => setIsEditingPersonalInfo(false)}
            currentPersonalInfo={resume?.personalInfo || {
              name: "",
              email: "",
              phone: "",
              location: "",
              title: "",
              linkedin: "",
              github: "",
              website: ""
            }}
            onSave={handlePersonalInfoUpdate}
          />

          <ExperienceEditModal
            isOpen={isEditingExperience}
            onClose={() => setIsEditingExperience(false)}
            currentExperiences={resume?.experiences || []}
            onSave={handleExperienceUpdate}
            resumeData={resume}
          />

          <CertificationsEditModal
            isOpen={isEditingCertifications}
            onClose={() => setIsEditingCertifications(false)}
            currentCertifications={resume?.certifications || []}
            onSave={handleCertificationsUpdate}
            resumeData={resume}
          />

          <JobPreferencesModal
            isOpen={isEditingJobPreferences}
            onClose={() => setIsEditingJobPreferences(false)}
          />
        </>
      )}
    </>
  );
}