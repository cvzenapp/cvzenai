import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Save, Palette } from 'lucide-react';

interface SimpleCustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (colors: CustomColors) => void;
}

export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  background: string;
}

const COLOR_SCHEMES = [
  {
    name: 'Professional Blue',
    colors: { primary: '#3B82F6', secondary: '#64748B', accent: '#10B981', text: '#1F2937', background: '#FFFFFF' }
  },
  {
    name: 'Creative Purple',
    colors: { primary: '#8B5CF6', secondary: '#EC4899', accent: '#F59E0B', text: '#1F2937', background: '#FFFFFF' }
  },
  {
    name: 'Corporate Gray',
    colors: { primary: '#6B7280', secondary: '#9CA3AF', accent: '#F59E0B', text: '#111827', background: '#FFFFFF' }
  },
  {
    name: 'Modern Green',
    colors: { primary: '#10B981', secondary: '#14B8A6', accent: '#3B82F6', text: '#1F2937', background: '#FFFFFF' }
  },
  {
    name: 'High Contrast',
    colors: { primary: '#000000', secondary: '#4B5563', accent: '#DC2626', text: '#000000', background: '#FFFFFF' }
  }
];

export default function SimpleCustomizationPanel({ isOpen, onClose, onApply }: SimpleCustomizationPanelProps) {
  const [selectedColors, setSelectedColors] = useState<CustomColors>(COLOR_SCHEMES[0].colors);

  const handleApply = () => {
    onApply(selectedColors);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold">Customize</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-3">Color Schemes</h3>
          <div className="space-y-2">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => setSelectedColors(scheme.colors)}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  JSON.stringify(selectedColors) === JSON.stringify(scheme.colors)
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{scheme.name}</span>
                </div>
                <div className="flex gap-2">
                  {Object.entries(scheme.colors).slice(0, 3).map(([key, color]) => (
                    <div
                      key={key}
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Colors */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Custom Colors</h3>
          <div className="space-y-2">
            {Object.entries(selectedColors).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-sm capitalize">{key}</label>
                <input
                  type="color"
                  value={value}
                  onChange={(e) => setSelectedColors({ ...selectedColors, [key]: e.target.value })}
                  className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          onClick={handleApply}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Apply Changes
        </Button>
      </div>
    </div>
  );
}
