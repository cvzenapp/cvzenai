import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RecruiterCompanyView: React.FC = () => {
  const [companySlug, setCompanySlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get recruiter's company slug from localStorage
    const recruiterData = localStorage.getItem('recruiter_user');
    if (recruiterData) {
      try {
        const recruiter = JSON.parse(recruiterData);
        const slug = recruiter.companySlug || recruiter.company_slug;
        setCompanySlug(slug);
      } catch (e) {
        console.error('Failed to parse recruiter data:', e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!companySlug) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-normal text-gray-900 mb-2">No Company Profile</h3>
          <p className="text-gray-500 mb-4">
            You haven't set up your company profile yet. Please contact support to set up your company slug.
          </p>
        </div>
      </div>
    );
  }

  // Navigate to the company profile page with the slug
  useEffect(() => {
    if (companySlug) {
      navigate(`/company/${companySlug}`);
    }
  }, [companySlug, navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
};
