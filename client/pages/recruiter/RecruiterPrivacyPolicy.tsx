import { Shield, Eye, Lock, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import RecruiterFooter from '@/components/RecruiterFooter';

export default function RecruiterPrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/recruiter" className="flex items-center gap-2">
              <img 
                src="/assets/cvzen_logo.png" 
                alt="CVZen Logo" 
                className="h-10 w-auto"
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
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Recruiter Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            How we protect and handle recruiter and candidate data in compliance with Indian privacy laws
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
            
            {/* Data Collection */}
            <section>
              <div className="flex items-center mb-6">
                <Database className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. Recruiter Data Collection</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We collect information necessary for recruiter operations including company profiles, 
                  job postings, candidate interactions, and recruitment analytics.
                </p>
              </div>
            </section>

            {/* Candidate Data Protection */}
            <section>
              <div className="flex items-center mb-6">
                <Lock className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Candidate Data Protection</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Recruiters access candidate data with explicit consent. We ensure secure handling 
                  of all candidate information and maintain strict access controls.
                </p>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <div className="flex items-center mb-6">
                <Eye className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">3. Data Usage and Sharing</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Recruiter data is used for platform operations, analytics, and improving recruitment services. 
                  We do not share recruiter data with unauthorized third parties.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For privacy-related questions or concerns:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Recruiter Privacy:</strong> recruiter-privacy@cvzen.com</p>
                  <p><strong>Data Protection Officer:</strong> dpo@cvzen.com</p>
                  <p><strong>Address:</strong> [Company Address], India</p>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/recruiter/terms-of-service" className="text-blue-600 hover:text-blue-800 transition-colors">Terms of Service</Link>
              <Link to="/recruiter/disclaimer" className="text-blue-600 hover:text-blue-800 transition-colors">Disclaimer</Link>
              <Link to="/recruiter/refund-policy" className="text-blue-600 hover:text-blue-800 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </section>

      <RecruiterFooter />
    </div>
  );
}