/**
 * Template Customization Engine
 * Handles real-time template customization including color schemes, fonts, and layouts
 */

import { TemplateConfig, ColorScheme, FontCombination, LayoutOption, SectionCustomization } from './templateService';

export interface CustomizationData {
  templateId: string;
  colorScheme?: ColorScheme;
  fontCombination?: FontCombination;
  layoutOption?: LayoutOption;
  sectionCustomizations?: SectionCustomization[];
  customColors?: Partial<ColorScheme['colors']>;
  customFonts?: Partial<FontCombination['typography']>;
  lastModified: Date;
}

export interface CustomTemplateConfig extends TemplateConfig {
  customizationId: string;
  baseTemplateId: string;
  customization: CustomizationData;
  isCustom: true;
}

export interface TemplatePreviewUpdate {
  templateId: string;
  customization: Partial<CustomizationData>;
  previewData?: any; // Resume data for preview
}

/**
 * Template Customization Engine
 * Provides methods for applying customizations to templates and managing user customizations
 */
export class TemplateCustomizationEngine {
  private customizations: Map<string, CustomizationData> = new Map();
  private previewCallbacks: Map<string, (update: TemplatePreviewUpdate) => void> = new Map();

  /**
   * Apply color scheme to a template configuration
   */
  applyColorScheme(template: TemplateConfig, colorScheme: ColorScheme): TemplateConfig {
    return {
      ...template,
      colors: {
        ...template.colors,
        ...colorScheme.colors
      }
    };
  }

  /**
   * Apply font combination to a template configuration
   */
  applyFontCombination(template: TemplateConfig, fontCombination: FontCombination): TemplateConfig {
    return {
      ...template,
      typography: {
        ...template.typography,
        ...fontCombination.typography
      }
    };
  }

  /**
   * Apply layout customization to a template configuration
   */
  customizeLayout(template: TemplateConfig, layoutOption: LayoutOption): TemplateConfig {
    return {
      ...template,
      layout: {
        ...template.layout,
        headerStyle: layoutOption.headerStyle as any,
        sidebarPosition: layoutOption.sidebarPosition,
        cardStyle: layoutOption.cardStyle as any
      }
    };
  }

  /**
   * Apply section customizations to a template configuration
   */
  applySectionCustomizations(template: TemplateConfig, sectionCustomizations: SectionCustomization[]): TemplateConfig {
    // Create a map of section customizations for easy lookup
    const customizationMap = new Map(
      sectionCustomizations.map(sc => [sc.sectionId, sc])
    );

    // Apply section visibility and ordering
    const visibleSections = sectionCustomizations
      .filter(sc => sc.isVisible)
      .sort((a, b) => a.order - b.order)
      .map(sc => sc.sectionId);

    return {
      ...template,
      layout: {
        ...template.layout,
        sectionPriority: visibleSections
      },
      sections: {
        ...template.sections,
        // Update required sections based on customizations
        required: template.sections.required.filter(section => 
          customizationMap.get(section)?.isVisible !== false
        ),
        // Update optional sections based on customizations
        optional: template.sections.optional.filter(section => 
          customizationMap.get(section)?.isVisible !== false
        )
      }
    };
  }

  /**
   * Apply all customizations to create a fully customized template
   */
  applyAllCustomizations(template: TemplateConfig, customization: CustomizationData): TemplateConfig {
    let customizedTemplate = { ...template };

    // Apply color scheme
    if (customization.colorScheme) {
      customizedTemplate = this.applyColorScheme(customizedTemplate, customization.colorScheme);
    }

    // Apply custom colors if provided
    if (customization.customColors) {
      customizedTemplate = {
        ...customizedTemplate,
        colors: {
          ...customizedTemplate.colors,
          ...customization.customColors
        }
      };
    }

    // Apply font combination
    if (customization.fontCombination) {
      customizedTemplate = this.applyFontCombination(customizedTemplate, customization.fontCombination);
    }

    // Apply custom fonts if provided
    if (customization.customFonts) {
      customizedTemplate = {
        ...customizedTemplate,
        typography: {
          ...customizedTemplate.typography,
          ...customization.customFonts
        }
      };
    }

    // Apply layout customization
    if (customization.layoutOption) {
      customizedTemplate = this.customizeLayout(customizedTemplate, customization.layoutOption);
    }

    // Apply section customizations
    if (customization.sectionCustomizations) {
      customizedTemplate = this.applySectionCustomizations(customizedTemplate, customization.sectionCustomizations);
    }

    return customizedTemplate;
  }

