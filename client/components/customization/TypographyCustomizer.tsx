import React from 'react';
import type { CustomizationSettings } from '../../../shared/types/customization';

interface TypographyCustomizerProps {
  settings: CustomizationSettings;
  onChange: (settings: Partial<CustomizationSettings>) => void;
}

const FONT_FAMILIES = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Inter', value: 'Inter, sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: '"Times New Roman", serif' },
  { name: 'Courier New', value: '"Courier New", monospace' }
];

export const TypographyCustomizer: React.FC<TypographyCustomizerProps> = ({
  settings,
  onChange
}) => {
  const handleTypographyChange = (
    key: keyof CustomizationSettings['typography'],
    value: string | number
  ) => {
    onChange({
      typography: {
        ...settings.typography,
        [key]: value
      }
    });
  };

  return (
    <div className="typography-customizer">
      {/* Font Family */}
      <div className="section">
        <h3>Font Family</h3>
        <div className="font-family-grid">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.value}
              className={`font-card ${
                settings.typography.fontFamily === font.value ? 'active' : ''
              }`}
              onClick={() => handleTypographyChange('fontFamily', font.value)}
              style={{ fontFamily: font.value }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="section">
        <h3>Font Size</h3>
        <div className="slider-group">
          <label>
            Base Size: {settings.typography.fontSize}px
          </label>
          <input
            type="range"
            min="12"
            max="18"
            step="1"
            value={settings.typography.fontSize}
            onChange={(e) => handleTypographyChange('fontSize', parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>12px</span>
            <span>18px</span>
          </div>
        </div>
      </div>

      {/* Line Height */}
      <div className="section">
        <h3>Line Height</h3>
        <div className="slider-group">
          <label>
            Spacing: {settings.typography.lineHeight}
          </label>
          <input
            type="range"
            min="1.2"
            max="2.0"
            step="0.1"
            value={settings.typography.lineHeight}
            onChange={(e) => handleTypographyChange('lineHeight', parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>Tight</span>
            <span>Loose</span>
          </div>
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="section">
        <h3>Letter Spacing</h3>
        <div className="slider-group">
          <label>
            Tracking: {settings.typography.letterSpacing}px
          </label>
          <input
            type="range"
            min="-0.5"
            max="2"
            step="0.1"
            value={settings.typography.letterSpacing}
            onChange={(e) => handleTypographyChange('letterSpacing', parseFloat(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>Tight</span>
            <span>Wide</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="section">
        <h3>Preview</h3>
        <div
          className="typography-preview"
          style={{
            fontFamily: settings.typography.fontFamily,
            fontSize: `${settings.typography.fontSize}px`,
            lineHeight: settings.typography.lineHeight,
            letterSpacing: `${settings.typography.letterSpacing}px`
          }}
        >
          <h4>John Doe</h4>
          <p>Senior Software Engineer</p>
          <p>
            Experienced developer with expertise in React, TypeScript, and Node.js.
            Passionate about building scalable applications and mentoring junior developers.
          </p>
        </div>
      </div>
    </div>
  );
};
