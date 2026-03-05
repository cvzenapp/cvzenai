import React from 'react';
import { Link } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import CVZenLogo from './CVZenLogo';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <CVZenLogo className="h-6 sm:h-7 md:h-8 w-auto" showCaption={true} />
            </Link>
            <p className="text-slate-400">
              Build professional resumes that get you hired faster.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <div className="space-y-2">
              <Link
                to="/features"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Features
              </Link>
              
              <Link
                to="/pricing"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Pricing
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
                About
              </Link>
              <Link
                to="/blog"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/careers"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Careers
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <div className="space-y-2">
              <Link
                to="/help"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Help Center
              </Link>
              <Link
                to="/contact"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <Link
                to="/privacy-policy"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/disclaimer"
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Disclaimer
              </Link>
              <Link
                to="/refund-policy"
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
            © 2026 CVZen. All rights reserved.
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link
              to="/privacy-policy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/disclaimer"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Disclaimer
            </Link>
            <Link
              to="/refund-policy"
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