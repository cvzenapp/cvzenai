import { useState, useEffect } from 'react';
import { Briefcase, MapPin, Calendar, Clock, CheckCircle, XCircle, Eye, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { jobApplicationApi } from '../../services/jobApplicationApi';

interface Application {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  location: string;
  job_type: string;
  status: string;
  applied_at: string;
  updated_at: string;
}

export function MyApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await jobApplicationApi.getMyApplications();
      if (response.success) {
        setApplications(response.data);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: 'Pending Review',
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        dotColor: 'bg-yellow-500'
      },
      reviewed: {
        label: 'Reviewed',
        icon: Eye,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500'
      },
      shortlisted: {
        label: 'Shortlisted',
        icon: Star,
        color: 'bg-purple-100 text-purple-700 border-purple-200',
        dotColor: 'bg-purple-500'
      },
      accepted: {
        label: 'Accepted',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-200',
        dotColor: 'bg-green-500'
      },
      rejected: {
        label: 'Not Selected',
        icon: XCircle,
        color: 'bg-red-100 text-red-700 border-red-200',
        dotColor: 'bg-red-500'
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewed: applications.filter(a => a.status === 'reviewed').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Applications Yet</h3>
        <p className="text-gray-600 mb-6">
          Start applying to jobs to track your applications here.
        </p>
        <button
          onClick={() => {
            const recommendationsTab = document.querySelector('[data-tab="recommendations"]');
            if (recommendationsTab) {
              (recommendationsTab as HTMLElement).click();
            }
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Applications' },
          { key: 'pending', label: 'Pending' },
          { key: 'reviewed', label: 'Reviewed' },
          { key: 'shortlisted', label: 'Shortlisted' },
          { key: 'accepted', label: 'Accepted' },
          { key: 'rejected', label: 'Not Selected' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
            {statusCounts[key as keyof typeof statusCounts] > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                filter === key ? 'bg-blue-500' : 'bg-gray-200'
              }`}>
                {statusCounts[key as keyof typeof statusCounts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No applications in this category
          </div>
        ) : (
          filteredApplications.map((application) => {
            const statusConfig = getStatusConfig(application.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {application.job_title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {application.company}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {application.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Applied {new Date(application.applied_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{statusConfig.label}</span>
                    </div>
                  </div>

                  {/* Job Type Badge */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {application.job_type}
                    </Badge>
                    
                    {/* Timeline indicator */}
                    {application.updated_at !== application.applied_at && (
                      <span className="text-xs text-gray-500">
                        Updated {new Date(application.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Status-specific messages */}
                  {application.status === 'shortlisted' && (
                    <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                      <p className="text-sm text-purple-800">
                        🎉 Congratulations! You've been shortlisted. The recruiter may contact you soon.
                      </p>
                    </div>
                  )}
                  {application.status === 'accepted' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg">
                      <p className="text-sm text-green-800">
                        🎊 Great news! Your application has been accepted. Check your email for next steps.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
