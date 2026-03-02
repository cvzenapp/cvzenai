/**
 * Unified Template Customization Modal
 * Modern, comprehensive customization interface for the unified template system
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  X, 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  Save, 
  RefreshCw, 
  Download,
  Sparkles,
  ChevronRight,
  Check
} from 'lucide-react';

import { TemplateState } from '@/services/templates/types';
import { TemplateCustomization } from '@/services/templateCustomizationService';

interface TemplateCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateState: TemplateState;
  currentCustomization?: TemplateCustomization | null;
  onPreview: (customization: TemplateCustomization) => void;
  onSave: (customization: TemplateCustomization) => void;
  onApply?: (customization: TemplateCustomization) => void;
}

interface ColorCustomization {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
}

interface TypographyCustomization {
  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: string;
  headingWeight: string;
}

interface LayoutCustomization {
  style: 'single-column' | 'two-column' | 'sidebar';
  spacing: string;
  borderRadius: string;
  showBorders: boolean;
  density: number;
}

const DEFAULT_COLORS: ColorCustomization = {
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#10b981',
  background: '#ffffff',
  text: '#1e293b',
  muted: '#94a3b8'
};

const DEFAULT_TYPOGRAPHY: TypographyCustomization = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '14px',
  lineHeight: '1.5',
  fontWeight: '400',
  headingWeight: '600'
};

const DEFAULT_LAYOUT: LayoutCustomization = {
  style: 'sidebar',
  spacing: '24px',
  borderRadius: '8px',
  showBorders: true,
  density: 1.0
};

const COLOR_PRESETS = [
  { name: 'Trust & Professional', colors: { primary: '#2563EB', secondary: '#1E293B', accent: '#22C55E', background: '#F8FAFC', text: '#1E293B', muted: '#64748b' } },
  { name: 'Modern Minimal', colors: { primary: '#0D9488', secondary: '#334155', accent: '#EAB308', background: '#F1F5F9', text: '#334155', muted: '#64748b' } },
  { name: 'Creative Energy', colors: { primary: '#7C3AED', secondary: '#1F2937', accent: '#F97316', background: '#FAFAFA', text: '#1F2937', muted: '#6b7280' } },
  { name: 'Calm & Growth', colors: { primary: '#16A34A', secondary: '#065F46', accent: '#F59E0B', background: '#F9FAFB', text: '#065F46', muted: '#6b7280' } },
  { name: 'Premium Professional', colors: { primary: '#1E3A8A', secondary: '#111827', accent: '#FACC15', background: '#F3F4F6', text: '#111827', muted: '#6b7280' } },
  { name: 'Tech Dark', colors: { primary: '#06b6d4', secondary: '#64748b', accent: '#f59e0b', background: '#0f172a', text: '#a1a1aa', muted: '#94a3b8' } }
];

const FONT_FAMILIES = [
  'Inter, system-ui, sans-serif',
  'Georgia, serif',
  'Arial, sans-serif',
  'Times New Roman, serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Playfair Display, serif',
  'Source Code Pro, monospace'
];

/**
 * Convert numeric font weight to enum value expected by server
 */
const convertFontWeight = (weight: string): 'normal' | 'medium' | 'semibold' | 'bold' => {
  const numericWeight = parseInt(weight);
  if (numericWeight <= 300) return 'normal';
  if (numericWeight <= 400) return 'normal';
  if (numericWeight <= 500) return 'medium';
  if (numericWeight <= 600) return 'semibold';
  return 'bold';
};

/**
 * Convert enum font weight to numeric value for UI
 */
const convertToNumericWeight = (weight: 'normal' | 'medium' | 'semibold' | 'bold'): string => {
  switch (weight) {
    case 'normal': return '400';
    case 'medium': return '500';
    case 'semibold': return '600';
    case 'bold': return '700';
    default: return '400';
  }
};

