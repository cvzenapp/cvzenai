import { useState, useEffect } from "react";
import { Plus, Search, Briefcase } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import JobPostingCard from "./JobPostingCard";
import JobPostingForm from "./JobPostingForm";
import { jobPostingsApi, type JobPosting, type JobPostingCreateRequest } from "@/services/jobPostingsApi";

function JobPostingsManager() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, statusFilter, typeFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await jobPostingsApi.getJobPostings();
      if (response.success) {
        setJobs(response.jobs);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.department.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job =>
        statusFilter === 'active' ? job.isActive : !job.isActive
      );
    }
    if (typeFilter !== 'all') {
      filtered = filtered.filter(job => job.type === typeFilter);
    }
    setFilteredJobs(filtered);
  };

  const handleCreateJob = async (data: JobPostingCreateRequest) => {
    try {
      const response = await jobPostingsApi.createJobPosting(data);
      if (response.success) {
        setJobs([response.job, ...jobs]);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  };

  const handleUpdateJob = async (data: JobPostingCreateRequest) => {
    if (!editingJob) return;
    try {
      const response = await jobPostingsApi.updateJobPosting(editingJob.id, data);
      if (response.success) {
        setJobs(jobs.map(j => j.id === editingJob.id ? response.job : j));
        setEditingJob(null);
        setIsFormOpen(false);
      }
    } catch (error) {
      console.error('Failed to update job:', error);
      throw error;
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      const response = await jobPostingsApi.deleteJobPosting(id);
      if (response.success) {
        setJobs(jobs.filter(j => j.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const job = jobs.find(j => j.id === id);
      if (!job) return;
      const response = await jobPostingsApi.updateJobPosting(id, {
        title: job.title,
        department: job.department,
        location: job.location,
        jobType: job.type,
        experienceLevel: job.level,
        salaryMin: job.salary.min,
        salaryMax: job.salary.max,
        salaryCurrency: job.salary.currency,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits,
        isActive,
      });
      if (response.success) {
        setJobs(jobs.map(j => j.id === id ? response.job : j));
      }
    } catch (error) {
      console.error('Failed to toggle job status:', error);
    }
  };

  const handleEdit = (job: JobPosting) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingJob(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading job postings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Job Postings</h2>
          <p className="text-slate-600">Manage your open positions</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Job Posting
        </Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Search jobs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Job Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Total Jobs</p><p className="text-2xl font-bold text-slate-900">{jobs.length}</p></div><Briefcase className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Active</p><p className="text-2xl font-bold text-green-600">{jobs.filter(j => j.isActive).length}</p></div><div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center"><div className="h-3 w-3 rounded-full bg-green-500" /></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Total Applicants</p><p className="text-2xl font-bold text-slate-900">{jobs.reduce((sum, j) => sum + j.applicationsCount, 0)}</p></div><div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">{jobs.reduce((sum, j) => sum + j.applicationsCount, 0)}</div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-slate-600">Total Views</p><p className="text-2xl font-bold text-slate-900">{jobs.reduce((sum, j) => sum + j.viewsCount, 0)}</p></div><div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">{jobs.reduce((sum, j) => sum + j.viewsCount, 0)}</div></div></CardContent></Card>
      </div>
      {filteredJobs.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-900 mb-2">{searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'No jobs found' : 'No job postings yet'}</h3><p className="text-slate-600 mb-4">{searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first job posting to start attracting candidates'}</p>{!searchQuery && statusFilter === 'all' && typeFilter === 'all' && (<Button onClick={() => setIsFormOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Job Posting</Button>)}</CardContent></Card>
      ) : (
        <div className="grid gap-4"><AnimatePresence mode="popLayout">{filteredJobs.map((job) => (<JobPostingCard key={job.id} job={job} onEdit={handleEdit} onDelete={handleDeleteJob} onToggleStatus={handleToggleStatus} />))}</AnimatePresence></div>
      )}
      <JobPostingForm isOpen={isFormOpen} onClose={handleCloseForm} onSubmit={editingJob ? handleUpdateJob : handleCreateJob} editingJob={editingJob} />
    </div>
  );
}

export default JobPostingsManager;
