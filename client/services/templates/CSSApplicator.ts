/**
 * CSS Applicator - Unified CSS variable management system
 * Handles consistent CSS variable application across all templates
 */

import { AppliedTemplate, CSSVariableMap } from './types';
import { TemplateConfig } from '@/services/templateService';
import { TemplateCustomization, TemplateCustomizationService } from '@/services/templateCustomizationService';

/**
 * Enterprise-grade CSS variable management system
 */
export class CSSApplicator {
  private static readonly STYLE_ID = 'unified-template-styles';
  private static appliedTemplate: AppliedTemplate | null = null;

  /**
   * Apply CSS variables and styles for a template and customization
   */
  static apply(appliedTemplate: AppliedTemplate): void {
    console.log('🎨 [CSSApplicator] Applying template styles:', {
      template: appliedTemplate.template.name,
      customization: appliedTemplate.customization?.name || 'none',
      customizationId: appliedTemplate.customization?.id,
      mode: appliedTemplate.templateProps.mode,
      timestamp: new Date().toISOString()
    });
    
    // if (appliedTemplate.customization) {
    //   // console.log('🎨 [CSSApplicator] Customization data received:', {
    //   //   id: appliedTemplate.customization.id,
    //   //   name: appliedTemplate.customization.name,
    //   //   templateId: appliedTemplate.customization.templateId,
    //   //   colors: appliedTemplate.customization.colors,
    //   //   typography: appliedTemplate.customization.typography,
    //   //   layout: appliedTemplate.customization.layout,
    //   //   sections: appliedTemplate.customization.sections,
    //   //   isDefault: appliedTemplate.customization.isDefault,
    //   //   createdAt: appliedTemplate.customization.createdAt,
    //   //   updatedAt: appliedTemplate.customization.updatedAt
    //   // });
      
    //   // Detailed field-by-field logging
    //   // console.log('🔍 [CSSApplicator] Customization field details:');
    //   // console.log('   Colors:', appliedTemplate.customization.colors);
    //   // console.log('   Typography:', appliedTemplate.customization.typography);
    //   // console.log('   Layout:', appliedTemplate.customization.layout);
    //   // console.log('   Has colors.muted:', !!appliedTemplate.customization.colors?.muted);
    //   // console.log('   Colors.muted value:', appliedTemplate.customization.colors?.muted);
    // } else {
    //   console.log('⚠️ [CSSApplicator] No customization data received');
    // }

    try {
      // Generate and apply CSS variables
      const cssVariables = this.generateCSSVariables(appliedTemplate.template, appliedTemplate.customization);
      this.applyCSSVariables(cssVariables);

      // Generate and apply template-specific styles
      const customStyles = this.generateTemplateStyles(appliedTemplate.template, appliedTemplate.customization);
      this.applyCustomStyles(customStyles);

      
      // Store applied template for reference
      this.appliedTemplate = appliedTemplate;

      console.log('✅ [CSSApplicator] Successfully applied template styles and layouts');

    } catch (error) {
      console.error('❌ [CSSApplicator] Failed to apply template styles:', error);
      throw error;
    }
  }

