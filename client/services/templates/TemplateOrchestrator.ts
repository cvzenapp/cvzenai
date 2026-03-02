/**
 * Template Orchestrator - Main coordination service
 * Enterprise-grade template and customization management
 */

import { 
  ResumeViewContext, 
  TemplateState, 
  AppliedTemplate,
  TemplateProps,
  ResumeLoadContext,
  ResumeLoadResult,
  TemplateSystemError,
  ResumeLoadError
} from './types';

import { Resume } from "@shared/api";
import { TemplateResolver } from './TemplateResolver';
import { CSSApplicator } from './CSSApplicator';
import { unifiedAuthService } from '@/services/unifiedAuthService';

/**
 * Main orchestrator for the unified template system
 * Single entry point for all template-related operations
 */
export class TemplateOrchestrator {
  
  /**
   * Get complete template state for any viewing context
   * This is the main entry point for template resolution
   */
  static async getTemplateState(context: ResumeViewContext): Promise<TemplateState> {
    const startTime = Date.now();
    
    try {
      console.log('🏗️ [TemplateOrchestrator] Getting template state for context:', {
        mode: context.mode,
        shareToken: !!context.shareToken,
        templateParam: context.templateParam,
        resumeId: context.resumeId
      });

      // For shared resumes, first load the resume to get template information
      let sharedResumeInfo = null;
      if (context.shareToken && context.mode === 'shared') {
        try {
          console.log('🔍 [TemplateOrchestrator] Loading shared resume to get template info...');
          const sharedResult = await this.loadSharedResume(context.shareToken);
          sharedResumeInfo = sharedResult.metadata;
          console.log('✅ [TemplateOrchestrator] Got shared resume template info:', {
            templateId: sharedResumeInfo.templateId,
            customizationId: sharedResumeInfo.customizationId
          });
        } catch (error) {
          console.warn('⚠️ [TemplateOrchestrator] Failed to load shared resume info, using defaults:', error);
        }
      }

      // Create resolver for this context, with shared resume template info if available
      const resolverContext = sharedResumeInfo ? {
        ...context,
        templateParam: sharedResumeInfo.templateId,
        customizationId: sharedResumeInfo.customizationId
      } : context;
      
      const resolver = new TemplateResolver(resolverContext);
      
      // Step 1: Resolve template configuration
      console.log('🔍 [TemplateOrchestrator] Step 1: Resolving template...');
      const templateResult = await resolver.resolveTemplate();
      
      // Step 2: Resolve customization - use shared customization if available
      console.log('🎨 [TemplateOrchestrator] Step 2: Resolving customization...');
      let customizationResult;
      if (sharedResumeInfo?.templateCustomization) {
        console.log('🎨 [TemplateOrchestrator] Using shared resume customization...');
        customizationResult = {
          customization: sharedResumeInfo.templateCustomization,
          source: 'shared'
        };
      } else {
        customizationResult = await resolver.resolveCustomization(templateResult.template);
      }
      
      // Step 3: Create unified template state
      const resolutionTime = Date.now() - startTime;
      
      const templateState: TemplateState = {
        template: templateResult.template,
        customization: customizationResult.customization,
        mode: context.mode,
        isLoading: false,
        templateSource: templateResult.source,
        customizationSource: customizationResult.source,
        metadata: {
          resolvedAt: new Date(),
          templateId: templateResult.template.id,
          customizationId: customizationResult.customization?.id,
          isSharedView: context.mode === 'shared'
        }
      };

      console.log('✅ [TemplateOrchestrator] Template state resolved successfully:', {
        template: templateState.template.name,
        customization: templateState.customization?.name || 'none',
        templateSource: templateState.templateSource,
        customizationSource: templateState.customizationSource,
        resolutionTime: `${resolutionTime}ms`
      });

      return templateState;

    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      console.error('❌ [TemplateOrchestrator] Failed to get template state:', error);
      
      throw new TemplateSystemError(
        `Template state resolution failed: ${error.message}`,
        'TEMPLATE_STATE_ERROR',
        { context, resolutionTime }
      );
    }
  }

