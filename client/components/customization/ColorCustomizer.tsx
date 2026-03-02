import React from 'react';
import type { CustomizationSettings } from '../../../shared/types/customization';

interface ColorCustomizerProps {
  settings: CustomizationSettings;
  onChange: (settings: Partial<CustomizationSettings>) => void;
}

const COLOR_SCHEMES = [
  {
    name: 'Professional Blue',
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#3b82f6',
    text: '#1f2937',
    background: '#ffffff'
  },
  {
    name: 'Creative Purple',
    primary: '#7c3aed',
    secondary: '#6d28d9',
    accent: '#8b5cf6',
    text: '#1f2937',
    background: '#ffffff'
  },
  {
    name: 'Modern Green',
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981',
    text: '#1f2937',
    background: '#ffffff'
  },
  {
    name: 'High Contrast',
    primary: '#000000',
    secondary: '#1f2937',
    accent: '#374151',
    text: '#000000',
    background: '#ffffff'
  },
  {
    name: 'Warm Orange',
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#f97316',
    text: '#1f2937',
    background: '#ffffff'
  }
];

export const ColorCustomizer: React.FC<ColorCustomizerProps> = ({
  settings,
  onChange
}) => {
  const handleSchemeSelect = (scheme: typeof COLOR_SCHEMES[0]) => {
    onChange({
      colors: {
        primary: scheme.primary,
        secondary: scheme.secondary,
        accent: scheme.accent,
        text: scheme.text,
        background: scheme.background
      }
    });
  };

  const handleColorChange = (key: keyof CustomizationSettings['colors'], value: string) => {
    onChange({
      colors: {
        ...settings.colors,
        [key]: value
      }
    });
  };

  // Calculate contrast ratio for accessibility
  const getContrastRatio = (color1: string, color2: string): number => {
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = ((rgb >> 16) & 0xff) / 255;
      const g = ((rgb >> 8) & 0xff) / 255;
      const b = (rgb & 0xff) / 255;
      
      const [rs, gs, bs] = [r, g, b].map(c => 
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      );
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  };

  const contrastRatio = getContrastRatio(settings.colors.text, settings.colors.background);
  const isAccessible = contrastRatio >= 4.5;

  return (
    <div className="color-customizer">
      {/* Predefined Schemes */}
      <div className="section">
        <h3>Color Schemes</h3>
        <div className="scheme-grid">
          {COLOR_SCHEMES.map((scheme) => (
            <button
              key={scheme.name}
              className="scheme-card"
              onClick={() => handleSchemeSelect(scheme)}
            >
              <div className="scheme-colors">
                <div className="color-dot" style={{ backgroundColor: scheme.primary }} />
                <div className="color-dot" style={{ backgroundColor: scheme.secondary }} />
                <div className="color-dot" style={{ backgroundColor: scheme.accent }} />
              </div>
              <span className="scheme-name">{scheme.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="section">
        <h3>Custom Colors</h3>
        <div className="color-inputs">
          <div className="color-input-group">
            <label>Primary Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
              />
              <input
                type="text"
                value={settings.colors.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="color-text-input"
              />
            </div>
          </div>

          <div className="color-input-group">
            <label>Secondary Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
              />
              <input
                type="text"
                value={settings.colors.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="color-text-input"
              />
            </div>
          </div>

          <div className="color-input-group">
            <label>Accent Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
              />
              <input
                type="text"
                value={settings.colors.accent}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="color-text-input"
              />
            </div>
          </div>

          <div className="color-input-group">
            <label>Text Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
              />
              <input
                type="text"
                value={settings.colors.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="color-text-input"
              />
            </div>
          </div>

          <div className="color-input-group">
            <label>Background Color</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                value={settings.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
              />
              <input
                type="text"
                value={settings.colors.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="color-text-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Check */}
      <div className="section">
        <h3>Accessibility</h3>
        <div className={`accessibility-check ${isAccessible ? 'pass' : 'fail'}`}>
          <div className="contrast-info">
            <span>Contrast Ratio: {contrastRatio.toFixed(2)}:1</span>
            <span className="status">
              {isAccessible ? '✓ WCAG AA Compliant' : '✗ Below WCAG AA'}
            </span>
          </div>
          {!isAccessible && (
            <p className="warning">
              Consider adjusting text or background colors for better readability
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
