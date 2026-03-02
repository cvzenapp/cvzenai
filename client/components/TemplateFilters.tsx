import React from 'react';
import { Filter, X, Star, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { TemplateFilters as TemplateFiltersType, ExperienceLevel, VisualStyle } from '@/services/templateService';

interface TemplateFiltersProps {
  filters: TemplateFiltersType;
  onFiltersChange: (filters: TemplateFiltersType) => void;
  onClearFilters: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  isOpen, 
  onClose 
}: TemplateFiltersProps) {
  if (!isOpen) return null;

  const categories = [
    { id: 'technology', name: 'Technology', count: 7 },
    { id: 'design', name: 'Design & Creative', count: 1 },
    { id: 'management', name: 'Management', count: 1 },
    { id: 'academic', name: 'Academic', count: 1 },
    { id: 'marketing', name: 'Marketing', count: 1 },
    { id: 'sales', name: 'Sales', count: 1 },
    { id: 'healthcare', name: 'Healthcare', count: 3 },
    { id: 'finance', name: 'Finance', count: 3 },
    { id: 'legal', name: 'Legal', count: 3 },
    { id: 'education', name: 'Education', count: 3 },
    { id: 'nonprofit', name: 'Non-profit', count: 3 },
    { id: 'consulting', name: 'Consulting', count: 3 }
  ];

  const experienceLevels: { id: ExperienceLevel; name: string }[] = [
    { id: 'entry', name: 'Entry Level' },
    { id: 'mid', name: 'Mid Level' },
    { id: 'senior', name: 'Senior Level' },
    { id: 'executive', name: 'Executive' }
  ];

  const visualStyles: { id: VisualStyle; name: string }[] = [
    { id: 'minimal', name: 'Minimal' },
    { id: 'modern', name: 'Modern' },
    { id: 'bold', name: 'Bold' },
    { id: 'creative', name: 'Creative' },
    { id: 'corporate', name: 'Corporate' }
  ];

  const features = [
    { id: 'Tech Stack', name: 'Tech Stack' },
    { id: 'Portfolio', name: 'Portfolio' },
    { id: 'Metrics', name: 'Metrics & Analytics' },
    { id: 'Publications', name: 'Publications' },
    { id: 'Certifications', name: 'Certifications' },
    { id: 'GitHub', name: 'GitHub Integration' },
    { id: 'Languages', name: 'Languages' }
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Legal',
    'Education',
    'Non-profit',
    'Consulting',
    'Design',
    'Marketing',
    'Sales'
  ];

  const updateFilters = (key: keyof TemplateFiltersType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleArrayFilter = (key: keyof TemplateFiltersType, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilters(key, newArray);
  };

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.experienceLevels.length > 0 ||
    filters.visualStyles.length > 0 ||
    filters.features.length > 0 ||
    filters.industries.length > 0 ||
    filters.atsOptimized ||
    filters.rating > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Templates
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear All
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-auto space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={() => toggleArrayFilter('categories', category.id)}
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category.name}
                    <span className="text-xs text-gray-500 ml-1">({category.count})</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Levels */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Experience Level</h3>
            <div className="flex flex-wrap gap-2">
              {experienceLevels.map((level) => (
                <Badge
                  key={level.id}
                  variant={filters.experienceLevels.includes(level.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('experienceLevels', level.id)}
                >
                  {level.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visual Styles */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Visual Style</h3>
            <div className="flex flex-wrap gap-2">
              {visualStyles.map((style) => (
                <Badge
                  key={style.id}
                  variant={filters.visualStyles.includes(style.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('visualStyles', style.id)}
                >
                  {style.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-2">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`feature-${feature.id}`}
                    checked={filters.features.includes(feature.id)}
                    onCheckedChange={() => toggleArrayFilter('features', feature.id)}
                  />
                  <label
                    htmlFor={`feature-${feature.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {feature.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Industries</h3>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry) => (
                <Badge
                  key={industry}
                  variant={filters.industries.includes(industry) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleArrayFilter('industries', industry)}
                >
                  {industry}
                </Badge>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Minimum Rating</h3>
            <div className="px-3">
              <Slider
                value={[filters.rating]}
                onValueChange={(value) => updateFilters('rating', value[0])}
                max={5}
                min={0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Any</span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {filters.rating.toFixed(1)}+
                </span>
              </div>
            </div>
          </div>

          {/* ATS Optimized */}
          <div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ats-optimized"
                checked={filters.atsOptimized}
                onCheckedChange={(checked) => updateFilters('atsOptimized', checked)}
              />
              <label
                htmlFor="ats-optimized"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Shield className="h-4 w-4 text-green-500" />
                ATS Optimized Only
              </label>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-1">
                {filters.categories.map(cat => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {categories.find(c => c.id === cat)?.name}
                  </Badge>
                ))}
                {filters.experienceLevels.map(level => (
                  <Badge key={level} variant="secondary" className="text-xs">
                    {experienceLevels.find(l => l.id === level)?.name}
                  </Badge>
                ))}
                {filters.visualStyles.map(style => (
                  <Badge key={style} variant="secondary" className="text-xs">
                    {visualStyles.find(s => s.id === style)?.name}
                  </Badge>
                ))}
                {filters.features.map(feature => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {filters.industries.map(industry => (
                  <Badge key={industry} variant="secondary" className="text-xs">
                    {industry}
                  </Badge>
                ))}
                {filters.rating > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {filters.rating.toFixed(1)}+ Rating
                  </Badge>
                )}
                {filters.atsOptimized && (
                  <Badge variant="secondary" className="text-xs">
                    ATS Optimized
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}