  /**
   * Apply template state and generate applied template
   */
  static applyTemplateState(
    templateState: TemplateState, 
    resume: Resume,
    interactionHandlers: {
      onUpvote?: () => void;
      onShortlist?: () => void;
      onShare?: () => void;
      onDownload?: () => void;
      onContact?: () => void;
      onCustomizationChange?: (customization: any) => void;
      onCustomizationSave?: (customization: any) => void;
      onCustomizationPreview?: (customization: any) => void;
    } = {},
    additionalProps: {
      upvotes?: number;
      hasUpvoted?: boolean;
      isShortlisted?: boolean;
      activeTab?: string;
      setActiveTab?: (tab: string) => void;
      className?: string;
      userName?: string;
    } = {}
  ): AppliedTemplate {
    
    console.log('🔧 [TemplateOrchestrator] Applying template state:', {
      template: templateState.template.name,
      customization: templateState.customization?.name || 'none',
      customizationId: templateState.customization?.id,
      mode: templateState.mode,
      timestamp: new Date().toISOString()
    });
    
    if (templateState.customization) {
      console.log('🎨 [TemplateOrchestrator] Customization to apply:', {
        colors: templateState.customization.colors,
        typography: templateState.customization.typography,
        layout: templateState.customization.layout
      });
    }

    try {
      // Generate CSS variables
      const cssVariables = CSSApplicator.generateCSSVariables(
        templateState.template, 
        templateState.customization
      );

      // Create template props
      const templateProps: TemplateProps = {
        resume,
        templateConfig: templateState.template,
        customization: templateState.customization,
        cssVariables,
        mode: templateState.mode,
        
        // Interaction handlers
        ...interactionHandlers,
        
        // Additional props
        ...additionalProps
      };

      // Generate custom styles
      const customStyles = this.generateCustomStyles(templateState);

      const appliedTemplate: AppliedTemplate = {
        template: templateState.template,
        customization: templateState.customization,
        cssVariables,
        templateProps,
        customStyles
      };

      // Apply CSS immediately
      CSSApplicator.apply(appliedTemplate);

      console.log('✅ [TemplateOrchestrator] Template state applied successfully');
      
      return appliedTemplate;

    } catch (error) {
      console.error('❌ [TemplateOrchestrator] Failed to apply template state:', error);
      throw new TemplateSystemError(
        `Template application failed: ${error.message}`,
        'TEMPLATE_APPLICATION_ERROR',
        { templateState }
      );
    }
  }

  /**
   * Load resume data for any context
   */
  static async loadResume(context: ResumeLoadContext): Promise<ResumeLoadResult> {
    const startTime = Date.now();
    
    try {
      console.log('📄 [TemplateOrchestrator] Loading resume for context:', context);

      // Priority 1: Shared resume
      if (context.shareToken && context.mode === 'shared') {
        try {
          const result = await this.loadSharedResume(context.shareToken);
          console.log('✅ [TemplateOrchestrator] Loaded shared resume:', result.resume.personalInfo?.name);
          return result;
        } catch (error) {
          console.error('❌ [TemplateOrchestrator] Failed to load shared resume:', error);
          throw error;
        }
      }

      // Priority 2: Database resume
      if (context.resumeId) {
        try {
          const result = await this.loadDatabaseResume(context.resumeId);
          console.log('✅ [TemplateOrchestrator] Loaded database resume:', result.resume.personalInfo?.name);
          return result;
        } catch (error) {
          console.warn('⚠️ [TemplateOrchestrator] Failed to load database resume, trying fallbacks:', error);
        }
      }

      // Priority 3: Current user's resume
      try {
        const result = await this.loadUserResume();
        console.log('✅ [TemplateOrchestrator] Loaded user resume:', result.resume.personalInfo?.name);
        return result;
      } catch (error) {
        console.warn('⚠️ [TemplateOrchestrator] Failed to load user resume:', error);
      }

      // Priority 4: LocalStorage fallback
      try {
        const result = await this.loadLocalStorageResume();
        console.log('✅ [TemplateOrchestrator] Loaded localStorage resume:', result.resume.personalInfo?.name);
        return result;
      } catch (error) {
        console.warn('⚠️ [TemplateOrchestrator] Failed to load localStorage resume:', error);
      }

      throw new ResumeLoadError('No resume data could be loaded from any source');

    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error('❌ [TemplateOrchestrator] Resume loading failed:', error);
      
      throw new ResumeLoadError(
        `Resume loading failed: ${error.message}`,
        { context, loadTime }
      );
    }
  }

