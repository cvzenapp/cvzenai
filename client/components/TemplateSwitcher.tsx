/**
 * Template Switcher Component
 * Allows switching between templates while preserving user content
 */

import React, { useState, useEffect } from 'react';
import { Resume } from '@shared/api';
import { TemplateConfig, getAllTemplates } from '@/services/templateService';
import { TemplatePreviewService } from '@/services/templatePreviewService';
import { templateContentRegistry } from '@/services/templateContentRegistry';
import { TemplateSpecificContent } from '@/types/templateContent';
import { getContentIdForTemplateId } from '@/services/templateContentInitializer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Grid3X3, 
  List, 
  Filter,
  Check,
  ArrowRight,
  Zap,
  Eye,
  Download,
  Star,
  Clock,
  TrendingUp
} from 'lucide-react';

export interface TemplateSwitcherProps {
  resumeData: Resume;
  currentTemplateId: string;
  onTemplateSelect: (templateId: string) => void;
  onPreview?: (templateId: string) => void;
  className?: string;
  showPreview?: boolean;
  compact?: boolean;
}

export interface TemplateCompatibilityInfo {
  templateId: string;
  compatible: boolean;
  compatibilityScore: number;
  issues: string[];
  suggestions: string[];
}

export default function TemplateSwitcher({
  resumeData,
  currentTemplateId,
  onTemplateSelect,
  onPreview,
  className = '',
  showPreview = true,
  compact = false
}: TemplateSwitcherProps) {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<TemplateConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [compatibilityInfo, setCompatibilityInfo] = useState<Record<string, TemplateCompatibilityInfo>>({});
  const [loading, setLoading] = useState(true);

  // Load templates and compatibility info
  useEffect(() => {
    loadTemplates();
  }, [resumeData]);

  // Filter templates based on search and category
  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Get all available templates from the template service (same as Templates page)
      const allTemplates = getAllTemplates();
      
      // Show all templates - they now have content registered in the initializer
      setTemplates(allTemplates);

      // Calculate compatibility for each template
      const compatibility: Record<string, TemplateCompatibilityInfo> = {};
      
      for (const template of allTemplates) {
        const validation = TemplatePreviewService.validateTemplateCompatibility(
          resumeData,
          template.id
        );
        
        compatibility[template.id] = {
          templateId: template.id,
          compatible: validation.compatible,
          compatibilityScore: calculateCompatibilityScore(validation, template),
          issues: validation.issues,
          suggestions: validation.suggestions
        };
      }
      
      setCompatibilityInfo(compatibility);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.industry.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Sort by compatibility score
    filtered.sort((a, b) => {
      const scoreA = compatibilityInfo[a.id]?.compatibilityScore || 0;
      const scoreB = compatibilityInfo[b.id]?.compatibilityScore || 0;
      return scoreB - scoreA;
    });

    setFilteredTemplates(filtered);
  };

  const calculateCompatibilityScore = (
    validation: ReturnType<typeof TemplatePreviewService.validateTemplateCompatibility>,
    template: TemplateConfig
  ): number => {
    let score = 100;
    
    // Deduct points for issues
    score -= validation.issues.length * 20;
    
    // Deduct points for missing features
    if (template.features.showTechStack && !resumeData.skills.some(s => s.category.toLowerCase().includes('tech'))) {
      score -= 15;
    }
    if (template.features.showPortfolio && !resumeData.projects.length) {
      score -= 15;
    }
    if (template.features.showMetrics && !resumeData.experiences.some(e => e.keyMetrics?.length)) {
      score -= 10;
    }
    
    return Math.max(0, score);
  };

  const getUniqueCategories = () => {
    const categories = new Set(templates.map(t => t.category));
    return Array.from(categories);
  };

  const handleTemplateSelect = (templateId: string) => {
    onTemplateSelect(templateId);
  };

  const handlePreview = (templateId: string) => {
    if (onPreview) {
      onPreview(templateId);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-64 ${className}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Switch Template</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a template that best fits your profile. Your content will be preserved.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-input rounded-md bg-background text-sm"
        >
          <option value="all">All Categories</option>
          {getUniqueCategories().map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Templates Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? `grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-6`
          : 'space-y-4'
      }>
        {filteredTemplates.map((template) => {
          const compatibility = compatibilityInfo[template.id];
          const isSelected = template.id === currentTemplateId;
          
          return (
            <TemplateCard
              key={template.id}
              template={template}
              compatibility={compatibility}
              isSelected={isSelected}
              viewMode={viewMode}
              onSelect={() => handleTemplateSelect(template.id)}
              onPreview={() => handlePreview(template.id)}
              showPreview={showPreview}
              compact={compact}
            />
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No templates found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or category filter.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Template Card Component
 */
interface TemplateCardProps {
  template: TemplateConfig;
  compatibility: TemplateCompatibilityInfo;
  isSelected: boolean;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
  onPreview: () => void;
  showPreview: boolean;
  compact: boolean;
}

function TemplateCard({
  template,
  compatibility,
  isSelected,
  viewMode,
  onSelect,
  onPreview,
  showPreview,
  compact
}: TemplateCardProps) {
  const [templateContent, setTemplateContent] = useState<TemplateSpecificContent | null>(null);

  useEffect(() => {
    // Load template-specific content for preview
    const contentId = getContentIdForTemplateId(template.id);
    const content = contentId ? templateContentRegistry.getTemplateContent(contentId) : null;
    setTemplateContent(content);
  }, [template.id]);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Fair';
  };

  const renderTemplatePreview = () => {
    if (!templateContent) {
      return (
        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-gradient-to-br from-gray-50 to-gray-100">
          No Preview
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white p-2 text-xs overflow-hidden">
        {/* Mini resume preview */}
        <div className="space-y-1">
          {/* Header */}
          <div className="text-center border-b pb-1">
            <div className="font-bold text-[8px] text-gray-800 truncate">
              {templateContent.personalInfo.name}
            </div>
            <div className="text-[6px] text-gray-600 truncate">
              {templateContent.personalInfo.title}
            </div>
          </div>
          
          {/* Summary */}
          <div className="space-y-0.5">
            <div className="text-[6px] font-semibold text-gray-700">SUMMARY</div>
            <div className="text-[5px] text-gray-600 line-clamp-2">
              {templateContent.professionalSummary}
            </div>
          </div>
          
          {/* Skills */}
          <div className="space-y-0.5">
            <div className="text-[6px] font-semibold text-gray-700">SKILLS</div>
            <div className="flex flex-wrap gap-0.5">
              {templateContent.skills.slice(0, 4).map((skill, index) => (
                <div key={index} className="bg-blue-100 text-blue-800 text-[4px] px-1 py-0.5 rounded">
                  {skill.name}
                </div>
              ))}
            </div>
          </div>
          
          {/* Experience */}
          <div className="space-y-0.5">
            <div className="text-[6px] font-semibold text-gray-700">EXPERIENCE</div>
            {templateContent.experiences.slice(0, 2).map((exp, index) => (
              <div key={index} className="space-y-0.5">
                <div className="text-[5px] font-medium text-gray-800 truncate">
                  {exp.position}
                </div>
                <div className="text-[4px] text-gray-600 truncate">
                  {exp.company}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (viewMode === 'list') {
    return (
      <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Template Preview */}
            <div className="w-16 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded border flex-shrink-0">
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                Preview
              </div>
            </div>
            
            {/* Template Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium text-foreground truncate">{template.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                    {compatibility && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCompatibilityColor(compatibility.compatibilityScore)}`}
                      >
                        {getCompatibilityLabel(compatibility.compatibilityScore)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {showPreview && (
                    <Button variant="outline" size="sm" onClick={onPreview}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={onSelect}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className="min-w-20"
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Selected
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader className="p-0">
        {/* Template Preview */}
        <div className="aspect-[3/4] bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg relative overflow-hidden border">
          {renderTemplatePreview()}
          {isSelected && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Template Info */}
          <div>
            <h3 className="font-medium text-foreground truncate">{template.name}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-xs">
              {template.category}
            </Badge>
            {compatibility && (
              <Badge 
                variant="outline" 
                className={`text-xs ${getCompatibilityColor(compatibility.compatibilityScore)}`}
              >
                {getCompatibilityLabel(compatibility.compatibilityScore)}
              </Badge>
            )}
          </div>
          
          {/* Compatibility Issues */}
          {compatibility && compatibility.issues.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Compatibility Notes:</p>
              <ul className="space-y-0.5">
                {compatibility.issues.slice(0, 2).map((issue, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span className="line-clamp-1">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {showPreview && (
              <Button variant="outline" size="sm" onClick={onPreview} className="flex-1">
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
            )}
            <Button 
              onClick={onSelect}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              {isSelected ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Selected
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Select
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}