export const TemplateCustomizationModal: React.FC<TemplateCustomizationModalProps> = ({
  isOpen,
  onClose,
  templateState,
  currentCustomization,
  onPreview,
  onSave,
  onApply
}) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [customizationName, setCustomizationName] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Customization state
  const [colors, setColors] = useState<ColorCustomization>(DEFAULT_COLORS);
  const [typography, setTypography] = useState<TypographyCustomization>(DEFAULT_TYPOGRAPHY);
  const [layout, setLayout] = useState<LayoutCustomization>(DEFAULT_LAYOUT);

  // Initialize customization from current state
  useEffect(() => {
    if (currentCustomization) {
      setCustomizationName(currentCustomization.name || '');
      
      if (currentCustomization.colors) {
        setColors({
          primary: currentCustomization.colors.primary || DEFAULT_COLORS.primary,
          secondary: currentCustomization.colors.secondary || DEFAULT_COLORS.secondary,
          accent: currentCustomization.colors.accent || DEFAULT_COLORS.accent,
          background: currentCustomization.colors.background || DEFAULT_COLORS.background,
          text: currentCustomization.colors.text || DEFAULT_COLORS.text,
          muted: currentCustomization.colors.muted || DEFAULT_COLORS.muted,
        });
      }
      
      if (currentCustomization.fonts) {
        setTypography({
          fontFamily: currentCustomization.fonts.heading || DEFAULT_TYPOGRAPHY.fontFamily,
          fontSize: currentCustomization.fonts.size || DEFAULT_TYPOGRAPHY.fontSize,
          lineHeight: DEFAULT_TYPOGRAPHY.lineHeight,
          fontWeight: DEFAULT_TYPOGRAPHY.fontWeight,
          headingWeight: DEFAULT_TYPOGRAPHY.headingWeight
        });
      }
      
      // Handle typography from server (with enum font weights)
      if (currentCustomization.typography) {
        setTypography({
          fontFamily: currentCustomization.typography.fontFamily || DEFAULT_TYPOGRAPHY.fontFamily,
          fontSize: `${currentCustomization.typography.fontSize || 14}px`,
          lineHeight: (currentCustomization.typography.lineHeight || 1.5).toString(),
          fontWeight: convertToNumericWeight(currentCustomization.typography.fontWeight || 'normal'),
          headingWeight: convertToNumericWeight(currentCustomization.typography.headingWeight || 'semibold')
        });
      }
      
      if (currentCustomization.layout) {
        setLayout({
          style: currentCustomization.layout.style || DEFAULT_LAYOUT.style,
          spacing: currentCustomization.spacing?.section ? `${currentCustomization.spacing.section}px` : DEFAULT_LAYOUT.spacing,
          borderRadius: DEFAULT_LAYOUT.borderRadius,
          showBorders: currentCustomization.layout.showBorders ?? DEFAULT_LAYOUT.showBorders,
          density: DEFAULT_LAYOUT.density
        });
      }
    } else {
      // Use template defaults
      setCustomizationName(`${templateState.template.name} Custom`);
      setColors(DEFAULT_COLORS);
      setTypography(DEFAULT_TYPOGRAPHY);
      setLayout(DEFAULT_LAYOUT);
    }
  }, [currentCustomization, templateState]);

  // Build customization object
  const buildCustomization = useCallback((): TemplateCustomization => {
    const spacingValue = parseInt(layout.spacing.replace('px', '')) || 24;
    const borderRadiusValue = parseInt(layout.borderRadius.replace('px', '')) || 8;
    const fontSizeValue = parseInt(typography.fontSize.replace('px', '')) || 14;
    
    return {
      id: currentCustomization?.id || -1,
      name: customizationName || `${templateState.template.name} Custom`,
      templateId: templateState.template.id,
      colors: colors,
      // Typography - match exact structure from defaultCustomization
      typography: {
        fontFamily: typography.fontFamily,
        fontSize: fontSizeValue,
        lineHeight: parseFloat(typography.lineHeight) || 1.5,
        fontWeight: convertFontWeight(typography.fontWeight),
        fontSizeScale: 1.0,
        letterSpacing: -0.01,
        headingWeight: convertFontWeight(typography.headingWeight),
        bodyWeight: 'normal'
      },
      layout: {
        style: layout.style as any,
        showBorders: layout.showBorders,
        spacing: spacingValue,
        borderRadius: borderRadiusValue
      },
      // Server expects 'sections' field
      sections: {
        showProfileImage: true,
        showSkillBars: true,
        showRatings: true,
        order: ['summary', 'experience', 'education', 'skills', 'projects']
      },
      // Keep spacing for backward compatibility
      spacing: {
        section: spacingValue,
        element: Math.floor(spacingValue / 2)
      },
      isDefault: false,
      createdAt: currentCustomization?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [colors, typography, layout, customizationName, templateState, currentCustomization]);

  // Handle preview
  const handlePreview = useCallback(() => {
    const customization = buildCustomization();
    onPreview(customization);
    setIsPreviewMode(true);
    
    // Auto-turn off preview mode after 3 seconds
    setTimeout(() => setIsPreviewMode(false), 3000);
  }, [buildCustomization, onPreview]);

  // Handle save
  const handleSave = useCallback(() => {
    const customization = buildCustomization();
    
    console.log('💾 [CustomizationModal] Saving customization:', {
      name: customization.name,
      templateId: customization.templateId,
      colors: customization.colors,
      typography: customization.typography,
      layout: customization.layout,
      sections: customization.sections
    });
    
    onSave(customization);
    onClose();
  }, [buildCustomization, onSave, onClose]);

  // Handle apply (for builder mode)
  const handleApply = useCallback(() => {
    if (onApply) {
      const customization = buildCustomization();
      onApply(customization);
    }
  }, [buildCustomization, onApply]);

  // Color preset handler
  const handleColorPreset = useCallback((preset: typeof COLOR_PRESETS[0]) => {
    setColors(preset.colors);
    if (isPreviewMode) handlePreview();
  }, [isPreviewMode, handlePreview]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    setColors(DEFAULT_COLORS);
    setTypography(DEFAULT_TYPOGRAPHY);
    setLayout(DEFAULT_LAYOUT);
    setCustomizationName(`${templateState.template.name} Custom`);
  }, [templateState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                Customize Template
              </h2>
              <p className="text-sm text-slate-600">
                {templateState.template.name} • Personalize your resume appearance
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isPreviewMode && (
              <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                <Eye className="w-3 h-3 mr-1" />
                Previewing
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-80 border-r bg-slate-50 p-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="customization-name" className="text-sm font-medium text-slate-700">
                  Customization Name
                </Label>
                <Input
                  id="customization-name"
                  value={customizationName}
                  onChange={(e) => setCustomizationName(e.target.value)}
                  placeholder="Enter name for this customization"
                  className="mt-1"
                />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors" className="flex items-center space-x-1">
                    <Palette className="w-3 h-3" />
                    <span>Colors</span>
                  </TabsTrigger>
                  <TabsTrigger value="typography" className="flex items-center space-x-1">
                    <Type className="w-3 h-3" />
                    <span>Typography</span>
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="flex items-center space-x-1">
                    <Layout className="w-3 h-3" />
                    <span>Layout</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
                  {/* Colors Tab */}
                  <TabsContent value="colors" className="space-y-4 mt-0">
                    {/* Color Presets */}
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">
                        Quick Presets
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {COLOR_PRESETS.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="outline"
                            size="sm"
                            className="justify-start h-auto p-2"
                            onClick={() => handleColorPreset(preset)}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div 
                                  className="w-3 h-3 rounded-full border" 
                                  style={{ backgroundColor: preset.colors.primary }}
                                />
                                <div 
                                  className="w-3 h-3 rounded-full border" 
                                  style={{ backgroundColor: preset.colors.accent }}
                                />
                              </div>
                              <span className="text-xs">{preset.name}</span>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Individual Colors */}
                    <div className="space-y-3">
                      {Object.entries(colors).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-sm font-medium text-slate-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()} Color
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                              className="w-10 h-8 rounded border border-slate-300"
                            />
                            <Input
                              value={value}
                              onChange={(e) => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                              className="font-mono text-xs"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Typography Tab */}
                  <TabsContent value="typography" className="space-y-4 mt-0">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Font Family
                      </Label>
                      <select
                        value={typography.fontFamily}
                        onChange={(e) => setTypography(prev => ({ ...prev, fontFamily: e.target.value }))}
                        className="w-full mt-1 p-2 border border-slate-300 rounded text-sm"
                      >
                        {FONT_FAMILIES.map(font => (
                          <option key={font} value={font}>
                            {font.split(',')[0]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Font Size: {typography.fontSize}
                      </Label>
                      <Slider
                        value={[parseInt(typography.fontSize.replace('px', '')) || 14]}
                        onValueChange={([value]) => setTypography(prev => ({ ...prev, fontSize: `${value}px` }))}
                        min={10}
                        max={20}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  </TabsContent>

                  {/* Layout Tab */}
                  <TabsContent value="layout" className="space-y-4 mt-0">
                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Layout Style
                      </Label>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {[
                          { value: 'sidebar', label: 'Sidebar', desc: 'Traditional sidebar layout' },
                          { value: 'two-column', label: 'Two Column', desc: 'Equal width columns' },
                          { value: 'single-column', label: 'Single Column', desc: 'Stacked sections' }
                        ].map(option => (
                          <Button
                            key={option.value}
                            variant={layout.style === option.value ? "default" : "outline"}
                            size="sm"
                            className="justify-start h-auto p-3 text-left"
                            onClick={() => setLayout(prev => ({ ...prev, style: option.value as any }))}
                          >
                            <div>
                              <div className="font-medium text-sm">{option.label}</div>
                              <div className="text-xs text-slate-600">{option.desc}</div>
                            </div>
                            {layout.style === option.value && (
                              <Check className="w-4 h-4 ml-auto text-blue-600" />
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-slate-700">
                        Spacing: {layout.spacing}
                      </Label>
                      <Slider
                        value={[parseInt(layout.spacing.replace('px', '')) || 24]}
                        onValueChange={([value]) => setLayout(prev => ({ ...prev, spacing: `${value}px` }))}
                        min={12}
                        max={48}
                        step={4}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">
                        Show Borders
                      </Label>
                      <Switch
                        checked={layout.showBorders}
                        onCheckedChange={(checked) => setLayout(prev => ({ ...prev, showBorders: checked }))}
                      />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-6 bg-slate-100">
            <div className="h-full bg-white rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Eye className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="text-lg font-medium text-slate-600">
                  Live Preview
                </h3>
                <p className="text-sm text-slate-500">
                  Changes will be applied to your resume in real-time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            {onApply && (
              <Button variant="outline" onClick={handleApply}>
                Apply
              </Button>
            )}
            
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
