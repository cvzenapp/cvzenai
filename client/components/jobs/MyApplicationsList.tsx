import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star, 
  Search,
  ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { jobApplicationsApi } from '../../services/jobApplicationsApi';

interface Application {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  location: string;
  job_type: string;
  job_slug: string;
  status: string;
  applied_at: string;
  updated_at: string;
}

export function MyApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await jobApplicationsApi.getMyApplications();
      if (response.success) {
        setApplications(response.applications);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { label: 'Pending', icon: Clock, color: 'text-amber-600 bg-amber-50' },
      reviewed: { label: 'Reviewed', icon: Eye, color: 'text-blue-600 bg-blue-50' },
      shortlisted: { label: 'Shortlisted', icon: Star, color: 'text-purple-600 bg-purple-50' },
      accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50' }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = searchQuery === '' || 
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const getSuccessRate = () => {
    const total = applications.length;
    if (total === 0) return 0;
    const successful = statusCounts.accepted + statusCounts.shortlisted;
    return Math.round((successful / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#1891db] border-t-transparent"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-600 mb-6">Start applying to jobs to see them here</p>
        <Button className="bg-[#1891db] hover:bg-[#0a0a37] text-white">
          <Search className="w-4 h-4 mr-2" />
          Find Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1891db] rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">My Applications</h1>
        <div className="flex gap-6 text-sm">
          <span>{applications.length} Total</span>
          <span>{statusCounts.shortlisted + statusCounts.accepted} Positive</span>
          <span>{getSuccessRate()}% Success Rate</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'pending', label: 'Pending' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'shortlisted', label: 'Shortlisted' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'rejected', label: 'Rejected' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === key
                ? 'bg-[#1891db] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label} {statusCounts[key as keyof typeof statusCounts] > 0 && (
              <span className="ml-1">({statusCounts[key as keyof typeof statusCounts]})</span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-3">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No applications found
          </div>
        ) : (
          filteredApplications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={application.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="w-5 h-5 text-[#1891db]" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{application.job_title}</h3>
                        <p className="text-gray-600">{application.company}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {application.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(application.applied_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {application.job_type}
                        </Badge>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(`/jobs/${application.job_slug}`, '_blank')}
                        className="text-[#1891db] hover:bg-[#1891db] hover:text-white"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Job
                      </Button>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ml-4 ${statusConfig.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusConfig.label}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
