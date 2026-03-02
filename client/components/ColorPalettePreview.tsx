import React, { useState, useEffect } from 'react';

interface ColorPalettePreviewProps {
  selectedColors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  onColorPresetSelect?: (preset: any) => void;
  className?: string;
}

export default function ColorPalettePreview({
  selectedColors,
  onColorPresetSelect,
  className = ''
}: ColorPalettePreviewProps) {
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

  const renderPreviewCard = (colors: any) => (
    <div 
      className="relative overflow-hidden rounded-xl border-2 transition-all duration-300"
      style={{ 
        backgroundColor: colors.background,
        borderColor: colors.primary + '20'
      }}
    >
      {/* Header Section */}
      <div 
        className="px-4 py-3 text-white relative"
        style={{ 
          background: `linear-gradient(135deg, ${colors.text} 0%, ${colors.secondary} 100%)`
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: colors.accent }}
          >
            JD
          </div>
          <div>
            <h3 className="font-bold text-sm">John Doe</h3>
            <p className="text-xs opacity-80">Senior Developer</p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Section Header */}
        <div className="flex items-center gap-2">
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            <div className="w-3 h-3 bg-white rounded"></div>
          </div>
          <h4 className="font-semibold text-sm" style={{ color: colors.text }}>
            Skills
          </h4>
        </div>
        
        {/* Skill Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: colors.secondary }}>React</span>
              <span style={{ color: colors.secondary }}>90%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full" 
                style={{ 
                  width: '90%',
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
                }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span style={{ color: colors.secondary }}>TypeScript</span>
              <span style={{ color: colors.secondary }}>85%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full" 
                style={{ 
                  width: '85%',
                  background: `linear-gradient(to right, ${colors.primary}, ${colors.accent})`
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="flex gap-2 mt-3">
          <div 
            className="flex-1 text-center py-2 rounded-lg"
            style={{ backgroundColor: colors.primary + '10' }}
          >
            <div className="font-bold text-lg" style={{ color: colors.primary }}>5+</div>
            <div className="text-xs" style={{ color: colors.secondary }}>Years</div>
          </div>
          <div 
            className="flex-1 text-center py-2 rounded-lg"
            style={{ backgroundColor: colors.accent + '10' }}
          >
            <div className="font-bold text-lg" style={{ color: colors.accent }}>12</div>
            <div className="text-xs" style={{ color: colors.secondary }}>Projects</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🎨 Professional Color Themes
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose a professionally designed color palette that matches your industry and personal style. 
          Each theme is carefully crafted for maximum visual impact and readability.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colorPresets.map((preset, index) => (
          <div key={index} className="space-y-3">
            {/* Preset Info */}
            <div>
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                {preset.name}
                {index === 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    Recommended
                  </span>
                )}
              </h4>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {preset.description}
              </p>
            </div>
            
            {/* Preview Card */}
            <button
              onClick={() => onColorPresetSelect?.(preset)}
              className="w-full text-left hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-xl"
            >
              {renderPreviewCard(preset.colors)}
            </button>
            
            {/* Color Swatches */}
            <div className="flex gap-1">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: preset.colors.primary }}
                title="Primary"
              />
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: preset.colors.secondary }}
                title="Secondary"
              />
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: preset.colors.accent }}
                title="Accent"
              />
              <div 
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: preset.colors.text }}
                title="Text"
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Current Selection Preview */}
      {selectedColors && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">✨ Current Theme Preview</h4>
          <div className="max-w-sm">
            {renderPreviewCard(selectedColors)}
          </div>
        </div>
      )}
    </div>
  );
}
