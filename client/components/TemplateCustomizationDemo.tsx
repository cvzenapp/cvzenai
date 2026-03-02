/**
 * Template Customization Demo Component
 * Demonstrates the enhanced template customization UI
 */

import React, { useState } from 'react';
import { TemplateCustomizer } from './TemplateCustomizer';
import { TemplateConfig } from '../services/templateService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Settings, Download, Share2 } from 'lucide-react';

// Mock template for demo
const mockTemplate: TemplateConfig = {
  id: 'demo-template',
  name: 'Modern Tech Resume',
  category: 'technology',
  description: 'A modern, clean template perfect for technology professionals',
  industry: 'Technology',
  colors: {
    primary: '#1e40af',
    secondary: '#3730a3',
    accent: '#0ea5e9',
    background: '#ffffff',
    text: '#1f2937',
    muted: '#6b7280'
  },
  typography: {
    headingFont: "'Inter', 'Segoe UI', sans-serif",
    bodyFont: "'Inter', 'Segoe UI', sans-serif",
    codeFont: "'JetBrains Mono', 'Courier New', monospace"
  },
  layout: {
    headerStyle: 'tech-focused',
    sidebarPosition: 'left',
    sectionPriority: ['contact', 'summary', 'experience', 'skills', 'projects'],
    cardStyle: 'code-blocks'
  },
  sections: {
    required: ['contact', 'summary', 'experience'],
    optional: ['skills', 'projects', 'education', 'certifications'],
    industrySpecific: ['techStack', 'github', 'portfolio']
  },
  features: {
    showTechStack: true,
    showPortfolio: true,
    showMetrics: true,
    showPublications: false,
    showCampaigns: false,
    showTeamSize: false,
    showGithub: true,
    showDesignTools: false,
    showCertifications: true,
    showLanguages: false
  }
};

export function TemplateCustomizationDemo() {
  const [customizedTemplate, setCustomizedTemplate] = useState<TemplateConfig>(mockTemplate);
  const [showPreview, setShowPreview] = useState(true);
  const [savedCustomizations, setSavedCustomizations] = useState<string[]>([]);

  const handleCustomizationChange = (template: TemplateConfig) => {
    setCustomizedTemplate(template);
  };

  const handleSave = (customizationId: string) => {
    setSavedCustomizations(prev => [...prev, customizationId]);
    console.log('Saved customization:', customizationId);
  };

  const handlePreviewToggle = (show: boolean) => {
    setShowPreview(show);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Template Customization Demo
              </h1>
              <p className="text-gray-600">
                Experience the enhanced template customization interface with real-time preview
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                {savedCustomizations.length} saved
              </Badge>
              
              <Button variant="outline" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customizer Panel */}
          <div className="space-y-6">
            <TemplateCustomizer
              template={mockTemplate}
              userId="demo-user"
              onCustomizationChange={handleCustomizationChange}
              onSave={handleSave}
              onPreviewToggle={handlePreviewToggle}
              showPreview={showPreview}
              className="w-full"
            />
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Live Preview
                    </CardTitle>
                    <Badge variant="outline">Real-time</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <TemplatePreview template={customizedTemplate} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {Object.keys(customizedTemplate.colors).length}
              </div>
              <div className="text-sm text-gray-600">Color Properties</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {Object.keys(customizedTemplate.typography).length}
              </div>
              <div className="text-sm text-gray-600">Font Settings</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {customizedTemplate.sections.required.length + 
                 customizedTemplate.sections.optional.length + 
                 customizedTemplate.sections.industrySpecific.length}
              </div>
              <div className="text-sm text-gray-600">Available Sections</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Simple Template Preview Component
interface TemplatePreviewProps {
  template: TemplateConfig;
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Preview Header */}
      <div 
        className="h-16 p-4 flex items-center"
        style={{ 
          backgroundColor: template.colors.primary,
          color: 'white'
        }}
      >
        <div className="w-12 h-12 bg-white/20 rounded-full mr-4"></div>
        <div>
          <div className="font-semibold" style={{ fontFamily: template.typography.headingFont }}>
            John Doe
          </div>
          <div className="text-sm opacity-90">Software Engineer</div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4 flex gap-4 h-80">
        {/* Sidebar */}
        {template.layout.sidebarPosition === 'left' && (
          <div className="w-1/3 space-y-3">
            <div 
              className="h-3 rounded"
              style={{ backgroundColor: template.colors.secondary }}
            ></div>
            <div className="space-y-2">
              <div 
                className="h-2 rounded w-full"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
              <div 
                className="h-2 rounded w-3/4"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
              <div 
                className="h-2 rounded w-1/2"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <div>
            <div 
              className="h-3 rounded mb-2"
              style={{ backgroundColor: template.colors.accent }}
            ></div>
            <div className="space-y-1">
              <div 
                className="h-2 rounded w-full"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
              <div 
                className="h-2 rounded w-5/6"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
              <div 
                className="h-2 rounded w-4/5"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
            </div>
          </div>
          
          <div>
            <div 
              className="h-3 rounded mb-2"
              style={{ backgroundColor: template.colors.accent }}
            ></div>
            <div className="space-y-1">
              <div 
                className="h-2 rounded w-full"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
              <div 
                className="h-2 rounded w-3/4"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {template.layout.sidebarPosition === 'right' && (
          <div className="w-1/3 space-y-3">
            <div 
              className="h-3 rounded"
              style={{ backgroundColor: template.colors.secondary }}
            ></div>
            <div className="space-y-2">
              <div 
                className="h-2 rounded w-full"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
              <div 
                className="h-2 rounded w-3/4"
                style={{ backgroundColor: template.colors.muted }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}