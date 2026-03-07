import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Eye, FileText, Mail, Calendar, User, Download, ExternalLink, AlertCircle, Sparkles, TrendingUp, AlertTriangle, Filter, X } from 'lucide-react';
import { recruiterApplicationsApi, type JobApplication } from '@/services/recruiterApplicationsApi';
import { jobPostingsApi, type JobPosting } from '@/services/jobPostingsApi';
import { ScheduleInterviewForm } from '@/components/interviews/ScheduleInterviewForm';
import { recruiterInterviewApi } from '@/services/recruiterInterviewApi';
import { format } from 'date-fns';
import { DocxViewer } from '@/components/DocxViewer';
import '@/components/DocxViewer.css';

interface ApplicationsManagerProps {
  jobId?: number;
  onNavigateToInterviews?: () => void;
}

export default function ApplicationsManager({ jobId, onNavigateToInterviews }: ApplicationsManagerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [displayedApplications, setDisplayedApplications] = useState<JobApplication[]>([]);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobFilter, setJobFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [shortlistMessage, setShortlistMessage] = useState('');
  const [shortlistingApplicationId, setShortlistingApplicationId] = useState<number | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState<{
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    resumeId: number;
    resumeTitle: string;
    isGuest?: boolean;
    guestName?: string;
    guestEmail?: string;
    jobPostingId?: number;
    applicationId?: number;
    currentRound?: number;
  } | null>(null);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [resumeViewerUrl, setResumeViewerUrl] = useState<string>('');
  const [viewerError, setViewerError] = useState(false);
  const [screeningApplicationId, setScreeningApplicationId] = useState<number | null>(null);

  useEffect(() => {
    loadApplications();
    loadJobPostings();
  }, [jobId, statusFilter]); // Remove jobFilter from dependencies since we filter on frontend

  useEffect(() => {
    // Reset pagination when search query or job filter changes
    if (searchQuery || jobFilter !== 'all') {
      setCurrentPage(1);
    }
  }, [searchQuery, jobFilter]);

  useEffect(() => {
    // Update displayed applications when applications or search query changes
    updateDisplayedApplications();
  }, [applications, currentPage, searchQuery, jobFilter]);

  const updateDisplayedApplications = () => {
    // Apply search filter first
    let filtered = applications.filter(app =>
      app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply job filter if not showing all jobs
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => {
        const appJobId = app.job_id;
        const filterJobId = jobFilter;
        
        // More robust comparison - handle both string and number IDs
        return appJobId?.toString() === filterJobId || 
               appJobId === parseInt(filterJobId);
      });
    }
    
    // Then apply pagination
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    const displayed = filtered.slice(startIndex, endIndex);
    
    setDisplayedApplications(displayed);
    setHasMore(endIndex < filtered.length);
  };

  const loadJobPostings = async () => {
    try {
      const response = await jobPostingsApi.getJobPostings();
      if (response.success) {
        setJobPostings(response.jobPostings || []);
      }
    } catch (error) {
      console.error('Failed to load job postings:', error);
    }
  };

  const loadApplications = async () => {
    setLoading(true);
    setCurrentPage(1);
    try {
      const filters: any = {};
      if (jobId) filters.jobId = jobId;
      if (statusFilter !== 'all') filters.status = statusFilter;
      // Don't apply jobFilter in API call - we'll filter on frontend to show correct counts

      const response = await recruiterApplicationsApi.getApplications(filters);
      if (response.success) {
        setApplications(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreApplications = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleStatusChange = async (applicationId: number, newStatus: JobApplication['status']) => {
    try {
      // If changing to shortlisted, show modal for custom message
      if (newStatus === 'shortlisted') {
        setShortlistingApplicationId(applicationId);
        setShortlistMessage('We will contact you soon with next steps for the interview process.');
        setShowShortlistModal(true);
        return;
      }
      
      // For other status changes, use the regular update endpoint
      const response = await recruiterApplicationsApi.updateApplicationStatus(applicationId, newStatus);
      if (response.success) {
        // Update local state
        setApplications(prev =>
          prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
        );
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication({ ...selectedApplication, status: newStatus });
        }
        
        // Show success message for other status changes
        toast({
          title: "Status Updated",
          description: `Application status changed to ${newStatus}.`,
        });
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmShortlist = async () => {
    if (!shortlistingApplicationId) return;
    
    try {
      const token = localStorage.getItem('recruiter_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/recruiter/shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          applicationId: shortlistingApplicationId,
          nextSteps: shortlistMessage || 'We will contact you soon with next steps for the interview process.'
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update local state
        setApplications(prev =>
          prev.map(app => app.id === shortlistingApplicationId ? { ...app, status: 'shortlisted' } : app)
        );
        if (selectedApplication?.id === shortlistingApplicationId) {
          setSelectedApplication({ ...selectedApplication, status: 'shortlisted' });
        }
        
        // Show success message
        toast({
          title: "Candidate Shortlisted!",
          description: `${result.data?.candidateName || 'Candidate'} has been shortlisted and notified via email.`,
        });
        
        // Close modal and reset state
        setShowShortlistModal(false);
        setShortlistingApplicationId(null);
        setShortlistMessage('');
      } else {
        throw new Error(result.message || 'Failed to shortlist candidate');
      }
    } catch (error) {
      console.error('Failed to shortlist candidate:', error);
      toast({
        title: "Error",
        description: "Failed to shortlist candidate. Please try again.",
        variant: "destructive",
      });
    }
  };

  const viewApplicationDetails = async (application: JobApplication) => {
    try {
      const response = await recruiterApplicationsApi.getApplication(application.id);
      if (response.success) {
        setSelectedApplication(response.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Failed to load application details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200',
      reviewed: 'bg-gradient-to-r from-blue-100 to-brand-auxiliary-1 text-blue-800 border-blue-200',
      shortlisted: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200',
      accepted: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200';
  };

  const handleScheduleInterview = (application: JobApplication) => {
    // For guest applications, pass guest info instead of user_id
    if (application.is_guest || !application.user_id) {
      setSelectedCandidateForInterview({
        candidateId: 0, // Use 0 to indicate guest
        candidateName: application.applicant_name || 'Unknown',
        candidateEmail: application.applicant_email || '',
        resumeId: 0, // Guest applications may not have resume_id
        resumeTitle: application.job_title || 'Resume',
        isGuest: true,
        guestName: application.applicant_name || '',
        guestEmail: application.applicant_email || '',
        jobPostingId: application.job_id,
        applicationId: application.id,
        currentRound: application.currentRound || 0
      });
    } else {
      setSelectedCandidateForInterview({
        candidateId: application.user_id,
        candidateName: application.applicant_name || 'Unknown',
        candidateEmail: application.applicant_email || '',
        resumeId: application.resume_id || 0,
        resumeTitle: application.job_title || 'Resume',
        isGuest: false,
        jobPostingId: application.job_id,
        applicationId: application.id,
        currentRound: application.currentRound || 0
      });
    }
    setShowInterviewModal(true);
  };

  const handleInterviewScheduled = () => {
    setShowInterviewModal(false);
    setSelectedCandidateForInterview(null);
    
    // Reload applications to get updated interview counts
    loadApplications();
    
    // Navigate to Interviews tab if callback provided
    if (onNavigateToInterviews) {
      onNavigateToInterviews();
    }
  };

  const testInterviewAPI = async () => {
    try {
      console.log('🧪 Testing recruiter interview API...');
      const interviews = await recruiterInterviewApi.getMyInterviews();
      console.log('✅ API Test Success:', interviews);
      alert(`API Test Success: Found ${interviews.length} interviews`);
    } catch (error: any) {
      console.error('❌ API Test Failed:', error);
      alert(`API Test Failed: ${error.message}`);
    }
  };

  const handleScreenWithAI = async (applicationId: number) => {
    setScreeningApplicationId(applicationId);
    try {
      const response = await recruiterApplicationsApi.screenApplication(applicationId);
      if (response.success) {
        // Update local state with AI screening results
        setApplications(prev =>
          prev.map(app => app.id === applicationId ? { ...app, ...response.data } : app)
        );
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication({ ...selectedApplication, ...response.data });
        }
      }
    } catch (error) {
      console.error('Failed to screen application:', error);
    } finally {
      setScreeningApplicationId(null);
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    if (!recommendation) return '';
    const lower = recommendation.toLowerCase();
    if (lower.includes('highly')) return 'text-green-600 bg-green-50';
    if (lower.includes('recommended') && !lower.includes('not')) return 'text-blue-600 bg-blue-50';
    if (lower.includes('maybe')) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Calculate filtered applications for counts and display
  const searchFilteredApplications = applications.filter(app =>
    app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.applicant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allFilteredApplications = jobFilter !== 'all' 
    ? searchFilteredApplications.filter(app => {
        const appJobId = app.job_id;
        const filterJobId = jobFilter;
        return appJobId?.toString() === filterJobId || 
               appJobId === parseInt(filterJobId);
              //  appJobId === filterJobId;
      })
    : searchFilteredApplications;

  // Calculate counts from original applications data (before any filtering)
  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const jobCounts = applications.reduce((acc, app) => {
    const jobId = app.job_id?.toString() || 'unknown';
    acc[jobId] = (acc[jobId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-50 to-white min-h-screen">
      {/* Enhanced Header with CVZen Branding */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-4">
            {/* Title and Stats Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 font-jakarta">Applications</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {allFilteredApplications.length} total application{allFilteredApplications.length !== 1 ? 's' : ''}
                    {(searchQuery || jobFilter !== 'all') && ` (${displayedApplications.length} shown)`}
                    {jobFilter !== 'all' && jobPostings.find(j => j.id === jobFilter) && 
                      ` for "${jobPostings.find(j => j.id === jobFilter)?.title}"`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search Bar with Filter Toggle */}
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-main/60" />
                  <Input
                    placeholder="Search applicants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-slate-200 focus:border-brand-main focus:ring-brand-main/20"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-slate-200 hover:border-brand-main hover:text-brand-main"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* Filter Dropdowns - Always visible on desktop, toggle on mobile */}
              <div className={`flex flex-col sm:flex-row gap-2 ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
                <Select value={jobFilter} onValueChange={setJobFilter}>
                  <SelectTrigger className="w-full sm:w-48 border-slate-200 focus:border-brand-main">
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs ({applications.length})</SelectItem>
                    {jobPostings.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} ({jobCounts[job.id] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 border-slate-200 focus:border-brand-main">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending ({statusCounts.pending || 0})</SelectItem>
                    <SelectItem value="reviewed">Reviewed ({statusCounts.reviewed || 0})</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted ({statusCounts.shortlisted || 0})</SelectItem>
                    <SelectItem value="accepted">Accepted ({statusCounts.accepted || 0})</SelectItem>
                    <SelectItem value="rejected">Rejected ({statusCounts.rejected || 0})</SelectItem>
                  </SelectContent>
                </Select>

                {(searchQuery || jobFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setJobFilter('all');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    className="whitespace-nowrap border-slate-200 hover:border-brand-main hover:text-brand-main"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Applications List */}
      <div className="px-4 sm:px-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-brand-main border-t-transparent"></div>
            <p className="mt-4 text-slate-600 font-medium">Loading applications...</p>
          </div>
        ) : displayedApplications.length === 0 ? (
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-main/10 to-brand-main/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-brand-main" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 font-jakarta">No applications found</h3>
              <p className="text-slate-600">Try adjusting your filters or check back later for new applications.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {displayedApplications.map((application, index) => (
              <Card key={`${application.id}-${index}`} className="hover:shadow-lg transition-all duration-200 border-slate-200 bg-white">
                <CardContent className="p-4 sm:p-6">
                  {/* Mobile-first responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Main content area */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-main flex items-center justify-center shadow-md flex-shrink-0">
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* First line: Name and Role */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900 text-base sm:text-lg font-jakarta truncate">
                              {application.applicant_name}
                            </h3>
                            <span className="text-brand-main font-medium text-sm sm:text-base">
                              ({application.job_title})
                            </span>
                          </div>
                          {/* Second line: Email and Date */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-brand-main flex-shrink-0" />
                              <span className="font-medium truncate">{application.applicant_email}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-brand-main flex-shrink-0" />
                              <span className="whitespace-nowrap">Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Score Badge - Mobile positioned below content */}
                      {application.ai_score !== undefined && application.ai_score !== null && (
                        <div className="flex justify-start sm:hidden mb-3">
                          <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm ${
                            application.ai_score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
                            application.ai_score >= 60 ? 'bg-gradient-to-r from-blue-500 to-brand-main text-white' :
                            application.ai_score >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' :
                            'bg-gradient-to-r from-red-400 to-pink-400 text-white'
                          }`}>
                            <Sparkles className="h-3 w-3 inline mr-1" />
                            {application.ai_score}/100
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop AI Score Badge */}
                    {application.ai_score !== undefined && application.ai_score !== null && (
                      <div className="hidden sm:flex items-center gap-2">
                        <div className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                          application.ai_score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white' :
                          application.ai_score >= 60 ? 'bg-gradient-to-r from-blue-500 to-brand-main text-white' :
                          application.ai_score >= 40 ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white' :
                          'bg-gradient-to-r from-red-400 to-pink-400 text-white'
                        }`}>
                          <Sparkles className="h-4 w-4 inline mr-2" />
                          {application.ai_score}/100
                        </div>
                      </div>
                    )}

                    {/* Actions - Mobile stacked, Desktop horizontal */}
                    <div className="flex flex-row items-center gap-2 sm:ml-6">
                      {/* Enhanced Screen with AI Button */}
                      {!application.ai_score && application.resume_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScreenWithAI(application.id)}
                          disabled={screeningApplicationId === application.id}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 text-xs sm:text-sm"
                        >
                          {screeningApplicationId === application.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1 sm:mr-2"></div>
                              <span className="hidden sm:inline">Screening...</span>
                              <span className="sm:hidden">AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-brand-main" />
                              <span className="hidden sm:inline">AI Screen</span>
                              <span className="sm:hidden">AI</span>
                            </>
                          )}
                        </Button>
                      )}

                      <Select
                        value={application.status}
                        onValueChange={(value) => handleStatusChange(application.id, value as JobApplication['status'])}
                      >
                        <SelectTrigger className="w-28 sm:w-32 h-8 sm:h-9 text-xs border-slate-200 focus:border-brand-main">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="reviewed">Reviewed</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Enhanced Interview Button */}
                      {application.status === 'shortlisted' && (
                        (() => {
                          console.log('🔍 Button render debug:', {
                            id: application.id,
                            hasScheduledInterview: application.hasScheduledInterview,
                            interviewCount: application.interviewCount,
                            currentRound: application.currentRound
                          });
                          
                          return (
                            <Button
                              size="sm"
                              onClick={() => handleScheduleInterview(application)}
                              className={application.hasScheduledInterview 
                                ? "bg-green-600 hover:bg-green-700 text-white shadow-md text-xs sm:text-sm"
                                : "bg-gradient-to-r from-brand-main to-brand-background hover:from-brand-background hover:to-brand-main text-white shadow-md text-xs sm:text-sm"
                              }
                            >
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">
                                {application.hasScheduledInterview ? 'Scheduled' : 'Interview'}
                                {application.currentRound > 0 && ` R${application.currentRound + 1}`}
                                {application.interviewCount > 1 && ` (${application.interviewCount})`}
                              </span>
                              <span className="sm:hidden">
                                {application.hasScheduledInterview ? 'Done' : 'Meet'}
                              </span>
                            </Button>
                          );
                        })()
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewApplicationDetails(application)}
                        className="border-slate-200 hover:border-brand-main hover:text-brand-main text-xs sm:text-sm"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">View</span>
                        <span className="sm:hidden">Details</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Enhanced Load More Button */}
            {hasMore && (
              <div className="text-center py-6">
                <Button
                  onClick={loadMoreApplications}
                  disabled={loadingMore}
                  variant="outline"
                  className="w-full max-w-xs border-brand-main text-brand-main hover:bg-brand-main hover:text-white"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-main mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    `Load More (${allFilteredApplications.length - displayedApplications.length} remaining)`
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-jakarta">Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-jakarta">Applicant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Name</p>
                      <p className="font-normal">{selectedApplication.applicant_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <p className="font-normal">{selectedApplication.applicant_email}</p>
                    </div>
                    {selectedApplication.applicant_phone && (
                      <div>
                        <p className="text-sm text-slate-600">Phone</p>
                        <p className="font-normal">{selectedApplication.applicant_phone}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-600">Applied Date</p>
                      <p className="font-normal">
                        {format(new Date(selectedApplication.applied_at), 'MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Screening Results */}
              {selectedApplication.ai_score !== undefined && selectedApplication.ai_score !== null && (
                <Card className="border-purple-200 bg-purple-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 font-jakarta">
                      <Sparkles className="h-5 w-5 text-brand-main" />
                      AI Screening Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Score and Recommendation */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-1">Match Score</p>
                        <div className="flex items-center gap-2">
                          <div className={`text-3xl font-normal ${
                            selectedApplication.ai_score >= 80 ? 'text-green-600' :
                            selectedApplication.ai_score >= 60 ? 'text-blue-600' :
                            selectedApplication.ai_score >= 40 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {selectedApplication.ai_score}
                          </div>
                          <span className="text-slate-500">/100</span>
                        </div>
                      </div>
                      {selectedApplication.ai_recommendation && (
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-1">Recommendation</p>
                          <Badge className={`${getRecommendationColor(selectedApplication.ai_recommendation)} border-0 px-3 py-1`}>
                            {selectedApplication.ai_recommendation}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Reasoning */}
                    {selectedApplication.ai_reasoning && (
                      <div>
                        <p className="text-sm font-normal text-slate-700 mb-2">Analysis</p>
                        <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                          {selectedApplication.ai_reasoning}
                        </p>
                      </div>
                    )}

                    {/* Strengths */}
                    {selectedApplication.ai_strengths && selectedApplication.ai_strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-normal text-slate-700 mb-2 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-brand-main" />
                          Strengths
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.ai_strengths.map((strength, idx) => (
                            <Badge key={idx} className="bg-green-100 text-green-700 border-0">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Concerns */}
                    {selectedApplication.ai_concerns && selectedApplication.ai_concerns.length > 0 && (
                      <div>
                        <p className="text-sm font-normal text-slate-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-brand-main" />
                          Concerns
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedApplication.ai_concerns.map((concern, idx) => (
                            <Badge key={idx} className="bg-amber-100 text-amber-700 border-0">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Screened timestamp */}
                    {selectedApplication.ai_screened_at && (
                      <p className="text-xs text-slate-500">
                        Screened on {format(new Date(selectedApplication.ai_screened_at), 'MMMM d, yyyy \'at\' h:mm a')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-jakarta">Cover Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-slate-700">
                      {selectedApplication.cover_letter}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Resume Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-jakarta">Resume</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedApplication.is_guest && selectedApplication.resume_file_url ? (
                    // Guest application - show view and download buttons
                    <>
                      <Button
                        onClick={() => {
                          setResumeViewerUrl(selectedApplication.resume_file_url!);
                          setShowResumeViewer(true);
                        }}
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2 text-white" />
                        View Resume
                      </Button>
                      <Button
                        onClick={() => window.open(selectedApplication.resume_file_url, '_blank')}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2 text-brand-main" />
                        Download Resume
                      </Button>
                    </>
                  ) : selectedApplication.shared_token || selectedApplication.resume_id ? (
                    // Regular application - show view button
                    <Button
                      onClick={() => navigate(`/shared/resume/${selectedApplication.shared_token || selectedApplication.resume_id}`)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2 text-white" />
                      View Full Resume
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-500">No resume available</p>
                  )}
                  
                  {selectedApplication.is_guest && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      <User className="h-4 w-4 text-brand-main" />
                      <span>Guest Application (No CVZen account)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Update and Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-jakarta">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* AI Screening Button - only show if application has resume */}
                  {!selectedApplication.ai_score && selectedApplication.resume_id && (
                    <div>
                      <p className="text-sm text-slate-600 mb-2">AI Screening</p>
                      <Button
                        onClick={() => handleScreenWithAI(selectedApplication.id)}
                        disabled={screeningApplicationId === selectedApplication.id}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {screeningApplicationId === selectedApplication.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Analyzing with AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2 text-white" />
                            Screen with AI
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-slate-500 mt-1">
                        Get AI-powered analysis of candidate fit for this position
                      </p>
                    </div>
                  )}
                  
                  {/* Show message if no resume available */}
                  {!selectedApplication.resume_id && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-sm text-amber-800">
                        AI screening is not available for applications without resume data.
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-slate-600 mb-2">Update Status</p>
                    <Select
                      value={selectedApplication.status}
                      onValueChange={(value) => {
                        handleStatusChange(selectedApplication.id, value as JobApplication['status']);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Schedule Interview Button for shortlisted candidates */}
                  {selectedApplication.status === 'shortlisted' && (
                    <div>
                      <p className="text-sm text-slate-600 mb-2">Interview Scheduling</p>
                      <Button
                        onClick={() => {
                          handleScheduleInterview(selectedApplication);
                          setShowDetailsModal(false);
                        }}
                        className={`w-full ${selectedApplication.hasScheduledInterview 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <Calendar className="h-4 w-4 mr-2 text-white" />
                        {selectedApplication.hasScheduledInterview ? 'Reschedule Interview' : 'Schedule Interview'}
                        {selectedApplication.currentRound > 0 && ` - Round ${selectedApplication.currentRound + 1}`}
                        {selectedApplication.interviewCount > 1 && ` (${selectedApplication.interviewCount} total)`}
                      </Button>
                      {selectedApplication.is_guest && (
                        <p className="text-xs text-slate-500 mt-2">
                          Interview invitation will be sent to: {selectedApplication.applicant_email}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Modal */}
      {showInterviewModal && selectedCandidateForInterview && (
        <ScheduleInterviewForm
          isOpen={true}
          onClose={() => setShowInterviewModal(false)}
          onSuccess={handleInterviewScheduled}
          preSelectedCandidate={selectedCandidateForInterview}
        />
      )}

      {/* Resume Viewer Modal */}
      <Dialog open={showResumeViewer} onOpenChange={(open) => {
        setShowResumeViewer(open);
        if (!open) {
          setViewerError(false);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[95vh] p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-jakarta">Resume Document</DialogTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(resumeViewerUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2 text-brand-main" />
                  Open in New Tab
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = resumeViewerUrl;
                    link.download = 'resume';
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2 text-brand-main" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          <div className="w-full h-[calc(95vh-120px)] overflow-auto bg-slate-50">
            {resumeViewerUrl && (
              <>
                {resumeViewerUrl.toLowerCase().endsWith('.pdf') ? (
                  // PDF Viewer
                  <iframe
                    src={resumeViewerUrl}
                    className="w-full h-full border-0"
                    title="Resume PDF Viewer"
                    onError={() => setViewerError(true)}
                  />
                ) : resumeViewerUrl.toLowerCase().match(/\.(doc|docx)$/i) ? (
                  // DOCX Viewer using mammoth.js
                  <DocxViewer url={resumeViewerUrl} className="min-h-full" />
                ) : (
                  // Fallback for other file types
                  <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                    <FileText className="h-16 w-16 text-brand-main" />
                    <p className="text-slate-600">Preview not available for this file type</p>
                    <Button
                      onClick={() => window.open(resumeViewerUrl, '_blank')}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2 text-brand-main" />
                      Download to View
                    </Button>
                  </div>
                )}

                {viewerError && resumeViewerUrl.toLowerCase().endsWith('.pdf') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-4 p-8">
                    <AlertCircle className="h-16 w-16 text-brand-main" />
                    <div className="text-center">
                      <p className="text-slate-900 font-normal mb-2">Unable to load PDF preview</p>
                      <p className="text-slate-600 text-sm mb-4">The file might be corrupted or in an unsupported format</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = resumeViewerUrl;
                          link.download = 'resume.pdf';
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2 text-white" />
                        Download File
                      </Button>
                      <Button
                        onClick={() => window.open(resumeViewerUrl, '_blank')}
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2 text-brand-main" />
                        Try Opening in New Tab
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Shortlist Confirmation Modal */}
      <Dialog open={showShortlistModal} onOpenChange={setShowShortlistModal}>
        <DialogContent className="max-w-md rounded-xl border border-slate-200 shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-6 bg-gradient-to-r from-brand-main to-brand-background flex items-center justify-between">
            <DialogTitle className="font-jakarta text-xl font-semibold text-white">Shortlist Candidate</DialogTitle>
            <button
              onClick={() => setShowShortlistModal(false)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 absolute top-4 right-4"
            >
              <X className="w-5 h-5" />
            </button>
          </DialogHeader>
          
          <div className="space-y-6 p-6">
            <p className="text-sm text-slate-600 font-jakarta">
              The candidate will be notified via email about being shortlisted. You can customize the message below:
            </p>
            
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 font-jakarta">
                Next Steps Message
              </label>
              <textarea
                value={shortlistMessage}
                onChange={(e) => setShortlistMessage(e.target.value)}
                placeholder="Enter next steps for the candidate..."
                className="w-full p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta"
                rows={4}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowShortlistModal(false);
                  setShortlistingApplicationId(null);
                  setShortlistMessage('');
                }}
                className="flex-1 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-jakarta"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmShortlist}
                className="flex-1 bg-gradient-to-r from-brand-main to-brand-background hover:shadow-lg text-white font-jakarta"
              >
                Shortlist & Notify
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
