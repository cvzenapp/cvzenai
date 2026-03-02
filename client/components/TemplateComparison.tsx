import React from 'react';
import { X, Check, Minus, Star, Download, Eye, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TemplateComparison as TemplateComparisonType, TemplateConfig } from '@/services/templateService';

interface TemplateComparisonProps {
  comparison: TemplateComparisonType;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  onPreviewTemplate: (templateId: string) => void;
}

export default function TemplateComparison({ 
  comparison, 
  onClose, 
  onSelectTemplate, 
  onPreviewTemplate 
}: TemplateComparisonProps) {
  const { templates, comparisonMatrix } = comparison;

  const comparisonFeatures = [
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'industry', label: 'Industry', type: 'text' },
    { key: 'rating', label: 'Rating', type: 'rating' },
    { key: 'downloads', label: 'Downloads', type: 'text' },
    { key: 'experienceLevel', label: 'Experience Level', type: 'badge' },
    { key: 'atsOptimized', label: 'ATS Optimized', type: 'boolean' },
    { key: 'isNew', label: 'New Template', type: 'boolean' },
    { key: 'showTechStack', label: 'Tech Stack', type: 'boolean' },
    { key: 'showPortfolio', label: 'Portfolio', type: 'boolean' },
    { key: 'showMetrics', label: 'Metrics', type: 'boolean' },
    { key: 'showPublications', label: 'Publications', type: 'boolean' },
    { key: 'showCertifications', label: 'Certifications', type: 'boolean' },
    { key: 'headerStyle', label: 'Header Style', type: 'text' },
    { key: 'sidebarPosition', label: 'Sidebar Position', type: 'text' },
    { key: 'cardStyle', label: 'Card Style', type: 'text' }
  ];

  const renderFeatureValue = (value: any, type: string) => {
    switch (type) {
      case 'boolean':
        return value ? (
          <Check className="h-4 w-4 text-green-500 mx-auto" />
        ) : (
          <Minus className="h-4 w-4 text-gray-400 mx-auto" />
        );
      case 'rating':
        return (
          <div className="flex items-center justify-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{value}</span>
          </div>
        );
      case 'badge':
        return (
          <Badge variant="secondary" className="text-xs">
            {value}
          </Badge>
        );
      case 'text':
      default:
        return <span className="text-sm text-center">{value}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">Template Comparison</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-auto">
          {/* Template Headers */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="font-medium text-sm text-gray-600">Features</div>
            {templates.map((template) => (
              <div key={template.id} className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-3">
                  <h3 className="font-semibold text-sm mb-2">{template.name}</h3>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{comparisonMatrix[template.id].rating}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {comparisonMatrix[template.id].downloads} downloads
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPreviewTemplate(template.id)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelectTemplate(template.id)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="space-y-2">
            {comparisonFeatures.map((feature) => (
              <div key={feature.key} className="grid grid-cols-4 gap-4 py-3 border-b border-gray-100">
                <div className="font-medium text-sm text-gray-700">
                  {feature.label}
                </div>
                {templates.map((template) => (
                  <div key={template.id} className="flex justify-center">
                    {renderFeatureValue(
                      comparisonMatrix[template.id][feature.key],
                      feature.type
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close Comparison
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}