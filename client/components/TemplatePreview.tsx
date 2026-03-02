/**
 * Template Preview Component
 * Displays template preview with user content and responsive design
 */

import React, { useState, useEffect, useRef } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig } from '@/services/templateService';
import { 
  TemplatePreviewService, 
  TemplatePreviewData,
  ContentAdaptationOptions 
} from '@/services/templatePreviewService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Download, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Zap,
  Settings
} from 'lucide-react';

export interface TemplatePreviewProps {
  resumeData: Resume;
  templateId: string;
  onTemplateSwitch?: (templateId: string) => void;
  onDownload?: () => void;
  className?: string;
  showControls?: boolean;
  showMetadata?: boolean;
  responsive?: boolean;
}

export interface PreviewViewport {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  width: string;
  height: string;
  breakpoint: string;
}

const PREVIEW_VIEWPORTS: PreviewViewport[] = [
  {
    id: 'mobile',
    name: 'Mobile',
    icon: Smartphone,
    width: '375px',
    height: '667px',
    breakpoint: 'mobile'
  },
  {
    id: 'tablet',
    name: 'Tablet',
    icon: Tablet,
    width: '768px',
    height: '1024px',
    breakpoint: 'tablet'
  },
  {
    id: 'desktop',
    name: 'Desktop',
    icon: Monitor,
    width: '100%',
    height: 'auto',
    breakpoint: 'desktop'
  }
];

