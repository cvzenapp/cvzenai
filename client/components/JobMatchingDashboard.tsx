/**
 * Job Matching Dashboard Component
 * Main dashboard for job discovery and recommendations
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobDetailsPanel } from './jobs/JobDetailsPanel';
import { MyApplicationsList } from './jobs/MyApplicationsList';
import {
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  Star,
  ExternalLink,
  Bookmark,
  Filter,
  TrendingUp,
  Briefcase,
  Heart
} from 'lucide-react';

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

interface JobMatchingDashboardProps {
  userId: string;
  resumeData?: any;
}

export default function JobMatchingDashboard({ userId, resumeData }: JobMatchingDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'recommendations' | 'search' | 'applications'>('recommendations');

  // Fetch job recommendations using proper API service
  const { data: recommendations, isLoading: recommendationsLoading, error: recommendationsError } = useQuery({
    queryKey: ['job-recommendations', userId],
    queryFn: async () => {
      console.log('🔍 JobMatchingDashboard - Fetching recommendations for userId:', userId);
      
      // Direct API call instead of using jobApi service
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/jobs/recommendations?limit=20`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📦 JobMatchingDashboard - Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ JobMatchingDashboard - API call failed:', response.status, errorText);
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 JobMatchingDashboard - Full API result:', JSON.stringify(result, null, 2));
      console.log('📦 JobMatchingDashboard - result.success:', result.success);
      console.log('📦 JobMatchingDashboard - result.data:', result.data);
      console.log('📦 JobMatchingDashboard - result.data?.jobs:', result.data?.jobs);
      console.log('📦 JobMatchingDashboard - jobs length:', result.data?.jobs?.length);
      
      // Handle both response formats: {success, data} and {data} directly
      if (result.success === false) {
        console.error('❌ JobMatchingDashboard - API returned error:', result.error);
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
      
      // If response has data directly (without success field), use it
      const responseData = result.data || result;
      
      console.log('✅ JobMatchingDashboard - Returning data:', responseData);
      return responseData;
    },
    enabled: true, // Always enabled for debugging - remove !!userId condition
    retry: false, // Don't retry to avoid multiple calls
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 JobMatchingDashboard - State:', {
      userId,
      isLoading: recommendationsLoading,
      hasError: !!recommendationsError,
      error: recommendationsError,
      hasRecommendations: !!recommendations,
      recommendationsStructure: recommendations ? Object.keys(recommendations) : null,
      jobsCount: recommendations?.jobs?.length || 0,
      recommendations: recommendations
    });
  }, [userId, recommendationsLoading, recommendationsError, recommendations]);

  // Fetch user's job analytics
  const { data: analytics } = useQuery({
    queryKey: ['job-analytics', userId],
    queryFn: async () => {
      const response = await fetch('/api/jobs/analytics', {
        headers: unifiedAuthService.getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      return result.data;
    }
  });

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

  const getExperienceLevelBadge = (level: string) => {
    const colors = {
      entry: 'bg-blue-100 text-blue-800',
      mid: 'bg-green-100 text-green-800',
      senior: 'bg-purple-100 text-purple-800',
      executive: 'bg-red-100 text-red-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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

  const handleApplyToJob = (job: JobOpportunity) => {
    // Set the selected job to show details modal
    // User can then apply from the details view
    setSelectedJob(job);
  };

  if (recommendationsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Loading Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <div className="h-6 bg-slate-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Loading Job Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
              <div className="p-4 sm:p-6">
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-slate-200 rounded w-16"></div>
                  <div className="h-6 bg-slate-200 rounded w-20"></div>
                  <div className="h-6 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (recommendationsError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Error Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 font-jakarta">Job Recommendations</h2>
                <p className="text-sm text-slate-600 mt-1 font-jakarta">Unable to load recommendations</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Error Content */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm">
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 font-jakarta">Error Loading Recommendations</h3>
            <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto font-jakarta">
              {recommendationsError instanceof Error ? recommendationsError.message : 'Failed to load job recommendations'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-6 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-lg hover:shadow-lg transition-all font-jakarta font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations?.jobs || recommendations.jobs.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Empty State Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 font-jakarta">Job Recommendations</h2>
                <p className="text-sm text-slate-600 mt-1 font-jakarta">No matches found yet</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Empty State Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-main/10 to-brand-background/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-brand-main" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2 font-jakarta">No Job Recommendations Yet</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto font-jakarta">
              {!resumeData 
                ? "Complete your resume to get personalized job recommendations based on your skills and experience."
                : "We're working on finding the perfect job matches for you. Check back soon!"
              }
            </p>
            {!resumeData && (
              <button
                onClick={() => window.location.href = '/builder'}
                className="h-10 px-6 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-lg hover:shadow-lg transition-all font-jakarta font-medium"
              >
                Complete Your Resume
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-8 min-w-max px-1">
          <button
            data-tab="recommendations"
            onClick={() => setActiveTab('recommendations')}
            className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'border-brand-main text-brand-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recommendations
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'search'
                ? 'border-brand-main text-brand-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Search Jobs
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'applications'
                ? 'border-brand-main text-brand-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Applications
          </button>
        </nav>
      </div>

      {/* My Applications Tab */}
      {activeTab === 'applications' && (
        <MyApplicationsList />
      )}

      {/* Recommendations/Search Tabs */}
      {activeTab !== 'applications' && (
        <>
          {/* Compact Header with CVZen Branding */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Title and Stats Row */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
                      <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 font-jakarta">
                        {activeTab === 'recommendations' ? 'Job Recommendations' : 'Search Jobs'}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1 font-jakarta">
                        {activeTab === 'recommendations' 
                          ? `${recommendations?.jobs?.length || 0} personalized matches found`
                          : 'Find your next opportunity'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats - Compact */}
                  {analytics && (
                    <div className="flex gap-3 sm:gap-4">
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-slate-900 font-jakarta">
                          {analytics.applications?.total || 0}
                        </div>
                        <div className="text-xs text-slate-600 font-jakarta">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-slate-900 font-jakarta">
                          {analytics.savedJobs || 0}
                        </div>
                        <div className="text-xs text-slate-600 font-jakarta">Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg sm:text-xl font-bold text-slate-900 font-jakarta">
                          {analytics.searches?.last30Days || 0}
                        </div>
                        <div className="text-xs text-slate-600 font-jakarta">Searches</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-main/60" />
                      <input
                        placeholder="Search jobs by title, company, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-brand-main focus:ring-brand-main/20 focus:ring-2 focus:outline-none font-jakarta"
                      />
                    </div>
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2">
                    <button className="px-4 py-2 border border-slate-200 rounded-lg hover:border-brand-main hover:text-brand-main transition-colors text-sm font-jakarta font-medium flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">Filters</span>
                    </button>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg hover:border-brand-main hover:text-brand-main transition-colors text-sm font-jakarta font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="hidden sm:inline">Location</span>
                    </button>
                    <button className="px-4 py-2 border border-slate-200 rounded-lg hover:border-brand-main hover:text-brand-main transition-colors text-sm font-jakarta font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">Salary</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* Job Recommendations */}
      <div className="grid gap-4 sm:gap-6">
        {recommendations.jobs
          .filter((job: JobOpportunity) => 
            !searchQuery || 
            job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.company.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((job: JobOpportunity) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-brand-main/30 hover:border-l-brand-main">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                      {job.matchScore !== undefined && (
                        <Badge className={`${getMatchScoreColor(job.matchScore / 100)} border-0 text-xs shrink-0`}>
                          {Math.round(job.matchScore)}% match
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{job.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{job.remote ? 'Remote' : job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span className="truncate">{formatSalary(job.salaryRange.min, job.salaryRange.max, job.salaryRange.currency)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                        <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 line-clamp-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      <Badge variant="secondary" className={`${getExperienceLevelBadge(job.experienceLevel)} text-xs`}>
                        {job.experienceLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{job.type}</Badge>
                      <Badge variant="outline" className="text-xs">{job.industry}</Badge>
                      {job.requirements.slice(0, 2).map(req => (
                        <Badge key={req} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                      {job.requirements.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{job.requirements.length - 2} more
                        </Badge>
                      )}
                    </div>

                    {job.matchReasons && job.matchReasons.length > 0 && (
                      <div className="text-xs sm:text-sm text-green-600 mb-3 sm:mb-4">
                        <strong>Why this matches:</strong> {job.matchReasons.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 sm:pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    {job.applicationCount || 0} applicants
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveJob(job.id)}
                      disabled={savedJobs.has(job.id)}
                      className="flex-1 sm:flex-none text-xs border-brand-main/30 text-brand-main hover:bg-brand-main hover:text-white transition-all duration-200"
                    >
                      <Bookmark className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${savedJobs.has(job.id) ? 'fill-current' : ''}`} />
                      {savedJobs.has(job.id) ? 'Saved' : 'Save'}
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleApplyToJob(job)}
                      className="flex-1 sm:flex-none text-xs bg-brand-main hover:bg-brand-background transition-all duration-200"
                    >
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Apply Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {recommendations.jobs.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" className="border-brand-main/30 text-brand-main hover:bg-brand-main hover:text-white transition-all duration-200">
            Load More Jobs
          </Button>
        </div>
      )}

      {/* Job Details Panel */}
      {selectedJob && (
        <JobDetailsPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
        </>
      )}
    </div>
  );
}