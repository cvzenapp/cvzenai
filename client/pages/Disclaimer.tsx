import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

export default function Disclaimer() {
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
      <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Disclaimer</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Important information about the use of CVZen services and limitations of liability
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
            
            {/* General Disclaimer */}
            <section>
              <div className="flex items-center mb-6">
                <Info className="w-6 h-6 text-amber-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">1. General Disclaimer</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen is provided for general information purposes only. We make no warranties about completeness, 
                  accuracy, or reliability of the platform or services.
                </p>
              </div>
            </section>

            {/* Service Limitations */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">2. Service Limitations</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not guarantee job placement, interview success, or uninterrupted service availability.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-amber-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For questions about this disclaimer, please contact us:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Email:</strong> legal@cvzen.com</p>
                  <p><strong>Address:</strong> [Company Address], India</p>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/terms-of-service" className="text-amber-600 hover:text-amber-800 transition-colors">Terms of Service</Link>
              <Link to="/privacy-policy" className="text-amber-600 hover:text-amber-800 transition-colors">Privacy Policy</Link>
              <Link to="/refund-policy" className="text-amber-600 hover:text-amber-800 transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}