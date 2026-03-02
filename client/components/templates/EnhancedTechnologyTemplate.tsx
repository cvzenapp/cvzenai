import React, { useState, useEffect } from "react";
import { Resume, Project } from "@shared/api";

// Extended Project interface to include achievements for template rendering
interface ProjectWithAchievements extends Project {
  achievements?: string[];
}
import { TemplateConfig } from "@/services/templateService";
import { TemplateCustomizationService } from "@/services/templateCustomizationService";
import type { TemplateCustomization } from "@/services/templateCustomizationService";
import { useGitHubUserRepositories } from "@/hooks/useGitHubRepoDetails";
import { GitHubRepoCard } from "@/components/templates/components/GitHubRepoCard";
import "./styles/enhanced-technology.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Heart,
  Star,
  Bookmark,
  Share2,
  Download,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Code2,
  Terminal,
  GitBranch,
  Database,
  Server,
  Cpu,
  Zap,
  Trophy,
  Users,
  Calendar,
  ExternalLink,
  FileCode,
  Layers,
  Package,
  Activity,
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Briefcase,
  GraduationCap,
  Eye,
  ChevronRight,
  ArrowUpRight,
  Building,
  Clock,
  ChevronLeft,
  Maximize2,
  X,
} from "lucide-react";
import { EducationCarousel } from "./components/EducationCarousel";
import { ExperienceCarousel } from "./components/ExperienceCarousel";
import { SkillsBarChart } from "./components/SkillsBarChart";
import { SkillsGraphChart } from "./components/SkillsGraphChart";
import { ProjectsCarousel } from "./components/ProjectsCarousel";
import { CertificationsSection } from "./components/CertificationsSection";

interface EnhancedTechnologyTemplateProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  upvotes: number;
  hasUpvoted: boolean;
  isShortlisted: boolean;
  onUpvote: () => void;
  onShortlist: () => void;
  // Customization support
  customization?: TemplateCustomization | null;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onCustomizationSave?: (customization: TemplateCustomization) => void;
  // Section improvement support
  improveSection?: (type: string, data: any, index?: number) => Promise<any>;
  isImprovingSection?: (type: string, index?: number) => boolean;
  showImproveButtons?: boolean;
}

