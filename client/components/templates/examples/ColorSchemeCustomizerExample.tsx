import React, { useState } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { ColorSchemeCustomizer, ColorScheme } from '../customization/ColorSchemeCustomizer';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BaseTemplateStructure, TemplateContainer } from '../foundation';
import { Header } from '../components/Header';
import { SummarySkills } from '../components/SummarySkills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Palette, Eye, Download } from 'lucide-react';

interface ColorSchemeCustomizerExampleProps {
  resume: Resume;
  templateConfig: TemplateConfig;
}

/**
 * Example demonstrating the ColorSchemeCustomizer component
 * Shows how to integrate color scheme customization with templates
 */
export const ColorSchemeCustomizerExample: React.FC<ColorSchemeCustomizerExampleProps> = ({
  resume,
  templateConfig
}) => {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [previewScheme, setPreviewScheme] = useState<ColorScheme | null>(null);
  
  const {
    currentScheme,
    setColorScheme,
    saveScheme,
    previewScheme: previewSchemeHook,
    applyScheme
  } = useColorScheme({
    templateId: templateConfig.id,
    persistToStorage: true,
    autoApply: true
  });

  const handleSchemeChange = (scheme: ColorScheme) => {
    setColorScheme(scheme);
  };

  const handlePreview = (scheme: ColorScheme) => {
    setPreviewScheme(scheme);
    previewSchemeHook(scheme);
  };

  const handleSave = async (scheme: ColorScheme) => {
    try {
      await saveScheme(scheme);
      applyScheme(scheme);
      setIsCustomizerOpen(false);
      setPreviewScheme(null);
    } catch (error) {
      console.error('Failed to save color scheme:', error);
    }
  };

  const handleDownload = () => {
    console.log('Download resume with current color scheme');
  };

  const handleContact = () => {
    console.log('Contact candidate');
  };

  const handleShare = () => {
    console.log('Share resume');
  };

  return (
    <BaseTemplateStructure
      resume={resume}
      templateConfig={templateConfig}
      className="color-scheme-example-template"
    >
      <TemplateContainer maxWidth="7xl">
        {/* Color Scheme Controls */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {previewScheme && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-800">
                    Previewing: {previewScheme.name}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewScheme(null);
                      applyScheme(currentScheme);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Dialog open={isCustomizerOpen} onOpenChange={setIsCustomizerOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white shadow-md"
              >
                <Palette className="w-4 h-4" />
                Customize Colors
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Color Scheme Customization</DialogTitle>
              </DialogHeader>
              <ColorSchemeCustomizer
                currentScheme={currentScheme}
                onSchemeChange={handleSchemeChange}
                onPreview={handlePreview}
                onSave={handleSave}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Template Content with Applied Color Scheme */}
        <div id="resume-template-container" className="space-y-0">
          {/* Header Section */}
          <Header
            resume={resume}
            templateConfig={templateConfig}
            onDownload={handleDownload}
            onContact={handleContact}
            onShare={handleShare}
          />

          {/* Summary & Skills Section */}
          <SummarySkills
            resume={resume}
            templateConfig={templateConfig}
          />

          {/* Color Scheme Information Panel */}
          <div className="py-8 bg-muted/30">
            <TemplateContainer maxWidth="4xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Current Color Scheme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{currentScheme.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentScheme.isDark ? 'Dark Mode' : 'Light Mode'} • 
                        {currentScheme.contrastRatio}:1 contrast ratio
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Object.entries(currentScheme.colors).slice(0, 5).map(([key, color]) => (
                        <div
                          key={key}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color }}
                          title={`${key}: ${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Primary</div>
                      <div className="font-mono">{currentScheme.colors.primary}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Secondary</div>
                      <div className="font-mono">{currentScheme.colors.secondary}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Accent</div>
                      <div className="font-mono">{currentScheme.colors.accent}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Background</div>
                      <div className="font-mono">{currentScheme.colors.background}</div>
                    </div>
                  </div>

                  {currentScheme.isAccessible ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">WCAG AA Compliant</span>
                      <span className="text-sm">({currentScheme.contrastRatio}:1 contrast)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">Accessibility Issues</span>
                      <span className="text-sm">({currentScheme.contrastRatio}:1 contrast)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TemplateContainer>
          </div>

          {/* Sample Content Sections to Show Color Application */}
          <div className="py-8">
            <TemplateContainer maxWidth="4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-primary">Primary Color Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      This card demonstrates how the primary color is used for headings and important elements.
                    </p>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Primary Button
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-secondary">Secondary Color Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Secondary colors are used for supporting text and less prominent elements.
                    </p>
                    <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                      Secondary Button
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-accent">Accent Color Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Accent colors highlight important information and call-to-action elements.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent"></div>
                      <span className="text-accent font-medium">Highlighted Text</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Typography & Contrast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">
                      All text maintains proper contrast ratios for accessibility.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="text-foreground">Primary text color</div>
                      <div className="text-muted-foreground">Muted text color</div>
                      <div className="text-primary">Primary accent text</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TemplateContainer>
          </div>
        </div>
      </TemplateContainer>
    </BaseTemplateStructure>
  );
};

export default ColorSchemeCustomizerExample;