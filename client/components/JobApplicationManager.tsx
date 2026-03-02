/**
 * Job Application Manager Component
 * Tracks and manages user's job applications
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  Calendar,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Briefcase,
  TrendingUp
} from 'lucide-react';

interface JobApplication {
  id: string;
  jobId: string;
  userId: number;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  resumeVersion?: string;
  coverLetter?: string;
  customizations?: Array<{ field: string; value: string }>;
  status: 'submitted' | 'reviewed' | 'interview' | 'offer' | 'rejected' | 'withdrawn';
  appliedAt: string;
  lastUpdated: string;
  timeline: ApplicationEvent[];
}

interface ApplicationEvent {
  id: string;
  type: 'submitted' | 'reviewed' | 'interview_scheduled' | 'interview_completed' | 'offer_made' | 'rejected' | 'withdrawn';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface JobApplicationManagerProps {
  applications: JobApplication[];
  onStatusUpdate: (applicationId: string, status: string) => void;
}

export default function JobApplicationManager({ applications: propApplications, onStatusUpdate }: JobApplicationManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const queryClient = useQueryClient();

  // Fetch user's applications
  const { data: applicationsData, isLoading } = useQuery({
    queryKey: ['job-applications', statusFilter],
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/job-applications/my-applications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch applications');
      }
      
      // Transform the data to match the component's expected format
      return result.data.map((app: any) => ({
        id: app.id.toString(),
        jobId: app.job_id.toString(),
        userId: app.user_id,
        title: app.job_title,
        company: app.company,
        location: app.location,
        remote: app.location?.toLowerCase().includes('remote'),
        status: app.status,
        appliedAt: app.applied_at,
        lastUpdated: app.updated_at,
        timeline: [{
          id: '1',
          type: 'submitted',
          description: 'Application submitted',
          timestamp: app.applied_at
        }]
      }));
    }
  });

  // Use real data if available, otherwise fall back to props
  const applications = applicationsData || propApplications;

  // Withdraw application mutation (placeholder - not implemented yet)
  const withdrawMutation = {
    mutate: (applicationId: string) => {
      console.log('Withdraw not implemented yet:', applicationId);
    },
    mutateAsync: async (applicationId: string) => {
      console.log('Withdraw not implemented yet:', applicationId);
    },
    isPending: false
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4" />;
      case 'reviewed':
        return <Eye className="h-4 w-4" />;
      case 'interview':
        return <Calendar className="h-4 w-4" />;
      case 'offer':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredApplications = applications.filter((app: JobApplication) => {
    const matchesSearch = !searchQuery || 
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const statusCounts = applications.reduce((acc: Record<string, number>, app: JobApplication) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const handleWithdrawApplication = async (applicationId: string) => {
    if (confirm('Are you sure you want to withdraw this application?')) {
      try {
        await withdrawMutation.mutateAsync(applicationId);
      } catch (error) {
        console.error('Failed to withdraw application:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
        </div>
        
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 mb-6">
              Start applying to jobs to track your applications here.
            </p>
            <Button onClick={() => window.location.href = '#search'}>
              Browse Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Applications</h2>
          <p className="text-gray-600">Track and manage your job applications</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{statusCounts.submitted || 0}</div>
            <div className="text-sm text-gray-600">Submitted</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.reviewed || 0}</div>
            <div className="text-sm text-gray-600">Reviewed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{statusCounts.interview || 0}</div>
            <div className="text-sm text-gray-600">Interview</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{statusCounts.offer || 0}</div>
            <div className="text-sm text-gray-600">Offers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{statusCounts.rejected || 0}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((application: JobApplication) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{application.title}</h3>
                    <Badge className={`${getStatusColor(application.status)} border-0 flex items-center gap-1`}>
                      {getStatusIcon(application.status)}
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      {application.company}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {application.remote ? 'Remote' : application.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Timeline Preview */}
                  {application.timeline && application.timeline.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Recent Activity:</div>
                      <div className="text-sm text-gray-600">
                        {application.timeline[application.timeline.length - 1]?.description}
                        <span className="text-gray-400 ml-2">
                          {new Date(application.timeline[application.timeline.length - 1]?.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Progress Indicator */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Application Progress</span>
                      <span>
                        {application.status === 'submitted' && '25%'}
                        {application.status === 'reviewed' && '50%'}
                        {application.status === 'interview' && '75%'}
                        {(application.status === 'offer' || application.status === 'rejected') && '100%'}
                        {application.status === 'withdrawn' && '0%'}
                      </span>
                    </div>
                    <Progress 
                      value={
                        application.status === 'submitted' ? 25 :
                        application.status === 'reviewed' ? 50 :
                        application.status === 'interview' ? 75 :
                        (application.status === 'offer' || application.status === 'rejected') ? 100 :
                        0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Last updated: {new Date(application.lastUpdated).toLocaleDateString()}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(application)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                  
                  {application.status === 'submitted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWithdrawApplication(application.id)}
                      disabled={withdrawMutation.isPending}
                    >
                      Withdraw
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/jobs/${application.jobId}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Job
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      {applicationsData?.hasMore && (
        <div className="text-center">
          <Button variant="outline">
            Load More Applications
          </Button>
        </div>
      )}

      {/* Application Details Modal/Sheet would go here */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{selectedApplication.title} at {selectedApplication.company}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Application Timeline */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Application Timeline</h4>
                <div className="space-y-4">
                  {selectedApplication.timeline.map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {getStatusIcon(event.type)}
                        </div>
                        {index < selectedApplication.timeline.length - 1 && (
                          <div className="w-px h-8 bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium text-gray-900">{event.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Application Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Application Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Resume Version:</strong> {selectedApplication.resumeVersion || 'Default'}</div>
                  {selectedApplication.coverLetter && (
                    <div><strong>Cover Letter:</strong> Included</div>
                  )}
                  {selectedApplication.customizations && selectedApplication.customizations.length > 0 && (
                    <div><strong>Customizations:</strong> {selectedApplication.customizations.length} modifications</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}