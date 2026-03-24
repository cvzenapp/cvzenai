/**
 * Job Matching Dashboard Component
 * Main dashboard for job discovery and recommendations using AI Tavily search
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiChatStreamingService } from '@/services/aiChatStreamingService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { JobDetailsPanel } from './jobs/JobDetailsPanel';
import { MyApplicationsList } from './jobs/MyApplicationsList';
import {
  MapPin,
  DollarSign,
  Clock,
  Building,
  Users,
  ExternalLink,
  Bookmark,
  Briefcase,
  Loader2,
  Filter,
  ChevronDown
} from 'lucide-react';
import unifiedAuthService from '@/services/unifiedAuthService';

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  salary?: string;
  location: string;
  remote?: boolean;
  type?: 'full-time' | 'part-time' | 'contract' | 'internship';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  postedDate: string;
  status?: 'active' | 'filled' | 'expired';
  matchScore?: number;
  matchReasons?: string[];
  applicationCount?: number;
  url?: string;
}

interface JobMatchingDashboardProps {
  userId: string;
  resumeData?: any;
}

export default function JobMatchingDashboard({ userId, resumeData }: JobMatchingDashboardProps) {
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'recommendations' | 'search' | 'applications'>('recommendations');
  const [aiJobs, setAiJobs] = useState<JobOpportunity[]>([]);
  const [isLoadingAiJobs, setIsLoadingAiJobs] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    country: '',
    state: '',
    jobType: '',
    experienceLevel: '',
    salary: '',
    industry: '',
    datePosted: '',
    remote: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);

  // Debug resume data structure
  useEffect(() => {
    console.log('🔍 JobMatchingDashboard received resumeData:', {
      hasResumeData: !!resumeData,
      resumeKeys: resumeData ? Object.keys(resumeData) : [],
      resumeData: resumeData
    });
  }, [resumeData]);

  // Load countries data
  useEffect(() => {
    fetch('/assets/countries.json')
      .then(response => response.json())
      .then(data => setCountries(data))
      .catch(error => console.error('Failed to load countries:', error));
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (filters.country) {
      const selectedCountry = countries.find(country => country.name === filters.country);
      setStates(selectedCountry?.states || []);
    } else {
      setStates([]);
    }
    // Clear state when country changes
    if (filters.state) {
      setFilters(prev => ({ ...prev, state: '' }));
    }
  }, [filters.country, countries]);

  // Load AI-powered job recommendations on mount or when filters change
  useEffect(() => {
    if (activeTab === 'recommendations') {
      loadAIJobRecommendations();
    }
  }, [activeTab, filters]);

  // Add timeout for loading state
  useEffect(() => {
    if (isLoadingAiJobs) {
      const timeout = setTimeout(() => {
        console.log('⏰ AI job search timeout - stopping loading state');
        setIsLoadingAiJobs(false);
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingAiJobs]);

  const loadAIJobRecommendations = async () => {
    setIsLoadingAiJobs(true);
    
    try {
      // Transform resume data to match expected format
      const userProfile = resumeData ? {
        skills: resumeData.skills?.map((skill: any) => 
          typeof skill === 'string' ? skill : skill.name || skill.skill || skill
        ) || [],
        experience: resumeData.experience || [],
        location: resumeData.personalInfo?.location || resumeData.location || resumeData.personalInfo?.city,
        jobTitle: resumeData.personalInfo?.jobTitle || resumeData.jobTitle || resumeData.personalInfo?.title
      } : undefined;

      // Create a more specific job search message based on resume data
      const skills = userProfile?.skills?.slice(0, 3).join(', ') || 'software development';
      const location = userProfile?.location || 'remote';
      const jobTitle = userProfile?.jobTitle || 'developer';
      
      const searchMessage = `Find ${jobTitle} jobs for someone with skills in ${skills}. ${filters.country && filters.state ? `Location: ${filters.state}, ${filters.country}.` : filters.country ? `Location: ${filters.country}.` : 'Include both remote and on-site opportunities.'} ${filters.jobType ? `Job type: ${filters.jobType}.` : ''} ${filters.experienceLevel ? `Experience level: ${filters.experienceLevel}.` : ''} ${filters.industry ? `Industry: ${filters.industry}.` : ''} ${filters.salary ? `Salary range: ${filters.salary}.` : ''} ${filters.datePosted ? `Posted: ${filters.datePosted}.` : ''} ${filters.remote ? 'Remote work preferred.' : ''} Focus on relevant positions that match the skill set and experience level.`;

      console.log('� Sending job search request:', {
        message: searchMessage,
        userProfile,
        resumeData: !!resumeData
      });

      await aiChatStreamingService.streamChat(
        {
          message: searchMessage,
          type: 'job_search' as const,
          context: {
            userProfile,
            resumeData,
            jobFilters: filters // Add structured filters
          }
        },
        {
          onConnect: () => {
            console.log('🔗 AI job search connected');
          },
          onJobs: (jobs) => {
            console.log('💼 Received AI jobs:', jobs);
            if (jobs && jobs.length > 0) {
              console.log('✅ Setting AI jobs:', jobs.length, 'jobs');
              setAiJobs(jobs);
            } else {
              console.log('⚠️ Received empty or invalid jobs array:', jobs);
            }
          },
          onJob: (job) => {
            console.log('💼 Received single AI job:', job);
            if (job) {
              console.log('✅ Adding single job to list');
              setAiJobs(prev => [...prev, job]);
            }
          },
          onChunk: (content) => {
            console.log('📝 Received content chunk:', content);
          },
          onComplete: () => {
            console.log('✅ AI job search completed');
            setIsLoadingAiJobs(false);
          },
          onError: (error) => {
            console.error('❌ AI job search error:', error);
            setIsLoadingAiJobs(false);
          }
        }
      );
    } catch (error) {
      console.error('Failed to load AI jobs:', error);
      setIsLoadingAiJobs(false);
    }
  };

  // Fetch recruiter-posted jobs
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['job-recommendations', userId, activeTab],
    queryFn: async () => {
      console.log('🔍 Fetching recruiter jobs for activeTab:', activeTab);
      console.log('🔍 Making API call to /api/jobs/recommendations');
      const token = localStorage.getItem('authToken');
      console.log('🔍 Using token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/jobs/recommendations?limit=20`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 API response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ API call failed with status:', response.status);
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('🔍 API response data:', result);
      
      if (result.success === false) {
        console.error('❌ JobMatchingDashboard - API returned error:', result.error);
        throw new Error(result.error || 'Failed to fetch recommendations');
      }
      
      const responseData = result.data || result;
      console.log('✅ JobMatchingDashboard - Returning data:', responseData);
      return responseData;
    },
    enabled: true, // Force enable to test
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

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
    setSelectedJob(job);
  };

  // Clear jobs when filters change to show loading state
  useEffect(() => {
    if (activeTab === 'recommendations') {
      setAiJobs([]);
    }
  }, [filters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 sm:gap-8 min-w-max px-1">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'border-brand-main text-brand-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            AI Recommendations
          </button>
          <button
            onClick={() => {
              console.log('🔍 Recruiter Jobs tab clicked, current activeTab:', activeTab);
              setActiveTab('search');
              console.log('🔍 Set activeTab to search');
            }}
            className={`pb-3 sm:pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === 'search'
                ? 'border-brand-main text-brand-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Recruiter Jobs
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

      {/* Filters Section for AI Recommendations and Recruiter Jobs */}
      {(activeTab === 'recommendations' || activeTab === 'search') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="p-4">
            {/* Filter Toggle Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Job Filters</h3>
                {/* Active filters count */}
                {Object.values(filters).some(value => value) && (
                  <Badge variant="secondary" className="bg-brand-main text-white">
                    {Object.values(filters).filter(value => value).length} active
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 border-brand-main text-brand-main hover:bg-brand-main hover:text-white"
              >
                <Filter className="h-4 w-4" />
                All Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {/* Quick Filters Row */}
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                value={filters.country}
                onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value, state: '' }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Country</option>
                {countries.map((country) => (
                  <option key={country.code2} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                disabled={!filters.country}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">State/Province</option>
                {states.map((state) => (
                  <option key={state.code} value={state.name}>
                    {state.name}
                  </option>
                ))}
              </select>

              <select
                value={filters.jobType}
                onChange={(e) => setFilters(prev => ({ ...prev, jobType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Job Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>

              <select
                value={filters.experienceLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, experienceLevel: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Experience Level</option>
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Level">Mid Level</option>
                <option value="Senior Level">Senior Level</option>
                <option value="Executive">Executive</option>
              </select>

              <select
                value={filters.salary}
                onChange={(e) => setFilters(prev => ({ ...prev, salary: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent"
              >
                <option value="">Salary Range</option>
                <option value="$40k-$60k">$40k - $60k</option>
                <option value="$60k-$80k">$60k - $80k</option>
                <option value="$80k-$100k">$80k - $100k</option>
                <option value="$100k-$150k">$100k - $150k</option>
                <option value="$150k+">$150k+</option>
              </select>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Posted</label>
                  <select
                    value={filters.datePosted}
                    onChange={(e) => setFilters(prev => ({ ...prev, datePosted: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-main focus:border-transparent"
                  >
                    <option value="">Any time</option>
                    <option value="Last 24 hours">Last 24 hours</option>
                    <option value="Last 3 days">Last 3 days</option>
                    <option value="Last week">Last week</option>
                    <option value="Last month">Last month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Remote Work</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.remote}
                      onChange={(e) => setFilters(prev => ({ ...prev, remote: e.target.checked }))}
                      className="rounded border-gray-300 text-brand-main focus:ring-brand-main"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remote work only</span>
                  </label>
                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            {(filters.country || filters.state || filters.jobType || filters.experienceLevel || filters.salary || filters.industry || filters.datePosted || filters.remote) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({
                    country: '',
                    state: '',
                    jobType: '',
                    experienceLevel: '',
                    salary: '',
                    industry: '',
                    datePosted: '',
                    remote: false
                  })}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Recommendations Tab */}
      {activeTab === 'recommendations' && (
        <div className="grid gap-4 sm:gap-6">
          {isLoadingAiJobs ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-main" />
            </div>
          ) : aiJobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Job Recommendations Yet</h3>
              <p className="text-gray-600 mb-4">
                {!resumeData 
                  ? "Complete your resume to get AI-powered job recommendations."
                  : "We're searching for jobs that match your skills and experience. This may take a moment..."
                }
              </p>
              <div className="flex gap-2 justify-center">
                {!resumeData && (
                  <Button 
                    onClick={() => window.location.href = '/builder'}
                    className="bg-brand-main hover:bg-brand-background"
                  >
                    Complete Resume
                  </Button>
                )}
                {resumeData && (
                  <Button 
                    onClick={loadAIJobRecommendations}
                    disabled={isLoadingAiJobs}
                    className="bg-brand-main hover:bg-brand-background"
                  >
                    {isLoadingAiJobs ? 'Searching...' : 'Search Jobs'}
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    console.log('🔍 Manual test - Current state:', {
                      isLoadingAiJobs,
                      aiJobsCount: aiJobs.length,
                      resumeData: !!resumeData,
                      activeTab
                    });
                  }}
                  variant="outline"
                  className="border-brand-main text-brand-main hover:bg-brand-main hover:text-white"
                >
                  Debug Info
                </Button>
              </div>
            </div>
          ) : (
            aiJobs.map((job: JobOpportunity) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-brand-main/30 hover:border-l-brand-main">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{job.title}</h3>
                          {job.matchScore !== undefined && (
                            <Badge className="bg-green-100 text-green-800 w-fit">
                              {job.matchScore}% match
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{job.company}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{job.postedDate}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.requirements?.slice(0, 3).map((req, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-brand-main hover:bg-brand-background"
                        onClick={() => job.url && window.open(job.url, '_blank')}
                      >
                        Apply Now
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSaveJob(job.id)}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Recruiter Jobs Tab */}
      {activeTab === 'search' && (
        <div className="grid gap-4 sm:gap-6">
          {recommendationsLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-main" />
            </div>
          ) : !recommendations?.jobs || recommendations.jobs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recruiter jobs available at the moment.</p>
            </div>
          ) : (
            recommendations.jobs.map((job: JobOpportunity) => (
              <Card key={job.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-brand-main/30 hover:border-l-brand-main">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{job.title}</h3>
                          {job.matchScore !== undefined && (
                            <Badge className="bg-green-100 text-green-800 border-0 text-xs shrink-0">
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
                          {job.salaryRange && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                              <span className="truncate">
                                ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                            <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                          {job.experienceLevel && (
                            <Badge variant="secondary" className="text-xs">
                              {job.experienceLevel}
                            </Badge>
                          )}
                          {job.type && <Badge variant="outline" className="text-xs">{job.type}</Badge>}
                          {job.industry && <Badge variant="outline" className="text-xs">{job.industry}</Badge>}
                          {job.requirements?.slice(0, 2).map(req => (
                            <Badge key={req} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {job.requirements && job.requirements.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.requirements.length - 2} more
                            </Badge>
                          )}
                        </div>
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
            ))
          )}
        </div>
      )}

      {selectedJob && (
        <JobDetailsPanel
          jobId={selectedJob.id}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}