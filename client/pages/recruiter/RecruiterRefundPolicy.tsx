import { CreditCard, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import RecruiterFooter from '@/components/RecruiterFooter';

export default function RecruiterRefundPolicy() {
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
      <section className="bg-gradient-to-br from-purple-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Recruiter Refund Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Our refund policy for recruiter subscriptions and services in compliance with Indian consumer protection laws
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
            
            {/* Overview */}
            <section>
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. Recruiter Refund Policy Overview</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen offers a 14-day money-back guarantee for recruiter subscriptions and services 
                  in compliance with Indian consumer protection laws.
                </p>
              </div>
            </section>

            {/* Processing Times */}
            <section>
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Processing Times</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  Recruiter refunds are typically processed within 5-10 business days after approval.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For refund requests, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Recruiter Refunds:</strong> recruiter-refunds@cvzen.com</p>
                  <p><strong>Support:</strong> recruiter-support@cvzen.com</p>
                  <p><strong>Address:</strong> [Company Address], India</p>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/recruiter/terms-of-service" className="text-purple-600 hover:text-purple-800 transition-colors">Terms of Service</Link>
              <Link to="/recruiter/privacy-policy" className="text-purple-600 hover:text-purple-800 transition-colors">Privacy Policy</Link>
              <Link to="/recruiter/disclaimer" className="text-purple-600 hover:text-purple-800 transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </section>

      <RecruiterFooter />
    </div>
  );
}