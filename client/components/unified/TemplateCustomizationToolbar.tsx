import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Palette, Type, Layout, RotateCcw, Save, Eye } from 'lucide-react';
import { TemplateState } from '../../../shared/types/template.types';
import { TemplateCustomization } from '../../../shared/types/customization.types';

// Color presets for quick customization
const COLOR_PRESETS = [
  { name: 'Trust & Professional', colors: { primary: '#2563EB', secondary: '#1E293B', accent: '#22C55E', muted: '#64748b' } },
  { name: 'Modern Minimal', colors: { primary: '#0D9488', secondary: '#334155', accent: '#EAB308', muted: '#64748b' } },
  { name: 'Creative Energy', colors: { primary: '#7C3AED', secondary: '#1F2937', accent: '#F97316', muted: '#6b7280' } },
  { name: 'Calm & Growth', colors: { primary: '#16A34A', secondary: '#065F46', accent: '#F59E0B', muted: '#6b7280' } },
  { name: 'Premium Professional', colors: { primary: '#1E3A8A', secondary: '#111827', accent: '#FACC15', muted: '#6b7280' } },
  { name: 'Tech Dark', colors: { primary: '#06b6d4', secondary: '#64748b', accent: '#f59e0b', muted: '#94a3b8' } }
];

// Typography presets for professional combinations
const TYPOGRAPHY_PRESETS = [
  { name: 'Modern Sans', headingFont: 'Inter', bodyFont: 'Inter', description: 'Clean and professional' },
  { name: 'Classic Serif', headingFont: 'Georgia', bodyFont: 'Georgia', description: 'Traditional and elegant' },
  { name: 'Professional Mix', headingFont: 'Poppins', bodyFont: 'Open Sans', description: 'Friendly yet professional' },
  { name: 'Tech Forward', headingFont: 'Roboto', bodyFont: 'Roboto', description: 'Modern and readable' },
  { name: 'Creative Blend', headingFont: 'Playfair Display', bodyFont: 'Open Sans', description: 'Creative with readability' }
];

// Simple layout presets for basic customization
const LAYOUT_PRESETS = [
  { name: 'Modern', style: 'modern', spacing: 'normal', showBorders: false, description: 'Clean and professional' },
  { name: 'Classic', style: 'classic', spacing: 'normal', showBorders: true, description: 'Traditional with borders' },
  { name: 'Minimal', style: 'minimal', spacing: 'relaxed', showBorders: false, description: 'Clean and spacious' },
  { name: 'Compact', style: 'modern', spacing: 'compact', showBorders: true, description: 'Information dense' }
];

interface TemplateCustomizationToolbarProps {
  isOpen: boolean;
  onToggle: () => void;
  templateState: TemplateState;
  currentCustomization: TemplateCustomization;
  onPreview: (customization: TemplateCustomization) => void;
  onSave: (customization: TemplateCustomization) => void;
}

