import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Resume } from "@shared/api";
import { resumeApi } from "@/services/resumeApi";
import { atsApi } from "@/services/atsApi";
import { getTemplateConfig, type TemplateCategory, type ExtendedTemplateCategory } from "@/services/templateService";
import { TemplateRecommendationService } from "@/services/templateRecommendationService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  User,
  Briefcase,
  GraduationCap,
  Code2,
  FolderOpen,
  Save,
  Eye,
  ArrowLeft,
  ArrowRight,
  Check,
  Award,
  Plus,
  Trash2,
  Building2,
  Palette,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import TemplateSwitcher from "@/components/TemplateSwitcher";
import TemplateRecommendation from "@/components/TemplateRecommendation";
import { ImproveButton } from "@/components/ImproveButton";
import { useFormStateManager } from "../hooks/useFormStateManager";
import { toast } from "sonner";
import AppHeader from "@/components/AppHeader";

// useValidation import removed - no longer needed
// useToast import removed - no longer needed
// ValidationEngine import removed - no longer needed

// Simple data structure
interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  technologies: string[];
  employmentType: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  yearsOfExperience: number;
  proficiency: number;
  isCore: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  url: string;
  github: string;
  technologies: string[];
  images: string[];
  status?: string;
}

import { SKILL_CATEGORIES } from '@shared/skillCategories';

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const DEGREE_TYPES = ["Bachelor's", "Master's", "PhD", "Associate", "Certificate", "Diploma"];

