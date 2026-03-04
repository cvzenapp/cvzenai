import { useState, useEffect } from 'react';
import { X, Leaf, CheckCircle2, TreeDeciduous } from 'lucide-react';
import type { PledgeSubmission, PledgeResponse } from '@shared/api';

interface SustainabilityPledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SustainabilityPledgeModal({ isOpen, onClose }: SustainabilityPledgeModalProps) {
  const [formData, setFormData] = useState<PledgeSubmission>({
    name: '',
    email: '',
    contact: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/pledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: PledgeResponse = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({
            name: '',
            email: '',
            contact: '',
          });
        }, 4000);
      } else {
        setError(data.message || 'Failed to submit pledge');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-normal text-gray-900 mb-2">Thank you!</h3>
            <p className="text-gray-600">You've joined the movement for a paperless future.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-6 rounded-t-xl relative">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Leaf className="w-8 h-8" />
                  <h2 className="text-2xl font-normal">I DON'T print CV</h2>
                </div>
                <p className="text-green-50 text-sm font-normal">
                  Join the pledge for sustainable, paperless hiring.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Impact Statement */}
              <div className="mb-5 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-gray-700 text-sm text-center leading-relaxed">
                  Every year, millions of resumes are printed once and discarded.
                  <br />
                  <span className="text-green-800 font-medium">Go digital. Save trees.</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-normal text-gray-700 mb-1.5">
                    Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Pledge Checkbox */}
                <div className="pt-2">
                  <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      required
                      id="pledge-agreement"
                      className="mt-0.5 w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="pledge-agreement" className="text-xs text-gray-700 leading-relaxed cursor-pointer">
                      I pledge to stop printing resumes and embrace digital hiring.
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-normal text-sm shadow-md"
                >
                  {isSubmitting ? 'Taking Pledge...' : 'Take the Pledge'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
