/**
 * Template Customizer Component
 * Provides a streamlined interface for customizing template appearance using TemplateCustomizationService
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Palette,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';
import { TemplateConfig } from '@/services/templateService';
import { TemplateCustomizationService } from '@/services/templateCustomizationService';
// Dynamic import types for templateCustomizationService
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

type CreateCustomizationRequest = {
  name: string;
  colors: any;
  typography: any;
  layout: any;
  sections: any;
  isDefault?: boolean;
};

interface TemplateCustomizerProps {
  template: string;
  showPreview: boolean;
  templateConfig: TemplateConfig;
  initialCustomization?: TemplateCustomization;
  onCustomizationChange?: (customization: TemplateCustomization) => void;
  onSave?: (customization: TemplateCustomization) => void;
  onPreview?: (customization: TemplateCustomization) => void;
  onApply?: (customization: TemplateCustomization) => void;
  compact?: boolean;
}

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  templateConfig,
  initialCustomization,
  onCustomizationChange,
  onSave,
  onPreview,
  onApply,
  compact = false
}) => {
  const [customization, setCustomization] = useState<TemplateCustomization>(() => {
    if (initialCustomization) {
      return initialCustomization;
    }

    // Create a temporary customization with defaults for immediate use
    return {
      id: -1, // Temporary ID
      templateId: templateConfig.id,
      name: `${templateConfig.name} Custom`,
      colors: {},
      typography: {},
      layout: {},
      sections: {},
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });

  const [activeTab, setActiveTab] = useState('colors');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onCustomizationChange?.(customization);
  }, [customization, onCustomizationChange]);

  const updateCustomization = (updates: Partial<TemplateCustomization>) => {
    const updated = {
      ...customization,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setCustomization(updated);
    setHasUnsavedChanges(true);
    setError(null);
  };

  const updateColors = (colorUpdates: Partial<TemplateCustomization['colors']>) => {
    updateCustomization({
      colors: { ...customization.colors, ...colorUpdates }
    });
  };

  const updateTypography = (typographyUpdates: Partial<TemplateCustomization['typography']>) => {
    updateCustomization({
      typography: { ...customization.typography, ...typographyUpdates }
    });
  };

  const updateLayout = (layoutUpdates: Partial<TemplateCustomization['layout']>) => {
    updateCustomization({
      layout: { ...customization.layout, ...layoutUpdates }
    });
  };

  const updateSections = (sectionUpdates: Partial<TemplateCustomization['sections']>) => {
    updateCustomization({
      sections: { ...customization.sections, ...sectionUpdates }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let savedCustomization: TemplateCustomization;

      if (customization.id === -1) {
        // Create new customization
        savedCustomization = await TemplateCustomizationService.createCustomization(
          customization.templateId,
          {
            name: customization.name,
            colors: customization.colors,
            typography: customization.typography,
            layout: customization.layout,
            sections: customization.sections,
            isDefault: false
          }
        );
      } else {
        // Update existing customization
        savedCustomization = await TemplateCustomizationService.updateCustomization(
          customization.id,
          {
            name: customization.name,
            colors: customization.colors,
            typography: customization.typography,
            layout: customization.layout,
            sections: customization.sections
          }
        );
      }

      setCustomization(savedCustomization);
      setHasUnsavedChanges(false);
      onSave?.(savedCustomization);
    } catch (error) {
      console.error('Failed to save customization:', error);
      setError(error instanceof Error ? error.message : 'Failed to save customization');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    onPreview?.(customization);
  };

  const handleApply = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let appliedCustomization: TemplateCustomization;

      if (customization.id === -1) {
        // Create new customization
        appliedCustomization = await TemplateCustomizationService.createCustomization(
          customization.templateId,
          {
            name: customization.name,
            colors: customization.colors,
            typography: customization.typography,
            layout: customization.layout,
            sections: customization.sections,
            isDefault: true // Set as default when applying
          }
        );
      } else {
        // Update existing customization
        appliedCustomization = await TemplateCustomizationService.updateCustomization(
          customization.id,
          {
            name: customization.name,
            colors: customization.colors,
            typography: customization.typography,
            layout: customization.layout,
            sections: customization.sections,
            isDefault: true // Set as default when applying
          }
        );
      }

      setCustomization(appliedCustomization);
      setHasUnsavedChanges(false);
      onApply?.(appliedCustomization);
    } catch (error) {
      console.error('Failed to apply customization:', error);
      setError(error instanceof Error ? error.message : 'Failed to apply customization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    const { TemplateCustomizationService } = await import('@/services/templateCustomizationService');
    const reset = TemplateCustomizationService.createTemporaryCustomization(
      customization.templateId,
      {
        ...setCustomization,
        name: customization.name,
        templateId: customization.templateId
      }
    );
    setCustomization(reset);
    setHasUnsavedChanges(true);
    setError(null);
  };

  const applyColorPreset = (preset: { colors: TemplateCustomization['colors'] }) => {
    updateColors(preset.colors);
  };

  const [colorPresets, setColorPresets] = useState<any[]>([]);

  useEffect(() => {
    const loadColorPresets = async () => {
      try {
        const { TemplateCustomizationService } = await import('@/services/templateCustomizationService');
        const presets = TemplateCustomizationService.getColorPresets();
        setColorPresets(presets);
      } catch (error) {
        console.error('Failed to load color presets:', error);
        setColorPresets([]);
      }
    };
    loadColorPresets();
  }, []);

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Quick Customize</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {colorPresets.slice(0, 4).map((preset, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 flex flex-col items-start"
              onClick={() => applyColorPreset(preset)}
            >
              <div className="flex gap-1 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: preset.colors.primary }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: preset.colors.secondary }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: preset.colors.accent }}
                />
              </div>
              <span className="text-xs font-medium">{preset.name}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Customize Template
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Personalize the appearance of {templateConfig.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            {onPreview && (
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {onApply && (
              <Button
                size="sm"
                onClick={handleApply}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Apply
              </Button>
            )}
            {onSave && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </div>
        {hasUnsavedChanges && (
          <Badge variant="secondary" className="w-fit">
            Unsaved changes
          </Badge>
        )}
        {error && (
          <Badge variant="destructive" className="w-fit">
            {error}
          </Badge>
        )}
        {isLoading && (
          <Badge variant="outline" className="w-fit">
            Saving...
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Color Presets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {colorPresets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 flex flex-col items-start"
                    onClick={() => applyColorPreset(preset)}
                  >
                    <div className="flex gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.colors.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.colors.secondary }}
                      />
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.colors.accent }}
                      />
                    </div>
                    <span className="text-sm font-medium">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={customization.colors.primary}
                    onChange={(e) => updateColors({ primary: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={customization.colors.primary}
                    onChange={(e) => updateColors({ primary: e.target.value })}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={customization.colors.secondary}
                    onChange={(e) => updateColors({ secondary: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={customization.colors.secondary}
                    onChange={(e) => updateColors({ secondary: e.target.value })}
                    placeholder="#64748B"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="accent-color">Accent Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="accent-color"
                    type="color"
                    value={customization.colors.accent}
                    onChange={(e) => updateColors({ accent: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={customization.colors.accent}
                    onChange={(e) => updateColors({ accent: e.target.value })}
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="background-color"
                    type="color"
                    value={customization.colors.background}
                    onChange={(e) => updateColors({ background: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={customization.colors.background}
                    onChange={(e) => updateColors({ background: e.target.value })}
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="typography" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="font-family">Font Family</Label>
                <Select
                  value={customization.typography.fontFamily}
                  onValueChange={(value) => updateTypography({ fontFamily: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans Pro'].map((font) => (
                      <SelectItem key={font} value={font}>
                        <span style={{ fontFamily: font }}>{font}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="font-weight">Font Weight</Label>
                <Select
                  value={customization.typography.fontWeight}
                  onValueChange={(value: any) => updateTypography({ fontWeight: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="semibold">Semi Bold</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="font-size">Font Size: {customization.typography.fontSize}px</Label>
                <Slider
                  id="font-size"
                  min={12}
                  max={18}
                  step={1}
                  value={[customization.typography.fontSize]}
                  onValueChange={([value]) => updateTypography({ fontSize: value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="line-height">Line Height: {customization.typography.lineHeight}</Label>
                <Slider
                  id="line-height"
                  min={1.2}
                  max={2.0}
                  step={0.1}
                  value={[customization.typography.lineHeight]}
                  onValueChange={([value]) => updateTypography({ lineHeight: value })}
                  className="mt-2"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <div>
              <Label htmlFor="layout">Layout Style</Label>
              <Select
                value={customization.layout.style}
                onValueChange={(value: any) => updateLayout({ style: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single-column">Single Column</SelectItem>
                  <SelectItem value="two-column">Two Column</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="spacing">Spacing: {customization.layout.spacing}px</Label>
                <Slider
                  id="spacing"
                  min={8}
                  max={32}
                  step={2}
                  value={[customization.layout.spacing]}
                  onValueChange={([value]) => updateLayout({ spacing: value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="border-radius">Border Radius: {customization.layout.borderRadius}px</Label>
                <Slider
                  id="border-radius"
                  min={0}
                  max={16}
                  step={2}
                  value={[customization.layout.borderRadius]}
                  onValueChange={([value]) => updateLayout({ borderRadius: value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-borders"
                checked={customization.layout.showBorders}
                onCheckedChange={(checked) => updateLayout({ showBorders: checked })}
              />
              <Label htmlFor="show-borders">Show section borders</Label>
            </div>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-profile-image"
                  checked={customization.sections.showProfileImage}
                  onCheckedChange={(checked) => updateSections({ showProfileImage: checked })}
                />
                <Label htmlFor="show-profile-image">Show profile image</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-skill-bars"
                  checked={customization.sections.showSkillBars}
                  onCheckedChange={(checked) => updateSections({ showSkillBars: checked })}
                />
                <Label htmlFor="show-skill-bars">Show skill progress bars</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-ratings"
                  checked={customization.sections.showRatings}
                  onCheckedChange={(checked) => updateSections({ showRatings: checked })}
                />
                <Label htmlFor="show-ratings">Show skill ratings</Label>
              </div>
            </div>

            <div>
              <Label>Section Order</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Drag to reorder sections (feature coming soon)
              </p>
              <div className="space-y-2">
                {customization.sections.order.map((section, index) => (
                  <div
                    key={section}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span className="capitalize">{section}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" disabled>
                        ↑
                      </Button>
                      <Button variant="ghost" size="sm" disabled>
                        ↓
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TemplateCustomizer;