import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Building, Clock, DollarSign, Briefcase, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { jobSearchApi } from '../services/jobSearchApi';
import { JobSearchResult, JobDetails } from '@shared/api';
import { formatJobContent } from '../lib/jobContentFormatter';
import { cn } from '../lib/utils';

interface JobSearchInterfaceProps {
  className?: string;
}

export function JobSearchInterface({ className }: JobSearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JobSearchResult[]>([]);
  const [detailedJobs, setDetailedJobs] = useState<JobDetails[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'detailed'>('search');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a job search query');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setDetailedJobs([]);

    try {
      const response = await jobSearchApi.searchJobs(query, location);
      
      if (response.success && response.data) {
        setSearchResults(response.data.results);
        setActiveTab('search');
      } else {
        setError(response.error || 'Failed to search jobs');
      }
    } catch (err) {
      setError('Network error occurred while searching');
      console.error('Job search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchAndCrawl = async () => {
    if (!query.trim()) {
      setError('Please enter a job search query');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setDetailedJobs([]);

    try {
      const response = await jobSearchApi.searchAndCrawlJobs(query, location, 5);
      
      if (response.success && response.data) {
        setSearchResults(response.data.searchResults);
        setDetailedJobs(response.data.detailedJobs);
        setActiveTab('detailed');
      } else {
        setError(response.error || 'Failed to search and analyze jobs');
      }
    } catch (err) {
      setError('Network error occurred while searching');
      console.error('Job search and crawl error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={cn("w-full max-w-6xl mx-auto p-6", className)}>
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Search</h1>
        <p className="text-gray-600">Search for jobs across multiple job boards and get detailed insights</p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Jobs
          </CardTitle>
          <CardDescription>
            Enter your job search criteria to find opportunities across major job boards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="query" className="text-sm font-medium">
                Job Title or Keywords *
              </label>
              <Input
                id="query"
                placeholder="e.g., Software Engineer, Data Scientist, Marketing Manager"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location (Optional)
              </label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, Remote, New York"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Quick Search
            </Button>
            <Button 
              onClick={handleSearchAndCrawl}
              disabled={isSearching || !query.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              Search & Analyze (Detailed)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      {(searchResults.length > 0 || detailedJobs.length > 0) && (
        <div className="mb-6">
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'search'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Search Results ({searchResults.length})
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'detailed'
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              Detailed Analysis ({detailedJobs.length})
            </button>
          </div>
        </div>
      )}

      {/* Search Results Tab */}
      {activeTab === 'search' && searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Found {searchResults.length} job opportunities
          </h2>
          {searchResults.map((job, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {job.title}
                  </h3>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">
                    {job.domain}
                  </Badge>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {job.snippet}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {job.publishedDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(job.publishedDate).toLocaleDateString()}
                      </div>
                    )}
                    {job.score && (
                      <div className="flex items-center gap-1">
                        <span>Match: {Math.round(job.score * 100)}%</span>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(job.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Jobs Tab */}
      {activeTab === 'detailed' && detailedJobs.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Detailed Analysis of {detailedJobs.length} jobs
          </h2>
          {detailedJobs.map((job, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {job.company}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(job.url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Apply
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Job Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.salary && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Salary:</span>
                      <span className="text-sm">{job.salary}</span>
                    </div>
                  )}
                  {job.jobType && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm">{job.jobType}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Description */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <div className="text-sm text-gray-600 leading-relaxed prose max-w-none">
                    {formatJobContent(job.description)}
                  </div>
                </div>

                {/* Requirements */}
                {job.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                    <div className="space-y-1">
                      {job.requirements.slice(0, 5).map((req, reqIndex) => (
                        <div key={reqIndex} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{req}</span>
                        </div>
                      ))}
                      {job.requirements.length > 5 && (
                        <p className="text-sm text-gray-500 italic">
                          +{job.requirements.length - 5} more requirements
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  Analyzed on {new Date(job.extractedAt).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && searchResults.length === 0 && detailedJobs.length === 0 && !error && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start Your Job Search
            </h3>
            <p className="text-gray-600">
              Enter a job title or keywords to search across multiple job boards
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}