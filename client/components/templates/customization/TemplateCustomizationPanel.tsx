import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Settings, 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RefreshCw, 
  Download,
  X,
  ChevronRight,
  Sparkles
} from 'lucide-react';

import { ColorSchemeCustomizer, ColorScheme } from './ColorSchemeCustomizer';
import { TypographyCustomizer, TypographyLayoutConfig } from './TypographyCustomizer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTypographyLayout } from '@/hooks/useTypographyLayout';

export interface TemplateCustomizationPanelProps {
  templateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (customization: TemplateCustomization) => void;
  onPreview: (customization: TemplateCustomization) => void;
  onExport: (customization: TemplateCustomization) => void;
  className?: string;
}

export interface TemplateCustomization {
  id: string;
  name: string;
  templateId: string;
  colorScheme: ColorScheme;
  typographyLayout: TypographyLayoutConfig;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Comprehensive template customization panel that combines color scheme and typography customization
 * with live preview, validation, and export capabilities
 */
export const TemplateCustomizationPanel: React.FC<TemplateCustomizationPanelProps> = ({
  templateId,
  isOpen,
  onClose,
  onSave,
  onPreview,
  onExport,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [customizationName, setCustomizationName] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Color scheme management
  const {
    currentScheme,
    setColorScheme,
    saveScheme,
    previewScheme,
    validateScheme,
    generateDarkVariant,
    isDarkMode,
    toggleDarkMode,
    isLoading: colorLoading,
    error: colorError
  } = useColorScheme({
    templateId,
    persistToStorage: true,
    autoApply: false // We'll handle preview manually
  });

  // Typography and layout management
  const {
    currentConfig,
    setConfig,
    saveConfig,
    previewConfig,
    validateConfig,
    generateResponsiveCSS,
    isLoading: typographyLoading,
    error: typographyError
  } = useTypographyLayout({
    templateId,
    persistToStorage: true,
    autoApply: false // We'll handle preview manually
  });

  // Track changes for unsaved indicator
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [currentScheme, currentConfig]);

  // Handle color scheme changes
  const handleColorSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    if (isPreviewMode) {
      handlePreview();
    }
  };

