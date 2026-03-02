import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Search, Eye, FileText, Mail, Calendar, User, Download, ExternalLink, AlertCircle, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { recruiterApplicationsApi, type JobApplication } from '@/services/recruiterApplicationsApi';
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
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
  } | null>(null);
  const [showResumeViewer, setShowResumeViewer] = useState(false);
  const [resumeViewerUrl, setResumeViewerUrl] = useState<string>('');
  const [viewerError, setViewerError] = useState(false);
  const [screeningApplicationId, setScreeningApplicationId] = useState<number | null>(null);

  useEffect(() => {
    loadApplications();
  }, [jobId, statusFilter]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (jobId) filters.jobId = jobId;
      if (statusFilter !== 'all') filters.status = statusFilter;

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

  const handleStatusChange = async (applicationId: number, newStatus: JobApplication['status']) => {
    try {
      const response = await recruiterApplicationsApi.updateApplicationStatus(applicationId, newStatus);
      if (response.success) {
        // Update local state
        setApplications(prev =>
          prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app)
        );
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication({ ...selectedApplication, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Failed to update status:', error);
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
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
        guestEmail: application.applicant_email || ''
      });
    } else {
      setSelectedCandidateForInterview({
        candidateId: application.user_id,
        candidateName: application.applicant_name || 'Unknown',
        candidateEmail: application.applicant_email || '',
        resumeId: application.resume_id || 0,
        resumeTitle: application.job_title || 'Resume',
        isGuest: false
      });
    }
    setShowInterviewModal(true);
  };

  const handleInterviewScheduled = () => {
    setShowInterviewModal(false);
    setSelectedCandidateForInterview(null);
    
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

  const filteredApplications = applications.filter(app =>
    app.applicant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.applicant_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-normal text-slate-900">Applications</h2>
          <p className="text-sm text-slate-600 mt-1">
            {applications.length} total application{applications.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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

          {/* <Button
            onClick={testInterviewAPI}
            variant="outline"
            size="sm"
            className="whitespace-nowrap"
          >
            Test API
          </Button> */}
        </div>
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading applications...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredApplications.map((application) => (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-normal text-slate-900">{application.applicant_name}</h3>
                        <p className="text-sm text-slate-600">{application.job_title}</p>
                      </div>
                      {/* AI Score Badge */}
                      {application.ai_score !== undefined && application.ai_score !== null && (
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-normal ${
                            application.ai_score >= 80 ? 'bg-green-100 text-green-700' :
                            application.ai_score >= 60 ? 'bg-blue-100 text-blue-700' :
                            application.ai_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            <Sparkles className="h-3 w-3 inline mr-1" />
                            {application.ai_score}/100
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {application.applicant_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Badge className={getStatusColor(application.status)}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </Badge>

                    <div className="flex gap-2">
                      {/* Screen with AI Button - only show if application has resume */}
                      {!application.ai_score && application.resume_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleScreenWithAI(application.id)}
                          disabled={screeningApplicationId === application.id}
                          className="border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          {screeningApplicationId === application.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                              Screening...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-1" />
                              Screen with AI
                            </>
                          )}
                        </Button>
                      )}

                      <Select
                        value={application.status}
                        onValueChange={(value) => handleStatusChange(application.id, value as JobApplication['status'])}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
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

                      {/* Schedule Interview Button - show for all shortlisted candidates */}
                      {application.status === 'shortlisted' && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleScheduleInterview(application)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Interview
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewApplicationDetails(application)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Applicant Information</CardTitle>
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
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
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
                          <TrendingUp className="h-4 w-4 text-green-600" />
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
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
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
                    <CardTitle className="text-lg">Cover Letter</CardTitle>
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
                  <CardTitle className="text-lg">Resume</CardTitle>
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
                        <Eye className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                      <Button
                        onClick={() => window.open(selectedApplication.resume_file_url, '_blank')}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Resume
                      </Button>
                    </>
                  ) : selectedApplication.shared_token || selectedApplication.resume_id ? (
                    // Regular application - show view button
                    <Button
                      onClick={() => navigate(`/shared/resume/${selectedApplication.shared_token || selectedApplication.resume_id}`)}
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Full Resume
                    </Button>
                  ) : (
                    <p className="text-sm text-slate-500">No resume available</p>
                  )}
                  
                  {selectedApplication.is_guest && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      <User className="h-4 w-4" />
                      <span>Guest Application (No CVZen account)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Update and Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
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
                            <Sparkles className="h-4 w-4 mr-2" />
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
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Interview
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
              <DialogTitle>Resume Document</DialogTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(resumeViewerUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
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
                  <Download className="h-4 w-4 mr-2" />
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
                    <FileText className="h-16 w-16 text-slate-300" />
                    <p className="text-slate-600">Preview not available for this file type</p>
                    <Button
                      onClick={() => window.open(resumeViewerUrl, '_blank')}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}

                {viewerError && resumeViewerUrl.toLowerCase().endsWith('.pdf') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 gap-4 p-8">
                    <AlertCircle className="h-16 w-16 text-amber-500" />
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
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                      <Button
                        onClick={() => window.open(resumeViewerUrl, '_blank')}
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
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
    </div>
  );
}
