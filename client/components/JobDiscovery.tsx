/**
 * Job Discovery Component
 * Advanced job search with filtering and pagination
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  Star,
  ExternalLink,
  Bookmark,
  X,
  SlidersHorizontal,
  Briefcase,
  TrendingUp
} from 'lucide-react';

interface JobFilters {
  keywords?: string;
  location?: string;
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  jobType?: Array<'full-time' | 'part-time' | 'contract' | 'internship'>;
  experienceLevel?: Array<'entry' | 'mid' | 'senior' | 'executive'>;
  industry?: string[];
  companySize?: Array<'startup' | 'small' | 'medium' | 'large' | 'enterprise'>;
  postedWithin?: number;
}

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  remote: boolean;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industry: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  postedDate: string;
  status: 'active' | 'filled' | 'expired';
  matchScore?: number;
  matchReasons?: string[];
  applicationCount?: number;
}

interface JobDiscoveryProps {
  onJobSelect: (job: JobOpportunity) => void;
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
}

export default function JobDiscovery({ onJobSelect, filters, onFiltersChange }: JobDiscoveryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'salary'>('relevance');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search query
  const [searchQuery, setSearchQuery] = useState(filters.keywords || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    onFiltersChange({ ...filters, keywords: debouncedQuery });
  }, [debouncedQuery]);

  // Search jobs with current filters
  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: ['job-search', filters, currentPage, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(filters.keywords && { keywords: filters.keywords }),
        ...(filters.location && { location: filters.location }),
        ...(filters.remote !== undefined && { remote: filters.remote.toString() }),
        ...(filters.salaryMin && { salaryMin: filters.salaryMin.toString() }),
        ...(filters.salaryMax && { salaryMax: filters.salaryMax.toString() }),
        ...(filters.postedWithin && { postedWithin: filters.postedWithin.toString() })
      });

      // Add array parameters
      filters.jobType?.forEach(type => params.append('jobType', type));
      filters.experienceLevel?.forEach(level => params.append('experienceLevel', level));
      filters.industry?.forEach(industry => params.append('industry', industry));
      filters.companySize?.forEach(size => params.append('companySize', size));

      const response = await fetch(`/api/jobs/search?${params}`, {
        headers: unifiedAuthService.getAuthHeaders()
      });
      
      if (!response.ok) throw new Error('Failed to search jobs');
      const result = await response.json();
      return result.data;
    },
    keepPreviousData: true
  });

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.remote !== undefined) count++;
    if (filters.salaryMin || filters.salaryMax) count++;
    if (filters.jobType?.length) count++;
    if (filters.experienceLevel?.length) count++;
    if (filters.industry?.length) count++;
    if (filters.companySize?.length) count++;
    if (filters.postedWithin) count++;
    return count;
  }, [filters]);

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearAllFilters = () => {
    onFiltersChange({ keywords: filters.keywords });
    setCurrentPage(1);
  };

  const formatSalary = (min: number, max: number, currency: string = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/save', {
        method: 'POST',
        headers: unifiedAuthService.getAuthHeaders(),
        body: JSON.stringify({ jobId })
      });

      if (response.ok) {
        setSavedJobs(prev => new Set([...prev, jobId]));
      }
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Location */}
      <div>
        <Label className="text-sm font-medium">Location</Label>
        <Input
          placeholder="City, State, or Remote"
          value={filters.location || ''}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="mt-2"
        />
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox
            id="remote"
            checked={filters.remote || false}
            onCheckedChange={(checked) => handleFilterChange('remote', checked)}
          />
          <Label htmlFor="remote" className="text-sm">Remote only</Label>
        </div>
      </div>

      <Separator />

      {/* Salary Range */}
      <div>
        <Label className="text-sm font-medium">Salary Range</Label>
        <div className="mt-4 space-y-4">
          <div>
            <Label className="text-xs text-gray-500">Minimum: ${filters.salaryMin || 0}</Label>
            <Slider
              value={[filters.salaryMin || 0]}
              onValueChange={([value]) => handleFilterChange('salaryMin', value)}
              max={200000}
              step={5000}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500">Maximum: ${filters.salaryMax || 200000}</Label>
            <Slider
              value={[filters.salaryMax || 200000]}
              onValueChange={([value]) => handleFilterChange('salaryMax', value)}
              max={200000}
              step={5000}
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Job Type */}
      <div>
        <Label className="text-sm font-medium">Job Type</Label>
        <div className="mt-2 space-y-2">
          {['full-time', 'part-time', 'contract', 'internship'].map(type => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={type}
                checked={filters.jobType?.includes(type as any) || false}
                onCheckedChange={(checked) => {
                  const current = filters.jobType || [];
                  const updated = checked
                    ? [...current, type as any]
                    : current.filter(t => t !== type);
                  handleFilterChange('jobType', updated);
                }}
              />
              <Label htmlFor={type} className="text-sm capitalize">
                {type.replace('-', ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Experience Level */}
      <div>
        <Label className="text-sm font-medium">Experience Level</Label>
        <div className="mt-2 space-y-2">
          {['entry', 'mid', 'senior', 'executive'].map(level => (
            <div key={level} className="flex items-center space-x-2">
              <Checkbox
                id={level}
                checked={filters.experienceLevel?.includes(level as any) || false}
                onCheckedChange={(checked) => {
                  const current = filters.experienceLevel || [];
                  const updated = checked
                    ? [...current, level as any]
                    : current.filter(l => l !== level);
                  handleFilterChange('experienceLevel', updated);
                }}
              />
              <Label htmlFor={level} className="text-sm capitalize">
                {level}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Industry */}
      <div>
        <Label className="text-sm font-medium">Industry</Label>
        <div className="mt-2 space-y-2">
          {['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Design'].map(industry => (
            <div key={industry} className="flex items-center space-x-2">
              <Checkbox
                id={industry}
                checked={filters.industry?.includes(industry) || false}
                onCheckedChange={(checked) => {
                  const current = filters.industry || [];
                  const updated = checked
                    ? [...current, industry]
                    : current.filter(i => i !== industry);
                  handleFilterChange('industry', updated);
                }}
              />
              <Label htmlFor={industry} className="text-sm">
                {industry}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Posted Within */}
      <div>
        <Label className="text-sm font-medium">Posted Within</Label>
        <Select
          value={filters.postedWithin?.toString() || 'all'}
          onValueChange={(value) => handleFilterChange('postedWithin', value === 'all' ? undefined : parseInt(value))}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Any time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any time</SelectItem>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last week</SelectItem>
            <SelectItem value="30">Last month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" onClick={clearAllFilters} className="w-full">
            Clear All Filters ({activeFiltersCount})
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Jobs</h2>
          <p className="text-gray-600">
            {searchResults ? `${searchResults.total} jobs found` : 'Search for your next opportunity'}
          </p>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by job title, company, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="date">Date Posted</SelectItem>
              <SelectItem value="salary">Salary</SelectItem>
            </SelectContent>
          </Select>

          {/* Mobile Filter Button */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="sm:hidden">
                <Filter className="h-4 w-4 mr-2" />
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>Filter Jobs</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filter Sidebar */}
        <div className="hidden sm:block w-80 shrink-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FilterSidebar />
            </CardContent>
          </Card>
        </div>

        {/* Job Results */}
        <div className="flex-1 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-red-500 mb-4">
                  <X className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search Error</h3>
                <p className="text-gray-600">
                  There was an error searching for jobs. Please try again.
                </p>
              </CardContent>
            </Card>
          ) : !searchResults?.jobs?.length ? (
            <Card className="text-center py-12">
              <CardContent>
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or filters to find more opportunities.
                </p>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Results */}
              <div className="space-y-4">
                {searchResults.jobs.map((job: JobOpportunity) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {job.matchScore !== undefined && (
                              <Badge className={`${getMatchScoreColor(job.matchScore / 100)} border-0`}>
                                {Math.round(job.matchScore)}% match
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {job.company}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.remote ? 'Remote' : job.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job.salaryRange.min, job.salaryRange.max)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(job.postedDate).toLocaleDateString()}
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline">{job.type}</Badge>
                            <Badge variant="outline">{job.experienceLevel}</Badge>
                            <Badge variant="outline">{job.industry}</Badge>
                            {job.requirements.slice(0, 3).map(req => (
                              <Badge key={req} variant="outline" className="text-xs">
                                {req}
                              </Badge>
                            ))}
                            {job.requirements.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.requirements.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="h-4 w-4" />
                          {job.applicationCount || 0} applicants
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSaveJob(job.id)}
                            disabled={savedJobs.has(job.id)}
                          >
                            <Bookmark className={`h-4 w-4 mr-1 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                            {savedJobs.has(job.id) ? 'Saved' : 'Save'}
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => onJobSelect(job)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {searchResults.hasMore && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={isLoading}
                  >
                    Load More Jobs
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}