export default function ResumeBuilder() {
  console.log("🔄 ResumeBuilder re-rendered");
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  // toast removed - no longer needed
  // Enhanced template state
  const templateParam = searchParams.get("template") as ExtendedTemplateCategory;
  const editMode = searchParams.get("edit") === "true"; // Check if we're in edit mode
  const resumeId = searchParams.get("id") || null; // Get resume ID from URL, null if creating new

  const formStateManager = useFormStateManager(resumeId || "new-resume");
  const { state: formState, updateField, setFormState, addArrayItem, removeArrayItem, updateArrayItem } = formStateManager;
  // validation hook removed - no longer needed

  const { personalInfo, summary, objective, experiences, education, skills, projects } = formState;
  const { name, title, email, phone, location, website, linkedin, github } = personalInfo;

  // Debug: Log form state on every render
  console.log("🔍 DEBUG: Current formState:", {
    editMode,
    resumeId,
    personalInfo,
    summary,
    objective,
    hasName: !!personalInfo?.name,
    hasEmail: !!personalInfo?.email,
    hasSummary: !!summary
  });
  const [selectedTemplate, setSelectedTemplate] = useState(() => {
    if (templateParam) {
      return getTemplateConfig(templateParam as TemplateCategory);
    }
    // Default to technology template if no template specified
    return getTemplateConfig('technology');
  });
  const [customizedTemplate, setCustomizedTemplate] = useState(selectedTemplate);
  const [showTemplateSwitcher, setShowTemplateSwitcher] = useState(false);
  const [templateRecommendations, setTemplateRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Load template recommendations based on current resume data
  const loadTemplateRecommendations = async () => {
    if (!name || !title) return; // Need basic info for recommendations

    setLoadingRecommendations(true);
    try {
      const resumeData: Resume = {
        id: "1",
        personalInfo: {
          name,
          title,
          email,
          phone,
          location,
          website,
          linkedin,
          github,
          avatar: ""
        },
        summary,
        objective,
        experiences: experiences.map(exp => ({
          id: exp.id,
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate,
          endDate: exp.current ? null : exp.endDate,
          current: exp.current,
          description: exp.description,
          technologies: exp.technologies,
          keyMetrics: []
        })),
        skills: skills.map(skill => ({
          id: skill.id,
          name: skill.name,
          level: typeof skill.proficiency === "number" ? skill.proficiency : (skill.proficiency ? Number(skill.proficiency) : undefined), // Use proficiency value, don't default to 0
          category: skill.category,
          yearsOfExperience: skill.yearsOfExperience,
          endorsements: skill.endorsements,
          isCore: skill.isCore,
          proficiency: typeof skill.proficiency === "number" ? skill.proficiency : (skill.proficiency ? Number(skill.proficiency) : undefined) // Store as number, not string
        })),
        education: education.map(edu => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.gpa
        })),
        projects: projects.map(proj => ({
          id: proj.id,
          title: proj.title,
          name: proj.title,
          description: proj.description,
          technologies: proj.technologies,
          startDate: proj.startDate || "",
          endDate: proj.endDate || "",
          url: proj.url,
          github: proj.github,
          images: proj.images || []
        })),
        upvotes: 0,
        rating: 0,
        isShortlisted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const recommendations = await TemplateRecommendationService.generateRecommendations(
        resumeData,
        [] // Will use all available templates
      );

      setTemplateRecommendations(recommendations.slice(0, 3)); // Show top 3 recommendations
    } catch (error) {
      console.error('Failed to load template recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Handle template switching
  const handleTemplateSwitch = (templateId: string) => {
    const newTemplate = getTemplateConfig(templateId as TemplateCategory);
    if (newTemplate) {
      setSelectedTemplate(newTemplate);
      setCustomizedTemplate(newTemplate);

      // Update URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('template', templateId);
      window.history.replaceState({}, '', newUrl.toString());

      setShowTemplateSwitcher(false);
    }
  };

  // Handle template customization changes
  const handleCustomizationChange = (customizedTemplate: any) => {
    setCustomizedTemplate(customizedTemplate);
  };

  // Load resume data function - moved outside useEffect so it can be called from saveResume
  // Load resume data when in edit mode
  useEffect(() => {
    if (editMode && resumeId) {
      loadResumeData();
    }
  }, [editMode, resumeId]);

  const loadResumeData = async () => {
    console.log("🔍 ResumeBuilder useEffect triggered");
    console.log("📊 Current state:", { editMode, resumeId, selectedTemplate: selectedTemplate?.id });

    if (editMode) {
      console.log("📡 EDIT MODE: Prioritizing API data for most up-to-date information...");

      // In edit mode, always try API first to get the latest saved data
      // localStorage will be used as fallback only if API fails

      try {
        let targetResume = null;

        if (resumeId && resumeId !== "new-resume") {
          // Load specific resume by ID
          console.log(`🌐 Fetching specific resume ID: ${resumeId}`);
          const resumeResponse = await resumeApi.getResume(resumeId);

          if (resumeResponse.success && resumeResponse.data) {
            targetResume = resumeResponse.data;
            console.log("✅ Loaded specific resume from API:", targetResume.title);
          } else {
            console.log("❌ Failed to load specific resume from API");
            throw new Error(`Resume ${resumeId} not found`);
          }
        } else {
          // Load user's resumes and get the first one (for new/default case)
          console.log("🌐 Fetching user's resumes from API...");
          const resumesData = await resumeApi.getUserResumes();

          if (!resumesData.success) {
            console.log("❌ No resume data found in API response");
            throw new Error("No resumes found");
          }

          targetResume = resumesData.data[0];
          console.log("✅ Loaded first resume from API:", targetResume.title);
        }

        if (!targetResume) {
          console.log("❌ No target resume found");
          throw new Error("No resume data available");
        }

        console.log("✅ Found target resume:", targetResume.title);
        console.log("🔍 DEBUG: Full target resume data:", targetResume);
        console.log("🔍 DEBUG: personalInfo structure:", targetResume.personalInfo);
        console.log("🔍 DEBUG: summary field:", targetResume.summary);

        // Convert API data to the format expected by the builder
        const apiResume = {
          personalInfo: {
            name: targetResume.personalInfo?.name || `${targetResume.personalInfo?.firstName || ''} ${targetResume.personalInfo?.lastName || ''}`.trim(),
            title: (() => {
              // Try multiple sources for the title
              if (targetResume.personalInfo?.title) {
                return targetResume.personalInfo.title;
              }

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
            github: targetResume.personalInfo?.githubUrl || targetResume.personalInfo?.github || ''
          },
          summary: targetResume.summary || targetResume.personalInfo?.summary || "",
          objective: targetResume.objective || "",
          skills: targetResume.skills || [],
          experiences: targetResume.experience || targetResume.experiences || [],
          education: targetResume.education || [],
          projects: (targetResume.projects || []).map((proj: any) => ({
            ...proj,
            title: proj.title || proj.name || '',
            name: proj.name || proj.title || ''
          })),
          certifications: targetResume.certifications || []
        };

        if (apiResume) {
          console.log("✅ Successfully loaded resume from API:", {
            name: apiResume.personalInfo?.name,
            title: apiResume.personalInfo?.title,
            projectsCount: apiResume.projects?.length || 0,
            experiencesCount: apiResume.experiences?.length || 0,
            skillsCount: apiResume.skills?.length || 0,
            educationCount: apiResume.education?.length || 0
          });

          setFormState(apiResume);
          console.log("✅ Resume data loaded successfully from API");
          return;
        }
      } catch (apiError) {
        console.warn("⚠️ API failed, falling back to localStorage:", apiError);
      }

      // Fallback to localStorage if API fails
      console.log("📂 Falling back to localStorage...");

      // Debug: Let's see what's actually in localStorage
      const allKeys = Object.keys(localStorage);
      const resumeKeys = allKeys.filter(key => key.includes('resume') || key === '1' || key === '2' || key === '3');

      console.log("🗄️ All localStorage keys:", allKeys);
      console.log("🔍 Resume-related keys:", resumeKeys);

      // Try to load from localStorage
      let loadedFromLocalStorage = false;

      // First try the specific resumeId
      if (resumeId) {
        const savedData = localStorage.getItem(resumeId);
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            console.log(`✅ Loading data from localStorage key "${resumeId}"`);
            setFormState(parsed);
            loadedFromLocalStorage = true;
          } catch (e) {
            console.error(`❌ Error parsing localStorage data for key "${resumeId}":`, e);
          }
        }
      }

      // If not found, try common resume keys
      if (!loadedFromLocalStorage) {
        const commonKeys = ['1', '2', '3'];
        for (const key of commonKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              console.log(`✅ Loading data from localStorage key "${key}"`);
              setFormState(parsed);
              loadedFromLocalStorage = true;
              break;
            } catch (e) {
              console.error(`❌ Error parsing localStorage data for key "${key}":`, e);
            }
          }
        }
      }

      if (!loadedFromLocalStorage) {
        console.log("❌ No valid resume data found in localStorage");
      }
    }
  };

  // Load saved template customizations
  useEffect(() => {
    const savedCustomizedTemplate = localStorage.getItem(`${resumeId}-customized-template`);
    if (savedCustomizedTemplate && selectedTemplate) {
      try {
        const customized = JSON.parse(savedCustomizedTemplate);
        setCustomizedTemplate(customized);
      } catch (error) {
        console.error("Error loading customized template:", error);
      }
    }
  }, [resumeId, selectedTemplate]);

  // Load template recommendations when user data changes
  useEffect(() => {
    if (name && title) {
      loadTemplateRecommendations();
    }
  }, [name, title, summary, experiences, skills]);

  const steps = [
    { id: "personal", title: "Personal", description: "Basic information", icon: User },
    { id: "overview", title: "Overview", description: "Summary and objectives", icon: User },
    { id: "experience", title: "Experience", description: "Work history", icon: Briefcase },
    { id: "education", title: "Education", description: "Academic background", icon: GraduationCap },
    { id: "skills", title: "Skills", description: "Technical abilities", icon: Code2 },
    { id: "projects", title: "Projects", description: "Portfolio showcase", icon: FolderOpen },
    { id: "certifications", title: "Certifications", description: "Professional credentials", icon: Award },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const previousStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const saveResume = async () => {
    // Debug: Log current form state values
    console.log("🔍 DEBUG: Current form state before validation:", {
      personalInfo: formState.personalInfo,
      name: formState.personalInfo?.name,
      email: formState.personalInfo?.email,
      nameLength: formState.personalInfo?.name?.length,
      emailLength: formState.personalInfo?.email?.length,
      nameType: typeof formState.personalInfo?.name,
      emailType: typeof formState.personalInfo?.email,
      fullFormState: formState
    });

    // Debug validation references removed - validation no longer used

    // Check if formState is empty/default
    const isFormEmpty = !formState.personalInfo?.name && !formState.personalInfo?.email && !formState.summary;
    if (isFormEmpty) {
      console.warn("⚠️ WARNING: Form appears to be empty! User may not have entered any data.");
      toast.error("Please fill in at least your name, email, and summary before saving.");
      setSaving(false);
      return;
    }

    // Validation removed - allow saving without validation checks
    try {
      setSaving(true);

      // Prepare resume data in the format expected by the database
      const resumeData = {
        personalInfo: {
          firstName: formState.personalInfo.name.split(' ')[0] || '',
          lastName: formState.personalInfo.name.split(' ').slice(1).join(' ') || '',
          name: formState.personalInfo.name,
          title: formState.personalInfo.title, // Add the title field to the saved data
          email: formState.personalInfo.email,
          phone: formState.personalInfo.phone,
          location: formState.personalInfo.location,
          summary: formState.summary,
          portfolioUrl: formState.personalInfo.website,
          linkedinUrl: formState.personalInfo.linkedin,
          githubUrl: formState.personalInfo.github
        },
        summary: formState.summary,
        objective: formState.objective, // Add the objective field to the saved data
        experience: formState.experiences,
        education: formState.education,
        skills: formState.skills,
        projects: formState.projects,
        certifications: formState.certifications
      };

      console.log("💾 Saving resume data for ID:", resumeId);
      console.log("📄 Resume data being saved:", resumeData);
      console.log("🔍 DEBUG: objective field in save data:", resumeData.objective);

      // Save to database via unified API
      try {
        let currentResumeId = resumeId;
        let result;

        const saveData = {
          content: resumeData,
          title: `${formState.personalInfo.name} - Resume`,
          status: 'published' as const
        };

        if (currentResumeId === 'new-resume' || !currentResumeId) {
          // Create new resume
          const response = await resumeApi.createResume(saveData);
          if (!response.success) {
            throw new Error('Failed to create resume');
          }
          result = response.data;
        } else {
          // Update existing resume
          const response = await resumeApi.updateResume(currentResumeId, saveData);
          if (!response.success) {
            throw new Error('Failed to update resume');
          }
          result = response.data;
        }
        // console.log("✅ Resume saved to database successfully:", result);

        if ((currentResumeId === 'new-resume' || !currentResumeId) && result?.id) {
          currentResumeId = result.id.toString();
          // Update URL with new ID using setSearchParams
          // This will cause a re-render with the new ID
          setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('id', currentResumeId);
            return newParams;
          });
        }



        // Save template information
        if (selectedTemplate) {
          localStorage.setItem(`${currentResumeId}-template`, selectedTemplate.category);
        }

        toast.success("Resume saved successfully!", {
          description: "Your changes have been saved to the database.",
          duration: 3000,
        });

        // Clear localStorage to force preview to use fresh API data
        if (currentResumeId && currentResumeId !== 'new-resume') {
          localStorage.removeItem(currentResumeId);
        }
        localStorage.removeItem("new-resume");
        console.log("🧹 Cleared localStorage to force fresh API data load");

        // Refresh the form data by re-fetching from API
        await loadResumeData();

      } catch (apiError) {
        console.error("❌ Database save failed:", apiError);

        toast.error("Failed to save resume", {
          description: (apiError as Error).message,
          duration: 5000,
        });
      }

    } catch (error) {
      console.error("❌ Save failed:", error);
      toast.error("Save failed", {
        description: (error as Error).message,
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  // Keyboard accessibility: Ctrl+S to save resume
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault(); // Prevent browser's default save dialog
        saveResume();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array since saveResume is stable

  // Helper functions for arrays
  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2);

  const addExperience = () => {
    addArrayItem('experiences', {
      id: generateId(),
      position: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      technologies: [],
      employmentType: "",
    });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    updateArrayItem('experiences', index, field, value);
  };

  const removeExperience = (index: number) => {
    removeArrayItem('experiences', index);
  };

  const addEducation = () => {
    addArrayItem('education', {
      id: generateId(),
      institution: "",
      degree: "",
      field: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
    });
  };

  const updateEducation = (index: number, field: string, value: any) => {
    updateArrayItem('education', index, field, value);
  };

  const removeEducation = (index: number) => {
    removeArrayItem('education', index);
  };

  const addSkill = () => {
    addArrayItem('skills', {
      id: generateId(),
      name: "",
      category: "",
      yearsOfExperience: 0,
      proficiency: 50,
      isCore: false,
    });
  };

  const updateSkill = (index: number, field: string, value: any) => {
    updateArrayItem('skills', index, field, value);
  };

  const removeSkill = (index: number) => {
    removeArrayItem('skills', index);
  };

  const addProject = () => {
    addArrayItem('projects', {
      id: generateId(),
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      url: "",
      github: "",
      technologies: [],
      images: [],
    });
  };

  const updateProject = (index: number, field: string, value: any) => {
    updateArrayItem('projects', index, field, value);
  };

  const removeProject = (index: number) => {
    removeArrayItem('projects', index);
  };

  // Step Components - memoized to prevent re-creation
  const PersonalInfoStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Let's start with your basics</h2>
        <p className="text-slate-600">Tell us about yourself and how to reach you</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formState?.personalInfo?.name || ''}
                onChange={(e) => {
                  console.log("🔍 DEBUG: Name input changed:", e.target.value);
                  updateField('personalInfo.name', e.target.value);
                }}
                placeholder="Alex Morgan"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Professional Title *</Label>
              <Input
                id="title"
                value={formState?.personalInfo?.title || ''}
                onChange={(e) => updateField('personalInfo.title', e.target.value)}
                placeholder="Software Engineer"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formState?.personalInfo?.email || ''}
                onChange={(e) => {
                  console.log("🔍 DEBUG: Email input changed:", e.target.value);
                  updateField('personalInfo.email', e.target.value);
                }}
                placeholder="john@example.com"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formState?.personalInfo?.phone || ''}
                onChange={(e) => updateField('personalInfo.phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formState?.personalInfo?.location || ''}
                onChange={(e) => updateField('personalInfo.location', e.target.value)}
                placeholder="San Francisco, CA"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formState?.personalInfo?.website || ''}
                onChange={(e) => updateField('personalInfo.website', e.target.value)}
                placeholder="https://johndoe.com"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={formState?.personalInfo?.linkedin || ''}
                onChange={(e) => updateField('personalInfo.linkedin', e.target.value)}
                placeholder="linkedin.com/in/johndoe"
              />
              {/* Validation errors removed */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={formState.personalInfo?.github || ''}
                onChange={(e) => updateField('personalInfo.github', e.target.value)}
                placeholder="github.com/johndoe"
              />
              {/* Validation errors removed */}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ), [formState?.personalInfo?.name, formState?.personalInfo?.title, formState?.personalInfo?.email, formState?.personalInfo?.phone, formState?.personalInfo?.location, formState?.personalInfo?.website, formState?.personalInfo?.linkedin, formState?.personalInfo?.github]);

  const OverviewStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Tell your professional story</h2>
        <p className="text-slate-600">Highlight your expertise and career goals</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Professional Summary *</CardTitle>
              {formState.summary && (
                <ImproveButton
                  onImprove={async () => {
                    const numericResumeId = parseInt(resumeId.replace('resume-', ''), 10);
                    if (isNaN(numericResumeId)) {
                      throw new Error('Invalid resume ID');
                    }
                    const result = await atsApi.improveSection(
                      numericResumeId,
                      'summary',
                      formState.summary
                    );
                    if (result.success && result.data?.improved) {
                      updateField('summary', result.data.improved);
                    } else {
                      const errorMsg = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to improve summary';
                      throw new Error(errorMsg);
                    }
                  }}
                  disabled={!formState.summary}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formState.summary}
              onChange={(e) => updateField('summary', e.target.value)}
              placeholder="Write a compelling summary of your professional experience, key skills, and achievements..."
              className="min-h-32"
            />
            {/* Validation errors removed */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Career Objective *</CardTitle>
              {formState.objective ? (
                <ImproveButton
                  onImprove={async () => {
                    const numericResumeId = parseInt(resumeId.replace('resume-', ''), 10);
                    if (isNaN(numericResumeId)) {
                      throw new Error('Invalid resume ID');
                    }
                    const result = await atsApi.improveSection(
                      numericResumeId,
                      'objective',
                      formState.objective
                    );
                    if (result.success && result.data?.improved) {
                      updateField('objective', result.data.improved);
                    } else {
                      const errorMsg = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to improve objective';
                      throw new Error(errorMsg);
                    }
                  }}
                  disabled={!formState.objective}
                />
              ) : (
                <ImproveButton
                  label="Add with AI"
                  onImprove={async () => {
                    const numericResumeId = parseInt(resumeId.replace('resume-', ''), 10);
                    if (isNaN(numericResumeId)) {
                      throw new Error('Invalid resume ID');
                    }
                    // Generate objective based on resume data
                    const result = await atsApi.improveSection(
                      numericResumeId,
                      'objective',
                      '' // Empty string to trigger generation
                    );
                    if (result.success && result.data?.improved) {
                      updateField('objective', result.data.improved);
                    } else {
                      const errorMsg = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to generate objective';
                      throw new Error(errorMsg);
                    }
                  }}
                  disabled={false}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formState.objective}
              onChange={(e) => updateField('objective', e.target.value)}
              placeholder="Describe your career goals and what you're looking for in your next role..."
              className="min-h-24"
            />
            {/* Validation errors removed */}
          </CardContent>
        </Card>
      </div>
    </div>
  ), [formState?.summary, formState?.objective, resumeId, updateField]);

  const ExperienceStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Your work experience</h2>
        <p className="text-slate-600">Share your professional journey and achievements</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {formState?.experiences?.map((exp, index) => (
          <Card key={exp.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Experience #{index + 1}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => removeExperience(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={exp.position}
                    onChange={(e) => updateExperience(index, "position", e.target.value)}
                    placeholder="Senior Software Engineer"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    placeholder="TechCorp Inc."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateExperience(index, "location", e.target.value)}
                    placeholder="San Francisco, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <Select
                    value={exp.employmentType}
                    onValueChange={(value) => updateExperience(index, "employmentType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    disabled={exp.current}
                  />
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={exp.current}
                      onCheckedChange={(checked) => {
                        updateExperience(index, "current", checked);
                        if (checked) updateExperience(index, "endDate", "");
                      }}
                    />
                    <Label>Currently working here</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Job Description</Label>
                  {exp.description && (
                    <ImproveButton
                      onImprove={async () => {
                        const numericResumeId = parseInt(resumeId.replace('resume-', ''), 10);
                        if (isNaN(numericResumeId)) {
                          throw new Error('Invalid resume ID');
                        }
                        const result = await atsApi.improveSection(
                          numericResumeId,
                          'experience',
                          exp,
                          index
                        );
                        if (result.success && result.data?.improved) {
                          // Extract description from the improved object
                          const improvedDescription = typeof result.data.improved === 'string' 
                            ? result.data.improved 
                            : result.data.improved.description || result.data.improved;
                          updateExperience(index, "description", improvedDescription);
                        } else {
                          const errorMsg = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to improve job description';
                          throw new Error(errorMsg);
                        }
                      }}
                      disabled={!exp.description}
                      size="sm"
                    />
                  )}
                </div>
                <Textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  placeholder="Describe your role, responsibilities, and achievements..."
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label>Technologies Used</Label>
                <Input
                  value={(exp.technologies || []).join(", ")}
                  onChange={(e) => updateExperience(index, "technologies",
                    e.target.value.split(",").map(t => t.trim()).filter(t => t)
                  )}
                  placeholder="React, Node.js, PostgreSQL"
                />
                <p className="text-xs text-slate-500">Separate with commas</p>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addExperience} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Experience
        </Button>
      </div>
    </div>
  ), [formState?.experiences, updateExperience, removeExperience, addExperience]);

  const EducationStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Your educational background</h2>
        <p className="text-slate-600">Share your academic achievements and qualifications</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {formState?.education?.map((edu, index) => (
          <Card key={edu.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Education #{index + 1}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => removeEducation(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    placeholder="University of California, Berkeley"
                  />
                  {/* Validation errors removed */}
                </div>
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Select
                    value={edu.degree}
                    onValueChange={(value) => updateEducation(index, "degree", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_TYPES.map((degree) => (
                        <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Field of Study</Label>
                  <Input
                    value={edu.field}
                    onChange={(e) => updateEducation(index, "field", e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={edu.location}
                    onChange={(e) => updateEducation(index, "location", e.target.value)}
                    placeholder="Berkeley, CA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>GPA (Optional)</Label>
                  <Input
                    value={edu.gpa}
                    onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                    placeholder="3.8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addEducation} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Education
        </Button>
      </div>
    </div>
  ), [formState?.education, updateEducation, removeEducation, addEducation]);

  const SkillsStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Showcase your skills</h2>
        <p className="text-slate-600">Highlight your technical and professional abilities</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {formState.skills.map((skill, index) => (
          <Card key={skill.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  Skill #{index + 1}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => removeSkill(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill Name</Label>
                  <Input
                    value={skill.name}
                    onChange={(e) => updateSkill(index, "name", e.target.value)}
                    placeholder="JavaScript"
                  />
                  {/* Validation errors removed */}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={skill.category}
                    onValueChange={(value) => updateSkill(index, "category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKILL_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={skill.yearsOfExperience}
                    onChange={(e) => updateSkill(index, "yearsOfExperience", parseInt(e.target.value) || 0)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proficiency Level: {skill.proficiency}%</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={skill.proficiency}
                    onChange={(e) => updateSkill(index, "proficiency", parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={skill.isCore}
                  onCheckedChange={(checked) => updateSkill(index, "isCore", checked)}
                />
                <Label>Core Skill</Label>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button onClick={addSkill} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Skill
        </Button>
      </div>
    </div>
  ), [formState?.skills, updateSkill, removeSkill, addSkill]);

  const ProjectsStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Your project portfolio</h2>
        <p className="text-slate-600">Showcase your best work and achievements</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {formState.projects.map((project, index) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  {project.title || `Project #${index + 1}`}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => removeProject(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={project.title}
                  onChange={(e) => updateProject(index, "title", e.target.value)}
                  placeholder="EcoTracker App"
                />
                {/* Validation errors removed */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={project.startDate}
                    onChange={(e) => updateProject(index, "startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={project.endDate}
                    onChange={(e) => updateProject(index, "endDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Live Demo URL</Label>
                  <Input
                    value={project.url}
                    onChange={(e) => updateProject(index, "url", e.target.value)}
                    placeholder="https://ecotracker.app"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GitHub Repository</Label>
                  <Input
                    value={project.github}
                    onChange={(e) => updateProject(index, "github", e.target.value)}
                    placeholder="github.com/username/project"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Project Description</Label>
                  {project.description && (
                    <ImproveButton
                      onImprove={async () => {
                        const numericResumeId = parseInt(resumeId.replace('resume-', ''), 10);
                        if (isNaN(numericResumeId)) {
                          throw new Error('Invalid resume ID');
                        }
                        const result = await atsApi.improveSection(
                          numericResumeId,
                          'project',
                          project,
                          index
                        );
                        if (result.success && result.data?.improved) {
                          // Extract description from the improved object
                          const improvedDescription = typeof result.data.improved === 'string' 
                            ? result.data.improved 
                            : result.data.improved.description || result.data.improved;
                          updateProject(index, "description", improvedDescription);
                        } else {
                          const errorMsg = typeof result.error === 'string' ? result.error : result.error?.message || 'Failed to improve project description';
                          throw new Error(errorMsg);
                        }
                      }}
                      disabled={!project.description}
                      size="sm"
                    />
                  )}
                </div>
                <Textarea
                  value={project.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  placeholder="Describe the project, your role, and key achievements..."
                  className="min-h-24"
                />
              </div>

              <div className="space-y-2">
                <Label>Technologies Used</Label>
                <Input
                  value={(project.technologies || []).join(", ")}
                  onChange={(e) => updateProject(index, "technologies",
                    e.target.value.split(",").map(t => t.trim()).filter(t => t)
                  )}
                  placeholder="React, Node.js, MongoDB"
                />
                <p className="text-xs text-slate-500">Separate with commas</p>
              </div>

              <ImageUpload
                images={project.images || []}
                onChange={(images) => updateProject(index, "images", images)}
                maxImages={8}
                maxSizeInMB={5}
                className="mt-4"
              />
            </CardContent>
          </Card>
        ))}

        <Button onClick={addProject} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>
    </div>
  ), [formState?.projects, updateProject, removeProject, addProject]);

  // Certifications Step
  const addCertification = () => {
    addArrayItem('certifications', {
      id: `cert-${Date.now()}`,
      name: '',
      issuer: '',
      date: '',
      url: '',
      description: ''
    });
  };

  const removeCertification = (index: number) => {
    removeArrayItem('certifications', index);
  };

  const updateCertification = (index: number, field: string, value: string) => {
    updateArrayItem('certifications', index, field, value);
  };

  const CertificationsStep = useMemo(() => (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
          <Award className="w-8 h-8" />
          Professional Certifications
        </h2>
        <p className="text-slate-600">Add your professional certifications and licenses</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {formState.certifications && formState.certifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-4">
                No certifications added yet
              </p>
              <Button onClick={addCertification} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Certification
              </Button>
            </CardContent>
          </Card>
        ) : (
          formState.certifications?.map((cert, index) => (
            <Card key={cert.id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certification #{index + 1}
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={() => removeCertification(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Certification Name *</Label>
                  <Input
                    value={cert.name || ''}
                    onChange={(e) => updateCertification(index, 'name', e.target.value)}
                    placeholder="e.g., AWS Certified Solutions Architect"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Issuing Organization</Label>
                    <Input
                      value={cert.issuer || ''}
                      onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                      placeholder="e.g., Amazon Web Services"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input
                      type="month"
                      value={cert.date || ''}
                      onChange={(e) => updateCertification(index, 'date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Credential URL</Label>
                  <Input
                    type="url"
                    value={cert.url || ''}
                    onChange={(e) => updateCertification(index, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={cert.description || ''}
                    onChange={(e) => updateCertification(index, 'description', e.target.value)}
                    placeholder="Brief description of the certification..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        <Button onClick={addCertification} className="w-full" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add Certification
        </Button>
      </div>
    </div>
  ), [formState?.certifications, updateCertification, removeCertification, addCertification]);

  const renderStepContent = useMemo(() => {
    switch (currentStep) {
      case 0: return PersonalInfoStep;
      case 1: return OverviewStep;
      case 2: return ExperienceStep;
      case 3: return EducationStep;
      case 4: return SkillsStep;
      case 5: return ProjectsStep;
      case 6: return CertificationsStep;
      default: return PersonalInfoStep;
    }
  }, [currentStep, PersonalInfoStep, OverviewStep, ExperienceStep, EducationStep, SkillsStep, ProjectsStep, CertificationsStep]);

  // Calculate completion percentage based on actual form data
  const completionPercentage = useMemo(() => {
    const requiredFields = [
      personalInfo.name,
      personalInfo.email,
      personalInfo.phone,
      summary || objective, // Either summary or objective
    ];

    const optionalSections = [
      experiences.length > 0,
      education.length > 0,
      skills.length > 0,
      projects.length > 0,
    ];

    const filledRequired = requiredFields.filter(field =>
      typeof field === 'string' ? field.trim().length > 0 : Boolean(field)
    ).length;

    const filledOptional = optionalSections.filter(Boolean).length;

    // Weight: 60% for required fields, 40% for optional sections
    const requiredScore = (filledRequired / requiredFields.length) * 60;
    const optionalScore = (filledOptional / optionalSections.length) * 40;

    return Math.round(requiredScore + optionalScore);
  }, [personalInfo.name, personalInfo.email, personalInfo.phone, summary, objective, experiences.length, education.length, skills.length, projects.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <AppHeader />

      {/* Builder Context Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {steps[currentStep].title}
              </Badge>
              {selectedTemplate && (
                <Badge variant="outline" className="bg-gradient-to-r from-pink-50 to-purple-50 text-purple-700 border-purple-200">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                  {selectedTemplate.name}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Simply open preview - it will load from database
                  window.open(`/resume/${resumeId}`, "_blank");
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>

              <Button
                onClick={saveResume}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-slate-500">{completionPercentage}% Complete</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>
      </div>

      {/* Template Notice */}
      {selectedTemplate && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
        </div>
      )}

      {/* Template Recommendations */}
      {!selectedTemplate && templateRecommendations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Recommended Templates</p>
                  <p className="text-xs text-blue-600">Based on your profile and experience</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                onClick={() => setShowTemplateSwitcher(true)}
              >
                View All Templates
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {templateRecommendations.map((recommendation, index) => (
                <div key={recommendation.template.id} className="bg-white rounded-lg border border-blue-200 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{recommendation.template.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{recommendation.template.industry}</p>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      {Math.round(recommendation.score)}% match
                    </Badge>
                  </div>

                  {recommendation.reasons.length > 0 && (
                    <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                      {recommendation.reasons[0]}
                    </p>
                  )}

                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleTemplateSwitch(recommendation.template.id)}
                  >
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading Recommendations */}
      {loadingRecommendations && name && title && (
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-slate-400 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Finding perfect templates for you...</p>
                <p className="text-xs text-gray-600">Analyzing your profile to suggest the best templates</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between space-x-4 overflow-x-auto">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 min-w-fit ${index === currentStep
                  ? "bg-blue-600 text-white shadow-lg"
                  : index < currentStep
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="font-medium">{step.title}</span>
                {index < currentStep && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {renderStepContent}
      </main>

      {/* Navigation Footer */}
      <footer className="bg-white border-t sticky bottom-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={previousStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{steps[currentStep].description}</span>
            </div>

            <Button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}