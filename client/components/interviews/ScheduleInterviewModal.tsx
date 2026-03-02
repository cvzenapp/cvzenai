import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { interviewApi } from '../../services/interviewApi';
import type { CreateInterviewRequest } from '@shared/api';

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  resumeId: number;
  resumeTitle: string;
  jobPostingId?: number;
  onSuccess?: () => void;
}

const interviewTypes = [
  { value: 'video_call', label: 'Video Call', icon: Video, description: 'Online meeting' },
  { value: 'phone', label: 'Phone', icon: Phone, description: 'Voice call' },
  { value: 'in_person', label: 'In Person', icon: MapPin, description: 'Office visit' },
  { value: 'technical', label: 'Technical', icon: Monitor, description: 'Coding/Tech' }
] as const;

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  isOpen,
  onClose,
  candidateId,
  candidateName,
  candidateEmail,
  resumeId,
  resumeTitle,
  jobPostingId,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateInterviewRequest>({
    candidateId,
    resumeId,
    jobPostingId,
    title: `Interview with ${candidateName}`,
    description: '',
    interviewType: 'video_call',
    proposedDatetime: '',
    durationMinutes: 60,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meetingLink: '',
    meetingLocation: '',
    meetingInstructions: '',
    recruiterNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await interviewApi.createInterview(formData);
      onSuccess?.();
      onClose();
      
      // Reset form
      setFormData({
        ...formData,
        title: `Interview with ${candidateName}`,
        description: '',
        proposedDatetime: '',
        meetingLink: '',
        meetingLocation: '',
        meetingInstructions: '',
        recruiterNotes: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CreateInterviewRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get minimum datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
          <div>
            <h2 className="text-2xl font-normal text-gray-900">Schedule Interview</h2>
            <p className="text-sm text-gray-600 mt-1">Set up an interview with {candidateName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content Area */}
          <div className="px-8 py-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4" role="alert">
                <p className="text-red-700 text-sm font-normal">{error}</p>
              </div>
            )}

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Candidate Info Card */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
                  <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-3">Candidate</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-16 pt-0.5">Name</span>
                      <span className="text-sm text-gray-900 font-normal flex-1">{candidateName}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-16 pt-0.5">Email</span>
                      <span className="text-sm text-gray-900 flex-1">{candidateEmail}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-xs text-gray-500 w-16 pt-0.5">Resume</span>
                      <span className="text-sm text-gray-900 flex-1">{resumeTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Interview Type Selection */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-3">
                    Interview Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {interviewTypes.map(({ value, label, icon: Icon, description }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleInputChange('interviewType', value)}
                        className={`relative flex flex-col items-center p-3 border-2 rounded-lg transition-all ${
                          formData.interviewType === value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-pressed={formData.interviewType === value}
                      >
                        <Icon className={`w-5 h-5 mb-1.5 ${
                          formData.interviewType === value ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                        <span className={`text-sm font-normal ${
                          formData.interviewType === value ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {label}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">{description}</span>
                        {formData.interviewType === value && (
                          <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date and Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Date & Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.proposedDatetime}
                      onChange={(e) => handleInputChange('proposedDatetime', e.target.value)}
                      min={getMinDateTime()}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                      aria-required="true"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Click to select date and time
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Duration
                    </label>
                    <select
                      value={formData.durationMinutes}
                      onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Interview Title */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    Interview Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Technical Interview - Frontend Developer"
                    required
                    aria-required="true"
                  />
                </div>

                {/* Meeting Link/Location - Conditional */}
                {formData.interviewType === 'video_call' && (
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      <Video className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={formData.meetingLink || ''}
                      onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="https://zoom.us/j/... (optional)"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      Leave empty to auto-generate a secure video link
                    </p>
                  </div>
                )}

                {formData.interviewType === 'in_person' && (
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                      Meeting Location
                    </label>
                    <textarea
                      value={formData.meetingLocation || ''}
                      onChange={(e) => handleInputChange('meetingLocation', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      rows={2}
                      placeholder="Office address or meeting location"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    rows={2}
                    placeholder="Brief overview of the interview..."
                  />
                </div>

                {/* Instructions for Candidate */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    Candidate Instructions
                  </label>
                  <textarea
                    value={formData.meetingInstructions || ''}
                    onChange={(e) => handleInputChange('meetingInstructions', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    rows={2}
                    placeholder="Preparation requirements, what to bring..."
                  />
                </div>
              </div>
            </div>

            {/* Advanced Section - Collapsible */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-sm font-normal text-gray-700">
                  Internal Notes (Private)
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              {showAdvanced && (
                <div className="mt-4 px-4">
                  <textarea
                    value={formData.recruiterNotes || ''}
                    onChange={(e) => handleInputChange('recruiterNotes', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                    rows={2}
                    placeholder="Internal notes (not visible to candidate)..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions - Fixed */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-normal text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2.5 text-sm font-normal bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scheduling...
                  </span>
                ) : (
                  'Schedule Interview'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
