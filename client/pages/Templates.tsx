import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Eye, Download, Code2, Palette, Users, GraduationCap,
  TrendingUp, Target, Zap, Layers, Shield, Smartphone, Settings,
  Star, Clock, CheckCircle, Filter, Search, Grid3X3, List,
  Sparkles, Award, TrendingDown, Brain, Rocket, Globe, Heart,
  GitCompare, SlidersHorizontal, ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllTemplates,
  searchTemplates,
  getTemplateComparison,
  addToFavorites,
  removeFromFavorites,
  isFavoriteTemplate,
  addToSearchHistory,
  type TemplateConfig,
  type TemplateSearchOptions
} from "@/services/templateService";
import TemplateComparison from "@/components/TemplateComparison";
import TemplateRecommendation from "@/components/TemplateRecommendation";
import { TemplateRecommendationService } from "@/services/templateRecommendationService";
import { Resume } from "@shared/api";
import TemplateFilters from "@/components/TemplateFilters";
import TemplateCard from "@/components/TemplateCard";

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "name" | "rating">("popular");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Enhanced filtering state
  const [filters, setFilters] = useState<TemplateFilters>({
    categories: [],
    experienceLevels: [],
    visualStyles: [],
    features: [],
    industries: [],
    atsOptimized: false,
    rating: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  // Template comparison state
  const [selectedTemplatesForComparison, setSelectedTemplatesForComparison] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Favorites state (mock user ID for demo)
  const userId = "demo-user";

  // Template recommendations state
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

  // Get all templates from the service - memoized to prevent infinite re-renders
  const allTemplates = useMemo(() => getAllTemplates(), []);

  // Load personalized template recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoadingRecommendations(true);

        // Mock user resume data - in production this would come from the user's actual resume
        const mockUserResume: Resume = {
          id: "user-resume-1",
          personalInfo: {
            name: "Alex Morgan",
            title: "Software Engineer",
            email: "alex@example.com",
            phone: "+1234567890",
            location: "San Francisco, CA"
          },
          summary: "Experienced software engineer with 5 years in web development",
          objective: "Seeking senior software engineer role",
          skills: [
            { id: "1", name: "JavaScript", level: 90, category: "Programming" },
            { id: "2", name: "React", level: 85, category: "Frontend" },
            { id: "3", name: "Node.js", level: 80, category: "Backend" },
            { id: "4", name: "Python", level: 75, category: "Programming" },
            { id: "5", name: "AWS", level: 70, category: "Cloud" }
          ],
          experiences: [
            {
              id: "1",
              company: "Tech Startup Inc",
              position: "Senior Software Engineer",
              startDate: "2021-01-01",
              endDate: null,
              description: "Lead development of web applications using React and Node.js. Managed team of 3 developers."
            },
            {
              id: "2",
              company: "Software Solutions LLC",
              position: "Software Engineer",
              startDate: "2019-06-01",
              endDate: "2020-12-31",
              description: "Developed full-stack web applications using modern JavaScript frameworks."
            }
          ],
          education: [
            {
              id: "1",
              institution: "University of Technology",
              degree: "Bachelor of Science",
              field: "Computer Science",
              startDate: "2015-09-01",
              endDate: "2019-05-31"
            }
          ],
          projects: [
            {
              id: "1",
              name: "E-commerce Platform",
              description: "Built a full-stack e-commerce platform using React and Node.js",
              technologies: ["React", "Node.js", "MongoDB"],
              startDate: "2020-01-01"
            }
          ],
          upvotes: 0,
          rating: 0,
          isShortlisted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const recommendations = await TemplateRecommendationService.generateRecommendations(
          mockUserResume,
          allTemplates
        );

        setRecommendations(recommendations);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [allTemplates]);

  // Enhanced template data with better categorization and visual hierarchy
  const templates = allTemplates.map((template) => ({
    id: template.id,
    name: template.name,
    category: getCategoryDisplayName(template.category),
    templateKey: template.category,
    image: getTemplateImage(template.category),
    description: template.description,
    popular: isPopularTemplate(template.category),
    features: getTemplateFeatures(template),
    icon: getCategoryIcon(template.category),
    difficulty: getTemplateDifficulty(template.category),
    industry: template.industry,
    rating: getTemplateRating(template.category),
    downloads: getTemplateDownloads(template.category),
    isNew: isNewTemplate(template.category),
    tags: getTemplateTags(template),
  }));

  // Enhanced categories with better organization and visual hierarchy
  const categories = [
    { key: "All", name: "All Templates", icon: Layers, count: templates.length },
    { key: "Technology", name: "Technology", icon: Code2, count: templates.filter(t => t.category === "Technology").length },
    { key: "Design & Creative", name: "Design & Creative", icon: Palette, count: templates.filter(t => t.category === "Design & Creative").length },
    { key: "Leadership", name: "Leadership", icon: Users, count: templates.filter(t => t.category === "Leadership").length },
    { key: "Academic", name: "Academic", icon: GraduationCap, count: templates.filter(t => t.category === "Academic").length },
    { key: "Marketing", name: "Marketing", icon: TrendingUp, count: templates.filter(t => t.category === "Marketing").length },
    { key: "Sales", name: "Sales", icon: Target, count: templates.filter(t => t.category === "Sales").length },
  ];

  function getCategoryDisplayName(category: string): string {
    const categoryMap: Record<string, string> = {
      'technology': 'Technology',
      'tech-modern': 'Technology',
      'tech-minimal': 'Technology',
      'tech-senior': 'Technology',
      'tech-fullstack': 'Technology',
      'tech-devops': 'Technology',
      'tech-mobile': 'Technology',
      'design': 'Design & Creative',
      'management': 'Leadership',
      'academic': 'Academic',
      'marketing': 'Marketing',
      'sales': 'Sales',
    };
    return categoryMap[category] || 'Technology';
  }

  function getTemplateImage(category: string): string {
    const imageMap: Record<string, string> = {
      'technology': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=500&fit=crop&q=80',
      'tech-modern': 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=500&fit=crop&q=80',
      'design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=500&fit=crop&q=80',
      'management': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80',
      'academic': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop&q=80',
      'marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=500&fit=crop&q=80',
      'sales': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=500&fit=crop&q=80',
    };
    return imageMap[category] || imageMap['technology'];
  }

  function isPopularTemplate(category: string): boolean {
    return ['technology', 'tech-modern', 'tech-fullstack', 'design'].includes(category);
  }

  function getTemplateFeatures(template: TemplateConfig): string[] {
    const features = [];
    if (template.features.showTechStack) features.push('Tech Stack');
    if (template.features.showPortfolio) features.push('Portfolio');
    if (template.features.showMetrics) features.push('Metrics');
    if (template.features.showGithub) features.push('GitHub');
    if (template.features.showCertifications) features.push('Certifications');
    return features.slice(0, 3);
  }

  function getCategoryIcon(category: string) {
    const iconMap: Record<string, any> = {
      'technology': Code2,
      'tech-modern': Zap,
      'design': Palette,
      'management': Users,
      'academic': GraduationCap,
      'marketing': TrendingUp,
      'sales': Target,
    };
    return iconMap[category] || Code2;
  }

  function getTemplateDifficulty(category: string): 'Beginner' | 'Intermediate' | 'Advanced' {
    const difficultyMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
      'technology': 'Intermediate',
      'tech-modern': 'Beginner',
      'design': 'Intermediate',
      'management': 'Advanced',
      'academic': 'Advanced',
      'marketing': 'Intermediate',
      'sales': 'Intermediate',
    };
    return difficultyMap[category] || 'Intermediate';
  }

  function getTemplateRating(category: string): number {
    const ratingMap: Record<string, number> = {
      'technology': 4.8,
      'tech-modern': 4.9,
      'design': 4.9,
      'management': 4.6,
      'academic': 4.4,
      'marketing': 4.7,
      'sales': 4.5,
    };
    return ratingMap[category] || 4.5;
  }

  function getTemplateDownloads(category: string): string {
    const downloadsMap: Record<string, string> = {
      'technology': '12.5K',
      'tech-modern': '18.2K',
      'design': '22.3K',
      'management': '5.9K',
      'academic': '3.1K',
      'marketing': '7.6K',
      'sales': '4.8K',
    };
    return downloadsMap[category] || '1.2K';
  }

  function isNewTemplate(category: string): boolean {
    return ['tech-modern', 'tech-fullstack', 'tech-mobile'].includes(category);
  }

  function getTemplateTags(template: TemplateConfig): string[] {
    const tags = [];
    if (template.features.showTechStack) tags.push('Tech Stack');
    if (template.features.showPortfolio) tags.push('Portfolio');
    if (template.features.showMetrics) tags.push('Analytics');
    if (template.features.showGithub) tags.push('GitHub');
    if (template.features.showCertifications) tags.push('Certified');
    if (template.features.showLanguages) tags.push('Multilingual');
    return tags;
  }

  function getTemplatePreviewStyle(templateKey: string): string {
    const styleMap: Record<string, string> = {
      'technology': 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white',
      'tech-modern': 'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white',
      'design': 'bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 text-white',
      'management': 'bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white',
      'academic': 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-300 text-gray-900',
      'marketing': 'bg-gradient-to-br from-red-400 via-pink-500 to-purple-600 text-white',
      'sales': 'bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 text-white',
    };
    return styleMap[templateKey] || styleMap['technology'];
  }

  function getTemplatePreview(templateKey: string, templateName: string): JSX.Element {
    return (
      <div className="w-full h-full flex flex-col p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-white/20 rounded-full"></div>
          <div className="h-3 bg-white/80 rounded w-3/4"></div>
        </div>
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-white/60 rounded w-full"></div>
          <div className="h-2 bg-white/40 rounded w-5/6"></div>
          <div className="h-2 bg-white/40 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  // Helper function to map display categories to actual template categories
  function getActualCategoriesFromDisplay(displayCategory: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'Technology': ['technology', 'tech-modern', 'tech-minimal', 'tech-senior', 'tech-fullstack', 'tech-devops', 'tech-mobile'],
      'Design & Creative': ['design'],
      'Leadership': ['management'],
      'Academic': ['academic'],
      'Marketing': ['marketing'],
      'Sales': ['sales'],
    };
    return categoryMap[displayCategory] || [];
  }

  // Enhanced filtering and sorting using the new search functionality
  const filteredAndSortedTemplates = useMemo(() => {
    // Convert display category to actual template categories
    let actualCategories: string[] = [];
    if (selectedCategory !== "All") {
      actualCategories = getActualCategoriesFromDisplay(selectedCategory);
    }

    const searchOptions: TemplateSearchOptions = {
      query: searchQuery,
      filters: {
        ...filters,
        categories: selectedCategory === "All" ? filters.categories : [...filters.categories, ...actualCategories]
      },
      sortBy,
      sortOrder
    };

    // Use the enhanced search function from templateService
    const searchResults = searchTemplates(searchOptions);

    // Map back to the enhanced template format for display
    return searchResults.map((template) => ({
      id: template.id,
      name: template.name,
      category: getCategoryDisplayName(template.category),
      templateKey: template.category,
      image: getTemplateImage(template.category),
      description: template.description,
      popular: isPopularTemplate(template.category),
      features: getTemplateFeatures(template),
      icon: getCategoryIcon(template.category),
      difficulty: getTemplateDifficulty(template.category),
      industry: template.industry,
      rating: getTemplateRating(template.category),
      downloads: getTemplateDownloads(template.category),
      isNew: isNewTemplate(template.category),
      tags: getTemplateTags(template),
      isFavorite: isFavoriteTemplate(userId, template.id)
    }));
  }, [searchQuery, filters, selectedCategory, sortBy, sortOrder, userId]);

  // Handle search with history tracking
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToSearchHistory(userId, query);
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (templateId: string) => {
    const isFav = isFavoriteTemplate(userId, templateId);
    if (isFav) {
      removeFromFavorites(userId, templateId);
    } else {
      addToFavorites(userId, templateId);
    }
  };

  // Handle template comparison
  const handleComparisonToggle = (templateId: string) => {
    setSelectedTemplatesForComparison(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId);
      } else if (prev.length < 3) {
        return [...prev, templateId];
      }
      return prev;
    });
  };

  const handleShowComparison = () => {
    if (selectedTemplatesForComparison.length >= 2) {
      setShowComparison(true);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      experienceLevels: [],
      visualStyles: [],
      features: [],
      industries: [],
      atsOptimized: false,
      rating: 0
    });
    setSelectedCategory("All");
    setSearchQuery("");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="h-4 w-px bg-slate-300" />
              <span className="text-sm font-medium text-slate-900">Templates</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 w-64 bg-white/50"
                />
              </div>

              {/* Enhanced Filter Controls */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {filters.categories.length + filters.experienceLevels.length +
                      filters.visualStyles.length + filters.features.length +
                      filters.industries.length + (filters.atsOptimized ? 1 : 0) +
                      (filters.rating > 0 ? 1 : 0)}
                  </Badge>
                )}
              </Button>

              {/* Template Comparison */}
              {selectedTemplatesForComparison.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowComparison}
                  disabled={selectedTemplatesForComparison.length < 2}
                  className="flex items-center gap-2"
                >
                  <GitCompare className="h-4 w-4" />
                  Compare ({selectedTemplatesForComparison.length})
                </Button>
              )}

              {/* Sort Controls */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-sm border-none outline-none"
                >
                  <option value="popular">Popular</option>
                  <option value="newest">Newest</option>
                  <option value="name">Name</option>
                  <option value="rating">Rating</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Visual Hierarchy */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-teal-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-slate-200">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-700">{allTemplates.length} Professional Templates Available</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Modern Resume
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent block">
              Templates
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Professionally designed, ATS-optimized templates that help you stand out.
            Built with modern design principles and proven to get results.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>ATS-Friendly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Mobile Responsive</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Easy Customization</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>PDF Export</span>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Template Recommendations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Recommended for You
              </h2>
              <p className="text-slate-600 mt-1">Templates tailored to your profile and experience</p>
            </div>
            {!loadingRecommendations && recommendations.length > 0 && (
              <Button variant="outline" size="sm">
                View All Recommendations
              </Button>
            )}
          </div>

          {loadingRecommendations ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 6).map((recommendation) => (
                <TemplateRecommendation
                  key={recommendation.template.id}
                  recommendation={recommendation}
                  onSelect={(templateId) => {
                    const userProfile = { industry: 'technology' }; // This would come from actual user profile
                    const recIndex = recommendations.findIndex(r => r.template.id === templateId);
                    const rec = recommendations[recIndex];

                    // Track recommendation selection
                    TemplateRecommendationService.trackRecommendationAccuracy(
                      templateId,
                      userProfile,
                      'selected',
                      {
                        position: recIndex + 1,
                        category: rec?.category || 'alternative',
                        reasons: rec?.reasons || [],
                        score: rec?.score || 0
                      }
                    );
                    // Navigate to builder with selected template
                    window.location.href = `/builder?template=${templateId}`;
                  }}
                  onPreview={(templateId) => {
                    window.location.href = `/builder?template=${templateId}`;
                  }}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
              <p className="text-gray-600">Complete your profile to get personalized template suggestions.</p>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Filter and Sort Controls */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Category Tabs */}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.key}
                      variant={selectedCategory === category.key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.key)}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {category.name}
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {category.count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Templates Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {filteredAndSortedTemplates.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No templates found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or filters to find more templates.</p>
            <Button onClick={handleClearFilters} variant="outline">
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-900">
                  {filteredAndSortedTemplates.length} Template{filteredAndSortedTemplates.length !== 1 ? 's' : ''}
                </h2>
                {searchQuery && (
                  <Badge variant="outline" className="text-sm">
                    Results for "{searchQuery}"
                  </Badge>
                )}
              </div>

              {selectedTemplatesForComparison.length > 0 && (
                <div className="text-sm text-slate-600">
                  {selectedTemplatesForComparison.length} template{selectedTemplatesForComparison.length !== 1 ? 's' : ''} selected for comparison
                </div>
              )}
            </div>

            {/* Templates Grid/List */}
            <div className={viewMode === "grid"
              ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              : "space-y-6"
            }>
              {filteredAndSortedTemplates.map((template) => {
                // Convert the template data back to TemplateConfig format for TemplateCard
                const templateConfig = allTemplates.find(t => t.id === template.id);
                
                if (!templateConfig) {
                  return null;
                }

                return (
                  <div key={template.id} className="flex justify-center">
                    <TemplateCard
                      template={templateConfig}
                      onUpvote={() => {}}
                      onShortlist={() => handleFavoriteToggle(template.id)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Enhanced Template Filters Modal */}
      <TemplateFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={handleClearFilters}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Template Comparison Modal */}
      {showComparison && selectedTemplatesForComparison.length >= 2 && (
        <TemplateComparison
          comparison={getTemplateComparison(selectedTemplatesForComparison)}
          onClose={() => setShowComparison(false)}
          onSelectTemplate={(templateId) => {
            const template = getAllTemplates().find(t => t.id === templateId);
            if (template) {
              window.location.href = `/builder?template=${template.category}`;
            }
          }}
          onPreviewTemplate={(templateId) => {
            const template = getAllTemplates().find(t => t.id === templateId);
            if (template) {
              window.location.href = `/builder?template=${template.category}`;
            }
          }}
        />
      )}
    </div>
  );
}