export default function TemplatePreview({
  resumeData,
  templateId,
  onTemplateSwitch,
  onDownload,
  className = '',
  showControls = true,
  showMetadata = true,
  responsive = true
}: TemplatePreviewProps) {
  const [previewData, setPreviewData] = useState<TemplatePreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentViewport, setCurrentViewport] = useState<PreviewViewport>(PREVIEW_VIEWPORTS[2]); // Default to desktop
  const [adaptationOptions, setAdaptationOptions] = useState<ContentAdaptationOptions>({
    preserveFormatting: true,
    fillMissingWithPlaceholders: true,
    optimizeForTemplate: true,
    responsiveBreakpoints: ['mobile', 'tablet', 'desktop']
  });
  const [refreshing, setRefreshing] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);

  // Load preview data
  useEffect(() => {
    loadPreviewData();
  }, [resumeData, templateId, adaptationOptions]);

  const loadPreviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const preview = await TemplatePreviewService.generatePreview(
        resumeData,
        templateId,
        adaptationOptions
      );
      
      setPreviewData(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
      console.error('Preview generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPreviewData();
    setRefreshing(false);
  };

  const handleViewportChange = (viewport: PreviewViewport) => {
    setCurrentViewport(viewport);
  };

  const handleTemplateSwitch = async (newTemplateId: string) => {
    if (previewData && onTemplateSwitch) {
      try {
        setLoading(true);
        const newPreview = await TemplatePreviewService.switchTemplate(previewData, newTemplateId);
        setPreviewData(newPreview);
        onTemplateSwitch(newTemplateId);
      } catch (err) {
        setError('Failed to switch template');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && !previewData) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Generating preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center space-y-4 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Preview Error</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Preview Controls */}
      {showControls && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Template Preview</h3>
            <Badge variant="outline" className="text-xs">
              {previewData.templateConfig.name}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Viewport Controls */}
            {responsive && (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                {PREVIEW_VIEWPORTS.map((viewport) => {
                  const Icon = viewport.icon;
                  return (
                    <Button
                      key={viewport.id}
                      variant={currentViewport.id === viewport.id ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleViewportChange(viewport)}
                      className="h-8 w-8 p-0"
                      title={viewport.name}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
            )}
            
            {/* Action Buttons */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {onDownload && (
              <Button onClick={onDownload} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Preview Metadata */}
      {showMetadata && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Preview Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Completion Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{previewData.previewMetadata.completionPercentage}%</span>
                </div>
                <Progress value={previewData.previewMetadata.completionPercentage} className="h-2" />
              </div>
              
              {/* Template Compatibility */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Compatibility</span>
                  <span className="font-medium">{previewData.previewMetadata.templateCompatibility}%</span>
                </div>
                <Progress value={previewData.previewMetadata.templateCompatibility} className="h-2" />
              </div>
              
              {/* Estimated Length */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Est. Length</span>
                  <span className="font-medium">{previewData.previewMetadata.estimatedLength} page{previewData.previewMetadata.estimatedLength !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            
            {/* Recommendations */}
            {previewData.previewMetadata.recommendedImprovements.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Recommendations</h4>
                <div className="space-y-1">
                  {previewData.previewMetadata.recommendedImprovements.slice(0, 3).map((improvement, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Container */}
      <div className="relative">
        <div 
          className="mx-auto transition-all duration-300 ease-in-out"
          style={{
            width: currentViewport.width,
            maxWidth: '100%'
          }}
        >
          <div 
            ref={previewRef}
            className="bg-white border border-border rounded-lg shadow-sm overflow-hidden"
            style={{
              minHeight: currentViewport.height !== 'auto' ? currentViewport.height : '600px'
            }}
          >
            <TemplatePreviewRenderer 
              previewData={previewData}
              viewport={currentViewport}
            />
          </div>
        </div>
        
        {/* Viewport Label */}
        {responsive && currentViewport.id !== 'desktop' && (
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm border rounded px-2 py-1">
            <span className="text-xs text-muted-foreground">{currentViewport.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Template Preview Renderer Component
 * Renders the actual template content with adapted data
 */
interface TemplatePreviewRendererProps {
  previewData: TemplatePreviewData;
  viewport: PreviewViewport;
}

function TemplatePreviewRenderer({ previewData, viewport }: TemplatePreviewRendererProps) {
  const { adaptedContent, placeholderContent, templateConfig } = previewData;
  
  // Use adapted content, falling back to placeholder content for missing fields
  const displayContent = {
    personalInfo: adaptedContent.personalInfo.name ? adaptedContent.personalInfo : placeholderContent.personalInfo,
    summary: adaptedContent.summary || placeholderContent.summary,
    experiences: adaptedContent.experiences.length ? adaptedContent.experiences : placeholderContent.experiences,
    skills: adaptedContent.skills.length ? adaptedContent.skills : placeholderContent.skills,
    education: adaptedContent.education.length ? adaptedContent.education : placeholderContent.education,
    projects: adaptedContent.projects.length ? adaptedContent.projects : placeholderContent.projects
  };

  return (
    <div className={`p-6 ${getViewportClasses(viewport.breakpoint)}`}>
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {displayContent.personalInfo.name}
            </h1>
            <p className="text-lg text-primary font-medium">
              {displayContent.personalInfo.title}
            </p>
          </div>
        </div>
        
        {/* Contact Information */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {displayContent.personalInfo.email && (
            <span>{displayContent.personalInfo.email}</span>
          )}
          {displayContent.personalInfo.phone && (
            <span>{displayContent.personalInfo.phone}</span>
          )}
          {displayContent.personalInfo.location && (
            <span>{displayContent.personalInfo.location}</span>
          )}
        </div>
      </div>

      {/* Summary Section */}
      {displayContent.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Professional Summary</h2>
          <p className="text-muted-foreground leading-relaxed">{displayContent.summary}</p>
        </div>
      )}

      {/* Experience Section */}
      {displayContent.experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Experience</h2>
          <div className="space-y-4">
            {displayContent.experiences.slice(0, 3).map((exp, index) => (
              <div key={exp.id || index} className="border-l-2 border-primary/20 pl-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <h3 className="font-medium text-foreground">{exp.position}</h3>
                  <span className="text-sm text-muted-foreground">
                    {exp.startDate} - {exp.endDate || 'Present'}
                  </span>
                </div>
                <p className="text-sm font-medium text-primary mb-2">{exp.company}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {exp.description}
                </p>
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.technologies.slice(0, 5).map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Section */}
      {displayContent.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(
              displayContent.skills.reduce((acc, skill) => {
                const category = skill.category || 'Other';
                if (!acc[category]) acc[category] = [];
                acc[category].push(skill);
                return acc;
              }, {} as Record<string, typeof displayContent.skills>)
            ).slice(0, 4).map(([category, skills]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
                <div className="space-y-2">
                  {skills.slice(0, 4).map((skill, index) => (
                    <div key={skill.id || index} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{skill.name}</span>
                      <div className="w-16 bg-muted rounded-full h-1.5">
                        <div 
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education Section */}
      {displayContent.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Education</h2>
          <div className="space-y-3">
            {displayContent.education.slice(0, 2).map((edu, index) => (
              <div key={edu.id || index}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <h3 className="font-medium text-foreground">{edu.degree} in {edu.field}</h3>
                  <span className="text-sm text-muted-foreground">
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <p className="text-sm text-primary">{edu.institution}</p>
                {edu.gpa && (
                  <p className="text-sm text-muted-foreground">GPA: {edu.gpa}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      {displayContent.projects.length > 0 && templateConfig.features.showPortfolio && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Projects</h2>
          <div className="space-y-4">
            {displayContent.projects.slice(0, 2).map((project, index) => (
              <div key={project.id || index} className="border border-border rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.technologies.slice(0, 6).map((tech, techIndex) => (
                    <Badge key={techIndex} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get viewport-specific CSS classes
 */
function getViewportClasses(breakpoint: string): string {
  const baseClasses = 'transition-all duration-300';
  
  switch (breakpoint) {
    case 'mobile':
      return `${baseClasses} text-sm`;
    case 'tablet':
      return `${baseClasses} text-sm`;
    case 'desktop':
    default:
      return `${baseClasses} text-base`;
  }
}