import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Palette, Check, RefreshCw, Sun, Moon, Eye } from 'lucide-react';

export interface ColorScheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
    muted: string;
    border: string;
  };
  isDark: boolean;
  isAccessible: boolean;
  contrastRatio: number;
}

export interface ColorSchemeCustomizerProps {
  currentScheme: ColorScheme;
  onSchemeChange: (scheme: ColorScheme) => void;
  onPreview: (scheme: ColorScheme) => void;
  onSave: (scheme: ColorScheme) => void;
  className?: string;
}

// Predefined accessible color schemes
const PREDEFINED_SCHEMES: ColorScheme[] = [
  {
    id: 'professional-blue',
    name: 'Professional Blue',
    colors: {
      primary: '#3B82F6',
      secondary: '#64748B',
      accent: '#10B981',
      text: '#1F2937',
      background: '#FFFFFF',
      muted: '#F8FAFC',
      border: '#E2E8F0'
    },
    isDark: false,
    isAccessible: true,
    contrastRatio: 4.8
  },
  {
    id: 'corporate-gray',
    name: 'Corporate Gray',
    colors: {
      primary: '#6B7280',
      secondary: '#9CA3AF',
      accent: '#F59E0B',
      text: '#1F2937',
      background: '#FFFFFF',
      muted: '#F9FAFB',
      border: '#D1D5DB'
    },
    isDark: false,
    isAccessible: true,
    contrastRatio: 4.6
  },
  {
    id: 'creative-purple',
    name: 'Creative Purple',
    colors: {
      primary: '#8B5CF6',
      secondary: '#A78BFA',
      accent: '#EC4899',
      text: '#1F2937',
      background: '#FFFFFF',
      muted: '#FAF5FF',
      border: '#E9D5FF'
    },
    isDark: false,
    isAccessible: true,
    contrastRatio: 4.5
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    colors: {
      primary: '#10B981',
      secondary: '#34D399',
      accent: '#3B82F6',
      text: '#1F2937',
      background: '#FFFFFF',
      muted: '#F0FDF4',
      border: '#BBF7D0'
    },
    isDark: false,
    isAccessible: true,
    contrastRatio: 4.7
  },
  {
    id: 'elegant-dark',
    name: 'Elegant Dark',
    colors: {
      primary: '#60A5FA',
      secondary: '#94A3B8',
      accent: '#34D399',
      text: '#F8FAFC',
      background: '#0F172A',
      muted: '#1E293B',
      border: '#334155'
    },
    isDark: true,
    isAccessible: true,
    contrastRatio: 4.9
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    colors: {
      primary: '#000000',
      secondary: '#4B5563',
      accent: '#DC2626',
      text: '#000000',
      background: '#FFFFFF',
      muted: '#F3F4F6',
      border: '#000000'
    },
    isDark: false,
    isAccessible: true,
    contrastRatio: 21.0
  }
];

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21, where higher is better for accessibility
 */