  /**
   * Transform raw resume data to Resume interface format (DRY principle)
   */
  private static transformResumeData(rawData: any): Resume {
    return {
      id: rawData.id,
      personalInfo: {
        name: rawData.personalInfo?.name || `${rawData.personalInfo?.firstName || ''} ${rawData.personalInfo?.lastName || ''}`.trim() || 'User',
        title: rawData.personalInfo?.title || "Professional",
        email: rawData.personalInfo?.email || '',
        phone: rawData.personalInfo?.phone || '',
        location: rawData.personalInfo?.location || '',
        website: rawData.personalInfo?.portfolioUrl || rawData.personalInfo?.website || '',
        linkedin: rawData.personalInfo?.linkedinUrl || rawData.personalInfo?.linkedin || '',
        github: rawData.personalInfo?.githubUrl || rawData.personalInfo?.github || '',
        avatar: rawData.personalInfo?.avatar || ''
      },
      summary: rawData.summary || rawData.personalInfo?.summary || "",
      objective: rawData.objective || "",
      skills: rawData.skills || [],
      experiences: rawData.experiences || rawData.experience || [],
      education: rawData.education || [],
      projects: rawData.projects || [],
      upvotes: rawData.upvotes || 0,
      rating: rawData.rating || 0,
      isShortlisted: rawData.isShortlisted || false,
      createdAt: rawData.createdAt,
      updatedAt: rawData.updatedAt
    };
  }

  /**
   * Load shared resume
   */
  private static async loadSharedResume(shareToken: string): Promise<ResumeLoadResult> {
    const response = await fetch(`/api/shared/resume/${shareToken}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch shared resume: ${response.status}`);
    }

    const sharedData = await response.json();
    if (!sharedData.success || !sharedData.data) {
      throw new Error('Invalid shared resume data');
    }

    const resume = this.transformResumeData(sharedData.data);

