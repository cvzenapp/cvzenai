import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TemplateCustomizationPanel, 
  CustomizationTrigger,
  TemplateCustomization,
  useColorScheme,
  useTypographyLayout
} from '../customization';
import { Palette, Type, Eye, Download } from 'lucide-react';

/**
 * Example component demonstrating how to integrate the customization system
 * into any template or component
 */
export const CustomizationExample: React.FC = () => {
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [savedCustomizations, setSavedCustomizations] = useState<TemplateCustomization[]>([]);

  // Use the customization hooks
  const { currentScheme, isDarkMode, toggleDarkMode } = useColorScheme({
    templateId: 'example-template',
    autoApply: true
  });

  const { currentConfig } = useTypographyLayout({
    templateId: 'example-template',
    autoApply: true
  });

  const handleCustomizationSave = (customization: TemplateCustomization) => {
    setSavedCustomizations(prev => [...prev, customization]);
    console.log('Saved customization:', customization);
  };

  const handleCustomizationPreview = (customization: TemplateCustomization) => {
    console.log('Previewing customization:', customization);
  };

  const handleCustomizationExport = (customization: TemplateCustomization) => {
    const dataStr = JSON.stringify(customization, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${customization.name.replace(/\s+/g, '-').toLowerCase()}-theme.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen p-8 bg-[var(--template-background-color,#ffffff)] text-[var(--text-slate-700,#000000)] transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[var(--template-primary-color,#3B82F6)]">
            Template Customization Demo
          </h1>
          <p className="text-lg text-[var(--template-secondary-color,#64748B)]">
            This example shows how to integrate the customization system into any template
          </p>
        </div>

        {/* Current Settings Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[var(--template-border-color,#E2E8F0)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--template-primary-color,#3B82F6)]" />
                Current Color Scheme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Name:</span>
                <Badge variant="secondary">{currentScheme.name}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Mode:</span>
                <Badge variant={isDarkMode ? 'default' : 'outline'}>
                  {isDarkMode ? 'Dark' : 'Light'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Accessible:</span>
                <Badge variant={currentScheme.isAccessible ? 'default' : 'destructive'}>
                  {currentScheme.isAccessible ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: currentScheme.colors.primary }}
                  title="Primary"
                />
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: currentScheme.colors.secondary }}
                  title="Secondary"
                />
                <div 
                  className="w-8 h-8 rounded border-2 border-gray-300"
                  style={{ backgroundColor: currentScheme.colors.accent }}
                  title="Accent"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--template-border-color,#E2E8F0)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5 text-[var(--template-secondary-color,#64748B)]" />
                Current Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Config:</span>
                <Badge variant="secondary">{currentConfig.name}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Font:</span>
                <span className="text-sm">{currentConfig.typography.fontFamily}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Size:</span>
                <span className="text-sm">{currentConfig.typography.fontSize}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Density:</span>
                <span className="text-sm">{currentConfig.layout.density}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Content */}
        <Card className="border-[var(--template-border-color,#E2E8F0)]">
          <CardHeader>
            <CardTitle>Sample Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--template-primary-color,#3B82F6)]">
              This is a heading
            </h2>
            <p className="text-[var(--text-slate-700,#000000)]">
              This is a paragraph of text that demonstrates how the typography settings affect readability. 
              The line height, letter spacing, and font family all contribute to the overall reading experience.
            </p>
            <div className="flex gap-2">
              <Badge style={{ backgroundColor: 'var(--template-primary-color, #3B82F6)' }}>
                Primary Badge
              </Badge>
              <Badge 
                variant="outline" 
                style={{ borderColor: 'var(--template-secondary-color, #64748B)' }}
              >
                Secondary Badge
              </Badge>
              <Badge style={{ backgroundColor: 'var(--template-accent-color, #10B981)' }}>
                Accent Badge
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Saved Customizations */}
        {savedCustomizations.length > 0 && (
          <Card className="border-[var(--template-border-color,#E2E8F0)]">
            <CardHeader>
              <CardTitle>Saved Customizations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedCustomizations.map((customization, index) => (
                  <div 
                    key={index}
                    className="p-4 border border-[var(--template-border-color,#E2E8F0)] rounded-lg"
                  >
                    <h4 className="font-medium mb-2">{customization.name}</h4>
                    <div className="text-sm text-[var(--template-secondary-color,#64748B)] space-y-1">
                      <div>Colors: {customization.colorScheme.name}</div>
                      <div>Typography: {customization.typographyLayout.name}</div>
                      <div>Created: {customization.createdAt.toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
          </Button>
          
          <CustomizationTrigger
            onOpenCustomization={() => setIsCustomizationOpen(true)}
            hasCustomizations={savedCustomizations.length > 0}
            isCustomizationOpen={isCustomizationOpen}
            variant="inline"
          />
        </div>
      </div>

      {/* Customization Panel */}
      <TemplateCustomizationPanel
        templateId="example-template"
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        onSave={handleCustomizationSave}
        onPreview={handleCustomizationPreview}
        onExport={handleCustomizationExport}
      />
    </div>
  );
};

export default CustomizationExample;