  /**
   * Generate CSS variables from template and customization
   */
  static generateCSSVariables(
    template: TemplateConfig, 
    customization: TemplateCustomization | null
  ): CSSVariableMap {
    
    // Base colors from template or customization with comprehensive fallbacks
    const colors = {
      primary: customization?.colors?.primary || template.colors.primary || '#1E40AF',
      secondary: customization?.colors?.secondary || template.colors.secondary || '#475569',
      accent: customization?.colors?.accent || template.colors.accent || '#06B6D4',
      background: customization?.colors?.background || template.colors.background || '#FFFFFF',
      text: customization?.colors?.text || template.colors.text || '#1E293B',
      // Always ensure muted has a fallback since it's often missing from saved customizations
      muted: customization?.colors?.muted || template.colors.muted || '#94a3b8'
    };

    // Typography from template or customization with comprehensive fallbacks
    const typography = {
      fontFamily: customization?.typography?.fontFamily || template.typography?.headingFont || 'Inter, system-ui, sans-serif',
      fontSize: customization?.typography?.fontSize || 16,
      lineHeight: customization?.typography?.lineHeight || 1.6,
      fontWeight: customization?.typography?.fontWeight || 'normal',
      // Always ensure headingWeight has a fallback since it's often missing from saved customizations
      headingWeight: customization?.typography?.headingWeight || 'semibold'
    };

    // Layout from customization with comprehensive fallbacks
    const layout = {
      spacing: customization?.layout?.spacing || 18,
      borderRadius: customization?.layout?.borderRadius || 12,
      // Always ensure these layout properties have fallbacks since they're often missing from saved customizations
      sectionSpacing: customization?.layout?.sectionSpacing || 2.5,
      cardPadding: customization?.layout?.cardPadding || 1.8,
      density: customization?.layout?.density || 'standard',
      style: customization?.layout?.style || 'two-column',
      showBorders: customization?.layout?.showBorders ?? false
    };

    // Calculate density multiplier
    const densityMultiplier = this.getDensityMultiplier(layout.density || 'standard');

    const cssVariables: CSSVariableMap = {
      // Colors
      '--template-primary-color': colors.primary,
      '--template-secondary-color': colors.secondary,
      '--template-accent-color': colors.accent,
      '--template-background-color': colors.background,
      '--text-slate-700': colors.text,
      '--template-muted-color': colors.muted,

      // Typography
      '--template-font-family': typography.fontFamily,
      '--template-font-size': `${typography.fontSize}px`,
      '--template-line-height': typography.lineHeight.toString(),
      '--template-font-weight': this.getFontWeightValue(typography.fontWeight),
      '--template-heading-weight': this.getFontWeightValue(typography.headingWeight || 'semibold'),

      // Layout
      '--template-spacing': `${layout.spacing}px`,
      '--template-border-radius': `${layout.borderRadius}px`,
      '--template-section-spacing': `${(layout.sectionSpacing || 2) * densityMultiplier}rem`,
      '--template-card-padding': `${(layout.cardPadding || 1.5) * densityMultiplier}rem`,
      '--template-density-multiplier': densityMultiplier.toString()
    };

    console.log('🎨 [CSSApplicator] Generated CSS variables:', cssVariables);
    
    // Log the source data used for generation
    console.log('📊 [CSSApplicator] Variable generation source data:', {
      'colors from customization': customization?.colors,
      'typography from customization': customization?.typography,
      'layout from customization': customization?.layout,
      'template colors fallback': template.colors,
      'template typography fallback': template.typography
    });
    
    return cssVariables;
  }

