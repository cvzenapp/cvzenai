/**
 * Template Preview with Switcher Integration Component
 * Combines template preview and switching functionality
 */

import React, { useState, useEffect } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { TemplatePreviewService, TemplatePreviewData } from '@/services/templatePreviewService';
import TemplatePreview from './TemplatePreview';
import TemplateSwitcher from './TemplateSwitcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Palette, 
  Download, 
  Settings,
  ArrowLeft,
  Check,
  AlertCircle,
  Zap
} from 'lucide-react';

export interface TemplatePreviewWithSwitcherProps {
  resumeData: Resume;
  initialTemplateId: string;
  onTemplateChange?: (templateId: string) => void;
  onDownload?: (templateId: string) => void;
  onClose?: () => void;
  className?: string;
  showSwitcher?: boolean;
  showPreviewControls?: boolean;
  showMetadata?: boolean;
  responsive?: boolean;
}

export default function TemplatePreviewWithSwitcher({
  resumeData,
  initialTemplateId,
  onTemplateChange,
  onDownload,
  onClose,
  className = '',
  showSwitcher = true,
  showPreviewControls = true,
  showMetadata = true,
  responsive = true
}: TemplatePreviewWithSwitcherProps) {
  const [currentTemplateId, setCurrentTemplateId] = useState(initialTemplateId);
  const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(null);
  const [showSwitcherDialog, setShowSwitcherDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial preview data
  useEffect(() => {
    loadPreviewData(currentTemplateId);
  }, [resumeData, currentTemplateId]);

  const loadPreviewData = async (templateId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const preview = await TemplatePreviewService.generatePreview(
        resumeData,
        templateId
      );
      
      setPreviewData(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
      console.error('Preview loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    if (templateId === currentTemplateId) return;

    try {
      setLoading(true);
      setCurrentTemplateId(templateId);
      
      if (previewData) {
        const newPreview = await TemplatePreviewService.switchTemplate(previewData, templateId);
        setPreviewData(newPreview);
      } else {
        await loadPreviewData(templateId);
      }
      
      setShowSwitcherDialog(false);
      
      if (onTemplateChange) {
        onTemplateChange(templateId);
      }
    } catch (err) {
      setError('Failed to switch template');
      console.error('Template switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewTemplate = (templateId: string) => {
    // For preview, we can show a quick preview without fully switching
    // This could open a modal or update a preview pane
    console.log('Preview template:', templateId);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(currentTemplateId);
    }
  };

  const getCompatibilityStatus = () => {
    if (!previewData) return null;
    
    const { templateCompatibility, recommendedImprovements } = previewData.previewMetadata;
    
    if (templateCompatibility >= 80) {
      return {
        status: 'excellent',
        color: 'text-green-600 bg-green-50',
        icon: Check,
        message: 'Excellent compatibility with your profile'
      };
    } else if (templateCompatibility >= 60) {
      return {
        status: 'good',
        color: 'text-yellow-600 bg-yellow-50',
        icon: AlertCircle,
        message: `Good compatibility. ${recommendedImprovements.length} suggestions available.`
      };
    } else {
      return {
        status: 'fair',
        color: 'text-red-600 bg-red-50',
        icon: AlertCircle,
        message: `Fair compatibility. Consider ${recommendedImprovements.length} improvements.`
      };
    }
  };

  const compatibilityStatus = getCompatibilityStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Template Info and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">Template Preview</h1>
            {previewData && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground">Current template:</span>
                <Badge variant="outline">{previewData.templateConfig.name}</Badge>
                {compatibilityStatus && (
                  <Badge variant="outline" className={compatibilityStatus.color}>
                    <compatibilityStatus.icon className="h-3 w-3 mr-1" />
                    {compatibilityStatus.status}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showSwitcher && (
            <Dialog open={showSwitcherDialog} onOpenChange={setShowSwitcherDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Palette className="h-4 w-4 mr-2" />
                  Switch Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Choose Template</DialogTitle>
                </DialogHeader>
                <TemplateSwitcher
                  resumeData={resumeData}
                  currentTemplateId={currentTemplateId}
                  onTemplateSelect={handleTemplateSelect}
                  onPreview={handlePreviewTemplate}
                  compact={true}
                />
              </DialogContent>
            </Dialog>
          )}
          
          <Button onClick={handleDownload} disabled={!previewData}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Compatibility Status Card */}
      {compatibilityStatus && showMetadata && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${compatibilityStatus.color}`}>
                <compatibilityStatus.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{compatibilityStatus.message}</p>
                {previewData && previewData.previewMetadata.recommendedImprovements.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Click on the recommendations in the preview analysis for details.
                  </p>
                )}
              </div>
              {previewData && (
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {previewData.previewMetadata.templateCompatibility}%
                  </div>
                  <div className="text-xs text-muted-foreground">compatibility</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          {showSwitcher && (
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Templates
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="preview" className="space-y-0">
          {loading && !previewData ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading template preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center space-y-4 max-w-md">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">Preview Error</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={() => loadPreviewData(currentTemplateId)} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <TemplatePreview
              resumeData={resumeData}
              templateId={currentTemplateId}
              onDownload={handleDownload}
              showControls={showPreviewControls}
              showMetadata={showMetadata}
              responsive={responsive}
            />
          )}
        </TabsContent>

        {showSwitcher && (
          <TabsContent value="templates" className="space-y-0">
            <TemplateSwitcher
              resumeData={resumeData}
              currentTemplateId={currentTemplateId}
              onTemplateSelect={handleTemplateSelect}
              onPreview={handlePreviewTemplate}
              showPreview={true}
              compact={false}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Quick Actions Footer */}
      {previewData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>{previewData.previewMetadata.completionPercentage}% complete</span>
                </div>
                <div>
                  <span>{previewData.previewMetadata.estimatedLength} page{previewData.previewMetadata.estimatedLength !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <span>{previewData.templateConfig.category} template</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveTab('templates')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Customize
                </Button>
                <Button onClick={handleDownload} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Simplified version for embedding in other components
 */
export function CompactTemplatePreview({
  resumeData,
  templateId,
  onTemplateChange,
  className = ''
}: {
  resumeData: Resume;
  templateId: string;
  onTemplateChange?: (templateId: string) => void;
  className?: string;
}) {
  return (
    <TemplatePreviewWithSwitcher
      resumeData={resumeData}
      initialTemplateId={templateId}
      onTemplateChange={onTemplateChange}
      className={className}
      showSwitcher={false}
      showPreviewControls={false}
      showMetadata={false}
      responsive={false}
    />
  );
}

/**
 * Full-featured version for dedicated preview pages
 */
export function FullTemplatePreview({
  resumeData,
  templateId,
  onTemplateChange,
  onDownload,
  onClose,
  className = ''
}: {
  resumeData: Resume;
  templateId: string;
  onTemplateChange?: (templateId: string) => void;
  onDownload?: (templateId: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <TemplatePreviewWithSwitcher
      resumeData={resumeData}
      initialTemplateId={templateId}
      onTemplateChange={onTemplateChange}
      onDownload={onDownload}
      onClose={onClose}
      className={className}
      showSwitcher={true}
      showPreviewControls={true}
      showMetadata={true}
      responsive={true}
    />
  );
}