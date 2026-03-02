import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Type, Layout, RefreshCw, Check, Eye } from 'lucide-react';

export interface TypographySettings {
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  fontSizeScale: number;
  lineHeight: number;
  letterSpacing: number;
  headingWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  bodyWeight: 'light' | 'normal' | 'medium';
}

export interface LayoutSettings {
  density: 'compact' | 'standard' | 'spacious';
  maxWidth: 'narrow' | 'standard' | 'wide';
  sectionSpacing: number;
  cardPadding: number;
  borderRadius: number;
}

export interface TypographyLayoutConfig {
  id: string;
  name: string;
  typography: TypographySettings;
  layout: LayoutSettings;
  isDefault?: boolean;
}

export interface TypographyCustomizerProps {
  currentConfig: TypographyLayoutConfig;
  onConfigChange: (config: TypographyLayoutConfig) => void;
  onPreview: (config: TypographyLayoutConfig) => void;
  onSave: (config: TypographyLayoutConfig) => void;
  className?: string;
}

// Web-safe font families with accessibility considerations
const FONT_FAMILIES = [
  {
    id: 'system',
    name: 'System Default',
    value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    category: 'System'
  },
  {
    id: 'inter',
    name: 'Inter',
    value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Modern'
  },
  {
    id: 'roboto',
    name: 'Roboto',
    value: '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Modern'
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    value: '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Modern'
  },
  {
    id: 'lato',
    name: 'Lato',
    value: '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Modern'
  },
  {
    id: 'source-sans',
    name: 'Source Sans Pro',
    value: '"Source Sans Pro", -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Professional'
  },
  {
    id: 'nunito',
    name: 'Nunito',
    value: '"Nunito", -apple-system, BlinkMacSystemFont, sans-serif',
    category: 'Friendly'
  },
  {
    id: 'georgia',
    name: 'Georgia',
    value: 'Georgia, "Times New Roman", Times, serif',
    category: 'Serif'
  },
  {
    id: 'times',
    name: 'Times New Roman',
    value: '"Times New Roman", Times, serif',
    category: 'Serif'
  },
  {
    id: 'arial',
    name: 'Arial',
    value: 'Arial, Helvetica, sans-serif',
    category: 'Classic'
  },
  {
    id: 'helvetica',
    name: 'Helvetica',
    value: 'Helvetica, Arial, sans-serif',
    category: 'Classic'
  }
];

// Predefined configurations
const PREDEFINED_CONFIGS: TypographyLayoutConfig[] = [
  {
    id: 'modern-standard',
    name: 'Modern Standard',
    typography: {
      fontFamily: 'inter',
      fontSize: 'medium',
      fontSizeScale: 1.0,
      lineHeight: 1.6,
      letterSpacing: 0,
      headingWeight: 'semibold',
      bodyWeight: 'normal'
    },
    layout: {
      density: 'standard',
      maxWidth: 'standard',
      sectionSpacing: 2,
      cardPadding: 1.5,
      borderRadius: 0.5
    },
    isDefault: true
  },
  {
    id: 'compact-professional',
    name: 'Compact Professional',
    typography: {
      fontFamily: 'system',
      fontSize: 'small',
      fontSizeScale: 0.9,
      lineHeight: 1.5,
      letterSpacing: 0,
      headingWeight: 'bold',
      bodyWeight: 'normal'
    },
    layout: {
      density: 'compact',
      maxWidth: 'narrow',
      sectionSpacing: 1,
      cardPadding: 1,
      borderRadius: 0.25
    }
  },
  {
    id: 'spacious-elegant',
    name: 'Spacious Elegant',
    typography: {
      fontFamily: 'georgia',
      fontSize: 'large',
      fontSizeScale: 1.1,
      lineHeight: 1.7,
      letterSpacing: 0.025,
      headingWeight: 'medium',
      bodyWeight: 'normal'
    },
    layout: {
      density: 'spacious',
      maxWidth: 'wide',
      sectionSpacing: 3,
      cardPadding: 2,
      borderRadius: 0.75
    }
  },
  {
    id: 'accessible-high-contrast',
    name: 'Accessible High Contrast',
    typography: {
      fontFamily: 'arial',
      fontSize: 'large',
      fontSizeScale: 1.2,
      lineHeight: 1.8,
      letterSpacing: 0.05,
      headingWeight: 'bold',
      bodyWeight: 'medium'
    },
    layout: {
      density: 'spacious',
      maxWidth: 'standard',
      sectionSpacing: 2.5,
      cardPadding: 2,
      borderRadius: 0
    }
  }
];

/**
 * Validate typography and layout settings for accessibility and readability
 */