  /**
   * Apply CSS variables to the document
   */
  private static applyCSSVariables(cssVariables: CSSVariableMap): void {
    const root = document.documentElement;
    
    console.log('🔧 [CSSApplicator] Starting to apply CSS variables to DOM...');
    console.log('   Variables to apply:', cssVariables);
    
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
      console.log(`   ✅ Set ${property}: ${value}`);
    });

    // Apply to template container - try multiple selectors
    const applyToContainer = () => {
      // Try multiple possible container selectors
      const selectors = [
        '#resume-template-container',
        '.enhanced-tech-template',
        '.template-container',
        '[class*="template"]'
      ];
      
      let templateContainer: HTMLElement | null = null;
      let foundSelector = '';
      
      for (const selector of selectors) {
        templateContainer = document.querySelector(selector) as HTMLElement;
        if (templateContainer) {
          foundSelector = selector;
          break;
        }
      }
      
      if (templateContainer) {
        console.log(`📎 [CSSApplicator] Found template container with selector: ${foundSelector}`);
        Object.entries(cssVariables).forEach(([property, value]) => {
          templateContainer!.style.setProperty(property, value);
        });
        console.log('✅ [CSSApplicator] Applied CSS variables to template container');
        return true;
      } else {
        console.log('⚠️ [CSSApplicator] No template container found with any of these selectors:', selectors);
        return false;
      }
    };
    
    // Try immediately
    if (!applyToContainer()) {
      // If not found, retry after a short delay (DOM might not be ready)
      console.log('🔄 [CSSApplicator] Retrying container application in 100ms...');
      setTimeout(() => {
        if (!applyToContainer()) {
          console.log('🔄 [CSSApplicator] Final retry in 500ms...');
          setTimeout(applyToContainer, 500);
        }
      }, 100);
    }

    console.log('✅ [CSSApplicator] Completed applying CSS variables to DOM');
  }

  /**
   * Generate template-specific CSS styles
   */
  private static generateTemplateStyles(
    template: TemplateConfig, 
    customization: TemplateCustomization | null
  ): string {

    const layout = customization?.layout;
    const colors = customization?.colors;

    return `
      /* ==============================================
         UNIFIED TEMPLATE SYSTEM STYLES
         ============================================== */
      
      /* Base template container */
      #resume-template-container {
        font-family: var(--template-font-family);
        color: var(--text-slate-700);
        background-color: var(--template-background-color);
        font-size: var(--template-font-size);
        line-height: var(--template-line-height);
      }
      
      /* Heading styles */
      #resume-template-container h1,
      #resume-template-container h2,
      #resume-template-container h3,
      #resume-template-container h4,
      #resume-template-container h5,
      #resume-template-container h6 {
        font-family: var(--template-font-family);
        font-weight: var(--template-heading-weight);
      }

      /* ==============================================
         TEMPLATE COLOR UTILITY CLASSES
         ============================================== */
      
      /* Text colors */
      .template-primary-text,
      #resume-template-container .text-blue-600,
      #resume-template-container .text-blue-500,
      #resume-template-container .text-primary { 
        color: var(--template-primary-color); 
      }
      
      .template-secondary-text,
      #resume-template-container .text-gray-600,
      #resume-template-container .text-gray-500,
      #resume-template-container .text-secondary { 
        color: var(--template-secondary-color); 
      }
      
      .template-accent-text,
      #resume-template-container .text-green-400,
      #resume-template-container .text-green-500,
      #resume-template-container .text-accent { 
        color: var(--template-accent-color); 
      }
      
      .template-text { 
        color: var(--text-slate-700); 
      }
      
      /* Background colors */
      .template-bg { 
        background-color: var(--template-background-color); 
      }
      
      .template-primary-bg,
      #resume-template-container .bg-blue-600,
      #resume-template-container .bg-blue-500,
      #resume-template-container .bg-primary { 
        background-color: var(--template-primary-color); 
      }
      
      .template-secondary-bg { 
        background-color: var(--template-secondary-color); 
      }
      
      .template-accent-bg,
      #resume-template-container .bg-green-400,
      #resume-template-container .bg-green-500,
      #resume-template-container .bg-accent { 
        background-color: var(--template-accent-color); 
      }
      
      /* Border colors */
      .template-primary-border,
      #resume-template-container .border-blue-600,
      #resume-template-container .border-blue-500,
      #resume-template-container .border-primary { 
        border-color: var(--template-primary-color); 
      }
      
      .template-accent-border,
      #resume-template-container .border-green-400,
      #resume-template-container .border-green-500,
      #resume-template-container .border-accent { 
        border-color: var(--template-accent-color); 
      }

      /* ==============================================
         LAYOUT CONTROLS
         ============================================== */
      
      ${layout?.style === 'single-column' ? this.generateSingleColumnCSS() : ''}
      ${layout?.style === 'two-column' ? this.generateTwoColumnCSS() : ''}
      ${layout?.style === 'sidebar' ? this.generateSidebarCSS(layout) : ''}

      /* ==============================================
         ENHANCED TECHNOLOGY TEMPLATE SPECIFIC
         ============================================== */
      
      /* Enhanced Technology Template color overrides */
      .enhanced-tech-template .hfi-tier-1 h1,
      .enhanced-tech-template .hfi-tier-1 .template-name-title,
      .enhanced-tech-template .hfi-tier-1 h1.template-name-title {
        color: var(--template-primary-color);
        font-family: var(--template-font-family);
        font-weight: var(--template-heading-weight);
      }
      
      .enhanced-tech-template .hfi-tier-1 p,
      .enhanced-tech-template .hfi-tier-1 .template-job-title,
      .enhanced-tech-template .hfi-tier-1 p.template-job-title {
        color: var(--template-accent-color);
        font-family: var(--template-font-family);
        font-weight: var(--template-font-weight);
      }
      
      .enhanced-tech-template .hfi-tier-1 h3 {
        color: var(--template-accent-color);
        font-family: var(--template-font-family);
        font-weight: var(--template-heading-weight);
      }
      
      /* Force typography variables in header */
      .enhanced-tech-template .hfi-tier-1 * {
        font-family: var(--template-font-family);
      }
      
      /* Contact information styling - using CSS variables */
      .enhanced-tech-template .hfi-tier-1 a,
      .enhanced-tech-template .hfi-tier-1 a span,
      .enhanced-tech-template .hfi-tier-1 a svg {
        color: var(--template-background-color);
        opacity: 0.8;
        text-decoration: none;
        font-family: var(--template-font-family);
      }
      
      .enhanced-tech-template .hfi-tier-1 a:hover,
      .enhanced-tech-template .hfi-tier-1 a:hover span,
      .enhanced-tech-template .hfi-tier-1 a:hover svg {
        opacity: 1;
      }

      /* ==============================================
         PROGRESSIVE ENHANCEMENTS
         ============================================== */
      
      /* Progress bars and skill indicators */
      #resume-template-container .bg-gradient-to-r {
        background: linear-gradient(to right, var(--template-primary-color), var(--template-accent-color)) !important;
      }
      
      /* Section spacing */
      #resume-template-container .section {
        margin-bottom: var(--template-spacing) !important;
        border-radius: var(--template-border-radius) !important;
        padding: var(--template-spacing) !important;
      }

      /* ==============================================
         RESPONSIVE DESIGN
         ============================================== */
      
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
  }

  /**
   * Generate single column layout CSS
   */
  private static generateSingleColumnCSS(): string {
    return `
      /* Single Column Layout */
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
        display: block !important;
        grid-template-columns: none !important;
      }
      
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div {
        grid-column: unset !important;
        width: 100% !important;
        margin-bottom: var(--template-spacing) !important;
        order: unset !important;
      }
    `;
  }

  /**
   * Generate two column layout CSS
   */
  private static generateTwoColumnCSS(): string {
    return `
      /* Two Column Layout */
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        gap: var(--template-spacing) !important;
      }
      
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:first-child {
        grid-column: 1 !important;
        order: 1 !important;
      }
      
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:last-child {
        grid-column: 2 !important;
        order: 2 !important;
      }
    `;
  }

  /**
   * Generate sidebar layout CSS
   */
  private static generateSidebarCSS(layout: any): string {
    const showBorders = layout.showBorders || false;
    
    return `
      /* Sidebar Layout */
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 {
        display: grid !important;
        grid-template-columns: 380px 1fr !important;
        gap: calc(var(--template-spacing) * 1.5) !important;
      }
      
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:first-child {
        grid-column: 1 !important;
        order: 1 !important;
        background: linear-gradient(135deg, rgba(100, 116, 139, 0.1), rgba(100, 116, 139, 0.05)) !important;
        padding: var(--template-spacing) !important;
        border-radius: var(--template-border-radius) !important;
        ${showBorders ? 'border: 1px solid rgba(100, 116, 139, 0.3) !important;' : ''}
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
      }
      
      #resume-template-container main .grid.grid-cols-1.lg\\:grid-cols-3 > div:last-child {
        grid-column: 2 !important;
        order: 2 !important;
      }
    `;
  }

  /**
   * Apply custom styles to the document
   */
  private static applyCustomStyles(styles: string): void {
    let styleElement = document.getElementById(this.STYLE_ID) as HTMLStyleElement;
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = this.STYLE_ID;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = styles;
    console.log('✅ [CSSApplicator] Applied custom styles to document');
  }

  /**
   * Get font weight numeric value from string
   */
  private static getFontWeightValue(weight: string): string {
    const weights: Record<string, string> = {
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700',
      'extrabold': '800',
      'black': '900'
    };
    
    return weights[weight] || '400';
  }

  /**
   * Get density multiplier from density setting
   */
  private static getDensityMultiplier(density: string): number {
    const multipliers: Record<string, number> = {
      'compact': 0.75,
      'standard': 1.0,
      'spacious': 1.5
    };
    
    return multipliers[density] || 1.0;
  }

  /**
   * Clear all applied styles (useful for cleanup)
   */
  static clear(): void {
    const styleElement = document.getElementById(this.STYLE_ID);
    if (styleElement) {
      styleElement.remove();
    }

    // Clear CSS variables from root
    const root = document.documentElement;
    const cssVarKeys = [
      '--template-primary-color',
      '--template-secondary-color', 
      '--template-accent-color',
      '--template-background-color',
      '--text-slate-700',
      '--template-muted-color',
      '--template-font-family',
      '--template-font-size',
      '--template-line-height',
      '--template-font-weight',
      '--template-heading-weight',
      '--template-spacing',
      '--template-border-radius',
      '--template-section-spacing',
      '--template-card-padding',
      '--template-density-multiplier'
    ];

    cssVarKeys.forEach(key => {
      root.style.removeProperty(key);
    });

    this.appliedTemplate = null;
    console.log('✅ [CSSApplicator] Cleared all template styles');
  }

  /**
   * Get currently applied template
   */
  static getAppliedTemplate(): AppliedTemplate | null {
    return this.appliedTemplate;
  }
}
