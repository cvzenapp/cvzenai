import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, MapPin, Calendar, Share2, ExternalLink, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import QuickSignupModal from '@/components/QuickSignupModal';
import { jobPostingsApi } from '@/services/jobPostingsApi';
import CVZenLogo from '@/components/CVZenLogo';
import { FormattedJobContent } from '@/lib/jobContentFormatter';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  isActive: boolean;
  slug: string;
  company: {
    id: string;
    name: string;
    logoUrl?: string;
    description?: string;
    website?: string;
    location?: string;
  };
  createdAt: string;
}

export const PublicJobPosting: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [job, setJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchJobPosting(slug);
    }
  }, [slug]);

  const fetchJobPosting = async (jobSlug: string) => {
    try {
      setLoading(true);
      const response = await jobPostingsApi.getJobBySlug(jobSlug);
      
      if (response.success) {
        console.log('🔍 Client received job data:', {
          jobId: response.job.id,
          companyName: response.job.company.name,
          hasLogoUrl: !!response.job.company.logoUrl,
          logoUrlLength: response.job.company.logoUrl?.length || 0,
          logoUrlPreview: response.job.company.logoUrl?.substring(0, 50) + '...' || 'null'
        });
        setJob(response.job as JobPosting);
      } else {
        setError('Job posting not found');
      }
    } catch (err) {
      console.error('Failed to fetch job:', err);
      setError('Failed to load job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = `Check out this job opportunity: ${job.title} at ${job.company.name}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${job.title} at ${job.company.name}`,
        text: text,
        url: url,
      });
    } else {
      copyJobLink();
    }
  };

  const copyJobLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Job posting link copied to clipboard.",
    });
  };

  const handleGuestApplication = async (data: {
    name: string;
    email: string;
    resumeFile: File;
    userId?: string;
    resumeId?: number;
    shareToken?: string;
    resumeUrl?: string;
    coverLetter?: string;
  }) => {
    try {
      // Submit guest job application
      const applicationData = {
        jobId: parseInt(job.id),
        name: data.name,
        email: data.email,
        resumeFileUrl: data.resumeUrl || '',
        userId: data.userId,
        resumeId: data.resumeId,
        shareToken: data.shareToken,
        coverLetter: data.coverLetter // Include cover letter in application
      };

      const response = await fetch('/api/job-applications/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Application Submitted!",
          description: "Your application has been sent successfully.",
        });
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let the modal handle it
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-main mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job posting...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This job posting is no longer available'}</p>
          <Button onClick={() => window.location.href = '/'}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const formatSalary = (min?: number, max?: number, currency = 'USD') => {
    const symbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
    const symbol = symbols[currency as keyof typeof symbols] || '$';
    
    if (min && max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    } else if (min) {
      return `${symbol}${min.toLocaleString()}+`;
    }
    return 'Competitive';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-brand-background border-b border-brand-main/20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* CVZen Logo */}
              <div className="flex items-center gap-3">
                <CVZenLogo className="h-8 w-auto" showCaption={false} />
                <div>
                  <h1 className="text-xl font-bold text-white">CVZen Jobs</h1>
                  <p className="text-sm text-white/80">Find your next opportunity</p>
                </div>
              </div>
              
              {/* Company Logo */}
              {job.company.logoUrl && (
                <div className="flex items-center gap-3 ml-6 pl-6 border-l border-white/20">
                  <img 
                    src={job.company.logoUrl} 
                    alt={job.company.name}
                    className="h-10 w-10 object-contain rounded-lg bg-white/10 p-1"
                    onError={(e) => {
                      // Hide if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{job.company.name}</p>
                    <p className="text-xs text-white/70">Hiring</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                asChild 
                variant="outline" 
                size="sm" 
                className="border-white/30 text-white hover:bg-white hover:text-brand-background bg-transparent"
              >
                <Link to="/">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={copyJobLink} className="border-white/30 text-white hover:bg-white hover:text-brand-background bg-transparent">
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="border-white/30 text-white hover:bg-white hover:text-brand-background bg-transparent">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{job.company.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{job.jobType}</Badge>
                      <Badge variant="outline">{job.experienceLevel}</Badge>
                      <Badge variant="outline">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</Badge>
                    </div>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-brand-main hover:bg-brand-background"
                  onClick={() => setShowApplicationModal(true)}
                >
                  Apply for this Position
                </Button>
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                <FormattedJobContent 
                  content={job.description} 
                  className="prose max-w-none"
                />
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                <FormattedJobContent 
                  content={job.requirements} 
                  className="prose max-w-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  {job.company.logoUrl ? (
                    <img 
                      src={job.company.logoUrl} 
                      alt={job.company.name}
                      className="w-16 h-16 mx-auto rounded-lg object-contain bg-gray-50 p-2"
                      onError={(e) => {
                        // If image fails to load, show fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {/* Fallback logo - always render but hide if image loads */}
                  <div 
                    className={`w-16 h-16 mx-auto bg-brand-main rounded-lg flex items-center justify-center ${job.company.logoUrl ? 'hidden' : ''}`}
                    style={{ display: job.company.logoUrl ? 'none' : 'flex' }}
                  >
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mt-3">
                    {job.company.name || 'Company'}
                  </h3>
                </div>
                
                {job.company.description && (
                  <p className="text-gray-600 text-sm mb-4">{job.company.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  {job.company.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{job.company.location}</span>
                    </div>
                  )}
                  {job.company.website && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <a 
                        href={job.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-main hover:underline"
                      >
                        Company Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Apply Button */}
            <Card>
              <CardContent className="p-6">
                <Button 
                  size="lg" 
                  className="w-full bg-brand-main hover:bg-brand-background mb-3"
                  onClick={() => setShowApplicationModal(true)}
                >
                  Apply Now
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Powered by CVZen - Create your professional resume
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <QuickSignupModal
          mode="job-application"
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          onJobApplication={handleGuestApplication}
          jobTitle={job.title}
          companyName={job.company.name}
        />
      )}
    </div>
  );
};