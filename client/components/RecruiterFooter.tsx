import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';

export default function RecruiterFooter() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="space-y-4">
            <Link to="/recruiter" className="flex items-center gap-2">
              <img 
                src="/assets/cvzen_logo.png" 
                alt="CVZen Recruiter Logo" 
                className="h-10 w-auto"
              />
              <span className="text-sm text-slate-400">Recruiter Portal</span>
            </Link>
            <p className="text-slate-400">
              Find and hire the best talent with CVZen's recruiter platform.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Recruiter Tools</h4>
            <div className="space-y-2">
              <Link
                to="/recruiter/dashboard"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/recruiter/candidates"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Browse Candidates
              </Link>
              <Link
                to="/recruiter/job-postings"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Job Postings
              </Link>
              <Link
                to="/recruiter/interviews"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Interviews
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <div className="space-y-2">
              <Link
                to="/about"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                About CVZen
              </Link>
              <Link
                to="/recruiter/pricing"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Recruiter Pricing
              </Link>
              <Link
                to="/contact"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <Link
                to="/recruiter/help"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Help Center
              </Link>
              <Link
                to="/recruiter/support"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Recruiter Support
              </Link>
              <Link
                to="/recruiter/api-docs"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                API Documentation
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <Link
                to="/recruiter/privacy-policy"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/recruiter/terms-of-service"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/recruiter/disclaimer"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Disclaimer
              </Link>
              <Link
                to="/recruiter/refund-policy"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Refund Policy
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-slate-800" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400">
            © 2025 CVZen Recruiter Portal. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link
              to="/recruiter/privacy-policy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/recruiter/terms-of-service"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/recruiter/disclaimer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Disclaimer
            </Link>
            <Link
              to="/recruiter/refund-policy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}