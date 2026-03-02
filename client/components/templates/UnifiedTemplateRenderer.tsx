/**
 * Unified Template Renderer - Enterprise template rendering component
 * Single, consistent way to render all templates with their customizations
 */

import React, { useMemo, useEffect } from 'react';
import { Resume } from "@shared/api";
import { TemplateRendererProps, AppliedTemplate } from '@/services/templates/types';
import { TemplateOrchestrator } from '@/services/templates/TemplateOrchestrator';

// Import template components
import TechnologyTemplate from "./TechnologyTemplate";
import CreativeDesignerTemplate from "./CreativeDesignerTemplate";
import ManagementTemplate from "./ManagementTemplate";
import AcademicTemplate from "./AcademicTemplate";
import MarketingTemplate from "./MarketingTemplate";
import SalesTemplate from "./SalesTemplate";
import ModernTechTemplate from "./ModernTechTemplate";
import DevOpsTemplate from "./DevOpsTemplate";
import MobileTemplate from "./MobileTemplate";
import ModernProfessionalTemplate from "./ModernProfessionalTemplate";
import EnhancedTechnologyTemplate from "./EnhancedTechnologyTemplate";

/**
 * Unified Template Renderer with enterprise-grade template management
 */
export default function UnifiedTemplateRenderer({
  resume,
  templateState,
  onUpvote,
  onShortlist,
  onShare,
  onDownload,
  onContact,
  onCustomizationChange,
  onCustomizationSave,
  onCustomizationPreview,
  upvotes,
  hasUpvoted,
  isShortlisted,
  activeTab = "overview",
  setActiveTab,
  className = '',
  userName,
}: TemplateRendererProps) {

  console.log('🎨 [UnifiedTemplateRenderer] Rendering template:', {
    template: templateState.template.name,
    customization: templateState.customization?.name || 'none',
    customizationId: templateState.customization?.id,
    mode: templateState.mode,
    source: templateState.templateSource,
    timestamp: new Date().toISOString()
  });
  
  // Detailed customization logging
  if (templateState.customization) {
    console.log('🎨 [UnifiedTemplateRenderer] Customization details:', {
      colors: templateState.customization.colors,
      typography: templateState.customization.typography,
      layout: templateState.customization.layout
    });
  } else {
    console.log('⚠️ [UnifiedTemplateRenderer] No customization in templateState');
  }

  // Apply template state and generate applied template
  const appliedTemplate: AppliedTemplate = useMemo(() => {
    console.log('📋 [UnifiedTemplateRenderer] useMemo: Generating applied template...');
    
    const result = TemplateOrchestrator.applyTemplateState(
      templateState,
      resume,
      {
        onUpvote,
        onShortlist,
        onShare,
        onDownload,
        onContact,
        onCustomizationChange,
        onCustomizationSave,
        onCustomizationPreview
      },
      {
        upvotes,
        hasUpvoted,
        isShortlisted,
        activeTab,
        setActiveTab,
        className,
        userName
      }
    );
    
    console.log('✅ [UnifiedTemplateRenderer] useMemo: Applied template generated successfully');
    return result;
  }, [
    templateState, 
    resume,
    onUpvote,
    onShortlist, 
    onShare,
    onDownload,
    onContact,
    onCustomizationChange,
    onCustomizationSave,
    onCustomizationPreview,
    upvotes,
    hasUpvoted,
    isShortlisted,
    activeTab,
    setActiveTab,
    className,
    userName
  ]);
  
  // Ensure CSSApplicator runs whenever templateState changes (especially customizations)
  useEffect(() => {
    console.log('🔄 [UnifiedTemplateRenderer] TemplateState changed, re-applying CSS...');
    console.log('   Customization ID:', templateState.customization?.id);
    console.log('   Template ID:', templateState.template?.id);
    
    try {
      TemplateOrchestrator.applyTemplateState(templateState, resume);
      console.log('✅ [UnifiedTemplateRenderer] CSS re-application completed');
    } catch (error) {
      console.error('❌ [UnifiedTemplateRenderer] Error in CSS re-application:', error);
    }
  }, [templateState.customization, templateState.template.id, resume]);

  // Error boundary for template rendering
  if (!templateState || !resume) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Template Rendering Error</h3>
          <p className="text-gray-600 mb-4">Missing template state or resume data.</p>
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

  // Template routing with fallback system
  try {
    console.log('🎨 [UnifiedTemplateRenderer] Starting template rendering...');
    const templateProps = appliedTemplate.templateProps;
    console.log('   Template category:', templateState.template.category);
    console.log('   Template props available:', !!templateProps);

    switch (templateState.template.category) {
      // New three-tier architecture templates
      case "modern-professional":
        return <ModernProfessionalTemplate {...templateProps} />;
      
      // Enhanced templates with HFI optimization  
      case "enhanced-technology":
        console.log('🎆 [UnifiedTemplateRenderer] Rendering EnhancedTechnologyTemplate...');
        const enhancedResult = <EnhancedTechnologyTemplate {...templateProps} />;
        console.log('✅ [UnifiedTemplateRenderer] EnhancedTechnologyTemplate rendered successfully');
        return enhancedResult;
      
      // Legacy templates (maintained for backward compatibility)
      case "technology":
        return <TechnologyTemplate {...templateProps} />;
      case "tech-modern":
        return <ModernTechTemplate {...templateProps} />;
      case "tech-devops":
        return <DevOpsTemplate {...templateProps} />;
      case "tech-mobile":
        return <MobileTemplate {...templateProps} />;
      case "design":
        return <CreativeDesignerTemplate {...templateProps} />;
      case "management":
        return <ManagementTemplate {...templateProps} />;
      case "academic":
        return <AcademicTemplate {...templateProps} />;
      case "marketing":
        return <MarketingTemplate {...templateProps} />;
      case "sales":
        return <SalesTemplate {...templateProps} />;
      
      // Default fallback
      default:
        console.warn(`[UnifiedTemplateRenderer] Unknown template category: ${templateState.template.category}, falling back to Enhanced Technology template`);
        
        // Create fallback props with Enhanced Technology template
        const fallbackProps = {
          ...templateProps,
          templateConfig: {
            ...templateProps.templateConfig,
            category: 'enhanced-technology' as any
          }
        };
        
        console.log('🚑 [UnifiedTemplateRenderer] Rendering fallback EnhancedTechnologyTemplate...');
        const fallbackResult = <EnhancedTechnologyTemplate {...fallbackProps} />;
        console.log('✅ [UnifiedTemplateRenderer] Fallback EnhancedTechnologyTemplate rendered successfully');
        return fallbackResult;
    }

  } catch (error) {
    console.error('[UnifiedTemplateRenderer] Template rendering error:', error);
    
    // Fallback error UI
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
            There was an error rendering the {templateState.template.name} template.
          </p>
          <div className="space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Reload Page
            </button>
            <p className="text-xs text-gray-500">
              Template: {templateState.template.name} ({templateState.template.category})<br />
              Mode: {templateState.mode}<br />
              Error: {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * Loading component for when template state is loading
 */
export function UnifiedTemplateLoader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-t-2 border-blue-300 mx-auto animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <p className="text-slate-600 font-medium">Loading template...</p>
          <p className="text-slate-500 text-sm">Initializing enterprise template system</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Error component for template system failures
 */
export function UnifiedTemplateError({ 
  error, 
  onRetry 
}: { 
  error: Error, 
  onRetry: () => void 
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg border max-w-md">
        <div className="text-red-500 mb-6">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Template System Error</h3>
        <p className="text-gray-600 mb-6">
          There was an error loading the template system. This might be due to a network issue or a temporary system problem.
        </p>
        <div className="space-y-3">
          <button 
            onClick={onRetry}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reload Page
          </button>
        </div>
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 overflow-auto max-h-40">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}
