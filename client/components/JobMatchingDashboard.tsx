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
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Recommendations</h2>
        </div>
        <div className="grid gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 sm:p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (recommendationsError) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Recommendations</h2>
        </div>
        
        <Card className="text-center py-8 sm:py-12 border-red-200 bg-red-50">
          <CardContent>
            <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Error Loading Recommendations</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
              {recommendationsError instanceof Error ? recommendationsError.message : 'Failed to load job recommendations'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Debug info: userId={userId || 'undefined'}, hasRecommendations={!!recommendations}
            </p>
            <Button onClick={() => window.location.reload()} className="bg-brand-main hover:bg-brand-background transition-all duration-200">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!recommendations?.jobs || recommendations.jobs.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Recommendations</h2>
        </div>
        
        <Card className="text-center py-8 sm:py-12">
          <CardContent>
            <Briefcase className="h-8 w-8 sm:h-12 sm:w-12 text-brand-main/60 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Job Recommendations Yet</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-md mx-auto">
              {!resumeData 
                ? "Complete your resume to get personalized job recommendations based on your skills and experience."
                : "We're working on finding the perfect job matches for you. Check back soon!"
              }
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Debug: userId={userId || 'undefined'}, recommendations={JSON.stringify(recommendations)}
            </p>
            {!resumeData && (
              <Button onClick={() => window.location.href = '/builder'} className="bg-brand-main hover:bg-brand-background transition-all duration-200">
                Complete Your Resume
              </Button>
            )}
          </CardContent>
        </Card>
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
      {/* Header with Search */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {activeTab === 'recommendations' ? 'Job Recommendations' : 'Search Jobs'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {activeTab === 'recommendations' 
              ? 'Personalized job matches based on your profile'
              : 'Find your next opportunity'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64 border-brand-main/30 focus:border-brand-main focus:ring-brand-main/20"
            />
          </div>
          <Button variant="outline" size="sm" className="border-brand-main/30 text-brand-main hover:bg-brand-main hover:text-white transition-all duration-200">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-brand-main" />
                <span className="text-xs sm:text-sm text-gray-600">Applications</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {analytics.applications?.total || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                <span className="text-xs sm:text-sm text-gray-600">Saved Jobs</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {analytics.savedJobs || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-600">Searches</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {analytics.searches?.last30Days || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                <span className="text-xs sm:text-sm text-gray-600">Active Alerts</span>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-gray-900">
                {analytics.alerts?.active || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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