import React from 'react';
import { Shield, Eye, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/assets/cvzen_cap.svg" 
                alt="CVZen Logo" 
                className="h-8 sm:h-9 md:h-10 w-auto"
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
      <section className="bg-gradient-to-br from-green-50 to-emerald-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
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
            
            {/* Introduction */}
            <section>
              <div className="flex items-center mb-6">
                <Eye className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. Introduction</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen is committed to protecting your privacy and personal data in compliance with Indian data protection laws, 
                  including the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center mb-6">
                <Database className="w-6 h-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Information We Collect</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">We collect personal information including:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Account information (name, email, phone)</li>
                  <li>Resume data and professional information</li>
                  <li>Usage data and analytics</li>
                  <li>Payment information (processed securely)</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-green-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions about this Privacy Policy, please contact:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Data Protection Officer:</strong> privacy@cvzen.com</p>
                  <p><strong>Address:</strong> [Company Address], India</p>
                  <p><strong>Grievance Officer:</strong> grievance@cvzen.com</p>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/terms-of-service" className="text-green-600 hover:text-green-800 transition-colors">Terms of Service</Link>
              <Link to="/disclaimer" className="text-green-600 hover:text-green-800 transition-colors">Disclaimer</Link>
              <Link to="/refund-policy" className="text-green-600 hover:text-green-800 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}