/**
 * Template Resolver - Core template resolution logic
 * Handles all scenarios for determining which template to use
 */

import { 
  ResumeViewContext, 
  TemplateResolutionResult, 
  CustomizationResolutionResult,
  TemplateSource,
  CustomizationSource,
  TemplateResolutionError,
  CustomizationResolutionError
} from './types';

import { TemplateConfig, TemplateCategory, getTemplateConfig } from '@/services/templateService';
import { getTemplateCategoryFromId } from '@/services/templateContentInitializer';

// Dynamic import types
type TemplateCustomization = {
  id: number;
  templateId: string;
  userId?: number;
  name: string;
  colors: any;
  typography: any;
  layout: any;
  sections: any;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Enterprise-grade template resolver with clear priority logic
 */
export class TemplateResolver {
  private context: ResumeViewContext;
  private startTime: number;

  constructor(context: ResumeViewContext) {
    this.context = context;
    this.startTime = Date.now();
  }

  /**
   * Resolve template configuration based on context
   * Priority order:
   * 1. Shared resume template ID (immutable)
   * 2. URL template parameter
   * 3. User's saved template preference
   * 4. Default template (enhanced-technology)
   */
  async resolveTemplate(): Promise<TemplateResolutionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 [TemplateResolver] Resolving template for context:', {
        mode: this.context.mode,
        shareToken: !!this.context.shareToken,
        templateParam: this.context.templateParam,
        resumeId: this.context.resumeId
      });

      // Priority 1: Shared resume template
      if (this.context.shareToken && this.context.mode === 'shared') {
        try {
          const result = await this.resolveSharedTemplate();
          console.log('✅ [TemplateResolver] Resolved template from shared resume:', result.template.name);
          return result;
        } catch (error) {
          console.warn('⚠️ [TemplateResolver] Failed to resolve shared template:', error);
          // Continue to next priority
        }
      }

      // Priority 2: URL template parameter
      if (this.context.templateParam) {
        try {
          const result = await this.resolveUrlTemplate();
          console.log('✅ [TemplateResolver] Resolved template from URL parameter:', result.template.name);
          return result;
        } catch (error) {
          console.warn('⚠️ [TemplateResolver] Failed to resolve URL template:', error);
          // Continue to next priority
        }
      }

      // Priority 3: User's saved template preference
      if (this.context.userId && this.context.mode === 'preview') {
        try {
          const result = await this.resolveUserPreferenceTemplate();
          console.log('✅ [TemplateResolver] Resolved template from user preference:', result.template.name);
          return result;
        } catch (error) {
          console.warn('⚠️ [TemplateResolver] Failed to resolve user preference template:', error);
          // Continue to next priority
        }
      }

      // Priority 4: Default template
      const result = await this.resolveDefaultTemplate();
      console.log('✅ [TemplateResolver] Using default template:', result.template.name);
      return result;

    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      console.error('❌ [TemplateResolver] Template resolution failed:', error);
      
      throw new TemplateResolutionError(
        `Failed to resolve template: ${error.message}`,
        { context: this.context, resolutionTime }
      );
    }
  }

  /**
   * Resolve customization based on context and template
   * Priority order:
   * 1. Shared resume customization (immutable)
   * 2. User's saved customization for this template
   * 3. Template default customization
   * 4. No customization
   */
  async resolveCustomization(template: TemplateConfig): Promise<CustomizationResolutionResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 [TemplateResolver] Resolving customization for template:', template.name);

      // Priority 1: Shared resume customization (immutable)
      if (this.context.shareToken && this.context.mode === 'shared') {
        try {
          const result = await this.resolveSharedCustomization();
          if (result.customization) {
            console.log('✅ [TemplateResolver] Resolved customization from shared resume:', result.customization.name);
            return result;
          }
        } catch (error) {
          console.warn('⚠️ [TemplateResolver] Failed to resolve shared customization:', error);
          // Continue to next priority
        }
      }

      // Priority 2: Load customizations (user-specific or default/public)
      console.log('🔍 [TemplateResolver] Loading customizations for template:', template.id);
      
      try {
        console.log('🎨 [TemplateResolver] Attempting to load customizations for template:', template.id);
        const result = await this.resolveTemplateCustomizations(template);
        if (result.customization) {
          console.log('✅ [TemplateResolver] Resolved customization:', result.customization.name);
          return result;
        } else {
          console.log('ℹ️ [TemplateResolver] No customizations found for template');
        }
      } catch (error) {
        console.warn('⚠️ [TemplateResolver] Failed to load customizations:', error);
        // Continue to next priority
      }

      // Priority 3: Template default customization
      try {
        const result = await this.resolveDefaultCustomization(template);
        if (result.customization) {
          console.log('✅ [TemplateResolver] Using template default customization');
          return result;
        }
      } catch (error) {
        console.warn('⚠️ [TemplateResolver] Failed to resolve default customization:', error);
      }

      // Priority 4: No customization
      const resolutionTime = Date.now() - startTime;
      console.log('ℹ️ [TemplateResolver] No customization applied');
      
      return {
        customization: null,
        source: 'none',
        metadata: {
          resolvedFrom: 'none',
          isDefault: true,
          resolutionTime
        }
      };

    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      console.error('❌ [TemplateResolver] Customization resolution failed:', error);
      
      throw new CustomizationResolutionError(
        `Failed to resolve customization: ${error.message}`,
        { context: this.context, template: template.name, resolutionTime }
      );
    }
  }

  /**
   * Resolve template from shared resume data
   */
  private async resolveSharedTemplate(): Promise<TemplateResolutionResult> {
    const startTime = Date.now();
    
    if (!this.context.shareToken) {
      throw new Error('Share token required for shared template resolution');
    }

    // Fetch shared resume data
    const response = await fetch(`/api/shared/resume/${this.context.shareToken}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch shared resume: ${response.status}`);
    }

    const sharedData = await response.json();
    if (!sharedData.success || !sharedData.data) {
      throw new Error('Invalid shared resume data');
    }

    // Get template ID from shared data
    let templateId = sharedData.data.templateId;
    
    // Also check customization for template ID
    if (!templateId && sharedData.data.templateCustomization?.templateId) {
      templateId = sharedData.data.templateCustomization.templateId;
    }

    if (!templateId) {
      throw new Error('No template ID found in shared resume data');
    }

    // Convert template ID to category
    const category = getTemplateCategoryFromId(templateId);
    if (!category) {
      throw new Error(`Cannot resolve template category for ID: ${templateId}`);
    }

    // Get template configuration
    const template = getTemplateConfig(category as TemplateCategory);
    const resolutionTime = Date.now() - startTime;

    return {
      template,
      source: 'shared',
      metadata: {
        resolvedFrom: `shared-resume:${templateId}`,
        fallbackUsed: false,
        resolutionTime
      }
    };
  }

  /**
   * Resolve template from URL parameter
   */
  private async resolveUrlTemplate(): Promise<TemplateResolutionResult> {
    const startTime = Date.now();
    
    if (!this.context.templateParam) {
      throw new Error('Template parameter required for URL template resolution');
    }

    let template: TemplateConfig;
    let resolvedFrom: string;
    let fallbackUsed = false;

    try {
      // First, try to use it as a template category
      template = getTemplateConfig(this.context.templateParam as TemplateCategory);
      resolvedFrom = `url-category:${this.context.templateParam}`;
    } catch {
      // If that fails, try to convert template ID to category
      const category = getTemplateCategoryFromId(this.context.templateParam);
      if (category) {
        template = getTemplateConfig(category as TemplateCategory);
        resolvedFrom = `url-id:${this.context.templateParam}->${category}`;
      } else {
        // Fallback to default template
        template = getTemplateConfig('enhanced-technology');
        resolvedFrom = `url-fallback:${this.context.templateParam}->enhanced-technology`;
        fallbackUsed = true;
      }
    }

    const resolutionTime = Date.now() - startTime;

    return {
      template,
      source: 'url',
      metadata: {
        resolvedFrom,
        fallbackUsed,
        resolutionTime
      }
    };
  }

  /**
   * Resolve template from user preferences
   */
  private async resolveUserPreferenceTemplate(): Promise<TemplateResolutionResult> {
    const startTime = Date.now();
    
    // TODO: Implement user preference loading from database
    // For now, throw error to move to next priority
    throw new Error('User preference template resolution not implemented yet');
  }

  /**
   * Resolve default template (Enhanced Technology)
   */
  private async resolveDefaultTemplate(): Promise<TemplateResolutionResult> {
    const startTime = Date.now();
    
    const template = getTemplateConfig('enhanced-technology');
    const resolutionTime = Date.now() - startTime;

    return {
      template,
      source: 'default',
      metadata: {
        resolvedFrom: 'default:enhanced-technology',
        fallbackUsed: false,
        resolutionTime
      }
    };
  }

  /**
   * Resolve customization from shared resume data
   */
  private async resolveSharedCustomization(): Promise<CustomizationResolutionResult> {
    const startTime = Date.now();
    
    if (!this.context.shareToken) {
      throw new Error('Share token required for shared customization resolution');
    }

    // Fetch shared resume data
    const response = await fetch(`/api/shared/resume/${this.context.shareToken}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch shared resume: ${response.status}`);
    }

    const sharedData = await response.json();
    if (!sharedData.success || !sharedData.data) {
      throw new Error('Invalid shared resume data');
    }

    const customization = sharedData.data.templateCustomization;
    const resolutionTime = Date.now() - startTime;

    return {
      customization: customization || null,
      source: 'shared',
      metadata: {
        resolvedFrom: `shared-resume:${this.context.shareToken}`,
        isDefault: false,
        resolutionTime
      }
    };
  }

  /**
   * Resolve customizations for template (user-specific or default/public)
   */
  private async resolveTemplateCustomizations(template: TemplateConfig): Promise<CustomizationResolutionResult> {
    const startTime = Date.now();
    
    try {
      console.log('📊 [TemplateResolver] Loading all customizations for template:', template.id);
      const { TemplateCustomizationService } = await import('@/services/templateCustomizationService');
      const customizations = await TemplateCustomizationService.getCustomizationsForTemplate(template.id);
      
      if (customizations.length === 0) {
        console.log('ℹ️ [TemplateResolver] No customizations found for template');
        throw new Error('No customizations found');
      }
      
      // Priority logic for selecting customization:
      // 1. If user is authenticated and has customizations -> use user's default or latest
      // 2. If no user or no user customizations -> use first available (public/default)
      let selectedCustomization: any;
      
      // If user is authenticated, get their specific customization for this template
      if (this.context.userId && customizations.length > 0) {
        const userIdStr = String(this.context.userId);
        const userIdNum = parseInt(this.context.userId);
        
        const userCustomization = customizations.find(c => 
          String(c.userId) === userIdStr || c.userId === userIdNum
        );
        
        if (userCustomization) {
          selectedCustomization = userCustomization;
          console.log('🎆 [TemplateResolver] Using user-specific customization:', selectedCustomization.name);
        }
      }
      
      // Fallback to most recent if no user-specific found
      if (!selectedCustomization && customizations.length > 0) {
        selectedCustomization = customizations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        console.log('🎆 [TemplateResolver] Using fallback customization:', selectedCustomization.name);
      }
      
      // Fallback to first available customization (could be public or default)
      if (!selectedCustomization) {
        selectedCustomization = customizations[0]; // Use first available
        console.log('🌍 [TemplateResolver] Using default/public customization:', selectedCustomization.name);
      }
      
      const resolutionTime = Date.now() - startTime;
      
      return {
        customization: selectedCustomization,
        source: this.context.userId ? 'database' : 'public',
        metadata: {
          resolvedFrom: this.context.userId ? `user-database:${template.id}` : `public-database:${template.id}`,
          isDefault: selectedCustomization.isDefault || false,
          resolutionTime
        }
      };
      
    } catch (error) {
      throw new Error(`Failed to load template customizations: ${error.message}`);
    }
  }
  
  /**
   * Resolve customization from user preferences (legacy method)
   */
  private async resolveUserCustomization(template: TemplateConfig): Promise<CustomizationResolutionResult> {
    const startTime = Date.now();
    
    try {
      const { TemplateCustomizationService } = await import('@/services/templateCustomizationService');
      const customizations = await TemplateCustomizationService.getCustomizationsForTemplate(template.id);
      
      if (customizations.length === 0) {
        throw new Error('No user customizations found');
      }

      // Use the most recent default customization, or the most recent one
      const defaultCustomization = customizations.find(c => c.isDefault);
      const latestCustomization = defaultCustomization || 
        customizations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

      const resolutionTime = Date.now() - startTime;

      return {
        customization: latestCustomization,
        source: 'database',
        metadata: {
          resolvedFrom: `user-database:${template.id}`,
          isDefault: !!defaultCustomization,
          resolutionTime
        }
      };

    } catch (error) {
      throw new Error(`Failed to load user customization: ${error.message}`);
    }
  }

  /**
   * Resolve default customization for template
   */
  private async resolveDefaultCustomization(template: TemplateConfig): Promise<CustomizationResolutionResult> {
    const startTime = Date.now();
    
    // Import the default customization from the service
    const { defaultCustomization } = await import('@/services/templateCustomizationService');
    
    // Create a proper default customization object with template-specific values
    const templateDefaultCustomization = {
      id: 0, // Temporary ID for default
      templateId: template.id,
      userId: undefined,
      name: '🎯 Executive Blue (Default)',
      colors: defaultCustomization.colors,
      typography: defaultCustomization.typography,
      layout: defaultCustomization.layout,
      sections: defaultCustomization.sections,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const resolutionTime = Date.now() - startTime;
    
    console.log('✅ [TemplateResolver] Using built-in default customization:', templateDefaultCustomization.name);

    return {
      customization: templateDefaultCustomization,
      source: 'default',
      metadata: {
        resolvedFrom: `template-default:${template.id}`,
        isDefault: true,
        resolutionTime
      }
    };
  }

  /**
   * Get the source of resolution for debugging
   */
  getSource(): TemplateSource {
    if (this.context.shareToken && this.context.mode === 'shared') {
      return 'shared';
    }
    
    if (this.context.templateParam) {
      return 'url';
    }
    
    if (this.context.userId && this.context.mode === 'preview') {
      return 'user-preference';
    }
    
    return 'default';
  }
}
