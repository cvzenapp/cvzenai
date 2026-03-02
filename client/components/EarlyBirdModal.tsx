import { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';
import type { WaitlistSubmission, WaitlistResponse } from '@shared/api';

interface EarlyBirdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EarlyBirdModal({ isOpen, onClose }: EarlyBirdModalProps) {
  const [formData, setFormData] = useState<WaitlistSubmission>({
    name: '',
    email: '',
    contact: '',
    companyName: '',
    companySize: '',
    useCase: '',
    interestedFeatures: [],
    additionalInfo: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent body scroll when modal is open
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

  const featureOptions = [
    'Resume Builder',
    'Job Matching',
    'AI-Powered Recommendations',
    'Recruiter Portal',
    'Interview Scheduling',
    'Analytics Dashboard',
  ];

  const companySizeOptions = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees',
  ];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data: WaitlistResponse = await response.json();

      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({
            name: '',
            email: '',
            contact: '',
            companyName: '',
            companySize: '',
            useCase: '',
            interestedFeatures: [],
            additionalInfo: '',
          });
        }, 3000);
      } else {
        setError(data.message || 'Failed to join waitlist');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      interestedFeatures: prev.interestedFeatures?.includes(feature)
        ? prev.interestedFeatures.filter(f => f !== feature)
        : [...(prev.interestedFeatures || []), feature],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Join Early Bird Program</h2>
                <p className="text-purple-100 text-sm">Be the first to experience CVZen's premium features</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* Success State */}
          {isSuccess ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">You're on the list!</h3>
              <p className="text-gray-600">Check your email for confirmation and next steps.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Company Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select size</option>
                    {companySizeOptions.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Use Case */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How do you plan to use CVZen?
                </label>
                <textarea
                  value={formData.useCase}
                  onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tell us about your use case..."
                />
              </div>

              {/* Interested Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Interested Features
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {featureOptions.map(feature => (
                    <label
                      key={feature}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.interestedFeatures?.includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Any specific requirements or questions?"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Joining...' : 'Join Early Bird Program'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
