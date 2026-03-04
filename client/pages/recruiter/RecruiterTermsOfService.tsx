import { FileText, Users, Building, Gavel } from 'lucide-react';
import { Link } from 'react-router-dom';
import RecruiterFooter from '@/components/RecruiterFooter';

export default function RecruiterTermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/recruiter" className="flex items-center gap-2">
              <img 
                src="/assets/cvzen_cap.svg" 
                alt="CVZen Logo" 
                className="h-8 sm:h-9 md:h-10 w-auto"
              />
              <span className="text-slate-300 text-sm">Recruiter Portal</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/recruiter/dashboard" className="text-slate-300 hover:text-white transition-colors">Dashboard</Link>
              <Link to="/recruiter/candidates" className="text-slate-300 hover:text-white transition-colors">Candidates</Link>
              <Link to="/recruiter/login" className="text-slate-300 hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Recruiter Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Terms and conditions governing the use of CVZen's recruiter platform and services
          </p>
          <div className="text-sm text-gray-500">
            Last updated: January 2, 2025 | Effective Date: January 2, 2025
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-12">
            
            {/* Service Agreement */}
            <section>
              <div className="flex items-center mb-6">
                <Building className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. Recruiter Service Agreement</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  By using CVZen's recruiter platform, you agree to these terms and conditions. 
                  This agreement governs your access to candidate profiles, job posting services, 
                  and recruitment tools.
                </p>
              </div>
            </section>

            {/* Candidate Data Usage */}
            <section>
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Candidate Data Usage</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Recruiters must use candidate data responsibly and in compliance with privacy laws. 
                  Unauthorized sharing or misuse of candidate information is strictly prohibited.
                </p>
              </div>
            </section>

            {/* Platform Responsibilities */}
            <section>
              <div className="flex items-center mb-6">
                <Gavel className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">3. Platform Responsibilities</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen provides recruitment tools and candidate matching services. Recruiters are 
                  responsible for their hiring decisions and compliance with employment laws.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-green-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions about these terms:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Recruiter Legal:</strong> recruiter-legal@cvzen.com</p>
                  <p><strong>Support:</strong> recruiter-support@cvzen.com</p>
                  <p><strong>Address:</strong> [Company Address], India</p>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/recruiter/privacy-policy" className="text-green-600 hover:text-green-800 transition-colors">Privacy Policy</Link>
              <Link to="/recruiter/disclaimer" className="text-green-600 hover:text-green-800 transition-colors">Disclaimer</Link>
              <Link to="/recruiter/refund-policy" className="text-green-600 hover:text-green-800 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </section>

      <RecruiterFooter />
    </div>
  );
}