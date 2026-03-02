import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { JobPosting, JobPostingCreateRequest } from "@/services/jobPostingsApi";

interface JobPostingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobPostingCreateRequest) => Promise<void>;
  editingJob?: JobPosting | null;
}

function JobPostingForm({ isOpen, onClose, onSubmit, editingJob }: JobPostingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<JobPostingCreateRequest>({
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
  const [requirementsText, setRequirementsText] = useState('');
  const [benefitsText, setBenefitsText] = useState('');

  useEffect(() => {
    if (editingJob) {
      setForm({
        title: editingJob.title,
        department: editingJob.department,
        location: editingJob.location,
        jobType: editingJob.type,
        experienceLevel: editingJob.level,
        salaryMin: editingJob.salary.min || undefined,
        salaryMax: editingJob.salary.max || undefined,
        salaryCurrency: editingJob.salary.currency,
        description: editingJob.description,
        requirements: editingJob.requirements,
        benefits: editingJob.benefits,
        isActive: editingJob.isActive,
      });
      setRequirementsText(editingJob.requirements.join('\n'));
      setBenefitsText(editingJob.benefits.join('\n'));
    } else {
      resetForm();
    }
  }, [editingJob, isOpen]);

  const resetForm = () => {
    setForm({
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
    setRequirementsText('');
    setBenefitsText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requirements = requirementsText
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);
      
      const benefits = benefitsText
        .split('\n')
        .map(b => b.trim())
        .filter(Boolean);

      await onSubmit({
        ...form,
        requirements,
        benefits,
      });
      
      resetForm();
      onClose();
    } catch (error) {
      console.error('Failed to submit job posting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Fill in the details to {editingJob ? 'update' : 'create'} a job posting.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Senior Software Engineer"
                required
              />
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Engineering"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="San Francisco, CA"
                required
              />
            </div>
            <div>
              <Label htmlFor="jobType">Job Type *</Label>
              <Select
                value={form.jobType}
                onValueChange={(value: any) => setForm({ ...form, jobType: value })}
              >
                <SelectTrigger id="jobType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="experienceLevel">Experience Level *</Label>
              <Select
                value={form.experienceLevel}
                onValueChange={(value: any) => setForm({ ...form, experienceLevel: value })}
              >
                <SelectTrigger id="experienceLevel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="salaryMin">Min Salary ($)</Label>
              <Input
                id="salaryMin"
                type="number"
                value={form.salaryMin || ''}
                onChange={(e) => setForm({ ...form, salaryMin: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="80000"
              />
            </div>
            <div>
              <Label htmlFor="salaryMax">Max Salary ($)</Label>
              <Input
                id="salaryMax"
                type="number"
                value={form.salaryMax || ''}
                onChange={(e) => setForm({ ...form, salaryMax: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="120000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Job Description *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the role, responsibilities, and what makes this position exciting..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="requirements">Requirements (one per line)</Label>
            <Textarea
              id="requirements"
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              placeholder="Bachelor's Degree in Computer Science&#10;5+ Years of Experience&#10;Proficiency in React and TypeScript"
              rows={5}
            />
          </div>

          <div>
            <Label htmlFor="benefits">Benefits (one per line)</Label>
            <Textarea
              id="benefits"
              value={benefitsText}
              onChange={(e) => setBenefitsText(e.target.value)}
              placeholder="Health Insurance&#10;401(k) Matching&#10;Remote Work Options"
              rows={5}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingJob ? 'Update Job' : 'Create Job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default JobPostingForm;
