import React from 'react';
import type { CustomizationSettings } from '../../../shared/types/customization';

interface LayoutCustomizerProps {
  settings: CustomizationSettings;
  onChange: (settings: Partial<CustomizationSettings>) => void;
}

const SPACING_PRESETS = [
  { name: 'Compact', value: 'compact' as const },
  { name: 'Normal', value: 'normal' as const },
  { name: 'Spacious', value: 'spacious' as const }
];

export const LayoutCustomizer: React.FC<LayoutCustomizerProps> = ({
  settings,
  onChange
}) => {
  const handleLayoutChange = (
    key: keyof CustomizationSettings['layout'],
    value: string | number
  ) => {
    onChange({
      layout: {
        ...settings.layout,
        [key]: value
      }
    });
  };

  return (
    <div className="layout-customizer">
      {/* Spacing Density */}
      <div className="section">
        <h3>Spacing Density</h3>
        <div className="spacing-grid">
          {SPACING_PRESETS.map((preset) => (
            <button
              key={preset.value}
              className={`spacing-card ${
                settings.layout.spacing === preset.value ? 'active' : ''
              }`}
              onClick={() => handleLayoutChange('spacing', preset.value)}
            >
              <div className={`spacing-preview ${preset.value}`}>
                <div className="preview-line" />
                <div className="preview-line" />
                <div className="preview-line" />
              </div>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="section">
        <h3>Border Radius</h3>
        <div className="slider-group">
          <label>
            Roundness: {settings.layout.borderRadius}px
          </label>
          <input
            type="range"
            min="0"
            max="16"
            step="2"
            value={settings.layout.borderRadius}
            onChange={(e) => handleLayoutChange('borderRadius', parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>Sharp</span>
            <span>Rounded</span>
          </div>
        </div>
        <div className="border-preview">
          <div
            className="preview-box"
            style={{ borderRadius: `${settings.layout.borderRadius}px` }}
          />
        </div>
      </div>

      {/* Section Padding */}
      <div className="section">
        <h3>Section Padding</h3>
        <div className="slider-group">
          <label>
            Padding: {settings.layout.sectionPadding}px
          </label>
          <input
            type="range"
            min="8"
            max="32"
            step="4"
            value={settings.layout.sectionPadding}
            onChange={(e) => handleLayoutChange('sectionPadding', parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-labels">
            <span>Tight</span>
            <span>Loose</span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="section">
        <h3>Layout Preview</h3>
        <div className="layout-preview">
          <div
            className={`preview-card spacing-${settings.layout.spacing}`}
            style={{
              borderRadius: `${settings.layout.borderRadius}px`,
              padding: `${settings.layout.sectionPadding}px`
            }}
          >
            <div className="preview-header">Header Section</div>
            <div className="preview-content">Content Area</div>
            <div className="preview-footer">Footer Section</div>
          </div>
        </div>
      </div>
    </div>
  );
};