  /**
   * Create a custom template configuration from base template and customizations
   */
  createCustomTemplate(
    baseTemplate: TemplateConfig, 
    customization: CustomizationData,
    customizationId: string
  ): CustomTemplateConfig {
    const customizedTemplate = this.applyAllCustomizations(baseTemplate, customization);
    
    return {
      ...customizedTemplate,
      id: customizationId,
      name: `${baseTemplate.name} (Custom)`,
      customizationId,
      baseTemplateId: baseTemplate.id,
      customization,
      isCustom: true
    };
  }

  /**
   * Register a callback for real-time preview updates
   */
  registerPreviewCallback(templateId: string, callback: (update: TemplatePreviewUpdate) => void): void {
    this.previewCallbacks.set(templateId, callback);
  }

  /**
   * Unregister a preview callback
   */
  unregisterPreviewCallback(templateId: string): void {
    this.previewCallbacks.delete(templateId);
  }

  /**
   * Trigger real-time preview update
   */
  updatePreview(templateId: string, customization: Partial<CustomizationData>, previewData?: any): void {
    const callback = this.previewCallbacks.get(templateId);
    if (callback) {
      callback({
        templateId,
        customization,
        previewData
      });
    }
  }

  /**
   * Save customization data (in-memory for now, can be extended to persist to server)
   */
  saveCustomization(userId: string, templateId: string, customization: CustomizationData): string {
    const customizationId = `${userId}-${templateId}-${Date.now()}`;
    const customizationWithId = {
      ...customization,
      templateId,
      lastModified: new Date()
    };
    
    this.customizations.set(customizationId, customizationWithId);
    
    // Save to localStorage for persistence
    try {
      const userCustomizations = this.getUserCustomizations(userId);
      userCustomizations[customizationId] = customizationWithId;
      localStorage.setItem(`template-customizations-${userId}`, JSON.stringify(userCustomizations));
    } catch (error) {
      console.warn('Failed to save customization to localStorage:', error);
    }
    
    return customizationId;
  }

  /**
   * Load customization data
   */
  loadCustomization(customizationId: string): CustomizationData | null {
    return this.customizations.get(customizationId) || null;
  }

  /**
   * Get all customizations for a user
   */
  getUserCustomizations(userId: string): Record<string, CustomizationData> {
    try {
      const stored = localStorage.getItem(`template-customizations-${userId}`);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Failed to load customizations from localStorage:', error);
      return {};
    }
  }

  /**
   * Delete a customization
   */
  deleteCustomization(userId: string, customizationId: string): boolean {
    try {
      this.customizations.delete(customizationId);
      
      const userCustomizations = this.getUserCustomizations(userId);
      delete userCustomizations[customizationId];
      localStorage.setItem(`template-customizations-${userId}`, JSON.stringify(userCustomizations));
      
      return true;
    } catch (error) {
      console.warn('Failed to delete customization:', error);
      return false;
    }
  }

  /**
   * Load user customizations into memory
   */
  loadUserCustomizations(userId: string): void {
    const userCustomizations = this.getUserCustomizations(userId);
    Object.entries(userCustomizations).forEach(([id, customization]) => {
      this.customizations.set(id, customization);
    });
  }

