/**
 * Unified Template System - Core Types
 * Enterprise-grade template and customization management
 */

import { Resume } from "@shared/api";
import { TemplateConfig, TemplateCategory } from "@/services/templateService";
import { TemplateCustomization } from "@/services/templateCustomizationService";

/**
 * Context information for template resolution
 */
export interface ResumeViewContext {
  shareToken?: string;
  templateParam?: string;
  resumeId?: string;
  mode: ViewMode;
  userId?: string;
  customizationId?: string | number;
}

/**
 * View modes for different contexts
 */
export type ViewMode = 'preview' | 'shared' | 'edit' | 'builder';

/**
 * Source of template configuration
 */
export type TemplateSource = 'url' | 'database' | 'shared' | 'default' | 'user-preference';

/**
 * Source of customization data
 */
export type CustomizationSource = 'shared' | 'database' | 'default' | 'none';

/**
 * Unified template state - Single source of truth
 */
export interface TemplateState {
  /** Template configuration */
  template: TemplateConfig;
  
  /** Applied customization (null if none) */
  customization: TemplateCustomization | null;
  
  /** Current view mode */
  mode: ViewMode;
  
  /** Loading state */
  isLoading: boolean;
  
  /** Source of template configuration */
  templateSource: TemplateSource;
  
  /** Source of customization data */
  customizationSource: CustomizationSource;
  
  /** Metadata for debugging and analytics */
  metadata: {
    resolvedAt: Date;
    templateId: string;
    customizationId?: number;
    isSharedView: boolean;
  };
}

/**
 * Applied template with resolved customizations
 */
export interface AppliedTemplate {
  /** Base template configuration */
  template: TemplateConfig;
  
  /** Resolved customization */
  customization: TemplateCustomization | null;
  
  /** Generated CSS variables */
  cssVariables: Record<string, string>;
  
  /** Component props for template */
  templateProps: TemplateProps;
  
  /** Template-specific styles */
  customStyles?: string;
}

/**
 * Props passed to template components
 */
export interface TemplateProps {
  resume: Resume;
  templateConfig: TemplateConfig;
  customization: TemplateCustomization | null;
  cssVariables: Record<string, string>;
  mode: ViewMode;
  
  // Interaction handlers
  onUpvote?: () => void;
  onShortlist?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onContact?: () => void;
  
  // Customization handlers (only in edit/builder modes)
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onCustomizationSave?: (customization: TemplateCustomization) => void;
  onCustomizationPreview?: (customization: TemplateCustomization) => void;
  
  // State
  upvotes?: number;
  hasUpvoted?: boolean;
  isShortlisted?: boolean;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

/**
 * Template resolution result
 */
export interface TemplateResolutionResult {
  template: TemplateConfig;
  source: TemplateSource;
  metadata: {
    resolvedFrom: string;
    fallbackUsed: boolean;
    resolutionTime: number;
  };
}

/**
 * Customization resolution result
 */
export interface CustomizationResolutionResult {
  customization: TemplateCustomization | null;
  source: CustomizationSource;
  metadata: {
    resolvedFrom: string;
    isDefault: boolean;
    resolutionTime: number;
  };
}

/**
 * Template renderer component interface
 */
export interface TemplateRendererProps {
  resume: Resume;
  templateState: TemplateState;
  
  // Interaction props
  onUpvote?: () => void;
  onShortlist?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  onContact?: () => void;
  
  // Customization props (for edit modes)
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onCustomizationSave?: (customization: TemplateCustomization) => void;
  onCustomizationPreview?: (customization: TemplateCustomization) => void;
  
  // State props
  upvotes?: number;
  hasUpvoted?: boolean;
  isShortlisted?: boolean;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  
  // Additional props
  className?: string;
  userName?: string;
}

/**
 * CSS Variable definitions
 */
export interface CSSVariableMap {
  // Colors
  '--template-primary-color': string;
  '--template-secondary-color': string;
  '--template-accent-color': string;
  '--template-background-color': string;
  '--text-slate-700': string;
  '--template-muted-color': string;
  
  // Typography
  '--template-font-family': string;
  '--template-font-size': string;
  '--template-line-height': string;
  '--template-font-weight': string;
  '--template-heading-weight': string;
  
  // Layout
  '--template-spacing': string;
  '--template-border-radius': string;
  '--template-section-spacing': string;
  '--template-card-padding': string;
  '--template-density-multiplier': string;
}

/**
 * Template validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    validatedAt: Date;
    version: string;
  };
}

/**
 * Resume loading context
 */
export interface ResumeLoadContext {
  shareToken?: string;
  resumeId?: string;
  mode: ViewMode;
}

/**
 * Resume loading result
 */
export interface ResumeLoadResult {
  resume: Resume;
  source: 'shared' | 'database' | 'localStorage' | 'sample';
  metadata: {
    loadedAt: Date;
    userId?: string;
    shareTokenUsed?: string;
  };
}

/**
 * Error types for template system
 */
export class TemplateSystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'TemplateSystemError';
  }
}

export class TemplateResolutionError extends TemplateSystemError {
  constructor(message: string, context?: any) {
    super(message, 'TEMPLATE_RESOLUTION_ERROR', context);
    this.name = 'TemplateResolutionError';
  }
}

export class CustomizationResolutionError extends TemplateSystemError {
  constructor(message: string, context?: any) {
    super(message, 'CUSTOMIZATION_RESOLUTION_ERROR', context);
    this.name = 'CustomizationResolutionError';
  }
}

export class ResumeLoadError extends TemplateSystemError {
  constructor(message: string, context?: any) {
    super(message, 'RESUME_LOAD_ERROR', context);
    this.name = 'ResumeLoadError';
  }
}

/**
 * Configuration for the template system
 */
export interface TemplateSystemConfig {
  defaultTemplate: TemplateCategory;
  enableSharedResumes: boolean;
  enableCustomizations: boolean;
  cacheTimeout: number; // in milliseconds
  maxRetries: number;
  
  // Feature flags
  features: {
    advancedCustomization: boolean;
    templatePreview: boolean;
    templateComparison: boolean;
    templateRecommendations: boolean;
  };
  
  // Analytics
  analytics: {
    trackTemplateUsage: boolean;
    trackCustomizationChanges: boolean;
    trackSharedViews: boolean;
  };
}