  // Handle color scheme preview
  const handleColorSchemePreview = (scheme: ColorScheme) => {
    previewScheme(scheme);
    onPreview({
      id: `preview-${Date.now()}`,
      name: 'Preview',
      templateId,
      colorScheme: scheme,
      typographyLayout: currentConfig,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  // Handle typography config changes
  const handleTypographyConfigChange = (config: TypographyLayoutConfig) => {
    setConfig(config);
    if (isPreviewMode) {
      handlePreview();
    }
  };

  // Handle typography config preview
  const handleTypographyConfigPreview = (config: TypographyLayoutConfig) => {
    previewConfig(config);
    onPreview({
      id: `preview-${Date.now()}`,
      name: 'Preview',
      templateId,
      colorScheme: currentScheme,
      typographyLayout: config,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  // Handle combined preview
  const handlePreview = () => {
    previewScheme(currentScheme);
    previewConfig(currentConfig);
    
    onPreview({
      id: `preview-${Date.now()}`,
      name: 'Preview',
      templateId,
      colorScheme: currentScheme,
      typographyLayout: currentConfig,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  };

  // Handle save
  const handleSave = async () => {
    try {
      // Validate both configurations
      const colorValidation = validateScheme(currentScheme);
      const typographyValidation = validateConfig(currentConfig);

      if (!colorValidation.isValid || !typographyValidation.isValid) {
        const issues = [...colorValidation.issues, ...typographyValidation.issues];
        throw new Error(`Validation failed: ${issues.join(', ')}`);
      }

      // Save individual configurations
      await saveScheme(currentScheme);
      await saveConfig(currentConfig);

      // Create combined customization
      const customization: TemplateCustomization = {
        id: `custom-${templateId}-${Date.now()}`,
        name: customizationName || `Custom ${templateId} Theme`,
        templateId,
        colorScheme: currentScheme,
        typographyLayout: currentConfig,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onSave(customization);
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Failed to save customization:', error);
      // You might want to show a toast notification here
    }
  };

  // Handle export
  const handleExport = () => {
    const customization: TemplateCustomization = {
      id: `export-${templateId}-${Date.now()}`,
      name: customizationName || `Exported ${templateId} Theme`,
      templateId,
      colorScheme: currentScheme,
      typographyLayout: currentConfig,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onExport(customization);
  };

  // Handle reset
  const handleReset = () => {
    // Reset to defaults would be handled by the individual hooks
    setHasUnsavedChanges(false);
    setCustomizationName('');
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    const newPreviewMode = !isPreviewMode;
    setIsPreviewMode(newPreviewMode);
    
    if (newPreviewMode) {
      handlePreview();
    }
  };

  // Get validation status
  const getValidationStatus = () => {
    const colorValidation = validateScheme(currentScheme);
    const typographyValidation = validateConfig(currentConfig);
    
    const allIssues = [...colorValidation.issues, ...typographyValidation.issues];
    
    return {
      isValid: colorValidation.isValid && typographyValidation.isValid,
      issues: allIssues,
      colorValid: colorValidation.isValid,
      typographyValid: typographyValidation.isValid
    };
  };

  const validation = getValidationStatus();

  if (!isOpen) return null;

  return (
    <div className={`template-customization-panel fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-50 overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:from-blue-900 rounded-lg">
            <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Customize Template</h2>
            {hasUnsavedChanges && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1">
            <Label htmlFor="preview-mode" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Live Preview
            </Label>
            <Switch
              id="preview-mode"
              checked={isPreviewMode}
              onCheckedChange={togglePreviewMode}
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      {!validation.isValid && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="p-1 bg-amber-100 dark:bg-amber-900/40 rounded">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                {validation.issues.length} issue{validation.issues.length !== 1 ? 's' : ''} to fix
              </p>
              <ul className="mt-1.5 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                {validation.issues.slice(0, 1).map((issue, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <span className="text-amber-500">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
                {validation.issues.length > 1 && (
                  <li className="text-amber-600 dark:text-amber-400 font-medium">
                    +{validation.issues.length - 1} more
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4 mb-0 bg-gray-100 dark:bg-gray-800 p-1">
            <TabsTrigger value="colors" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Palette className="w-4 h-4" />
              <span className="font-medium">Colors</span>
              {!validation.colorValid && (
                <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm">
              <Type className="w-4 h-4" />
              <span className="font-medium">Typography</span>
              {!validation.typographyValid && (
                <Badge variant="destructive" className="w-2 h-2 p-0 rounded-full" />
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-hide">
            <TabsContent value="colors" className="mt-0 space-y-4">
              <ColorSchemeCustomizer
                currentScheme={currentScheme}
                onSchemeChange={handleColorSchemeChange}
                onPreview={handleColorSchemePreview}
                onSave={async (scheme) => {
                  await saveScheme(scheme);
                  setHasUnsavedChanges(false);
                }}
              />
            </TabsContent>

            <TabsContent value="typography" className="mt-0 space-y-4">
              <TypographyCustomizer
                currentConfig={currentConfig}
                onConfigChange={handleTypographyConfigChange}
                onPreview={handleTypographyConfigPreview}
                onSave={async (config) => {
                  await saveConfig(config);
                  setHasUnsavedChanges(false);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Footer Toolbar - Compact Icon-based Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left side - Action icons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 w-8 p-0"
              title="Reset to defaults"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreview}
              className="h-8 w-8 p-0"
              title="Preview changes"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="h-8 w-8 p-0"
              disabled={!validation.isValid}
              title="Export theme"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Right side - Save button */}
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
            disabled={!validation.isValid || (!hasUnsavedChanges && !customizationName)}
            title="Save theme"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save
          </Button>
        </div>

        {/* Status bar */}
        {(colorLoading || typographyLoading || !validation.isValid) && (
          <div className="px-4 py-1.5 text-xs text-center border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
            {colorLoading || typographyLoading ? (
              <span className="text-gray-500 dark:text-gray-400">Loading...</span>
            ) : !validation.isValid ? (
              <span className="text-amber-600 dark:text-amber-400">
                {validation.issues.length} issue{validation.issues.length !== 1 ? 's' : ''} to fix
              </span>
            ) : (
              <span className="text-green-600 dark:text-green-400 font-medium">
                Ready • {validation.colorValid ? '✓' : '✗'} Colors • {validation.typographyValid ? '✓' : '✗'} Typography
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateCustomizationPanel;