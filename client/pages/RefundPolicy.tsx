import React from 'react';
import { CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

export default function RefundPolicy() {
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
      <section className="bg-gradient-to-br from-purple-50 to-indigo-100 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
            <CreditCard className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">Refund Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Our commitment to fair and transparent refund practices in compliance with Indian consumer protection laws
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
                <h2 className="text-2xl font-semibold text-gray-900">1. Refund Policy Overview</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  CVZen is committed to customer satisfaction and fair business practices. This Refund Policy 
                  outlines the terms and conditions for refunds in compliance with the Consumer Protection Act, 2019, 
                  and other applicable Indian laws. We strive to provide clear, transparent, and customer-friendly 
                  refund procedures.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  This policy applies to all paid services offered through the CVZen platform, including premium 
                  subscriptions, one-time purchases, and additional services.
                </p>
              </div>
            </section>

            {/* Refund Eligibility */}
            <section>
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">2. Refund Eligibility</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">7-Day Money-Back Guarantee</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We offer a 7-day money-back guarantee for most of our services. You are eligible for a full refund if:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                  <li>You request a refund within 7 days of purchase</li>
                  <li>You have not extensively used the premium features</li>
                  <li>The service does not meet the described functionality</li>
                  <li>You experience technical issues that we cannot resolve</li>
                  <li>You are not satisfied with the service quality</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">Subscription Refunds</h3>
                <p className="text-gray-700 leading-relaxed mb-4">For subscription-based services:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Monthly Subscriptions:</strong> Full refund if cancelled within 7 days</li>
                  <li><strong>Annual Subscriptions:</strong> Pro-rated refund for unused months</li>
                  <li><strong>Auto-renewal:</strong> Can be cancelled anytime; refund for current billing period if within 7 days</li>
                </ul>
              </div>
            </section>

            {/* Non-Refundable Services */}
            <section>
              <div className="flex items-center mb-6">
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">3. Non-Refundable Services</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  The following services are generally non-refundable after the 7-day period:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Services that have been fully delivered and used</li>
                  <li>Custom resume writing services after completion</li>
                  <li>Interview coaching sessions after they have been conducted</li>
                  <li>Downloaded premium content or templates</li>
                  <li>Services purchased with promotional discounts (unless defective)</li>
                  <li>Third-party services integrated through our platform</li>
                </ul>
                <p className="text-gray-700 leading-relaxed">
                  However, we may consider exceptions on a case-by-case basis for genuine grievances 
                  or service failures.
                </p>
              </div>
            </section>

            {/* Processing Times */}
            <section>
              <div className="flex items-center mb-6">
                <Clock className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">4. Refund Processing Times</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <div className="bg-purple-50 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Request Review:</span>
                      <span className="font-semibold text-purple-600">2-3 business days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Refund Processing:</span>
                      <span className="font-semibold text-purple-600">5-10 business days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Bank Credit (varies by bank):</span>
                      <span className="font-semibold text-purple-600">3-7 business days</span>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">Refund Methods</h3>
                <p className="text-gray-700 leading-relaxed mb-4">Refunds will be processed using the following methods:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><strong>Original Payment Method:</strong> Refunded to the same card/account used for purchase</li>
                  <li><strong>Bank Transfer:</strong> Direct transfer to your bank account (if original method unavailable)</li>
                  <li><strong>Digital Wallet:</strong> Refund to UPI or digital wallet (where applicable)</li>
                  <li><strong>Store Credit:</strong> CVZen credit for future purchases (optional)</li>
                </ul>
              </div>
            </section>

            {/* Special Circumstances */}
            <section>
              <div className="flex items-center mb-6">
                <AlertCircle className="w-6 h-6 text-purple-600 mr-3" />
                <h2 className="text-2xl font-semibold text-gray-900">5. Special Circumstances</h2>
              </div>
              <div className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Technical Issues</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you experience technical problems that prevent you from using our services:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-6">
                  <li>We will first attempt to resolve the technical issue</li>
                  <li>If resolution is not possible, a full refund will be provided</li>
                  <li>Extended service period may be offered as an alternative</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Downtime</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  For extended service outages affecting premium features:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Automatic service extension for the downtime period</li>
                  <li>Partial refund for significantly impacted services</li>
                  <li>Alternative compensation as deemed appropriate</li>
                </ul>
              </div>
            </section>

            {/* Contact Information */}
            <section className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Contact Information</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For refund requests, questions, or assistance, please contact us:
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-gray-800">Refund Requests:</p>
                      <p className="text-gray-700">refunds@cvzen.com</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">General Support:</p>
                      <p className="text-gray-700">support@cvzen.com</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Grievance Officer:</p>
                      <p className="text-gray-700">grievance@cvzen.com</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Phone Support:</p>
                      <p className="text-gray-700">+91 [Phone Number]</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Business Hours:</p>
                    <p className="text-gray-700">Monday to Friday: 9:00 AM - 6:00 PM IST</p>
                    <p className="text-gray-700">Saturday: 10:00 AM - 4:00 PM IST</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Registered Address:</p>
                    <p className="text-gray-700">[Company Address], India</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Cross-navigation */}
          <div className="mt-12 text-center">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/terms-of-service" className="text-purple-600 hover:text-purple-800 transition-colors">Terms of Service</Link>
              <Link to="/privacy-policy" className="text-purple-600 hover:text-purple-800 transition-colors">Privacy Policy</Link>
              <Link to="/disclaimer" className="text-purple-600 hover:text-purple-800 transition-colors">Disclaimer</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}