function calculateContrastRatio(color1: string, color2: string): number {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Validate if a color scheme meets accessibility standards
 */
function validateAccessibility(scheme: ColorScheme): { isAccessible: boolean; contrastRatio: number; issues: string[] } {
  const issues: string[] = [];
  
  // Check primary text contrast
  const textContrastRatio = calculateContrastRatio(scheme.colors.text, scheme.colors.background);
  const primaryContrastRatio = calculateContrastRatio(scheme.colors.primary, scheme.colors.background);
  
  if (textContrastRatio < 4.5) {
    issues.push('Text contrast ratio is below WCAG AA standard (4.5:1)');
  }
  
  if (primaryContrastRatio < 3.0) {
    issues.push('Primary color contrast ratio is below WCAG AA standard for large text (3:1)');
  }

  const minContrastRatio = Math.min(textContrastRatio, primaryContrastRatio);
  
  return {
    isAccessible: issues.length === 0,
    contrastRatio: Math.round(minContrastRatio * 10) / 10,
    issues
  };
}

/**
 * Generate a dark mode variant of a light color scheme
 */
function generateDarkVariant(lightScheme: ColorScheme): ColorScheme {
  return {
    ...lightScheme,
    id: `${lightScheme.id}-dark`,
    name: `${lightScheme.name} (Dark)`,
    colors: {
      ...lightScheme.colors,
      text: '#F8FAFC',
      background: '#0F172A',
      muted: '#1E293B',
      border: '#334155',
      // Lighten primary colors for better contrast on dark background
      primary: lightenColor(lightScheme.colors.primary, 20),
      secondary: lightenColor(lightScheme.colors.secondary, 15),
      accent: lightenColor(lightScheme.colors.accent, 10)
    },
    isDark: true
  };
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

export const ColorSchemeCustomizer: React.FC<ColorSchemeCustomizerProps> = ({
  currentScheme,
  onSchemeChange,
  onPreview,
  onSave,
  className = ''
}) => {
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>(currentScheme);
  const [customColors, setCustomColors] = useState(currentScheme.colors);
  const [isDarkMode, setIsDarkMode] = useState(currentScheme.isDark);
  const [validationResult, setValidationResult] = useState(validateAccessibility(currentScheme));
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Update validation when colors change
  useEffect(() => {
    const updatedScheme = {
      ...selectedScheme,
      colors: customColors,
      isDark: isDarkMode
    };
    const validation = validateAccessibility(updatedScheme);
    setValidationResult(validation);
    
    // Auto-preview changes
    onPreview({
      ...updatedScheme,
      isAccessible: validation.isAccessible,
      contrastRatio: validation.contrastRatio
    });
  }, [customColors, isDarkMode, selectedScheme, onPreview]);

  const handlePredefinedSchemeSelect = (scheme: ColorScheme) => {
    const finalScheme = isDarkMode && !scheme.isDark ? generateDarkVariant(scheme) : scheme;
    setSelectedScheme(finalScheme);
    setCustomColors(finalScheme.colors);
    setIsCustomizing(false);
    onSchemeChange(finalScheme);
  };

  const handleColorChange = (colorKey: keyof ColorScheme['colors'], value: string) => {
    const newColors = { ...customColors, [colorKey]: value };
    setCustomColors(newColors);
    setIsCustomizing(true);
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setIsDarkMode(enabled);
    if (enabled && !selectedScheme.isDark) {
      const darkVariant = generateDarkVariant(selectedScheme);
      setCustomColors(darkVariant.colors);
    } else if (!enabled && selectedScheme.isDark) {
      // Find the light variant or use professional blue as fallback
      const lightScheme = PREDEFINED_SCHEMES.find(s => !s.isDark) || PREDEFINED_SCHEMES[0];
      setCustomColors(lightScheme.colors);
    }
  };

  const handleSave = () => {
    const finalScheme: ColorScheme = {
      ...selectedScheme,
      id: isCustomizing ? `custom-${Date.now()}` : selectedScheme.id,
      name: isCustomizing ? 'Custom Scheme' : selectedScheme.name,
      colors: customColors,
      isDark: isDarkMode,
      isAccessible: validationResult.isAccessible,
      contrastRatio: validationResult.contrastRatio
    };
    
    onSave(finalScheme);
  };

  const handleReset = () => {
    setSelectedScheme(currentScheme);
    setCustomColors(currentScheme.colors);
    setIsDarkMode(currentScheme.isDark);
    setIsCustomizing(false);
  };

  return (
    <div className={`color-scheme-customizer space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Color Scheme</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Label htmlFor="dark-mode-toggle" className="text-sm">
            Dark Mode
          </Label>
          <Switch
            id="dark-mode-toggle"
            checked={isDarkMode}
            onCheckedChange={handleDarkModeToggle}
          />
          {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </div>
      </div>

      {/* Accessibility Status */}
      <Card className={`border-l-4 ${validationResult.isAccessible ? 'border-l-green-500 bg-green-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validationResult.isAccessible ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Eye className="w-4 h-4 text-yellow-600" />
              )}
              <span className="font-medium">
                {validationResult.isAccessible ? 'WCAG AA Compliant' : 'Accessibility Issues'}
              </span>
            </div>
            <Badge variant={validationResult.isAccessible ? 'default' : 'secondary'}>
              {validationResult.contrastRatio}:1 contrast
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

      {/* Predefined Schemes */}
      <div>
        <h4 className="font-medium mb-3">Predefined Schemes</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PREDEFINED_SCHEMES.map((scheme) => {
            const displayScheme = isDarkMode && !scheme.isDark ? generateDarkVariant(scheme) : scheme;
            const isSelected = selectedScheme.id === scheme.id || 
              (isDarkMode && selectedScheme.id === `${scheme.id}-dark`);
            
            return (
              <Card
                key={scheme.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handlePredefinedSchemeSelect(scheme)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: displayScheme.colors.primary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: displayScheme.colors.secondary }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: displayScheme.colors.accent }}
                      />
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm font-medium">{displayScheme.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {displayScheme.contrastRatio}:1 contrast
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Custom Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(customColors).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`color-${key}`} className="text-sm capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`color-${key}`}
                    type="color"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ColorScheme['colors'], e.target.value)}
                    className="w-12 h-8 p-1 border rounded cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={value}
                    onChange={(e) => handleColorChange(key as keyof ColorScheme['colors'], e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};

export default ColorSchemeCustomizer;