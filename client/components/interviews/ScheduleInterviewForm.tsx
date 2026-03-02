import React, { useState } from 'react';
import { X, Calendar, Clock, Video, Phone, MapPin, Monitor, User, Briefcase } from 'lucide-react';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import { CandidateSelector } from './CandidateSelector';
import type { CreateInterviewRequest } from '@shared/api';

interface Candidate {
  id: number;
  name: string;
  email: string;
  resumeId: number;
  resumeTitle: string;
  source: 'shortlist' | 'application' | 'search';
  avatar?: string;
  skills?: string[];
  experience?: string;
  upvotes?: number;
  isGuest?: boolean;
  guestName?: string;
  guestEmail?: string;
}

interface ScheduleInterviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedCandidate?: {
    candidateId: number;
    candidateName: string;
    candidateEmail: string;
    resumeId: number;
    resumeTitle: string;
    isGuest?: boolean;
    guestName?: string;
    guestEmail?: string;
  };
}

const interviewTypes = [
  { value: 'video_call', label: 'Video Call', icon: Video, description: 'Online meeting via video platform' },
  { value: 'phone', label: 'Phone Call', icon: Phone, description: 'Voice call interview' },
  { value: 'in_person', label: 'In Person', icon: MapPin, description: 'Face-to-face meeting at office' },
  { value: 'technical', label: 'Technical Interview', icon: Monitor, description: 'Coding or technical assessment' }
] as const;

export const ScheduleInterviewForm: React.FC<ScheduleInterviewFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedCandidate
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    preSelectedCandidate ? {
      id: preSelectedCandidate.candidateId,
      name: preSelectedCandidate.candidateName,
      email: preSelectedCandidate.candidateEmail,
      resumeId: preSelectedCandidate.resumeId,
      resumeTitle: preSelectedCandidate.resumeTitle,
      source: 'shortlist' as const,
      isGuest: preSelectedCandidate.isGuest,
      guestName: preSelectedCandidate.guestName,
      guestEmail: preSelectedCandidate.guestEmail
    } : null
  );

  const [formData, setFormData] = useState<Omit<CreateInterviewRequest, 'candidateId' | 'resumeId'>>({
    title: '',
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

  // Update title when candidate is selected
  React.useEffect(() => {
    if (selectedCandidate && !formData.title) {
      setFormData(prev => ({
        ...prev,
        title: `Interview with ${selectedCandidate.name}`
      }));
    }
  }, [selectedCandidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    if (!formData.title || !formData.proposedDatetime) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateInterviewRequest = selectedCandidate.isGuest ? {
        // Guest candidate
        guestCandidateName: selectedCandidate.guestName,
        guestCandidateEmail: selectedCandidate.guestEmail,
        ...formData
      } : {
        // Registered candidate
        candidateId: selectedCandidate.id,
        resumeId: selectedCandidate.resumeId,
        ...formData
      };

      console.log('🎯 Submitting interview request:', request);
      const result = await recruiterInterviewApi.createInterview(request);
      console.log('✅ Interview created successfully:', result);
      
      onSuccess?.();
      onClose();
      
      // Reset form
      setSelectedCandidate(preSelectedCandidate ? selectedCandidate : null);
      setFormData({
        title: '',
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
    } catch (err: any) {
      console.error('❌ Interview scheduling failed:', err);
      
      // Handle different types of errors
      if (err.type === 'SETUP_IN_PROGRESS' || err.message?.includes('being set up')) {
        setError('🚧 Interview system is being set up. Database tables are being created. Please try again in a few minutes.');
      } else if (err.type === 'SERVER_ERROR') {
        setError('Server error occurred. This might be due to database connectivity issues. Please try again later or contact support.');
      } else if (err.type === 'UNAUTHORIZED') {
        setError('Authentication required. Please refresh the page and try again.');
      } else if (err.type === 'VALIDATION_ERROR') {
        setError('Please check your input and try again.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to schedule interview. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get minimum datetime (current time + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  const selectedInterviewType = interviewTypes.find(type => type.value === formData.interviewType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Interview</h2>
            <p className="text-sm text-gray-600 mt-1">Create a new interview invitation for a candidate</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Candidate Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate *
            </label>
            <CandidateSelector
              selectedCandidate={selectedCandidate}
              onCandidateSelect={setSelectedCandidate}
              placeholder="Choose a candidate to interview"
            />
            {selectedCandidate && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-blue-900">{selectedCandidate.name}</p>
                    <p className="text-sm text-blue-700">{selectedCandidate.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Briefcase className="w-3 h-3 text-blue-600" />
                      <p className="text-xs text-blue-600">{selectedCandidate.resumeTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interview Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Technical Interview - Frontend Developer"
              required
            />
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {interviewTypes.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleInputChange('interviewType', value)}
                  className={`flex items-start space-x-3 p-4 border rounded-lg transition-colors text-left ${
                    formData.interviewType === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm opacity-75">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.proposedDatetime}
                onChange={(e) => handleInputChange('proposedDatetime', e.target.value)}
                min={getMinDateTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration
              </label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange('durationMinutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>

          {/* Meeting Details */}
          {formData.interviewType === 'video_call' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link
              </label>
              <input
                type="url"
                value={formData.meetingLink || ''}
                onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide the video call link (Zoom, Google Meet, Teams, etc.)
              </p>
            </div>
          )}

          {formData.interviewType === 'in_person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Location
              </label>
              <textarea
                value={formData.meetingLocation || ''}
                onChange={(e) => handleInputChange('meetingLocation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Office address or meeting location"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description of what to expect in this interview..."
            />
          </div>

          {/* Meeting Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions for Candidate
            </label>
            <textarea
              value={formData.meetingInstructions || ''}
              onChange={(e) => handleInputChange('meetingInstructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Any special instructions, preparation requirements, or what to bring..."
            />
          </div>

          {/* Recruiter Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Internal Notes (not visible to candidate)
            </label>
            <textarea
              value={formData.recruiterNotes || ''}
              onChange={(e) => handleInputChange('recruiterNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Internal notes about this interview..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedCandidate}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};