import React from 'react';
import { Shield, Users, FileText, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/assets/cvzen_logo.png" 
                alt="CVZen Logo" 
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
              <Link to="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
              <Link to="/login" className="text-slate-300 hover:text-white transition-colors">Login</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Please read these terms carefully before using CVZen's services
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
            
            {/* Acceptance Section */}
            <section>
              <div className="flex items-center mb-6">
                <Shield className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. Acceptance of Terms</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  By accessing or using CVZen ("we," "our," or "us"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not access the service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  CVZen is operated by [Company Name], a company incorporated under the laws of India, 
                  with its registered office at [Registered Address].
                </p>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-blue-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Service Description</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen provides an online platform for creating professional resumes, job matching services, 
                  and connecting job seekers with recruiters. Our services include:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Resume building tools and templates</li>
                  <li>Job matching and recommendation services</li>
                  <li>Recruiter portal for candidate discovery</li>
                  <li>Resume sharing and analytics</li>
                  <li>Interview scheduling and management</li>
                </ul>
              </div>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">3. User Conduct and Prohibited Activities</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Upload false, misleading, or fraudulent information</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon intellectual property rights</li>
                  <li>Transmit viruses, malware, or harmful code</li>
                  <li>Engage in harassment, discrimination, or abusive behavior</li>
                </ul>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <div className="flex items-start mb-6">
                <AlertTriangle className="w-6 h-6 text-amber-600 mr-3 mt-1" />
                <h2 className="text-2xl font-semibold text-gray-900">4. Disclaimers and Limitations</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen is provided "as is" without warranties of any kind. We do not guarantee job placement, 
                  interview success, or uninterrupted service.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions about these Terms, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@cvzen.com</p>
                  <p><strong>Address:</strong> [Company Address], India</p>
                  <p><strong>Phone:</strong> +91 [Phone Number]</p>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy-policy" className="text-blue-600 hover:text-blue-800 transition-colors">Privacy Policy</Link>
              <Link to="/disclaimer" className="text-blue-600 hover:text-blue-800 transition-colors">Disclaimer</Link>
              <Link to="/refund-policy" className="text-blue-600 hover:text-blue-800 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}