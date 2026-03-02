/**
 * React hook for template customization with real-time preview updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TemplateConfig, 
  ColorScheme, 
  FontCombination, 
  LayoutOption, 
  SectionCustomization 
} from '../services/templateService';
import { 
  templateCustomizationEngine, 
  CustomizationData, 
  CustomTemplateConfig,
  TemplatePreviewUpdate 
} from '../services/templateCustomizationEngine';

export interface UseTemplateCustomizationOptions {
  templateId: string;
  baseTemplate: TemplateConfig;
  userId?: string;
  enableRealTimePreview?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseTemplateCustomizationReturn {
  // Current customization state
  customization: CustomizationData | null;
  customizedTemplate: TemplateConfig;
  
  // Available options
  colorSchemes: ColorScheme[];
  fontCombinations: FontCombination[];
  layoutOptions: LayoutOption[];
  
  // Customization actions
  applyColorScheme: (colorScheme: ColorScheme) => void;
  applyFontCombination: (fontCombination: FontCombination) => void;
  applyLayoutOption: (layoutOption: LayoutOption) => void;
  applySectionCustomizations: (sectionCustomizations: SectionCustomization[]) => void;
  applyCustomColors: (colors: Partial<ColorScheme['colors']>) => void;
  applyCustomFonts: (fonts: Partial<FontCombination['typography']>) => void;
  
  // Template management
  saveCustomization: () => Promise<string | null>;
  loadCustomization: (customizationId: string) => Promise<boolean>;
  resetCustomization: () => void;
  deleteCustomization: (customizationId: string) => Promise<boolean>;
  
  // Preview management
  updatePreview: (previewData?: any) => void;
  
  // State
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  validationErrors: string[];
}

export function useTemplateCustomization({
  templateId,
  baseTemplate,
  userId,
  enableRealTimePreview = true,
  autoSave = false,
  autoSaveDelay = 2000
}: UseTemplateCustomizationOptions): UseTemplateCustomizationReturn {
  
  const [customization, setCustomization] = useState<CustomizationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get available customization options
  const { colorSchemes, fontCombinations, layoutOptions } = useMemo(() => 
    templateCustomizationEngine.getDefaultCustomizationOptions(baseTemplate),
    [baseTemplate]
  );

  // Create customized template
  const customizedTemplate = useMemo(() => {
    if (!customization) return baseTemplate;
    return templateCustomizationEngine.applyAllCustomizations(baseTemplate, customization);
  }, [baseTemplate, customization]);

  // Initialize customization data
  useEffect(() => {
    if (!customization) {
      setCustomization({
        templateId,
        lastModified: new Date()
      });
    }
  }, [templateId, customization]);

  // Setup real-time preview callback
  useEffect(() => {
    if (enableRealTimePreview) {
      const handlePreviewUpdate = (update: TemplatePreviewUpdate) => {
        // Handle preview updates if needed
        console.log('Preview update:', update);
      };

      templateCustomizationEngine.registerPreviewCallback(templateId, handlePreviewUpdate);
      
      return () => {
        templateCustomizationEngine.unregisterPreviewCallback(templateId);
      };
    }
  }, [templateId, enableRealTimePreview]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && userId && customization) {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }

      const timeout = setTimeout(async () => {
        await saveCustomization();
      }, autoSaveDelay);

      setAutoSaveTimeout(timeout);

      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [autoSave, hasUnsavedChanges, userId, customization, autoSaveDelay]);

  // Update customization helper
  const updateCustomization = useCallback((updates: Partial<CustomizationData>) => {
    setCustomization(prev => {
      if (!prev) return null;
      
      const updated = {
        ...prev,
        ...updates,
        lastModified: new Date()
      };

      // Validate the updated customization
      const validation = templateCustomizationEngine.validateCustomization(updated);
      setValidationErrors(validation.errors);

      return updated;
    });
    
    setHasUnsavedChanges(true);
  }, []);

  // Apply color scheme
  const applyColorScheme = useCallback((colorScheme: ColorScheme) => {
    updateCustomization({ colorScheme });
    
    if (enableRealTimePreview) {
      templateCustomizationEngine.updatePreview(templateId, { colorScheme });
    }
  }, [templateId, enableRealTimePreview, updateCustomization]);

  // Apply font combination
  const applyFontCombination = useCallback((fontCombination: FontCombination) => {
    updateCustomization({ fontCombination });
    
    if (enableRealTimePreview) {
      templateCustomizationEngine.updatePreview(templateId, { fontCombination });
    }
  }, [templateId, enableRealTimePreview, updateCustomization]);

  // Apply layout option
  const applyLayoutOption = useCallback((layoutOption: LayoutOption) => {
    updateCustomization({ layoutOption });
    
    if (enableRealTimePreview) {
      templateCustomizationEngine.updatePreview(templateId, { layoutOption });
    }
  }, [templateId, enableRealTimePreview, updateCustomization]);

  // Apply section customizations
  const applySectionCustomizations = useCallback((sectionCustomizations: SectionCustomization[]) => {
    updateCustomization({ sectionCustomizations });
    
    if (enableRealTimePreview) {
      templateCustomizationEngine.updatePreview(templateId, { sectionCustomizations });
    }
  }, [templateId, enableRealTimePreview, updateCustomization]);

  // Apply custom colors
  const applyCustomColors = useCallback((colors: Partial<ColorScheme['colors']>) => {
    updateCustomization({ customColors: colors });
    
    if (enableRealTimePreview) {
      templateCustomizationEngine.updatePreview(templateId, { customColors: colors });
    }
  }, [templateId, enableRealTimePreview, updateCustomization]);

  // Apply custom fonts
  const applyCustomFonts = useCallback((fonts: Partial<FontCombination['typography']>) => {
    updateCustomization({ customFonts: fonts });
    
    if (enableRealTimePreview) {
      templateCustomizationEngine.updatePreview(templateId, { customFonts: fonts });
    }
  }, [templateId, enableRealTimePreview, updateCustomization]);

  // Save customization
  const saveCustomization = useCallback(async (): Promise<string | null> => {
    if (!userId || !customization) return null;

    setIsSaving(true);
    try {
      const customizationId = templateCustomizationEngine.saveCustomization(
        userId, 
        templateId, 
        customization
      );
      setHasUnsavedChanges(false);
      return customizationId;
    } catch (error) {
      console.error('Failed to save customization:', error);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [userId, templateId, customization]);

  // Load customization
  const loadCustomization = useCallback(async (customizationId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const loadedCustomization = templateCustomizationEngine.loadCustomization(customizationId);
      if (loadedCustomization) {
        setCustomization(loadedCustomization);
        setHasUnsavedChanges(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to load customization:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset customization
  const resetCustomization = useCallback(() => {
    setCustomization({
      templateId,
      lastModified: new Date()
    });
    setHasUnsavedChanges(false);
    setValidationErrors([]);
  }, [templateId]);

  // Delete customization
  const deleteCustomization = useCallback(async (customizationId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      return templateCustomizationEngine.deleteCustomization(userId, customizationId);
    } catch (error) {
      console.error('Failed to delete customization:', error);
      return false;
    }
  }, [userId]);

  // Update preview
  const updatePreview = useCallback((previewData?: any) => {
    if (enableRealTimePreview && customization) {
      templateCustomizationEngine.updatePreview(templateId, customization, previewData);
    }
  }, [templateId, enableRealTimePreview, customization]);

  return {
    // Current state
    customization,
    customizedTemplate,
    
    // Available options
    colorSchemes,
    fontCombinations,
    layoutOptions,
    
    // Customization actions
    applyColorScheme,
    applyFontCombination,
    applyLayoutOption,
    applySectionCustomizations,
    applyCustomColors,
    applyCustomFonts,
    
    // Template management
    saveCustomization,
    loadCustomization,
    resetCustomization,
    deleteCustomization,
    
    // Preview management
    updatePreview,
    
    // State
    isLoading,
    isSaving,
    hasUnsavedChanges,
    validationErrors
  };
}