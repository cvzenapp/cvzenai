import { useState, useEffect } from "react";
import { Resume } from "@shared/api";
import { TemplateConfig } from "@/services/templateService";
import { TemplateCustomization, TemplateCustomizationService } from "@/services/templateCustomizationService";
import TemplateRenderer from "@/components/templates/TemplateRenderer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RecruiterAuthModal from "@/components/RecruiterAuthModal";
import RecruiterProfileMenu from "@/components/RecruiterProfileMenu";
import UserProfileMenu from "@/components/UserProfileMenu";
import { 
  Download, 
  Share2, 
  Heart, 
  Bookmark, 
  Eye,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Settings
} from "lucide-react";
import { ATSScoreDisplay } from "@/components/ATSScoreDisplay";
import { atsApi } from "@/services/atsApi";
import { useSectionImprovement } from "@/hooks/useSectionImprovement";
import { SocialShareIcons } from "@/components/SocialShareIcons";

interface ResumeDisplayProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  mode: 'preview' | 'shared';
  
  // Common props
  upvotes: number;
  hasUpvoted: boolean;
  isShortlisted: boolean;
  onUpvote: () => void;
  onShortlist: () => void;
  
  // Preview mode specific
  userName?: string;
  onShare?: () => void;
  onDownloadPDF?: () => void;
  currentCustomization?: TemplateCustomization | null;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onCustomizationSave?: (customization: TemplateCustomization) => void;
  
  // Shared mode specific
  shareToken?: string;
  
  // Edit modal handlers
  setIsEditingPersonalInfo?: (editing: boolean) => void;
  setIsEditingSummary?: (editing: boolean) => void;
  setIsEditingObjective?: (editing: boolean) => void;
  setIsEditingSkills?: (editing: boolean) => void;
  setIsEditingProjects?: (editing: boolean) => void;
  setIsEditingEducation?: (editing: boolean) => void;
  setIsEditingExperience?: (editing: boolean) => void;
  setIsEditingCertifications?: (editing: boolean) => void;
  setIsEditingJobPreferences?: (editing: boolean) => void;
}