  /**
   * Validate customization data
   */
  validateCustomization(customization: Partial<CustomizationData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate color scheme
    if (customization.colorScheme) {
      const requiredColorKeys = ['primary', 'secondary', 'accent', 'background', 'text', 'muted'];
      const missingColors = requiredColorKeys.filter(key => 
        !customization.colorScheme!.colors[key as keyof typeof customization.colorScheme.colors]
      );
      if (missingColors.length > 0) {
        errors.push(`Missing required colors: ${missingColors.join(', ')}`);
      }
    }

    // Validate font combination
    if (customization.fontCombination) {
      const requiredFontKeys = ['headingFont', 'bodyFont', 'codeFont'];
      const missingFonts = requiredFontKeys.filter(key => 
        !customization.fontCombination!.typography[key as keyof typeof customization.fontCombination.typography]
      );
      if (missingFonts.length > 0) {
        errors.push(`Missing required fonts: ${missingFonts.join(', ')}`);
      }
    }

    // Validate layout option
    if (customization.layoutOption) {
      const validSidebarPositions = ['left', 'right', 'none', 'split'];
      if (!validSidebarPositions.includes(customization.layoutOption.sidebarPosition)) {
        errors.push(`Invalid sidebar position: ${customization.layoutOption.sidebarPosition}`);
      }
    }

    // Validate section customizations
    if (customization.sectionCustomizations) {
      customization.sectionCustomizations.forEach((section, index) => {
        if (!section.sectionId) {
          errors.push(`Section customization ${index} missing sectionId`);
        }
        if (typeof section.order !== 'number' || section.order < 0) {
          errors.push(`Section customization ${index} has invalid order`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get default customization options for a template
   */
  getDefaultCustomizationOptions(template: TemplateConfig): {
    colorSchemes: ColorScheme[];
    fontCombinations: FontCombination[];
    layoutOptions: LayoutOption[];
  } {
    return {
      colorSchemes: this.getDefaultColorSchemes(),
      fontCombinations: this.getDefaultFontCombinations(),
      layoutOptions: this.getDefaultLayoutOptions()
    };
  }

  /**
   * Get default color schemes
   */
  private getDefaultColorSchemes(): ColorScheme[] {
    return [
      {
        id: 'professional-blue',
        name: 'Professional Blue',
        colors: {
          primary: '#1e40af',
          secondary: '#3730a3',
          accent: '#0ea5e9',
          background: '#ffffff',
          text: '#1f2937',
          muted: '#6b7280'
        }
      },
      {
        id: 'modern-green',
        name: 'Modern Green',
        colors: {
          primary: '#059669',
          secondary: '#047857',
          accent: '#10b981',
          background: '#ffffff',
          text: '#1f2937',
          muted: '#6b7280'
        }
      },
      {
        id: 'creative-purple',
        name: 'Creative Purple',
        colors: {
          primary: '#7c3aed',
          secondary: '#5b21b6',
          accent: '#a855f7',
          background: '#ffffff',
          text: '#1f2937',
          muted: '#6b7280'
        }
      },
      {
        id: 'executive-dark',
        name: 'Executive Dark',
        colors: {
          primary: '#1e293b',
          secondary: '#0f172a',
          accent: '#64748b',
          background: '#ffffff',
          text: '#0f172a',
          muted: '#64748b'
        }
      },
      {
        id: 'warm-orange',
        name: 'Warm Orange',
        colors: {
          primary: '#ea580c',
          secondary: '#c2410c',
          accent: '#f97316',
          background: '#ffffff',
          text: '#1f2937',
          muted: '#6b7280'
        }
      }
    ];
  }

  /**
   * Get default font combinations
   */
  private getDefaultFontCombinations(): FontCombination[] {
    return [
      {
        id: 'modern-sans',
        name: 'Modern Sans-Serif',
        typography: {
          headingFont: "'Inter', 'Segoe UI', sans-serif",
          bodyFont: "'Inter', 'Segoe UI', sans-serif",
          codeFont: "'JetBrains Mono', 'Courier New', monospace"
        }
      },
      {
        id: 'classic-serif',
        name: 'Classic Serif',
        typography: {
          headingFont: "'Merriweather', 'Times New Roman', serif",
          bodyFont: "'Crimson Text', 'Times New Roman', serif",
          codeFont: "'JetBrains Mono', 'Courier New', monospace"
        }
      },
      {
        id: 'tech-focused',
        name: 'Tech-Focused',
        typography: {
          headingFont: "'Roboto', 'Arial', sans-serif",
          bodyFont: "'Source Sans Pro', 'Arial', sans-serif",
          codeFont: "'Fira Code', 'Monaco', monospace"
        }
      },
      {
        id: 'creative-mix',
        name: 'Creative Mix',
        typography: {
          headingFont: "'Montserrat', 'Arial', sans-serif",
          bodyFont: "'Open Sans', 'Helvetica', sans-serif",
          codeFont: "'Source Code Pro', 'Consolas', monospace"
        }
      },
      {
        id: 'academic-formal',
        name: 'Academic Formal',
        typography: {
          headingFont: "'Crimson Text', 'Times New Roman', serif",
          bodyFont: "'Crimson Text', 'Times New Roman', serif",
          codeFont: "'JetBrains Mono', 'Courier New', monospace"
        }
      }
    ];
  }

  /**
   * Get default layout options
   */
  private getDefaultLayoutOptions(): LayoutOption[] {
    return [
      {
        id: 'sidebar-left',
        name: 'Left Sidebar',
        headerStyle: 'tech-focused',
        sidebarPosition: 'left',
        cardStyle: 'code-blocks'
      },
      {
        id: 'sidebar-right',
        name: 'Right Sidebar',
        headerStyle: 'executive-minimal',
        sidebarPosition: 'right',
        cardStyle: 'metrics-focused'
      },
      {
        id: 'no-sidebar',
        name: 'Full Width',
        headerStyle: 'academic-formal',
        sidebarPosition: 'none',
        cardStyle: 'publication-style'
      },
      {
        id: 'split-layout',
        name: 'Split Layout',
        headerStyle: 'portfolio-hero',
        sidebarPosition: 'split',
        cardStyle: 'portfolio-cards'
      }
    ];
  }
}

// Export singleton instance
export const templateCustomizationEngine = new TemplateCustomizationEngine();