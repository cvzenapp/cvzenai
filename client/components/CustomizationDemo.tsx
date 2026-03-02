/**
 * Customization System Demo
 * Demonstrates the complete integration of the unified template customization system
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Palette, 
  Eye, 
  Settings, 
  Sparkles, 
  Check, 
  Download,
  Share,
  ChevronRight
} from 'lucide-react';

import { TemplateCustomizationModal } from '@/components/unified/TemplateCustomizationModal';
import { TemplateState } from '@/services/templates/types';
import { TemplateCustomization } from '@/services/templateCustomizationService';

// Mock data for demonstration
const mockTemplateState: TemplateState = {
  template: {
    id: 'enhanced-technology',
    name: 'Enhanced Technology',
    category: 'enhanced-technology' as any,
    description: 'Modern technology template with enhanced features',
    isPremium: false,
    tags: ['technology', 'modern', 'professional'],
    previewUrl: '',
    features: []
  },
  customization: {
    id: 1,
    name: 'Professional Blue',
    templateId: 'enhanced-technology',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#10b981',
      background: '#ffffff',
      text: '#1e293b',
      muted: '#94a3b8'
    },
    fonts: {
      heading: 'Inter, system-ui, sans-serif',
      body: 'Inter, system-ui, sans-serif',
      size: '14px'
    },
    layout: {
      style: 'sidebar' as any,
      showBorders: true
    },
    spacing: {
      section: 24,
      element: 12
    },
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  mode: 'preview',
  isLoading: false,
  templateSource: 'default',
  customizationSource: 'database',
  metadata: {
    resolvedAt: new Date(),
    templateId: 'enhanced-technology',
    customizationId: 1,
    isSharedView: false
  }
};

const mockCustomizations = [
  {
    id: 1,
    name: 'Professional Blue',
    templateId: 'enhanced-technology',
    colors: { primary: '#2563eb', secondary: '#64748b', accent: '#10b981', background: '#ffffff', text: '#1e293b', muted: '#94a3b8' },
    isActive: true
  },
  {
    id: 2,
    name: 'Elegant Purple',
    templateId: 'enhanced-technology', 
    colors: { primary: '#7c3aed', secondary: '#6b7280', accent: '#f59e0b', background: '#ffffff', text: '#111827', muted: '#9ca3af' },
    isActive: false
  },
  {
    id: 3,
    name: 'Modern Green',
    templateId: 'enhanced-technology',
    colors: { primary: '#059669', secondary: '#6b7280', accent: '#dc2626', background: '#ffffff', text: '#111827', muted: '#9ca3af' },
    isActive: false
  },
  {
    id: 4,
    name: 'Tech Dark',
    templateId: 'enhanced-technology',
    colors: { primary: '#06b6d4', secondary: '#64748b', accent: '#f59e0b', background: '#0f172a', text: '#f8fafc', muted: '#94a3b8' },
    isActive: false
  }
];

export const CustomizationDemo: React.FC = () => {
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [currentTemplateState, setCurrentTemplateState] = useState<TemplateState>(mockTemplateState);
  const [activeCustomization, setActiveCustomization] = useState(0);

  const handleCustomizationPreview = (customization: TemplateCustomization) => {
    console.log('🎨 Previewing customization:', customization.name);
    setCurrentTemplateState(prev => ({
      ...prev,
      customization
    }));
  };

  const handleCustomizationSave = (customization: TemplateCustomization) => {
    console.log('💾 Saving customization:', customization.name);
    setCurrentTemplateState(prev => ({
      ...prev,
      customization
    }));
    setIsCustomizationOpen(false);
    
    // Show success message
    setTimeout(() => {
      alert('✅ Customization saved successfully!');
    }, 100);
  };

  const handleQuickCustomization = (index: number) => {
    const customization = mockCustomizations[index];
    setActiveCustomization(index);
    
    const fullCustomization: TemplateCustomization = {
      id: customization.id,
      name: customization.name,
      templateId: customization.templateId,
      colors: customization.colors,
      fonts: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
        size: '14px'
      },
      layout: {
        style: 'sidebar' as any,
        showBorders: true
      },
      spacing: {
        section: 24,
        element: 12
      },
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCurrentTemplateState(prev => ({
      ...prev,
      customization: fullCustomization
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-800">
              Template Customization System
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Experience our comprehensive template customization system with live preview,
            multiple themes, and seamless integration across all resume templates.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Current Template</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Template</span>
                    <Badge variant="secondary">{currentTemplateState.template.name}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Customization</span>
                    <Badge variant="outline">
                      {currentTemplateState.customization?.name || 'Default'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Layout</span>
                    <span className="text-xs text-slate-500 capitalize">
                      {currentTemplateState.customization?.layout?.style || 'sidebar'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Customizations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Quick Themes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockCustomizations.map((customization, index) => (
                    <Button
                      key={customization.id}
                      variant={activeCustomization === index ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => handleQuickCustomization(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: customization.colors.primary }}
                          />
                          <div 
                            className="w-3 h-3 rounded-full border" 
                            style={{ backgroundColor: customization.colors.accent }}
                          />
                        </div>
                        <span className="text-sm">{customization.name}</span>
                      </div>
                      {activeCustomization === index && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsCustomizationOpen(true)}
              >
                <Palette className="w-4 h-4 mr-2" />
                Advanced Customization
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
              
              <Button variant="outline" className="w-full">
                <Share className="w-4 h-4 mr-2" />
                Share Customized Resume
              </Button>
            </div>

            {/* Features List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-700">
                  System Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Live preview with instant updates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>6 built-in color themes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Custom color picker</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Typography customization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Layout options (sidebar, columns)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Spacing and border controls</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Persistent customization saving</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <ChevronRight className="w-3 h-3 text-green-500" />
                    <span>Perfect shared link preservation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Live Preview</span>
                  <Badge 
                    variant="outline" 
                    className="text-green-600 border-green-200 bg-green-50"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Real-time Updates
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Mock Resume Preview */}
                <div 
                  className="w-full h-[600px] border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center bg-slate-50"
                  style={{
                    backgroundColor: currentTemplateState.customization?.colors?.background || '#ffffff',
                    color: currentTemplateState.customization?.colors?.text || '#1e293b'
                  }}
                >
                  <div className="text-center space-y-4 p-8">
                    <div 
                      className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white font-bold text-2xl"
                      style={{
                        backgroundColor: currentTemplateState.customization?.colors?.primary || '#2563eb'
                      }}
                    >
                      JD
                    </div>
                    
                    <div>
                      <h2 className="text-2xl font-bold mb-2">John Developer</h2>
                      <p 
                        className="text-lg"
                        style={{
                          color: currentTemplateState.customization?.colors?.secondary || '#64748b'
                        }}
                      >
                        Senior Software Engineer
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <span 
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: currentTemplateState.customization?.colors?.accent || '#10b981',
                          color: 'white'
                        }}
                      >
                        React
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: currentTemplateState.customization?.colors?.accent || '#10b981',
                          color: 'white'
                        }}
                      >
                        TypeScript
                      </span>
                      <span 
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: currentTemplateState.customization?.colors?.accent || '#10b981',
                          color: 'white'
                        }}
                      >
                        Node.js
                      </span>
                    </div>
                    
                    <div className="text-center mt-8">
                      <p className="text-sm text-slate-500 mb-4">
                        This preview updates in real-time as you customize colors, fonts, and layout.
                      </p>
                      <div className="text-xs text-slate-400">
                        <p>Layout: <span className="font-medium capitalize">
                          {currentTemplateState.customization?.layout?.style || 'sidebar'}
                        </span></p>
                        <p>Theme: <span className="font-medium">
                          {currentTemplateState.customization?.name || 'Default'}
                        </span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comprehensive Customization Modal */}
        <TemplateCustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          templateState={currentTemplateState}
          currentCustomization={currentTemplateState.customization}
          onPreview={handleCustomizationPreview}
          onSave={handleCustomizationSave}
        />
      </div>
    </div>
  );
};