    return {
      resume,
      source: 'shared',
      metadata: {
        loadedAt: new Date(),
        shareTokenUsed: shareToken,
        templateId: sharedData.data.templateId,
        customizationId: sharedData.data.customizationId,
        templateCustomization: sharedData.data.templateCustomization
      }
    };
  }

  /**
   * Load resume from database
   */
  private static async loadDatabaseResume(resumeId: string): Promise<ResumeLoadResult> {
    const headers = unifiedAuthService.getAuthHeaders();
    
    const response = await fetch(`/api/resumes/${resumeId}`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch database resume: ${response.status}`);
    }

    const resumeData = await response.json();
    if (!resumeData.success || !resumeData.data) {
      throw new Error('Invalid database resume data');
    }

    const resume = this.transformResumeData(resumeData.data);

    return {
      resume,
      source: 'database',
      metadata: {
        loadedAt: new Date(),
        userId: resumeData.data.user_id
      }
    };
  }

  /**
   * Load current user's resume
   */
  private static async loadUserResume(): Promise<ResumeLoadResult> {
    const isAuth = unifiedAuthService.isAuthenticated();
    const hasTokenInStorage = !!localStorage.getItem('authToken');
    
    if (!isAuth && !hasTokenInStorage) {
      throw new Error('User not authenticated');
    }

    const headers = unifiedAuthService.getAuthHeaders();
    
    try {
      const response = await fetch("/api/resumes", { headers });
      
      if (!response.ok) {
        // Handle authentication errors gracefully
        if (response.status === 401 || response.status === 403) {
          console.warn('🔐 [TemplateOrchestrator] Authentication failed for /api/resumes, user may need to log in');
          throw new Error('Authentication required - please log in');
        }
        throw new Error(`Failed to fetch user resumes: ${response.status}`);
      }

    const resumesData = await response.json();
    if (!resumesData.success || !resumesData.data?.length) {
      throw new Error('No user resumes found');
    }

    // Use the first resume
    const dbResume = resumesData.data[0];
    const resume: Resume = {
      id: dbResume.id,
      personalInfo: {
        name: dbResume.personalInfo?.name || `${dbResume.personalInfo?.firstName || ''} ${dbResume.personalInfo?.lastName || ''}`.trim(),
        title: dbResume.personalInfo?.title || "Professional",
        email: dbResume.personalInfo?.email || '',
        phone: dbResume.personalInfo?.phone || '',
        location: dbResume.personalInfo?.location || '',
        website: dbResume.personalInfo?.portfolioUrl || dbResume.personalInfo?.website || '',
        linkedin: dbResume.personalInfo?.linkedinUrl || dbResume.personalInfo?.linkedin || '',
        github: dbResume.personalInfo?.githubUrl || dbResume.personalInfo?.github || '',
        avatar: dbResume.personalInfo?.avatar || ''
      },
      summary: dbResume.summary || "",
      objective: dbResume.objective || "",
      skills: dbResume.skills || [],
      experiences: dbResume.experience || [],
      education: dbResume.education || [],
      projects: dbResume.projects || [],
      upvotes: 127,
      rating: 4.8,
      isShortlisted: false,
      createdAt: dbResume.createdAt,
      updatedAt: dbResume.updatedAt
    };

    return {
      resume,
      source: 'database',
      metadata: {
        loadedAt: new Date(),
        userId: dbResume.user_id
      }
    };
    
    } catch (error) {
      console.error('🚨 [TemplateOrchestrator] Error in loadUserResume:', error);
      
      // If it's an authentication error, provide a clear message
      if (error instanceof Error && error.message.includes('Authentication required')) {
        throw error;
      }
      
      // For other errors, wrap with more context
      throw new Error(`Failed to load user resume: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Load resume from localStorage (fallback)
   */
  private static async loadLocalStorageResume(): Promise<ResumeLoadResult> {
    const possibleKeys = ["resume-1", "1"];
    
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.personalInfo) {
            const resume: Resume = {
              id: parsed.id || '1',
              personalInfo: parsed.personalInfo,
              summary: parsed.summary || "",
              objective: parsed.objective || "",
              skills: parsed.skills || [],
              experiences: parsed.experiences || [],
              education: parsed.education || [],
              projects: parsed.projects || [],
              upvotes: 127,
              rating: 4.8,
              isShortlisted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            return {
              resume,
              source: 'localStorage',
              metadata: {
                loadedAt: new Date()
              }
            };
          }
        } catch (e) {
          console.warn(`Invalid JSON in localStorage key: ${key}`);
        }
      }
    }

    throw new Error('No valid resume data found in localStorage');
  }

  /**
   * Generate custom styles for the template state
   */
  private static generateCustomStyles(templateState: TemplateState): string {
    // For now, let CSSApplicator handle all styles
    return '';
  }

  /**
   * Clear all template state (cleanup)
   */
  static cleanup(): void {
    CSSApplicator.clear();
    console.log('✅ [TemplateOrchestrator] Cleanup completed');
  }
}
