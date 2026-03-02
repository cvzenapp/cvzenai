import React from "react";
import { Resume } from "@shared/api";
import { TemplateConfig, TemplateCategory } from "@/services/templateService";
import { TemplateCustomization } from "@/services/templateCustomizationService";
import CreativeDesignerTemplate from "./CreativeDesignerTemplate";
import AcademicTemplate from "./AcademicTemplate";
import ModernTechTemplate from "./ModernTechTemplate";
import DevOpsTemplate from "./DevOpsTemplate";
import ModernProfessionalTemplate from "./ModernProfessionalTemplate";
import EnhancedTechnologyTemplate from "./EnhancedTechnologyTemplate";

interface TemplateRendererProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  upvotes: number;
  hasUpvoted: boolean;
  isShortlisted: boolean;
  onUpvote: () => void;
  onShortlist: () => void;
  // New props for enhanced template system
  onDownload?: () => void;
  onContact?: () => void;
  onShare?: () => void;
  className?: string;
  // Customization props
  currentCustomization?: TemplateCustomization | null;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onCustomizationSave?: (customization: TemplateCustomization) => void;
  // Section improvement props
  improveSection?: (
    sectionType: 'summary' | 'objective' | 'experience' | 'education' | 'project' | 'skills',
    sectionData: any,
    sectionIndex?: number
  ) => Promise<any>;
  isImprovingSection?: (sectionType: string, sectionIndex?: number) => boolean;
  showImproveButtons?: boolean;
}

/**
 * Enhanced Template Renderer with Three-Tier Architecture Support
 * Supports both legacy templates and new redesigned templates
 */
export default function TemplateRenderer({
  resume,
  templateConfig,
  activeTab,
  setActiveTab,
  upvotes,
  hasUpvoted,
  isShortlisted,
  onUpvote,
  onShortlist,
  onDownload,
  onContact,
  onShare,
  className = '',
  currentCustomization,
  onCustomizationChange,
  onCustomizationSave,
  improveSection,
  isImprovingSection,
  showImproveButtons = false,
}: TemplateRendererProps) {
  // Error boundary for template loading failures
  if (!templateConfig) {
    console.error("TemplateRenderer: templateConfig is undefined");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Loading Error</h3>
          <p className="text-gray-600 mb-4">Unable to load the selected template configuration.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Validate resume data
  if (!resume) {
    console.error("TemplateRenderer: resume data is undefined");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="text-yellow-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Data Missing</h3>
          <p className="text-gray-600">No resume data available to display.</p>
        </div>
      </div>
    );
  }

  // Common props for all templates
  const commonProps = {
    resume,
    templateConfig,
    activeTab,
    setActiveTab,
    upvotes,
    hasUpvoted,
    isShortlisted,
    onUpvote,
    onShortlist,
  };

  // Enhanced props for new three-tier architecture templates
  const enhancedProps = {
    ...commonProps,
    onDownload,
    onContact,
    onShare,
    className,
    currentCustomization,
    onCustomizationChange,
    onCustomizationSave,
    improveSection,
    isImprovingSection,
    showImproveButtons,
  };

  // Template routing with fallback system
  try {
    switch (templateConfig.category) {
      // New three-tier architecture templates
      case "modern-professional":
        return <ModernProfessionalTemplate {...enhancedProps} />;
      
      // Enhanced templates with HFI optimization
      case "enhanced-technology":
        return <EnhancedTechnologyTemplate {...enhancedProps} />;
      default:
        console.warn(`Unknown template category: ${templateConfig.category}, falling back to technology template`);
        return <EnhancedTechnologyTemplate {...enhancedProps} />;
    }
  } catch (error) {
    console.error("Template rendering error:", error);
    
    // Fallback to safe template
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Error</h3>
          <p className="text-gray-600 mb-4">
            There was an error rendering the selected template. 
            {templateConfig.name && ` (${templateConfig.name})`}
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
           
          </div>
        </div>
      </div>
    );
  }
}
