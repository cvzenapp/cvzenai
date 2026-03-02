import React, { useState } from 'react';
import { Search, ExternalLink, Briefcase, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { jobSearchApi } from '../../services/jobSearchApi';
import { JobSearchResult } from '@shared/api';
import { Link } from 'react-router-dom';

export function JobSearchWidget() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<JobSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleQuickSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a job search query');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await jobSearchApi.searchJobs(query);
      
      if (response.success && response.data) {
        // Show only top 3 results in the widget
        setSearchResults(response.data.results.slice(0, 3));
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Quick Job Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Software Engineer, Data Scientist"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleQuickSearch}
            disabled={isSearching || !query.trim()}
            size="sm"
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((job, index) => (
              <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm line-clamp-1">{job.title}</h4>
                  <Badge variant="secondary" className="text-xs ml-2 flex-shrink-0">
                    {job.domain}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {job.snippet}
                </p>
                <div className="flex justify-between items-center">
                  {job.publishedDate && (
                    <span className="text-xs text-gray-500">
                      {new Date(job.publishedDate).toLocaleDateString()}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(job.url, '_blank')}
                    className="text-xs h-7"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-2 border-t">
              <Link to="/job-search">
                <Button variant="outline" size="sm" className="w-full">
                  View All Results & Advanced Search
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!isSearching && searchResults.length === 0 && !error && query && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No results found. Try a different search term.
          </div>
        )}

        {!query && !isSearching && searchResults.length === 0 && (
          <div className="text-center py-4">
            <Link to="/job-search">
              <Button variant="outline" size="sm">
                <Briefcase className="h-4 w-4 mr-2" />
                Open Full Job Search
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}