export default function ResumeDisplay({
  resume,
  templateConfig,
  mode,
  upvotes,
  hasUpvoted,
  isShortlisted,
  onUpvote,
  onShortlist,
  userName,
  onShare,
  onDownloadPDF,
  currentCustomization,
  onCustomizationChange,
  onCustomizationSave,
  shareToken,
  setIsEditingPersonalInfo,
  setIsEditingSummary,
  setIsEditingObjective,
  setIsEditingSkills,
  setIsEditingProjects,
  setIsEditingEducation,
  setIsEditingExperience,
  setIsEditingCertifications,
  setIsEditingJobPreferences,
}: ResumeDisplayProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [localCustomization, setLocalCustomization] = useState<TemplateCustomization | null>(currentCustomization || null);
  const [showRecruiterAuth, setShowRecruiterAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<'upvote' | 'shortlist' | null>(null);
  const [recruiterName, setRecruiterName] = useState<string>("");
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isShortlisting, setIsShortlisting] = useState(false);
  
  // ATS Score state
  const [atsScore, setAtsScore] = useState<any>(null);
  const [showATSModal, setShowATSModal] = useState(false);
  const [isCalculatingATS, setIsCalculatingATS] = useState(false);
  const [isImprovingATS, setIsImprovingATS] = useState(false);
  const [improvementResult, setImprovementResult] = useState<{
    success: boolean;
    message: string;
    improvements?: string[];
    oldScore?: number;
    newScore?: number;
    scoreIncrease?: number;
    noChangeReason?: string;
  } | null>(null);

  // Section-by-section improvement
  const {
    improveSection,
    isImprovingSection,
    getSectionError,
    getImprovedResume,
    hasImprovements
  } = useSectionImprovement(Number(resume.id), resume);

  // Use improved resume for display if improvements exist
  const displayResume = hasImprovements ? getImprovedResume() : resume;

  // Check if user is a recruiter and get their name
  const isRecruiter = () => {
    const recruiterToken = localStorage.getItem('recruiter_token');
    const recruiterUser = localStorage.getItem('recruiterUser');
    return !!(recruiterToken && recruiterUser);
  };

  // Get recruiter name from localStorage
  const getRecruiterName = () => {
    try {
      const recruiterUser = localStorage.getItem('recruiterUser');
      if (recruiterUser) {
        const user = JSON.parse(recruiterUser);
        return `${user.firstName} ${user.lastName}`.trim() || user.email || "Recruiter";
      }
    } catch (error) {
      console.error("Error parsing recruiter user:", error);
    }
    return "";
  };

  // Check for existing recruiter session on mount
  useEffect(() => {
    if (isRecruiter()) {
      setRecruiterName(getRecruiterName());
      // Refresh recruiterAuthApi state to ensure compatibility
      try {
        const { recruiterAuthApi } = require('@/services/recruiterAuthApi');
        recruiterAuthApi.refreshAuthState();
      } catch (error) {
        console.error("Error refreshing auth state:", error);
      }
    }
  }, []);

  // Handle recruiter authentication success
  const handleRecruiterAuthSuccess = () => {
    setShowRecruiterAuth(false);
    
    // Set the recruiter name for welcome message
    setRecruiterName(getRecruiterName());
    
    // Refresh recruiterAuthApi state to ensure compatibility
    try {
      const { recruiterAuthApi } = require('@/services/recruiterAuthApi');
      recruiterAuthApi.refreshAuthState();
    } catch (error) {
      console.error("Error refreshing auth state:", error);
    }
    
    // Execute the pending action
    if (pendingAction === 'upvote') {
      onUpvote();
    } else if (pendingAction === 'shortlist') {
      onShortlist();
    }
    
    setPendingAction(null);
  };

  // Handle recruiter authentication cancel
  const handleRecruiterAuthCancel = () => {
    setShowRecruiterAuth(false);
    setPendingAction(null);
  };

  // Wrapper for upvote action with debouncing
  const handleUpvoteClick = async () => {
    if (isUpvoting) return; // Prevent double-click
    
    if (isRecruiter()) {
      setIsUpvoting(true);
      try {
        await onUpvote();
      } finally {
        // Add small delay to prevent rapid clicking
        setTimeout(() => setIsUpvoting(false), 500);
      }
    } else {
      setPendingAction('upvote');
      setShowRecruiterAuth(true);
    }
  };

  // Wrapper for shortlist action with debouncing
  const handleShortlistClick = async () => {
    if (isShortlisting) return; // Prevent double-click
    
    if (isRecruiter()) {
      setIsShortlisting(true);
      try {
        await onShortlist();
      } finally {
        // Add small delay to prevent rapid clicking
        setTimeout(() => setIsShortlisting(false), 500);
      }
    } else {
      setPendingAction('shortlist');
      setShowRecruiterAuth(true);
    }
  };

  // ATS Score handlers
  const handleCalculateATS = async () => {
    if (!resume.id || isCalculatingATS) return;
    
    setIsCalculatingATS(true);
    try {
      const result = await atsApi.calculateScore(Number(resume.id));
      
      if (result.success && result.data?.atsScore) {
        setAtsScore(result.data.atsScore);
        setShowATSModal(true);
      }
    } catch (error) {
      console.error('Error calculating ATS score:', error);
    } finally {
      setIsCalculatingATS(false);
    }
  };

  const handleImproveATS = async () => {
    if (!resume.id || isImprovingATS) return;

    setIsImprovingATS(true);
    setImprovementResult(null);
    
    try {
      const result = await atsApi.improveResume(Number(resume.id));
      
      if (result.success && result.data) {
        setImprovementResult({
          success: true,
          message: 'Resume improved successfully!',
          improvements: result.data.improvements,
          oldScore: result.data.oldScore,
          newScore: result.data.newScore,
          scoreIncrease: result.data.scoreIncrease,
          noChangeReason: result.data.noChangeReason
        });
        
        if (result.data.newATSScore) {
          setAtsScore(result.data.newATSScore);
        }
        
        // Reload the page after 2 seconds to show updated resume
        setTimeout(() => {
          window.location.reload();
        }, 2000);
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

  // Apply customization CSS when it changes
  useEffect(() => {
    // DISABLED - Prevents infinite loop errors
    return; // Exit immediately without applying CSS
    
    // Guard against running during SSR or if document is not available
    if (typeof document === 'undefined') {
      return;
    }

    const customizationToApply = currentCustomization || localCustomization;
    if (!customizationToApply) {
      return;
    }

    try {
      const styleId = `${mode}-template-customization-styles`;
      let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
      
      if (!styleElement) {
        try {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          styleElement.setAttribute('type', 'text/css');
          if (document.head) {
            document.head.appendChild(styleElement);
          } else {
            console.error('document.head is not available');
            return;
          }
        } catch (createError) {
          console.error('Error creating style element:', createError);
          return;
        }
      }

      // Safety check - ensure element exists and has required properties
      if (!styleElement || typeof styleElement.textContent === 'undefined') {
        console.error('Style element is invalid or missing textContent property');
        return;
      }

     
        
      // styleElement.textContent = enhancedCSS;
      console.log(`🎨 Applied template customization for ${mode} mode:`, customizationToApply.name);
    } catch (error) {
      console.error('❌ Error applying template customization:', error);
      // Don't rethrow - just log and continue
    }
  }, [currentCustomization, localCustomization, mode]);

  const handleCustomizationChange = (customization: TemplateCustomization) => {
    setLocalCustomization(customization);
    if (onCustomizationChange) {
      onCustomizationChange(customization);
    }
  };

  const handleCustomizationSave = async (customization: TemplateCustomization) => {
    if (onCustomizationSave) {
      await onCustomizationSave(customization);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-xl font-semibold text-gray-900 truncate">
                    {resume.personalInfo.name}'s Resume
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {mode === 'preview' ? 'Preview' : 'Shared'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* User Profile Menu for Preview Mode */}
              {mode === 'preview' && userName && (
                <UserProfileMenu 
                  userName={userName}
                  className="hidden sm:block"
                />
              )}

              {/* Recruiter Profile Menu for Shared Mode */}
              {mode === 'shared' && recruiterName && (
                <RecruiterProfileMenu 
                  recruiterName={recruiterName}
                  className="hidden sm:block"
                />
              )}

              {/* Mobile: Show only essential buttons */}
              <div className="flex items-center space-x-1 sm:hidden">
                {/* Upvote Button - Mobile */}
                {mode !== 'preview' && (
                  <Button
                    variant={hasUpvoted ? "default" : "outline"}
                    size="sm"
                    onClick={handleUpvoteClick}
                    disabled={isUpvoting}
                    className="p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''} ${isUpvoting ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
                
                {/* Share Button - Mobile */}
                <Button
                  onClick={onShare}
                  variant="outline"
                  size="sm"
                  className="p-2"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                {/* Download Button - Mobile */}
                <Button
                  onClick={onDownloadPDF}
                  size="sm"
                  className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {/* Desktop: Show full buttons with text */}
              <div className="hidden sm:flex items-center space-x-2">
                {/* Upvote Button - Desktop */}
                {mode !== 'preview' && (
                  <Button
                    variant={hasUpvoted ? "default" : "outline"}
                    size="sm"
                    onClick={handleUpvoteClick}
                    disabled={isUpvoting}
                    className="flex items-center space-x-2 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart className={`h-4 w-4 ${hasUpvoted ? 'fill-current' : ''} ${isUpvoting ? 'animate-pulse' : ''}`} />
                    <span className="font-medium">{upvotes}</span>
                  </Button>
                )}
                
                {/* Share Button - Desktop */}
                <Button
                  onClick={onShare}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>

                {/* Shortlist Button - Desktop */}
                {mode !== 'preview' && (
                  <Button
                    variant={isRecruiter() && isShortlisted ? "default" : "outline"}
                    size="sm"
                    onClick={handleShortlistClick}
                    disabled={isShortlisting}
                    className="flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Bookmark className={`h-4 w-4 ${isRecruiter() && isShortlisted ? 'fill-current' : ''} ${isShortlisting ? 'animate-pulse' : ''}`} />
                    <span className="hidden md:inline">
                      {isRecruiter() && isShortlisted ? 'Shortlisted' : 'Shortlist'}
                    </span>
                  </Button>
                )}
                
                {/* Download Button - Desktop */}
                <Button
                  onClick={onDownloadPDF}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
                
                {/* ATS Improve Button - Desktop */}
                {mode === 'preview' && (
                  <Button
                    onClick={handleCalculateATS}
                    disabled={isCalculatingATS}
                    className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden lg:inline">{isCalculatingATS ? 'Calculating...' : 'Improve ATS'}</span>
                  </Button>
                )}

                {/* Job Preferences Button - Desktop */}
                {(mode === 'preview' || mode === 'shared') && setIsEditingJobPreferences && (
                  <Button
                    onClick={() => {
                      console.log('💼 [DEBUG] Job Preferences button clicked');
                      console.log('💼 [DEBUG] Mode:', mode);
                      console.log('💼 [DEBUG] Resume job preferences:', resume?.jobPreferences);
                      setIsEditingJobPreferences(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden lg:inline">
                      {mode === 'shared' ? 'View Preferences' : 'Preferences'}
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Content */}
      <div className="w-full pt-20 sm:pt-24 pb-8 px-2 sm:px-4 lg:px-8">
        <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          {/* Contact Info Section */}
          {resume.personalInfo.email && (
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-3 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex flex-row flex-wrap items-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-gray-600">
                  {resume.personalInfo.email && (
                    <a 
                      href={`mailto:${resume.personalInfo.email}`}
                      className="flex items-center space-x-1.5 sm:space-x-2 hover:text-blue-600 transition-colors duration-200"
                    >
                      <span className="text-sm sm:text-base">📧</span>
                      <span className="break-all text-xs sm:text-sm">{resume.personalInfo.email}</span>
                    </a>
                  )}
                  {resume.personalInfo.phone && (
                    <a 
                      href={`tel:${resume.personalInfo.phone}`}
                      className="flex items-center space-x-1.5 sm:space-x-2 hover:text-blue-600 transition-colors duration-200"
                    >
                      <span className="text-sm sm:text-base">📞</span>
                      <span className="text-xs sm:text-sm">{resume.personalInfo.phone}</span>
                    </a>
                  )}
                </div>
                
                {/* Social Share Icons */}
                <div className="flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-300 sm:pl-3 lg:pl-4">
                  <SocialShareIcons 
                    resume={resume} 
                    size="sm" 
                    variant="icons"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* ATS Score Section */}
          {resume.atsScore && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 sm:px-8 py-6 border-b border-gray-200">
              <ATSScoreDisplay atsScore={resume.atsScore} compact={false} />
            </div>
          )}
          
          {/* Template Content */}
          <div id="resume-template-container" className="p-4 sm:p-8">
            <TemplateRenderer
              resume={displayResume}
              templateConfig={templateConfig}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              upvotes={upvotes}
              hasUpvoted={hasUpvoted}
              isShortlisted={isShortlisted}
              onUpvote={handleUpvoteClick}
              onShortlist={handleShortlistClick}
              currentCustomization={localCustomization}
              onCustomizationChange={handleCustomizationChange}
              onCustomizationSave={handleCustomizationSave}
              improveSection={improveSection}
              isImprovingSection={isImprovingSection}
              showImproveButtons={mode === 'preview'}
              setIsEditingPersonalInfo={setIsEditingPersonalInfo}
              setIsEditingSummary={setIsEditingSummary}
              setIsEditingObjective={setIsEditingObjective}
              setIsEditingSkills={setIsEditingSkills}
              setIsEditingProjects={setIsEditingProjects}
              setIsEditingEducation={setIsEditingEducation}
              setIsEditingExperience={setIsEditingExperience}
              setIsEditingCertifications={setIsEditingCertifications}
            />
          </div>
        </div>
      </div>

      {/* Mobile Action Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg sm:hidden">
        <div className="flex items-center justify-around py-2 px-2">
          {/* ATS Improve Button - Mobile */}
          {mode === 'preview' && (
            <Button
              onClick={handleCalculateATS}
              disabled={isCalculatingATS}
              size="sm"
              className="flex flex-col items-center space-y-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-2 py-2 min-w-[60px]"
            >
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] leading-tight">{isCalculatingATS ? 'Calc...' : 'ATS Score'}</span>
            </Button>
          )}

          {/* Shortlist Button - Mobile */}
          {mode !== 'preview' && (
            <Button
              variant={isRecruiter() && isShortlisted ? "default" : "outline"}
              size="sm"
              onClick={handleShortlistClick}
              disabled={isShortlisting}
              className="flex flex-col items-center space-y-1 px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px]"
            >
              <Bookmark className={`h-3 w-3 ${isRecruiter() && isShortlisted ? 'fill-current' : ''} ${isShortlisting ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] leading-tight">
                {isRecruiter() && isShortlisted ? 'Saved' : 'Save'}
              </span>
            </Button>
          )}

          {/* Job Preferences Button - Mobile */}
          {(mode === 'preview' || mode === 'shared') && setIsEditingJobPreferences && (
            <Button
              onClick={() => {
                console.log('💼 [DEBUG] Job Preferences button clicked (mobile)');
                console.log('💼 [DEBUG] Mode:', mode);
                console.log('💼 [DEBUG] Resume job preferences:', resume?.jobPreferences);
                setIsEditingJobPreferences(true);
              }}
              variant="outline"
              size="sm"
              className="flex flex-col items-center space-y-1 px-2 py-2 min-w-[60px]"
            >
              <Settings className="h-3 w-3" />
              <span className="text-[10px] leading-tight">
                {mode === 'shared' ? 'Prefs' : 'Settings'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Recruiter Authentication Modal */}
      {showRecruiterAuth && (
        <Dialog open={showRecruiterAuth} onOpenChange={setShowRecruiterAuth}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Recruiter Access Required</DialogTitle>
            </DialogHeader>
            <RecruiterAuthModal
              isOpen={showRecruiterAuth}
              onSuccess={handleRecruiterAuthSuccess}
              onCancel={handleRecruiterAuthCancel}
              message={`To ${pendingAction === 'upvote' ? 'like' : 'shortlist'} this resume, please sign in as a recruiter or create a recruiter account.`}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* ATS Score Modal */}
      <Dialog open={showATSModal} onOpenChange={(open) => {
        setShowATSModal(open);
        if (!open) {
          setImprovementResult(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ATS Score Details</DialogTitle>
            <DialogDescription>
              Improve your resume's ATS compatibility score with AI
            </DialogDescription>
          </DialogHeader>
          
          {/* Section-by-Section Improvement Buttons */}
          {!atsScore && (
            <div className="space-y-3 mb-6">
              <h3 className="font-semibold text-lg text-gray-900">Improve Individual Sections</h3>
              <p className="text-sm text-gray-600 mb-4">Click to improve specific sections of your resume with AI</p>
              
              {/* Summary */}
              {displayResume.summary && (
                <Button
                  onClick={() => improveSection('summary', displayResume.summary)}
                  disabled={isImprovingSection('summary')}
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50"
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${isImprovingSection('summary') ? 'animate-spin' : ''}`} />
                  {isImprovingSection('summary') ? 'Improving Summary...' : 'Improve Professional Summary'}
                </Button>
              )}
              
              {/* Objective */}
              {displayResume.objective && (
                <Button
                  onClick={() => improveSection('objective', displayResume.objective)}
                  disabled={isImprovingSection('objective')}
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50"
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${isImprovingSection('objective') ? 'animate-spin' : ''}`} />
                  {isImprovingSection('objective') ? 'Improving Objective...' : 'Improve Career Objective'}
                </Button>
              )}
              
              {/* Skills */}
              {displayResume.skills && displayResume.skills.length > 0 && (
                <Button
                  onClick={() => improveSection('skills', displayResume.skills)}
                  disabled={isImprovingSection('skills')}
                  variant="outline"
                  className="w-full justify-start hover:bg-blue-50"
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${isImprovingSection('skills') ? 'animate-spin' : ''}`} />
                  {isImprovingSection('skills') ? 'Improving Skills...' : `Improve Skills (${displayResume.skills.length} skills)`}
                </Button>
              )}
              
              {/* Experience */}
              {displayResume.experiences && displayResume.experiences.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mt-2">Work Experience</p>
                  {displayResume.experiences.map((exp, index) => (
                    <Button
                      key={index}
                      onClick={() => improveSection('experience', exp, index)}
                      disabled={isImprovingSection('experience', index)}
                      variant="outline"
                      className="w-full justify-start hover:bg-blue-50 text-left"
                    >
                      <Sparkles className={`mr-2 h-4 w-4 flex-shrink-0 ${isImprovingSection('experience', index) ? 'animate-spin' : ''}`} />
                      <span className="truncate">
                        {isImprovingSection('experience', index) 
                          ? `Improving ${exp.position}...` 
                          : `${exp.position} at ${exp.company}`}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Education */}
              {displayResume.education && displayResume.education.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mt-2">Education</p>
                  {displayResume.education.map((edu, index) => (
                    <Button
                      key={index}
                      onClick={() => improveSection('education', edu, index)}
                      disabled={isImprovingSection('education', index)}
                      variant="outline"
                      className="w-full justify-start hover:bg-blue-50 text-left"
                    >
                      <Sparkles className={`mr-2 h-4 w-4 flex-shrink-0 ${isImprovingSection('education', index) ? 'animate-spin' : ''}`} />
                      <span className="truncate">
                        {isImprovingSection('education', index) 
                          ? `Improving ${edu.degree}...` 
                          : `${edu.degree} in ${edu.field}`}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
              
              {/* Projects */}
              {displayResume.projects && displayResume.projects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 mt-2">Projects</p>
                  {displayResume.projects.map((project, index) => (
                    <Button
                      key={index}
                      onClick={() => improveSection('project', project, index)}
                      disabled={isImprovingSection('project', index)}
                      variant="outline"
                      className="w-full justify-start hover:bg-blue-50 text-left"
                    >
                      <Sparkles className={`mr-2 h-4 w-4 flex-shrink-0 ${isImprovingSection('project', index) ? 'animate-spin' : ''}`} />
                      <span className="truncate">
                        {isImprovingSection('project', index) 
                          ? `Improving ${project.title}...` 
                          : project.title}
                      </span>
                    </Button>
                  ))}
                </div>
              )}
              
              <div className="border-t pt-4 mt-4">
                <Button
                  onClick={handleImproveATS}
                  disabled={isImprovingATS}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Sparkles className={`mr-2 h-4 w-4 ${isImprovingATS ? 'animate-spin' : ''}`} />
                  {isImprovingATS ? 'Improving Entire Resume...' : 'Improve Entire Resume at Once'}
                </Button>
              </div>
            </div>
          )}
          
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
                    <div className="mb-2 text-sm font-medium text-green-800">
                      Score: {improvementResult.oldScore} → {improvementResult.newScore} 
                      {improvementResult.scoreIncrease !== undefined && improvementResult.scoreIncrease > 0 && (
                        <span className="ml-2 text-green-600">
                          (+{improvementResult.scoreIncrease} points)
                        </span>
                      )}
                      {improvementResult.noChangeReason === 'improvements_decreased_score' && (
                        <span className="ml-2 text-gray-600">
                          (kept original score)
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className={`text-sm ${
                    improvementResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {improvementResult.message}
                  </p>
                  
                  {/* Helpful message for good scores with no improvement */}
                  {improvementResult.success && 
                   improvementResult.scoreIncrease === 0 && 
                   (improvementResult.newScore || 0) >= 70 && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h6 className="font-medium text-blue-900 text-sm mb-1">Your resume looks good!</h6>
                          <p className="text-xs text-blue-700 mb-2">
                            To improve your score further, consider adding:
                          </p>
                          <ul className="text-xs text-blue-700 space-y-1">
                            <li>• More relevant skills that match job requirements</li>
                            <li>• Additional projects showcasing your expertise</li>
                            <li>• Professional certifications related to your field</li>
                            <li>• Quantifiable achievements with specific metrics</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
          
          {atsScore && (
            <ATSScoreDisplay 
              atsScore={atsScore} 
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
