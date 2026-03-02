import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Eye, EyeOff, Briefcase, MapPin, Clock, DollarSign, Users, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { jobPostingsApi, JobPosting, JobPostingCreateRequest } from "@/services/jobPostingsApi";

interface JobPostingManagerProps {
  onJobsChange?: (jobs: JobPosting[]) => void;
}

const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time', icon: Briefcase },
  { value: 'part-time', label: 'Part-time', icon: Clock },
  { value: 'contract', label: 'Contract', icon: Users },
  { value: 'internship', label: 'Internship', icon: Calendar },
] as const;

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', description: '0-2 years experience' },
  { value: 'mid', label: 'Mid Level', description: '3-5 years experience' },
  { value: 'senior', label: 'Senior Level', description: '6+ years experience' },
  { value: 'executive', label: 'Executive', description: 'Leadership role' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'CAD', label: 'CAD (C$)', symbol: 'C$' },
  { value: 'AUD', label: 'AUD (A$)', symbol: 'A$' },
] as const;

export default function JobPostingManager({ onJobsChange }: JobPostingManagerProps) {
  console.log('🔍 JobPostingManager component rendering...');
  
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<'create' | 'edit' | null>(null);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10); // Show 10 jobs initially

  // Form state
  const [formData, setFormData] = useState<JobPostingCreateRequest>({
    title: '',
    department: '',
    location: '',
    jobType: 'full-time',
    experienceLevel: 'mid',
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: 'USD',
    description: '',
    requirements: [],
    benefits: [],
    isActive: true,
  });

  // Form helpers
  const [requirementInput, setRequirementInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    // Update displayed jobs when jobs list or display count changes
    setDisplayedJobs(jobs.slice(0, displayCount));
  }, [jobs, displayCount]);

  const loadJobs = async () => {
    try {
      console.log('🔍 Loading jobs...');
      setLoading(true);
      setError(null);
      const response = await jobPostingsApi.getJobPostings();
      console.log('🔍 Jobs API response:', response);
      if (response.success) {
        setJobs(response.jobs);
        onJobsChange?.(response.jobs);
        setDisplayCount(10); // Reset display count when loading new jobs
        console.log('✅ Jobs loaded successfully:', response.jobs.length);
      } else {
        console.error('❌ Jobs API returned error:', response);
        setError('Failed to load job postings');
      }
    } catch (err) {
      console.error('❌ Failed to load jobs:', err);
      setError('Failed to load job postings: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      department: '',
      location: '',
      jobType: 'full-time',
      experienceLevel: 'mid',
      salaryMin: undefined,
      salaryMax: undefined,
      salaryCurrency: 'USD',
      description: '',
      requirements: [],
      benefits: [],
      isActive: true,
    });
    setRequirementInput('');
    setBenefitInput('');
    setEditingJob(null);
    setActiveModal('create');
  };

  const handleEdit = (job: JobPosting) => {
    setFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      jobType: job.type,
      experienceLevel: job.level,
      salaryMin: job.salary.min || undefined,
      salaryMax: job.salary.max || undefined,
      salaryCurrency: job.salary.currency,
      description: job.description,
      requirements: job.requirements,
      benefits: job.benefits,
      isActive: job.isActive,
    });
    setRequirementInput('');
    setBenefitInput('');
    setEditingJob(job);
    setActiveModal('edit');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (editingJob) {
        const response = await jobPostingsApi.updateJobPosting(editingJob.id, formData);
        if (response.success) {
          await loadJobs();
          setActiveModal(null);
        }
      } else {
        const response = await jobPostingsApi.createJobPosting(formData);
        if (response.success) {
          await loadJobs();
          setActiveModal(null);
        }
      }
    } catch (err) {
      console.error('Failed to save job:', err);
      setError(err instanceof Error ? err.message : 'Failed to save job posting');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (job: JobPosting) => {
    if (!confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await jobPostingsApi.deleteJobPosting(job.id);
      if (response.success) {
        await loadJobs();
      }
    } catch (err) {
      console.error('Failed to delete job:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete job posting');
    }
  };

  const handleToggleStatus = async (job: JobPosting) => {
    try {
      const response = await jobPostingsApi.toggleJobStatus(job.id, !job.isActive);
      if (response.success) {
        await loadJobs();
      }
    } catch (err) {
      console.error('Failed to toggle job status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  const addRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), requirementInput.trim()]
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter((_, i) => i !== index) || []
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...(formData.benefits || []), benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits?.filter((_, i) => i !== index) || []
    });
  };

  const resetForm = () => {
    setActiveModal(null);
    setEditingJob(null);
    setError(null);
  };

  const formatSalary = (job: JobPosting) => {
    const currency = CURRENCIES.find(c => c.value === job.salary.currency);
    const symbol = currency?.symbol || '$';
    
    if (job.salary.min && job.salary.max) {
      return `${symbol}${job.salary.min.toLocaleString()} - ${symbol}${job.salary.max.toLocaleString()}`;
    } else if (job.salary.min) {
      return `${symbol}${job.salary.min.toLocaleString()}+`;
    } else if (job.salary.max) {
      return `Up to ${symbol}${job.salary.max.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  const getJobTypeInfo = (type: string) => {
    return JOB_TYPES.find(jt => jt.value === type) || JOB_TYPES[0];
  };

  const getExperienceLevelInfo = (level: string) => {
    return EXPERIENCE_LEVELS.find(el => el.value === level) || EXPERIENCE_LEVELS[1];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Loading job postings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 rounded-lg">
              <svg className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <div>
              <span className="text-slate-900">Job Postings</span>
              <p className="text-sm text-slate-500 font-normal mt-0.5">Manage your open positions and attract talent</p>
            </div>
          </CardTitle>
          <Button onClick={handleCreate} size="sm" className="bg-violet-600 hover:bg-violet-700">
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="max-w-sm mx-auto">
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-2xl mx-auto flex items-center justify-center">
                  <svg className="h-10 w-10 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-100 border-2 border-white rounded-full flex items-center justify-center">
                  <svg className="h-3 w-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-normal text-slate-900 mb-2">Start Hiring Great Talent</h3>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Create your first job posting to attract qualified candidates and grow your team.
              </p>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Reach qualified candidates</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Streamline your hiring process</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Build your dream team</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {displayedJobs.map((job) => {
                const jobTypeInfo = getJobTypeInfo(job.type);
                const experienceInfo = getExperienceLevelInfo(job.level);
                const JobTypeIcon = jobTypeInfo.icon;

                return (
                  <div
                    key={job.id}
                    className="group relative bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:border-violet-200 transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <Badge 
                        variant={job.isActive ? "default" : "secondary"}
                        className={job.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-slate-100 text-slate-600"}
                      >
                        {job.isActive ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-4 right-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(job)}
                        className="h-8 w-8 p-0"
                      >
                        {job.isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(job)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(job)}
                        className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Job Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <JobTypeIcon className="h-6 w-6 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-normal text-slate-900 group-hover:text-violet-600 transition-colors mb-1">
                          {job.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>{job.department}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                            <span>{formatSalary(job)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="bg-violet-50 text-violet-700">
                        {jobTypeInfo.label}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {experienceInfo.label}
                      </Badge>
                    </div>

                    {/* Job Description */}
                    <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Job Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{job.applicationsCount} applications</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{job.viewsCount} views</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Opportunity Badge */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="w-6 h-6 bg-violet-100 border-2 border-white rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {displayedJobs.length < jobs.length && (
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => setDisplayCount(prev => prev + 10)}
                  variant="outline"
                  className="w-full max-w-md"
                >
                  Load More ({jobs.length - displayedJobs.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Enhanced Job Posting Modal */}
      <Dialog open={activeModal !== null} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col z-50">
          <DialogHeader className="pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <svg className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-xl font-normal text-slate-900">
                  {editingJob ? 'Edit Job Posting' : 'Create Job Posting'}
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {editingJob ? 'Update your job posting details' : 'Create a new job posting to attract qualified candidates'}
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-6 px-1">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Job Information
                  </h3>
                  
                  {/* Job Title */}
                  <div className="space-y-2">
                    <Label htmlFor="job-title" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Job Title *
                    </Label>
                    <Input
                      id="job-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Senior Software Engineer, Product Manager, UX Designer"
                      className="h-11 text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="job-department" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Department *
                    </Label>
                    <Input
                      id="job-department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Engineering, Marketing, Sales, Design"
                      className="h-11 text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    />
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="job-location" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Location *
                    </Label>
                    <Input
                      id="job-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., San Francisco, CA / Remote / New York, NY"
                      className="h-11 text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                    />
                  </div>

                  {/* Job Type & Experience Level */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-type" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Job Type *
                      </Label>
                      <Select
                        value={formData.jobType}
                        onValueChange={(value: any) => setFormData({ ...formData, jobType: value })}
                      >
                        <SelectTrigger id="job-type" className="h-11 border-slate-200 focus:border-violet-500 focus:ring-violet-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {JOB_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4 text-violet-600" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience-level" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Experience Level *
                      </Label>
                      <Select
                        value={formData.experienceLevel}
                        onValueChange={(value: any) => setFormData({ ...formData, experienceLevel: value })}
                      >
                        <SelectTrigger id="experience-level" className="h-11 border-slate-200 focus:border-violet-500 focus:ring-violet-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div>
                                <div className="font-normal">{level.label}</div>
                                <div className="text-xs text-slate-500">{level.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Salary Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-normal text-slate-900 flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Salary Range
                    <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salary-min" className="text-sm font-normal text-slate-700">
                        Minimum Salary
                      </Label>
                      <Input
                        id="salary-min"
                        type="number"
                        value={formData.salaryMin || ''}
                        onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="50000"
                        className="h-11 text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary-max" className="text-sm font-normal text-slate-700">
                        Maximum Salary
                      </Label>
                      <Input
                        id="salary-max"
                        type="number"
                        value={formData.salaryMax || ''}
                        onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="80000"
                        className="h-11 text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="salary-currency" className="text-sm font-normal text-slate-700">
                        Currency
                      </Label>
                      <Select
                        value={formData.salaryCurrency}
                        onValueChange={(value) => setFormData({ ...formData, salaryCurrency: value })}
                      >
                        <SelectTrigger id="salary-currency" className="h-11 border-slate-200 focus:border-violet-500 focus:ring-violet-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Description & Details */}
              <div className="space-y-6">
                {/* Job Description */}
                <div className="space-y-2">
                  <Label htmlFor="job-description" className="text-sm font-normal text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Job Description *
                  </Label>
                  <Textarea
                    id="job-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                    rows={6}
                    className="text-base border-slate-200 focus:border-violet-500 focus:ring-violet-500 resize-none"
                  />
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Be specific about the role and expectations</span>
                    <span className={`${formData.description.length > 500 ? 'text-amber-600' : ''}`}>
                      {formData.description.length}/1000
                    </span>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3">
                  <Label className="text-sm font-normal text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Requirements
                    <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      placeholder="e.g., 3+ years React experience"
                      className="flex-1 h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                      onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                    />
                    <Button
                      type="button"
                      onClick={addRequirement}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.requirements && formData.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.requirements.map((req, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-pointer"
                          onClick={() => removeRequirement(index)}
                        >
                          {req}
                          <Trash2 className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="space-y-3">
                  <Label className="text-sm font-normal text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Benefits & Perks
                    <span className="text-xs text-slate-400 font-normal">(Optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      placeholder="e.g., Health insurance, Remote work, Stock options"
                      className="flex-1 h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                      onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                    />
                    <Button
                      type="button"
                      onClick={addBenefit}
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.benefits && formData.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((benefit, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"
                          onClick={() => removeBenefit(index)}
                        >
                          {benefit}
                          <Trash2 className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Job Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-normal text-slate-700 flex items-center gap-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Visibility
                  </Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm text-slate-700">
                        Publish this job posting immediately
                      </span>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">
                    {formData.isActive 
                      ? "This job will be visible to candidates and appear in search results"
                      : "This job will be saved as a draft and won't be visible to candidates"
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="flex-1 h-11"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!formData.title.trim() || !formData.department.trim() || !formData.location.trim() || !formData.description.trim() || saving}
              className="flex-1 h-11 bg-violet-600 hover:bg-violet-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {editingJob ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {editingJob ? 'Update Job' : 'Create Job'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}