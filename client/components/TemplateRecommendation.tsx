/**
 * Template Recommendation Component
 * Displays template recommendations with explanations for suggestions
 */

import React from 'react';
import { TemplateRecommendation as TemplateRecommendationType } from '../services/templateService';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Star, CheckCircle, Info, Zap } from 'lucide-react';

interface TemplateRecommendationProps {
  recommendation: TemplateRecommendationType;
  onSelect: (templateId: string) => void;
  onPreview?: (templateId: string) => void;
  showReasons?: boolean;
  compact?: boolean;
}

export const TemplateRecommendation: React.FC<TemplateRecommendationProps> = ({
  recommendation,
  onSelect,
  onPreview,
  showReasons = true,
  compact = false
}) => {
  const { template, score, reasons, category } = recommendation;

  const getCategoryIcon = () => {
    switch (category) {
      case 'perfect-match':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'good-fit':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'alternative':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'perfect-match':
        return 'Perfect Match';
      case 'good-fit':
        return 'Good Fit';
      case 'alternative':
        return 'Alternative';
      default:
        return '';
    }
  };

  const getCategoryColor = () => {
    switch (category) {
      case 'perfect-match':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'good-fit':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'alternative':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = () => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-gray-600';
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelect(template.id)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{template.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{template.industry}</p>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <Badge variant="outline" className={`text-xs ${getCategoryColor()}`}>
                {getCategoryIcon()}
                <span className="ml-1">{Math.round(score)}%</span>
              </Badge>
            </div>
          </div>
          
          {showReasons && reasons.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-700 line-clamp-2">
                {reasons[0]}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {template.industry} • {template.description}
            </CardDescription>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-4">
            <Badge variant="outline" className={`${getCategoryColor()}`}>
              {getCategoryIcon()}
              <span className="ml-1">{getCategoryLabel()}</span>
            </Badge>
            
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-gray-400" />
              <span className={`text-sm font-medium ${getScoreColor()}`}>
                {Math.round(score)}% match
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Template Preview */}
        <div 
          className="w-full h-32 bg-gradient-to-br rounded-lg mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ 
            background: template.colors.background || template.colors.primary 
          }}
          onClick={() => onPreview?.(template.id)}
        >
          <div className="p-4 h-full flex flex-col justify-between text-white">
            <div>
              <div className="h-2 bg-white/30 rounded mb-1" style={{ width: '60%' }}></div>
              <div className="h-1 bg-white/20 rounded" style={{ width: '40%' }}></div>
            </div>
            <div className="space-y-1">
              <div className="h-1 bg-white/20 rounded" style={{ width: '80%' }}></div>
              <div className="h-1 bg-white/20 rounded" style={{ width: '70%' }}></div>
              <div className="h-1 bg-white/20 rounded" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>

        {/* Recommendation Reasons */}
        {showReasons && reasons.length > 0 && (
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Why this template?</h5>
            <ul className="space-y-1">
              {reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Template Features */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {template.features.showTechStack && (
              <Badge variant="secondary" className="text-xs">Tech Stack</Badge>
            )}
            {template.features.showPortfolio && (
              <Badge variant="secondary" className="text-xs">Portfolio</Badge>
            )}
            {template.features.showMetrics && (
              <Badge variant="secondary" className="text-xs">Metrics</Badge>
            )}
            {template.features.showCertifications && (
              <Badge variant="secondary" className="text-xs">Certifications</Badge>
            )}
            {template.features.showPublications && (
              <Badge variant="secondary" className="text-xs">Publications</Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={() => onSelect(template.id)}
            className="flex-1"
            variant={category === 'perfect-match' ? 'default' : 'outline'}
          >
            Use Template
          </Button>
          
          {onPreview && (
            <Button 
              onClick={() => onPreview(template.id)}
              variant="ghost"
              size="sm"
            >
              Preview
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateRecommendation;