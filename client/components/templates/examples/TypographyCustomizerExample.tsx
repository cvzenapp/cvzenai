import React, { useState } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { TypographyCustomizer, TypographyLayoutConfig } from '../customization/TypographyCustomizer';
import { useTypographyLayout } from '@/hooks/useTypographyLayout';
import { BaseTemplateStructure, TemplateContainer } from '../foundation';
import { Header } from '../components/Header';
import { SummarySkills } from '../components/SummarySkills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Type, Layout, Eye, Settings } from 'lucide-react';

interface TypographyCustomizerExampleProps {
  resume: Resume;
  templateConfig: TemplateConfig;
}

/**
 * Example demonstrating the TypographyCustomizer component
 * Shows how to integrate typography and layout customization with templates
 */
export const TypographyCustomizerExample: React.FC<TypographyCustomizerExampleProps> = ({
  resume,
  templateConfig
}) => {
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<TypographyLayoutConfig | null>(null);
  
  const {
    currentConfig,
    setConfig,
    saveConfig,
    previewConfig: previewConfigHook,
    applyConfig,
    generateResponsiveCSS
  } = useTypographyLayout({
    templateId: templateConfig.id,
    persistToStorage: true,
    autoApply: true
  });

  const handleConfigChange = (config: TypographyLayoutConfig) => {
    setConfig(config);
  };

  const handlePreview = (config: TypographyLayoutConfig) => {
    setPreviewConfig(config);
    previewConfigHook(config);
  };

  const handleSave = async (config: TypographyLayoutConfig) => {
    try {
      await saveConfig(config);
      applyConfig(config);
      setIsCustomizerOpen(false);
      setPreviewConfig(null);
    } catch (error) {
      console.error('Failed to save typography configuration:', error);
    }
  };

  const handleDownload = () => {
    console.log('Download resume with current typography settings');
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
      className="typography-example-template"
    >
      {/* Apply custom CSS */}
      <style dangerouslySetInnerHTML={{ __html: generateResponsiveCSS(currentConfig) }} />
      
      <TemplateContainer maxWidth="7xl">
        {/* Typography Controls */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {previewConfig && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">
                    Previewing: {previewConfig.name}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPreviewConfig(null);
                      applyConfig(currentConfig);
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
                <Settings className="w-4 h-4" />
                Customize Typography
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Typography & Layout Customization</DialogTitle>
              </DialogHeader>
              <TypographyCustomizer
                currentConfig={currentConfig}
                onConfigChange={handleConfigChange}
                onPreview={handlePreview}
                onSave={handleSave}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Template Content with Applied Typography */}
        <div id="resume-template-container" className="template-container space-y-0">
          {/* Header Section */}
          <div className="template-section">
            <Header
              resume={resume}
              templateConfig={templateConfig}
              onDownload={handleDownload}
              onContact={handleContact}
              onShare={handleShare}
            />
          </div>

          {/* Summary & Skills Section */}
          <div className="template-section">
            <SummarySkills
              resume={resume}
              templateConfig={templateConfig}
            />
          </div>

          {/* Typography Information Panel */}
          <div className="template-section py-8 bg-muted/30">
            <TemplateContainer maxWidth="2xl">
              <Card className="template-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Current Typography & Layout Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Typography Settings Display */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Typography
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground">Font Family</div>
                        <div className="capitalize">{currentConfig.typography.fontFamily.replace('-', ' ')}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Font Size</div>
                        <div className="capitalize">{currentConfig.typography.fontSize}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Scale</div>
                        <div>{currentConfig.typography.fontSizeScale.toFixed(1)}x</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Line Height</div>
                        <div>{currentConfig.typography.lineHeight.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Letter Spacing</div>
                        <div>{currentConfig.typography.letterSpacing.toFixed(3)}em</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Heading Weight</div>
                        <div className="capitalize">{currentConfig.typography.headingWeight}</div>
                      </div>
                    </div>
                  </div>

                  {/* Layout Settings Display */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Layout
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-muted-foreground">Density</div>
                        <div className="capitalize">{currentConfig.layout.density}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Max Width</div>
                        <div className="capitalize">{currentConfig.layout.maxWidth}</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Section Spacing</div>
                        <div>{currentConfig.layout.sectionSpacing}rem</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Card Padding</div>
                        <div>{currentConfig.layout.cardPadding}rem</div>
                      </div>
                      <div>
                        <div className="font-medium text-muted-foreground">Border Radius</div>
                        <div>{currentConfig.layout.borderRadius}rem</div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration Status */}
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Configuration: {currentConfig.name}</span>
                    <span className="text-sm">Accessibility validated</span>
                  </div>
                </CardContent>
              </Card>
            </TemplateContainer>
          </div>

          {/* Typography Demonstration Sections */}
          <div className="template-section py-8">
            <TemplateContainer maxWidth="2xl">
              <div className="space-y-6">
                {/* Heading Hierarchy */}
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle>Heading Hierarchy</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <h1>H1: Main Resume Title</h1>
                    <h2>H2: Section Headers</h2>
                    <h3>H3: Subsection Headers</h3>
                    <h4>H4: Item Titles</h4>
                    <p>Body text: This is how regular paragraph text appears with the current typography settings. It demonstrates line height, letter spacing, and font weight.</p>
                  </CardContent>
                </Card>

                {/* Content Density Examples */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="template-card">
                    <CardHeader>
                      <CardTitle>Work Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold">Senior Software Engineer</h4>
                          <p className="text-muted-foreground">Tech Company • 2020-2023</p>
                          <p className="mt-2">Led development of scalable web applications using React and Node.js. Managed a team of 5 developers and improved system performance by 40%.</p>
                        </div>
                        <div>
                          <h4 className="font-semibold">Software Engineer</h4>
                          <p className="text-muted-foreground">Startup Inc • 2018-2020</p>
                          <p className="mt-2">Built full-stack applications and implemented CI/CD pipelines. Contributed to product architecture decisions and mentored junior developers.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="template-card">
                    <CardHeader>
                      <CardTitle>Technical Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium">Frontend</h4>
                          <p className="text-sm text-muted-foreground">React, TypeScript, Next.js, Tailwind CSS</p>
                        </div>
                        <div>
                          <h4 className="font-medium">Backend</h4>
                          <p className="text-sm text-muted-foreground">Node.js, Express, PostgreSQL, Redis</p>
                        </div>
                        <div>
                          <h4 className="font-medium">DevOps</h4>
                          <p className="text-sm text-muted-foreground">Docker, AWS, GitHub Actions, Terraform</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Font Size Demonstration */}
                <Card className="template-card">
                  <CardHeader>
                    <CardTitle>Font Size Scale Demonstration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div style={{ fontSize: 'var(--font-size-xs)' }}>Extra Small Text (XS)</div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>Small Text (SM)</div>
                    <div style={{ fontSize: 'var(--font-size-base)' }}>Base Text Size</div>
                    <div style={{ fontSize: 'var(--font-size-lg)' }}>Large Text (LG)</div>
                    <div style={{ fontSize: 'var(--font-size-xl)' }}>Extra Large Text (XL)</div>
                    <div style={{ fontSize: 'var(--font-size-2xl)' }}>2X Large Text (2XL)</div>
                    <div style={{ fontSize: 'var(--font-size-3xl)' }}>3X Large Text (3XL)</div>
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

export default TypographyCustomizerExample;