export default function EnhancedTechnologyTemplate({
  resume,
  templateConfig,
  activeTab,
  setActiveTab,
  upvotes,
  hasUpvoted,
  isShortlisted,
  onUpvote,
  onShortlist,
  customization,
  onCustomizationChange,
  onCustomizationSave,
  improveSection,
  isImprovingSection,
  showImproveButtons = false,
}: EnhancedTechnologyTemplateProps) {
  // HFI Optimization: Three-tier information hierarchy
  // Tier 1: Critical Assessment (3 seconds) - Name, title, contact, key metrics
  // Tier 2: Qualification Review (10 seconds) - Skills, experience summary, key achievements
  // Tier 3: Detailed Evaluation (30 seconds) - Full experience, projects, education

  // Dynamic Customization State - simplified to work with unified system
  const [appliedCustomization, setAppliedCustomization] = useState<TemplateCustomization | null>(null);

  // Fetch GitHub repositories from user's profile
  const { repositories: githubRepos, loading: githubLoading } = useGitHubUserRepositories(
    resume.personalInfo?.github
  );

  // Modal state for project image gallery
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalProjectTitle, setModalProjectTitle] = useState('');

  // Track customization changes for template-specific styling
  useEffect(() => {
    console.log('🔍 Enhanced Technology Template - Customization Debug:');
    console.log('   customization prop:', customization);
    console.log('   templateConfig:', templateConfig);
    
    if (customization) {
      console.log('🎨 Enhanced Technology Template using customization:', {
        colors: customization.colors,
        typography: customization.typography,
        layout: customization.layout
      });
      setAppliedCustomization(customization);
    } else {
      console.log('⚠️ No customization provided, using unified system defaults');
      setAppliedCustomization(null);
    }
  }, [customization, templateConfig]);

  // Remove hardcoded color forcing - let CSSApplicator handle all styling

  // Template now relies on the unified CSS system - no duplicate generation needed

  // Handle section visibility and ordering
  const getSectionVisibility = (sectionKey: string): boolean => {
    if (!appliedCustomization?.visibleSections) {
      return true; // Show all sections by default
    }
    return appliedCustomization.visibleSections.includes(sectionKey);
  };

  const getSectionOrder = (): string[] => {
    if (!appliedCustomization?.sectionOrder) {
      // Default section order
      return ['header', 'summary', 'skills', 'projects', 'experience', 'education'];
    }
    return appliedCustomization.sectionOrder;
  };

  // Handle customization callbacks
  const handleCustomizationChange = (newCustomization: TemplateCustomization) => {
    console.log('🔄 Customization changed in Enhanced Technology Template');
    if (onCustomizationChange) {
      onCustomizationChange(newCustomization);
    }
  };

  const handleCustomizationSave = () => {
    console.log('💾 Saving customization for Enhanced Technology Template');
    if (onCustomizationSave && appliedCustomization) {
      onCustomizationSave(appliedCustomization);
    }
  };

  // Calculate total experience in years
  const calculateTotalExperience = (): string => {
    if (!resume.experiences || resume.experiences.length === 0) return "0";
    const totalMonths = resume.experiences.reduce((acc, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months =
        (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return acc + months;
    }, 0);
    const years = Math.floor(totalMonths / 12);
    return years > 0 ? `${years}` : "< 1";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const getTopSkills = () => {
    if (!resume.skills || resume.skills.length === 0) return [];
    return resume.skills
      .sort((a, b) => (b.proficiency || 0) - (a.proficiency || 0))
      .slice(0, 8);
  };

  const getCoreSkills = () => {
    if (!resume.skills || resume.skills.length === 0) return [];
    return resume.skills
      .filter(skill => skill.isCore || (skill.proficiency && skill.proficiency >= 80))
      .slice(0, 6);
  };

  const getKeyMetrics = () => {
    const years = calculateTotalExperience();
    const projectCount = resume.projects?.length || 0;
    const skillCount = resume.skills?.length || 0;
    const companyCount = resume.experiences?.length || 0;
    
    return {
      experience: years,
      projects: projectCount,
      skills: skillCount,
      companies: companyCount
    };
  };

  const getRecentProjects = () => {
    if (!resume.projects || resume.projects.length === 0) return [];
    return resume.projects
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      .slice(0, 3);
  };

  const metrics = getKeyMetrics();
  const topSkills = getTopSkills();
  const coreSkills = getCoreSkills();
  const recentProjects = getRecentProjects();

  // Render section based on visibility and order
  const renderSection = (sectionKey: string, sectionComponent: JSX.Element): JSX.Element | null => {
    if (!getSectionVisibility(sectionKey)) {
      return null;
    }
    return sectionComponent;
  };

  // Get responsive values based on customization
  const getResponsiveValues = () => {
    const density = appliedCustomization?.layout.density || 'standard';
    const spacing = appliedCustomization?.layout.spacing || 16;
    const borderRadius = appliedCustomization?.layout.borderRadius || 8;
    
    return {
      padding: density === 'compact' ? 'p-6 lg:p-8' : density === 'spacious' ? 'p-10 lg:p-16' : 'p-8 lg:p-12',
      horizontalPadding: density === 'compact' ? 'px-6 lg:px-8' : density === 'spacious' ? 'px-10 lg:px-16' : 'px-8 lg:px-12',
      gap: density === 'compact' ? 'gap-4' : density === 'spacious' ? 'gap-10' : 'gap-8',
      cardPadding: density === 'compact' ? 'p-4' : density === 'spacious' ? 'p-8' : 'p-6',
      borderRadius: borderRadius <= 4 ? 'rounded-lg' : borderRadius >= 16 ? 'rounded-2xl' : 'rounded-xl',
      sectionSpacing: density === 'compact' ? 'space-y-4' : density === 'spacious' ? 'space-y-10' : 'space-y-6',
      verticalSpacing: density === 'compact' ? 'py-2' : density === 'spacious' ? 'py-4' : 'py-3'
    };
  };

  const responsiveValues = getResponsiveValues();

  return (
    <div id="resume-template-container" className="min-h-screen">
      
      {/* CSS Override Styles for Perfect Color Consistency */}
      
      {/* Enhanced Template Container with Sophisticated Layout */}
      <div className={`w-full shadow-2xl overflow-hidden ${responsiveValues.borderRadius}`} 
           style={{ 
             backgroundColor: 'var(--template-background-color)',
             fontFamily: 'var(--template-font-family)',
             fontSize: 'var(--template-font-size)',
             color: 'var(--text-text-700)'
           }}>
        
        {/* TIER 1: Critical Assessment Zone (3-second scan) */}
        <div className="hfi-tier-1 relative overflow-hidden" 
             style={{ 
               background: `linear-gradient(135deg, var(--template-primary-color) 0%, var(--template-secondary-color) 100%)`,
               color: 'var(--template-background-color)'
             }}>
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" 
                 style={{ backgroundColor: 'var(--template-primary-color)' }}></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" 
                 style={{ backgroundColor: 'var(--template-accent-color)' }}></div>
          </div>

          {/* Header Grid Layout - Symmetrical Design */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 lg:px-12 py-4 lg:py-6">
            
            {/* Left: Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-start gap-6">
                {/* Profile Avatar */}
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 shadow-xl" style={{ borderColor: 'var(--template-background-color)' }}>
                    <AvatarImage src={resume.personalInfo?.avatar} />
                    <AvatarFallback 
                      className="text-2xl font-bold"
                      style={{ 
                        background: `linear-gradient(135deg, var(--template-primary-color), var(--template-accent-color))`,
                        fontFamily: 'var(--template-font-family)',
                        fontWeight: 'var(--template-heading-weight)',
                        color: 'var(--template-background-color)'
                      }}>
                      {resume.personalInfo?.name?.split(" ").map(n => n[0]).join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status Indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-3 flex items-center justify-center"
                       style={{ 
                         backgroundColor: 'var(--template-accent-color)',
                         borderColor: 'var(--template-background-color)'
                       }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--template-background-color)' }}></div>
                  </div>
                </div>

                {/* Name & Title */}
                <div className="flex-1 min-w-0">
                  <h1 className="font-bold drop-shadow-lg template-name-title"
                      style={{ 
                        fontSize: `clamp(2.5rem, 5vw, 4rem)`,
                        lineHeight: '1.1',
                        marginBottom: '1rem'
                      }}>
                    {resume.personalInfo?.name || "Your Name"}
                  </h1>
                  <p className="font-medium drop-shadow-sm template-job-title" 
                     style={{ 
                       fontSize: `clamp(1.25rem, 3vw, 1.875rem)`,
                       lineHeight: '1.3',
                       marginTop: '0.75rem',
                       marginBottom: '1.5rem'
                     }}>
                    {resume.personalInfo?.title || "Professional Title"}
                  </p>

                  {/* Contact Information - Clean and Scannable */}
                  <div className="space-y-3">
                    {resume.personalInfo?.email && (
                      <a href={`mailto:${resume.personalInfo.email}`} 
                         className="flex items-center gap-3 transition-all duration-300 group hover:bg-white/10 rounded-lg p-2 -m-2">
                        <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25 transition-colors">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-medium">{resume.personalInfo.email}</span>
                      </a>
                    )}
                    
                    <div className="flex items-center gap-6">
                      {resume.personalInfo?.phone && (
                        <a href={`tel:${resume.personalInfo.phone}`} 
                           className="flex items-center gap-2 transition-all duration-300 group hover:bg-white/10 rounded-lg p-2 -m-2">
                          <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center group-hover:bg-white/25">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-sm">{resume.personalInfo.phone}</span>
                        </a>
                      )}
                      
                      {resume.personalInfo?.location && (
                        <div className="flex items-center gap-2 transition-all duration-300 p-2 -m-2 rounded-lg">
                          <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-medium text-sm">{resume.personalInfo.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Social Links */}
                    <div className="flex items-center gap-3 pt-2">
                      {resume.personalInfo?.linkedin && (
                        <a href={resume.personalInfo.linkedin} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
                          <Linkedin className="w-4 h-4" />
                          <span className="font-medium text-sm">LinkedIn</span>
                        </a>
                      )}
                      {resume.personalInfo?.github && (
                        <a href={resume.personalInfo.github} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
                          <Github className="w-4 h-4" />
                          <span className="font-medium text-sm">GitHub</span>
                        </a>
                      )}
                      {resume.personalInfo?.website && (
                        <a href={resume.personalInfo.website} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
                          <Globe className="w-4 h-4" style={{ color: 'var(--template-background-color)', opacity: 0.8 }} />
                          <span className="font-medium text-sm" style={{ color: 'var(--template-background-color)', opacity: 0.9 }}>Portfolio</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Key Metrics Dashboard */}
            <div className="space-y-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2 template-section-heading" 
                  style={{ 
                    color: 'var(--template-accent-color)',
                    fontSize: '1.125rem',
                    fontFamily: 'var(--template-font-family)',
                    fontWeight: 'var(--template-heading-weight)'
                  }}>
                <BarChart3 className="w-5 h-5" style={{ color: 'var(--template-accent-color)' }} />
                Career Overview
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/15 transition-colors">
                  <div className="text-2xl font-bold" 
                       style={{ 
                         color: 'var(--template-background-color)',
                         fontFamily: 'var(--template-font-family)',
                         fontWeight: 'var(--template-heading-weight)'
                       }}>                       
                    {metrics.experience}+
                  </div>
                  <div className="text-sm" style={{ color: 'var(--template-background-color)', opacity: 0.6 }}>Years Exp</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/15 transition-colors">
                  <div className="text-2xl font-bold" 
                       style={{ 
                         color: 'var(--template-background-color)',
                         fontFamily: 'var(--template-font-family)',
                         fontWeight: 'var(--template-heading-weight)'
                       }}>
                    {metrics.projects}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--template-background-color)', opacity: 0.6 }}>Projects</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/15 transition-colors">
                  <div className="text-2xl font-bold" 
                       style={{ 
                         color: 'var(--template-background-color)',
                         fontFamily: 'var(--template-font-family)',
                         fontWeight: 'var(--template-heading-weight)'
                       }}>
                    {metrics.skills}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--template-background-color)', opacity: 0.6 }}>Skills</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/15 transition-colors">
                  <div className="text-2xl font-bold" 
                       style={{ 
                         color: 'var(--template-background-color)',
                         fontFamily: 'var(--template-font-family)',
                         fontWeight: 'var(--template-heading-weight)'
                       }}>
                    {metrics.companies}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--template-background-color)', opacity: 0.6 }}>Companies</div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* TIER 2: Qualification Review Zone (10-second scan) */}
        <div className="hfi-tier-2 bg-white">
          
          {/* Professional Summary & Career Objective - Two Column Layout */}
          <div className={`${responsiveValues.horizontalPadding} py-4 border-b border-slate-100`}>
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Left Column: Professional Summary */}
              <div className="flex flex-col h-[280px]">
                {renderSection('summary', (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
                      <h2 className="text-2xl font-bold flex items-center gap-2" 
                          style={{ 
                            color: 'var(--template-primary-color)',
                            fontFamily: 'var(--template-font-family)',
                            fontWeight: 'var(--template-heading-weight)'
                          }}>
                        <Users size={24} />
                        Professional Summary
                      </h2>
                      {/* Improve Button */}
                      {showImproveButtons && improveSection && resume.summary && (
                        <button
                          onClick={() => improveSection('summary', resume.summary)}
                          disabled={isImprovingSection?.('summary')}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          style={{
                            background: `linear-gradient(to right, var(--template-primary-color, #3b82f6), var(--template-accent-color, #8b5cf6))`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <svg className={`w-3 h-3 ${isImprovingSection?.('summary') ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {isImprovingSection?.('summary') ? 'Improving...' : 'Improve'}
                        </button>
                      )}
                    </div>
                    {resume.summary ? (
                      <div className={`bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex-1 overflow-y-auto relative ${isImprovingSection?.('summary') ? 'animate-pulse' : ''}`} style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--template-primary-color) #f1f1f1'
                      }}>
                        {isImprovingSection?.('summary') && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none rounded-xl"></div>
                        )}
                        <p className="text-slate-700 leading-relaxed text-base">
                          {resume.summary}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                        <Eye className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-slate-500 text-base font-medium mb-1">Add Professional Summary</p>
                        <p className="text-slate-400 text-sm">Showcase your expertise and value</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Right Column: Career Objective */}
              <div className="flex flex-col h-[280px]">
                {renderSection('objective', (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
                      <h2 className="text-2xl font-bold flex items-center gap-2" 
                          style={{ 
                            color: 'var(--template-primary-color)',
                            fontFamily: 'var(--template-font-family)',
                            fontWeight: 'var(--template-heading-weight)'
                          }}>
                        <Target size={24} />
                        Career Objective
                      </h2>
                      {/* Improve Button */}
                      {showImproveButtons && improveSection && resume.objective && (
                        <button
                          onClick={() => improveSection('objective', resume.objective)}
                          disabled={isImprovingSection?.('objective')}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                          style={{
                            background: `linear-gradient(to right, var(--template-primary-color, #3b82f6), var(--template-accent-color, #8b5cf6))`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          <svg className={`w-3 h-3 ${isImprovingSection?.('objective') ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                          {isImprovingSection?.('objective') ? 'Improving...' : 'Improve'}
                        </button>
                      )}
                    </div>
                    {resume.objective ? (
                      <div className={`bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex-1 overflow-y-auto relative ${isImprovingSection?.('objective') ? 'animate-pulse' : ''}`} style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'var(--template-primary-color) #f1f1f1'
                      }}>
                        {isImprovingSection?.('objective') && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer pointer-events-none rounded-xl"></div>
                        )}
                        <p className="text-slate-700 leading-relaxed text-base">
                          {resume.objective}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center flex-1 flex flex-col items-center justify-center">
                        <Target className="w-10 h-10 text-slate-400 mb-3" />
                        <p className="text-slate-500 text-base font-medium mb-1">Add Career Objective</p>
                        <p className="text-slate-400 text-sm">Define your career goals</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TIER 3: Detailed Evaluation Zone (30+ second deep dive) */}
        <div className="hfi-tier-3 bg-slate-50">
          
          {/* Experience & Education Row */}
          <div className={`grid lg:grid-cols-3 ${responsiveValues.gap} ${responsiveValues.horizontalPadding} py-4`}>
            
            {/* Professional Experience - 2/3 width */}
            {renderSection('experience', (
              <div className={`lg:col-span-2 ${responsiveValues.sectionSpacing}`}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" 
                  style={{ 
                    color: 'var(--template-primary-color)',
                    fontFamily: 'var(--template-font-family)',
                    fontWeight: 'var(--template-heading-weight)'
                  }}>
                <Briefcase size={24} />
                Professional Experience
              </h2>

              {resume.experiences && resume.experiences.length > 0 ? (
                <ExperienceCarousel 
                  experiences={resume.experiences}
                  improveSection={improveSection}
                  isImprovingSection={isImprovingSection}
                  showImproveButtons={showImproveButtons}
                />
              ) : (
                <Card className="border-2 border-dashed border-slate-200" style={{ height: '320px' }}>
                  <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                    <Briefcase className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-500 text-lg font-medium mb-2">No experience added yet</p>
                    <p className="text-slate-400">Add your professional experience to build credibility</p>
                  </CardContent>
                </Card>
              )}
              
              </div>
            ))}

            {/* Education & Skills Sidebar - 1/3 width */}
            {renderSection('education', (
              <div className={responsiveValues.sectionSpacing}>
                
                {/* Education Carousel */}
                <div className={responsiveValues.sectionSpacing}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" 
                    style={{ 
                      color: 'var(--template-primary-color)',
                      fontFamily: 'var(--template-font-family)',
                      fontWeight: 'var(--template-heading-weight)'
                    }}>
                  <GraduationCap size={20} />
                  Education
                </h2>
                
                {resume.education && resume.education.length > 0 ? (
                  <EducationCarousel education={resume.education} />
                ) : (
                  <Card className="border-2 border-dashed border-slate-200" style={{ height: '320px' }}>
                    <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                      <GraduationCap className="w-12 h-12 text-slate-400 mb-4" />
                      <p className="text-slate-500 text-lg font-medium mb-2">No education added yet</p>
                      <p className="text-slate-400">Add education details</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              </div>
            ))}
          </div>

           {/* Projects & GitHub Repositories - Two Column Layout */}
          {renderSection('projects-github', (
            <div className={`${responsiveValues.horizontalPadding} py-6 border-t border-slate-200`}>
              <div className="grid lg:grid-cols-2 gap-6 items-start">
                
                {/* Left Column: Projects Portfolio */}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold mb-6 flex-shrink-0" 
                  style={{ 
                    color: 'var(--template-primary-color)',
                    fontFamily: 'var(--template-font-family)',
                    fontWeight: 'var(--template-heading-weight)'
                  }}>
                Projects Portfolio
              </h2>
              
              {resume.projects && resume.projects.length > 0 ? (
                <ProjectsCarousel
                  projects={resume.projects}
                  primaryColor={templateConfig.primaryColor || '#3b82f6'}
                  accentColor={templateConfig.accentColor || '#60a5fa'}
                  fontFamily={templateConfig.fontFamily || 'inherit'}
                  headingWeight={templateConfig.headingWeight || '700'}
                  improveSection={improveSection}
                  isImprovingSection={isImprovingSection}
                  showImproveButtons={showImproveButtons}
                />
              ) : (
                <Card className="border-2 border-dashed border-slate-200" style={{ height: '320px' }}>
                  <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                    <FileCode className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-500 text-lg font-medium mb-2">No projects added yet</p>
                    <p className="text-slate-400">Add your projects to showcase your technical expertise</p>
                  </CardContent>
                </Card>
              )}
                </div>
                
                {/* Right Column: GitHub Repositories - Always Show */}
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold mb-6 flex-shrink-0" 
                  style={{ 
                    color: 'var(--template-primary-color)',
                    fontFamily: 'var(--template-font-family)',
                    fontWeight: 'var(--template-heading-weight)'
                  }}>
                <Github className="inline-block mr-2 mb-1" size={24} />
                GitHub Repositories
              </h2>
              
              {!resume.personalInfo?.github ? (
                <Card className="border-2 border-dashed border-slate-200" style={{ height: '320px' }}>
                  <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                    <Github className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-500 text-lg font-medium mb-2">No GitHub profile linked</p>
                    <p className="text-slate-400">Add your GitHub profile to showcase your repositories</p>
                  </CardContent>
                </Card>
              ) : githubLoading ? (
                <Card className="border border-slate-200" style={{ height: '320px' }}>
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mb-3"></div>
                    <span className="text-sm text-slate-500">Loading repositories from GitHub...</span>
                  </CardContent>
                </Card>
              ) : githubRepos.length > 0 ? (
                <div className="flex flex-col" style={{ height: '320px' }}>
                  <p className="text-sm text-slate-600 mb-4 flex-shrink-0">
                    {githubRepos.length} public {githubRepos.length === 1 ? 'repository' : 'repositories'} from{' '}
                    <a 
                      href={resume.personalInfo.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {resume.personalInfo.github.split('/').pop()}
                    </a>
                  </p>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--template-primary-color) #f1f1f1'
                  }}>
                    {githubRepos.map((repo) => (
                      <GitHubRepoCard key={repo.fullName} details={repo} />
                    ))}
                  </div>
                  {githubRepos.length > 6 && (
                    <div className="text-center pt-4 flex-shrink-0">
                      <a
                        href={resume.personalInfo.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        <span>View all on GitHub</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-slate-200" style={{ height: '320px' }}>
                  <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                    <Github className="w-12 h-12 text-slate-400 mb-4" />
                    <p className="text-slate-500 text-lg font-medium mb-2">No public repositories found</p>
                    <p className="text-slate-400">Make sure your GitHub profile has public repositories</p>
                  </CardContent>
                </Card>
              )}
                </div>
              </div>
            </div>
          ))}
          
          {/* Technical Expertise - Graph Chart Visualization */}
          <div className={`${responsiveValues.horizontalPadding} py-6 border-t border-slate-200 bg-gradient-to-br from-white to-slate-50`}>
            {resume.skills && resume.skills.length > 0 ? (
              <SkillsGraphChart
                skills={resume.skills}
                title="Technical Expertise"
                primaryColor={templateConfig.primaryColor}
                accentColor={templateConfig.accentColor}
              />
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-6" 
                    style={{ 
                      color: 'var(--template-primary-color)',
                      fontFamily: 'var(--template-font-family)',
                      fontWeight: 'var(--template-heading-weight)'
                    }}>
                  Technical Expertise
                </h2>
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                  <Code2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 text-lg font-medium mb-1">No technical skills added yet</p>
                  <p className="text-slate-400 text-sm">Add your technical expertise to showcase your capabilities</p>
                </div>
              </div>
            )}
          </div>

          {/* Certifications Section */} 
          {resume.certifications && resume.certifications.length > 0 && (
            <div className={`${responsiveValues.horizontalPadding} py-6 border-t border-slate-200 bg-white`}>
              <CertificationsSection
                certifications={resume.certifications}
                primaryColor={templateConfig?.primaryColor}
                accentColor={templateConfig?.accentColor}
              />
            </div>
          )}
          
         
        </div>

        {/* Professional Footer */}
        <footer className="mt-8 border-t-2" 
                style={{ borderTopColor: 'var(--template-primary-color)' }}>
          
          {/* Main Footer Content */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6">
            <div className="max-w-6xl mx-auto">
              
              {/* Footer Content - Legal & Branding */}
              <div>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm" 
                     style={{ color: 'var(--template-muted-color)' }}>
                  
                  {/* Left: Copyright & Date */}
                  <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4">
                    <span>© {new Date().getFullYear()} CVZen. All rights reserved.</span>
                    <div className="hidden lg:block w-px h-4 bg-slate-300"></div>
                    <span>{new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  
                  {/* Center: CVZen Branding */}
                  <div className="flex items-center gap-2 font-medium" 
                       style={{ color: 'var(--template-primary-color)' }}>
                    <Zap className="w-4 h-4" />
                    <span>Powered by CVZen</span>
                  </div>
                  
                  {/* Right: Legal Links */}
                  <div className="flex items-center gap-4 text-xs">
                    <a href="#terms" 
                       className="hover:underline transition-colors" 
                       style={{ color: 'var(--template-muted-color)' }}
                       onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--template-primary-color)'}
                       onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--template-muted-color)'}>
                      Terms of Use
                    </a>
                    <div className="w-px h-3 bg-slate-300"></div>
                    <a href="#privacy" 
                       className="hover:underline transition-colors" 
                       style={{ color: 'var(--template-muted-color)' }}
                       onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--template-primary-color)'}
                       onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--template-muted-color)'}>
                      Privacy Policy
                    </a>
                    <div className="w-px h-3 bg-slate-300"></div>
                    <a href="#disclaimer" 
                       className="hover:underline transition-colors" 
                       style={{ color: 'var(--template-muted-color)' }}
                       onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--template-primary-color)'}
                       onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--template-muted-color)'}>
                      Disclaimer
                    </a>
                  </div>
                </div>
                
                {/* Disclaimer Text */}
                <div className="w-full text-small mt-3 pt-3 border-t border-slate-200 text-xs text-center" 
                     style={{ color: 'var(--template-muted-color)', opacity: 0.8 }}>
                  <div className="text-center w-full">
                    This resume template is designed for professional use. All information presented is the responsibility of the individual. 
                    CVZen provides the template framework and styling system. The content accuracy and professional claims are solely 
                    the responsibility of the resume owner.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Image Gallery Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-bold">{modalProjectTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative p-6">
            {modalImages.length > 0 && (
              <div className="relative">
                <img
                  src={modalImages[modalImageIndex]}
                  alt={`${modalProjectTitle} - Image ${modalImageIndex + 1}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />

                {/* Navigation arrows */}
                {modalImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setModalImageIndex((prev) => prev === 0 ? modalImages.length - 1 : prev - 1)}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                    <button
                      onClick={() => setModalImageIndex((prev) => prev === modalImages.length - 1 ? 0 : prev + 1)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {modalImageIndex + 1} / {modalImages.length}
                </div>

                {/* Thumbnail navigation */}
                {modalImages.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {modalImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setModalImageIndex(idx)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === modalImageIndex
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