function validateConfig(config: TypographyLayoutConfig): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Typography validation
  if (config.typography.fontSizeScale < 0.8) {
    issues.push('Font size is too small for accessibility standards');
  }
  
  if (config.typography.lineHeight < 1.4) {
    issues.push('Line height is too tight for comfortable reading');
  }
  
  if (config.typography.letterSpacing > 0.1) {
    issues.push('Letter spacing is too wide and may impact readability');
  }
  
  // Layout validation
  if (config.layout.sectionSpacing < 0.5) {
    issues.push('Section spacing is too tight');
  }
  
  if (config.layout.cardPadding < 0.5) {
    issues.push('Card padding is too small for touch targets');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

export const TypographyCustomizer: React.FC<TypographyCustomizerProps> = ({
  currentConfig,
  onConfigChange,
  onPreview,
  onSave,
  className = ''
}) => {
  const [selectedConfig, setSelectedConfig] = useState<TypographyLayoutConfig>(currentConfig);
  const [customTypography, setCustomTypography] = useState<TypographySettings>(currentConfig.typography);
  const [customLayout, setCustomLayout] = useState<LayoutSettings>(currentConfig.layout);
  const [validationResult, setValidationResult] = useState(validateConfig(currentConfig));
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Update validation when settings change
  useEffect(() => {
    const updatedConfig = {
      ...selectedConfig,
      typography: customTypography,
      layout: customLayout
    };
    const validation = validateConfig(updatedConfig);
    setValidationResult(validation);
    
    // Auto-preview changes
    onPreview(updatedConfig);
  }, [customTypography, customLayout, selectedConfig, onPreview]);

  const handlePredefinedConfigSelect = (config: TypographyLayoutConfig) => {
    setSelectedConfig(config);
    setCustomTypography(config.typography);
    setCustomLayout(config.layout);
    setIsCustomizing(false);
    onConfigChange(config);
  };

  const handleTypographyChange = <K extends keyof TypographySettings>(
    key: K,
    value: TypographySettings[K]
  ) => {
    const newTypography = { ...customTypography, [key]: value };
    setCustomTypography(newTypography);
    setIsCustomizing(true);
  };

  const handleLayoutChange = <K extends keyof LayoutSettings>(
    key: K,
    value: LayoutSettings[K]
  ) => {
    const newLayout = { ...customLayout, [key]: value };
    setCustomLayout(newLayout);
    setIsCustomizing(true);
  };

  const handleSave = () => {
    const finalConfig: TypographyLayoutConfig = {
      ...selectedConfig,
      id: isCustomizing ? `custom-${Date.now()}` : selectedConfig.id,
      name: isCustomizing ? 'Custom Configuration' : selectedConfig.name,
      typography: customTypography,
      layout: customLayout
    };
    
    onSave(finalConfig);
  };

  const handleReset = () => {
    setSelectedConfig(currentConfig);
    setCustomTypography(currentConfig.typography);
    setCustomLayout(currentConfig.layout);
    setIsCustomizing(false);
  };

  const getFontFamilyById = (id: string) => {
    return FONT_FAMILIES.find(f => f.id === id) || FONT_FAMILIES[0];
  };

  return (
    <div className={`typography-customizer space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Type className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Typography & Layout</h3>
      </div>

      {/* Validation Status */}
      <Card className={`border-l-4 ${validationResult.isValid ? 'border-l-green-500 bg-green-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validationResult.isValid ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Layout className="w-4 h-4 text-yellow-600" />
              )}
              <span className="font-medium">
                {validationResult.isValid ? 'Accessibility Compliant' : 'Accessibility Issues'}
              </span>
            </div>
            <Badge variant={validationResult.isValid ? 'default' : 'secondary'}>
              {validationResult.isValid ? 'Valid' : 'Issues Found'}
            </Badge>
          </div>
          {validationResult.issues.length > 0 && (
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              {validationResult.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Predefined Configurations */}
      <div>
        <h4 className="font-medium mb-3">Predefined Configurations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PREDEFINED_CONFIGS.map((config) => {
            const isSelected = selectedConfig.id === config.id;
            const fontFamily = getFontFamilyById(config.typography.fontFamily);
            
            return (
              <Card
                key={config.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handlePredefinedConfigSelect(config)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{config.name}</h5>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Font: {fontFamily.name}</div>
                    <div>Size: {config.typography.fontSize}</div>
                    <div>Density: {config.layout.density}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>  
    {/* Typography Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="w-4 h-4" />
            Typography Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Family */}
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={customTypography.fontFamily}
              onValueChange={(value) => handleTypographyChange('fontFamily', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font family" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  FONT_FAMILIES.reduce((acc, font) => {
                    if (!acc[font.category]) acc[font.category] = [];
                    acc[font.category].push(font);
                    return acc;
                  }, {} as Record<string, typeof FONT_FAMILIES>)
                ).map(([category, fonts]) => (
                  <div key={category}>
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                      {category}
                    </div>
                    {fonts.map((font) => (
                      <SelectItem key={font.id} value={font.id}>
                        <span style={{ fontFamily: font.value }}>{font.name}</span>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label htmlFor="font-size">Font Size</Label>
            <Select
              value={customTypography.fontSize}
              onValueChange={(value: 'small' | 'medium' | 'large') => 
                handleTypographyChange('fontSize', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (14px base)</SelectItem>
                <SelectItem value="medium">Medium (16px base)</SelectItem>
                <SelectItem value="large">Large (18px base)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Size Scale */}
          <div className="space-y-2">
            <Label htmlFor="font-size-scale">
              Font Size Scale: {customTypography.fontSizeScale.toFixed(1)}x
            </Label>
            <Slider
              id="font-size-scale"
              min={0.8}
              max={1.3}
              step={0.1}
              value={[customTypography.fontSizeScale]}
              onValueChange={([value]) => handleTypographyChange('fontSizeScale', value)}
              className="w-full"
            />
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label htmlFor="line-height">
              Line Height: {customTypography.lineHeight.toFixed(1)}
            </Label>
            <Slider
              id="line-height"
              min={1.2}
              max={2.0}
              step={0.1}
              value={[customTypography.lineHeight]}
              onValueChange={([value]) => handleTypographyChange('lineHeight', value)}
              className="w-full"
            />
          </div>

          {/* Letter Spacing */}
          <div className="space-y-2">
            <Label htmlFor="letter-spacing">
              Letter Spacing: {customTypography.letterSpacing.toFixed(3)}em
            </Label>
            <Slider
              id="letter-spacing"
              min={-0.05}
              max={0.1}
              step={0.005}
              value={[customTypography.letterSpacing]}
              onValueChange={([value]) => handleTypographyChange('letterSpacing', value)}
              className="w-full"
            />
          </div>

          {/* Font Weights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="heading-weight">Heading Weight</Label>
              <Select
                value={customTypography.headingWeight}
                onValueChange={(value: 'normal' | 'medium' | 'semibold' | 'bold') => 
                  handleTypographyChange('headingWeight', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (400)</SelectItem>
                  <SelectItem value="medium">Medium (500)</SelectItem>
                  <SelectItem value="semibold">Semibold (600)</SelectItem>
                  <SelectItem value="bold">Bold (700)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body-weight">Body Weight</Label>
              <Select
                value={customTypography.bodyWeight}
                onValueChange={(value: 'light' | 'normal' | 'medium') => 
                  handleTypographyChange('bodyWeight', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light (300)</SelectItem>
                  <SelectItem value="normal">Normal (400)</SelectItem>
                  <SelectItem value="medium">Medium (500)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Layout Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout Density */}
          <div className="space-y-2">
            <Label htmlFor="density">Layout Density</Label>
            <Select
              value={customLayout.density}
              onValueChange={(value: 'compact' | 'standard' | 'spacious') => 
                handleLayoutChange('density', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact - More content per page</SelectItem>
                <SelectItem value="standard">Standard - Balanced spacing</SelectItem>
                <SelectItem value="spacious">Spacious - Maximum readability</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Width */}
          <div className="space-y-2">
            <Label htmlFor="max-width">Content Width</Label>
            <Select
              value={customLayout.maxWidth}
              onValueChange={(value: 'narrow' | 'standard' | 'wide') => 
                handleLayoutChange('maxWidth', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="narrow">Narrow - Better for mobile</SelectItem>
                <SelectItem value="standard">Standard - Balanced layout</SelectItem>
                <SelectItem value="wide">Wide - Maximum content width</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section Spacing */}
          <div className="space-y-2">
            <Label htmlFor="section-spacing">
              Section Spacing: {customLayout.sectionSpacing.toFixed(1)}rem
            </Label>
            <Slider
              id="section-spacing"
              min={0.5}
              max={4}
              step={0.5}
              value={[customLayout.sectionSpacing]}
              onValueChange={([value]) => handleLayoutChange('sectionSpacing', value)}
              className="w-full"
            />
          </div>

          {/* Card Padding */}
          <div className="space-y-2">
            <Label htmlFor="card-padding">
              Card Padding: {customLayout.cardPadding.toFixed(1)}rem
            </Label>
            <Slider
              id="card-padding"
              min={0.5}
              max={3}
              step={0.25}
              value={[customLayout.cardPadding]}
              onValueChange={([value]) => handleLayoutChange('cardPadding', value)}
              className="w-full"
            />
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <Label htmlFor="border-radius">
              Border Radius: {customLayout.borderRadius.toFixed(2)}rem
            </Label>
            <Slider
              id="border-radius"
              min={0}
              max={1}
              step={0.05}
              value={[customLayout.borderRadius]}
              onValueChange={([value]) => handleLayoutChange('borderRadius', value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default TypographyCustomizer;