export const TemplateCustomizationToolbar: React.FC<TemplateCustomizationToolbarProps> = ({
  isOpen,
  onToggle,
  templateState,
  currentCustomization,
  onPreview,
  onSave
}) => {
  const [localCustomization, setLocalCustomization] = useState<TemplateCustomization>(currentCustomization);
  const [activeTab, setActiveTab] = useState('colors');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Sync local customization with props
  useEffect(() => {
    console.log('🔄 [Toolbar] Syncing with currentCustomization:', {
      currentCustomization,
      typography: currentCustomization?.typography,
      fontFamily: currentCustomization?.typography?.fontFamily
    });
    setLocalCustomization(currentCustomization);
  }, [currentCustomization]);

  // Real-time preview on changes
  useEffect(() => {
    if (isPreviewMode) {
      onPreview(localCustomization);
    }
  }, [localCustomization, isPreviewMode, onPreview]);

  const handleColorChange = (colorType: string, value: string) => {
    const updatedCustomization = {
      ...localCustomization,
      colors: {
        ...localCustomization.colors,
        [colorType]: value
      }
    };
    setLocalCustomization(updatedCustomization);
    
    // Auto-preview on color changes
    onPreview(updatedCustomization);
  };

  const handleTypographyChange = (field: string, value: any) => {
    let updatedTypography = { ...localCustomization.typography };
    
    // Handle font family changes for both heading and body
    if (field === 'headingFont' || field === 'bodyFont') {
      // Update both headingFont and bodyFont, and set the unified fontFamily
      updatedTypography[field] = value;
      
      // Set fontFamily to the full font stack with fallbacks
      if (value === 'Inter') {
        updatedTypography.fontFamily = 'Inter, system-ui, sans-serif';
      } else if (value === 'Georgia') {
        updatedTypography.fontFamily = 'Georgia, "Times New Roman", Times, serif';
      } else if (value === 'Roboto') {
        updatedTypography.fontFamily = 'Roboto, system-ui, sans-serif';
      } else if (value === 'Open Sans') {
        updatedTypography.fontFamily = '"Open Sans", system-ui, sans-serif';
      } else if (value === 'Poppins') {
        updatedTypography.fontFamily = 'Poppins, system-ui, sans-serif';
      } else if (value === 'Lato') {
        updatedTypography.fontFamily = 'Lato, system-ui, sans-serif';
      } else if (value === 'Playfair Display') {
        updatedTypography.fontFamily = '"Playfair Display", Georgia, serif';
      } else {
        updatedTypography.fontFamily = `${value}, system-ui, sans-serif`;
      }
    } else {
      updatedTypography[field] = value;
    }
    
    const updatedCustomization = {
      ...localCustomization,
      typography: updatedTypography
    };
    
    console.log('🔤 [Toolbar] Typography change:', {
      field,
      value,
      updatedTypography,
      fontFamily: updatedTypography.fontFamily
    });
    
    setLocalCustomization(updatedCustomization);
    
    // Auto-preview on typography changes
    onPreview(updatedCustomization);
  };

  const handleLayoutChange = (field: string, value: any) => {
    let updatedCustomization = { ...localCustomization };
    
    // Handle nested section properties
    if (field.startsWith('sections.')) {
      const sectionField = field.split('.')[1];
      updatedCustomization = {
        ...localCustomization,
        sections: {
          ...localCustomization.sections,
          [sectionField]: value
        }
      };
    } else {
      // Handle regular layout fields
      updatedCustomization = {
        ...localCustomization,
        layout: {
          ...localCustomization.layout,
          [field]: value
        }
      };
    }
    
    console.log('🏛️ [Toolbar] Layout change:', {
      field,
      value,
      updatedLayout: updatedCustomization.layout,
      updatedSections: updatedCustomization.sections
    });
    
    setLocalCustomization(updatedCustomization);
    
    // Auto-preview on layout changes
    onPreview(updatedCustomization);
  };

  const handlePresetApply = (preset: typeof COLOR_PRESETS[0]) => {
    const updatedCustomization = {
      ...localCustomization,
      colors: {
        ...localCustomization.colors,
        ...preset.colors
      }
    };
    setLocalCustomization(updatedCustomization);
    onPreview(updatedCustomization);
  };

  const handleTypographyPresetApply = (preset: typeof TYPOGRAPHY_PRESETS[0]) => {
    // Create the proper font family string with fallbacks
    let fontFamily = '';
    if (preset.headingFont === 'Inter') {
      fontFamily = 'Inter, system-ui, sans-serif';
    } else if (preset.headingFont === 'Georgia') {
      fontFamily = 'Georgia, "Times New Roman", Times, serif';
    } else if (preset.headingFont === 'Roboto') {
      fontFamily = 'Roboto, system-ui, sans-serif';
    } else if (preset.headingFont === 'Open Sans') {
      fontFamily = '"Open Sans", system-ui, sans-serif';
    } else if (preset.headingFont === 'Poppins') {
      fontFamily = 'Poppins, system-ui, sans-serif';
    } else if (preset.headingFont === 'Lato') {
      fontFamily = 'Lato, system-ui, sans-serif';
    } else if (preset.headingFont === 'Playfair Display') {
      fontFamily = '"Playfair Display", Georgia, serif';
    } else {
      fontFamily = `${preset.headingFont}, system-ui, sans-serif`;
    }
    
    const updatedCustomization = {
      ...localCustomization,
      typography: {
        ...localCustomization.typography,
        headingFont: preset.headingFont,
        bodyFont: preset.bodyFont,
        fontFamily: fontFamily  // This is what CSSApplicator looks for
      }
    };
    
    console.log('📋 [Toolbar] Typography preset applied:', {
      presetName: preset.name,
      headingFont: preset.headingFont,
      bodyFont: preset.bodyFont,
      fontFamily,
      fullTypography: updatedCustomization.typography
    });
    
    setLocalCustomization(updatedCustomization);
    onPreview(updatedCustomization);
  };

  const handleLayoutPresetApply = (preset: typeof LAYOUT_PRESETS[0]) => {
    const updatedCustomization = {
      ...localCustomization,
      layout: {
        ...localCustomization.layout,
        style: preset.style,
        spacing: preset.spacing,
        showBorders: preset.showBorders
      }
    };
    
    console.log('🎨 [Toolbar] Layout preset applied:', {
      presetName: preset.name,
      style: preset.style,
      spacing: preset.spacing,
      showBorders: preset.showBorders
    });
    
    setLocalCustomization(updatedCustomization);
    onPreview(updatedCustomization);
  };

  const handleReset = () => {
    // Reset to default template customization
    const defaultCustomization = templateState.customization;
    setLocalCustomization(defaultCustomization);
    onPreview(defaultCustomization);
  };

  const handleSave = () => {
    onSave(localCustomization);
    setIsPreviewMode(false);
  };

  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
    if (!isPreviewMode) {
      onPreview(localCustomization);
    }
  };

  return (
    <>
      {/* Toolbar Toggle Button */}
      <div 
        className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ease-in-out ${
          isOpen ? 'right-96' : 'right-0'
        }`}
      >
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="rounded-l-lg rounded-r-none border-r-0 bg-white shadow-xl hover:bg-gray-50 hover:shadow-2xl transition-all duration-200 hover:scale-105"
        >
          {isOpen ? 
            <ChevronRight className="h-4 w-4 transition-transform duration-200" /> : 
            <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
          }
        </Button>
      </div>

      {/* Right-Side Toolbar */}
      <div 
        className={`fixed top-0 right-0 h-full w-96 max-w-[90vw] sm:w-96 bg-white border-l border-gray-200 shadow-2xl z-40 transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Customize Template</h2>
            </div>
            {isPreviewMode && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Eye className="h-3 w-3 mr-1" />
                Live Preview
              </Badge>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Customization Name */}
              <div className="space-y-2">
                <Label htmlFor="customization-name">Customization Name</Label>
                <Input
                  id="customization-name"
                  value={localCustomization.name || ''}
                  onChange={(e) => setLocalCustomization({
                    ...localCustomization,
                    name: e.target.value
                  })}
                  placeholder="Enter customization name..."
                  className="w-full"
                />
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors">
                    <Palette className="h-4 w-4 mr-1" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="typography">
                    <Type className="h-4 w-4 mr-1" />
                    Fonts
                  </TabsTrigger>
                  <TabsTrigger value="layout">
                    <Layout className="h-4 w-4 mr-1" />
                    Layout
                  </TabsTrigger>
                </TabsList>

                {/* Colors Tab */}
                <TabsContent value="colors" className="space-y-4 mt-4">
                  {/* Color Presets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Presets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        {COLOR_PRESETS.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handlePresetApply(preset)}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex gap-1">
                                <div 
                                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: preset.colors.primary }}
                                />
                                <div 
                                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: preset.colors.secondary }}
                                />
                                <div 
                                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: preset.colors.accent }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {preset.name}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Color Palette */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custom Colors</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Primary</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localCustomization.colors?.primary || '#3b82f6'}
                              onChange={(e) => handleColorChange('primary', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform duration-200"
                            />
                            <Input
                              value={localCustomization.colors?.primary || '#3b82f6'}
                              onChange={(e) => handleColorChange('primary', e.target.value)}
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Secondary</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localCustomization.colors?.secondary || '#64748b'}
                              onChange={(e) => handleColorChange('secondary', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform duration-200"
                            />
                            <Input
                              value={localCustomization.colors?.secondary || '#64748b'}
                              onChange={(e) => handleColorChange('secondary', e.target.value)}
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Accent</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localCustomization.colors?.accent || '#f59e0b'}
                              onChange={(e) => handleColorChange('accent', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform duration-200"
                            />
                            <Input
                              value={localCustomization.colors?.accent || '#f59e0b'}
                              onChange={(e) => handleColorChange('accent', e.target.value)}
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Muted</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={localCustomization.colors?.muted || '#94a3b8'}
                              onChange={(e) => handleColorChange('muted', e.target.value)}
                              className="w-8 h-8 rounded border cursor-pointer hover:scale-110 transition-transform duration-200"
                            />
                            <Input
                              value={localCustomization.colors?.muted || '#94a3b8'}
                              onChange={(e) => handleColorChange('muted', e.target.value)}
                              className="flex-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Typography Tab */}
                <TabsContent value="typography" className="space-y-4 mt-4">
                  {/* Typography Presets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Typography Presets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        {TYPOGRAPHY_PRESETS.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handleTypographyPresetApply(preset)}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200 group text-left"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-700">
                                {preset.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {preset.description}
                              </span>
                              <div className="text-xs text-gray-400">
                                Heading: {preset.headingFont} • Body: {preset.bodyFont}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Typography */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custom Typography</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Heading Font</Label>
                        <select
                          value={localCustomization.typography?.headingFont || 'Inter'}
                          onChange={(e) => handleTypographyChange('headingFont', e.target.value)}
                          className="w-full p-2 border rounded-md hover:border-blue-400 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Body Font</Label>
                        <select
                          value={localCustomization.typography?.bodyFont || 'Inter'}
                          onChange={(e) => handleTypographyChange('bodyFont', e.target.value)}
                          className="w-full p-2 border rounded-md hover:border-blue-400 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Inter">Inter</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Open Sans">Open Sans</option>
                          <option value="Lato">Lato</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size Scale: {localCustomization.typography?.fontSize || 16}px</Label>
                        <Slider
                          value={[localCustomization.typography?.fontSize || 16]}
                          onValueChange={(value) => handleTypographyChange('fontSize', value[0])}
                          min={12}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Line Height: {localCustomization.typography?.lineHeight || 1.5}</Label>
                        <Slider
                          value={[localCustomization.typography?.lineHeight || 1.5]}
                          onValueChange={(value) => handleTypographyChange('lineHeight', value[0])}
                          min={1.2}
                          max={2.0}
                          step={0.1}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Layout Tab */}
                <TabsContent value="layout" className="space-y-4 mt-4">
                  {/* Layout Presets */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Layout Presets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 gap-2">
                        {LAYOUT_PRESETS.map((preset, index) => (
                          <button
                            key={index}
                            onClick={() => handleLayoutPresetApply(preset)}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200 group text-left"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-gray-700">
                                {preset.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {preset.description}
                              </span>
                              <div className="text-xs text-gray-400">
                                {preset.preview || `${preset.style} • ${preset.spacing} spacing`}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Layout */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Custom Layout</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Layout Style</Label>
                        <select
                          value={localCustomization.layout?.style || 'modern'}
                          onChange={(e) => handleLayoutChange('style', e.target.value)}
                          className="w-full p-2 border rounded-md hover:border-blue-400 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="modern">Modern Sidebar</option>
                          <option value="classic">Classic Two-Column</option>
                          <option value="stacked">Stacked (Single Column)</option>
                          <option value="wide-sidebar">Wide Sidebar</option>
                          <option value="minimal">Minimal Clean</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Spacing: {localCustomization.layout?.spacing || 'normal'}</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={localCustomization.layout?.spacing === 'compact' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleLayoutChange('spacing', 'compact')}
                            className="w-full text-xs"
                          >
                            Compact
                          </Button>
                          <Button
                            variant={localCustomization.layout?.spacing === 'normal' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleLayoutChange('spacing', 'normal')}
                            className="w-full text-xs"
                          >
                            Normal
                          </Button>
                          <Button
                            variant={localCustomization.layout?.spacing === 'relaxed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleLayoutChange('spacing', 'relaxed')}
                            className="w-full text-xs"
                          >
                            Relaxed
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Show Borders</Label>
                          <Button
                            variant={localCustomization.layout?.showBorders ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleLayoutChange('showBorders', !localCustomization.layout?.showBorders)}
                          >
                            {localCustomization.layout?.showBorders ? 'On' : 'Off'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Section Visibility</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Profile Image</span>
                            <Button
                              variant={localCustomization.sections?.showProfileImage !== false ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleLayoutChange('sections.showProfileImage', !(localCustomization.sections?.showProfileImage !== false))}
                              className="h-6 px-2 text-xs"
                            >
                              {localCustomization.sections?.showProfileImage !== false ? 'Show' : 'Hide'}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Skill Progress Bars</span>
                            <Button
                              variant={localCustomization.sections?.showSkillBars !== false ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleLayoutChange('sections.showSkillBars', !(localCustomization.sections?.showSkillBars !== false))}
                              className="h-6 px-2 text-xs"
                            >
                              {localCustomization.sections?.showSkillBars !== false ? 'Show' : 'Hide'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreviewMode}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                {isPreviewMode ? 'Exit Preview' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={!localCustomization.name?.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Customization
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300 animate-in fade-in"
          onClick={onToggle}
        />
      )}
    </>
  );
};
