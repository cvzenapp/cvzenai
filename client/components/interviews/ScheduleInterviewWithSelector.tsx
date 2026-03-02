import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CandidateSelector } from './CandidateSelector';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';

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
}

interface ScheduleInterviewWithSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ScheduleInterviewWithSelector: React.FC<ScheduleInterviewWithSelectorProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowScheduleModal(true);
  };

  const handleScheduleClose = () => {
    setShowScheduleModal(false);
    setSelectedCandidate(null);
  };

  const handleScheduleSuccess = () => {
    setShowScheduleModal(false);
    setSelectedCandidate(null);
    onSuccess?.();
    onClose();
  };

  if (!isOpen) return null;

  // If candidate is selected, show the schedule modal
  if (showScheduleModal && selectedCandidate) {
    return (
      <ScheduleInterviewModal
        isOpen={true}
        onClose={handleScheduleClose}
        candidateId={selectedCandidate.id}
        candidateName={selectedCandidate.name}
        candidateEmail={selectedCandidate.email}
        resumeId={selectedCandidate.resumeId}
        resumeTitle={selectedCandidate.resumeTitle}
        onSuccess={handleScheduleSuccess}
      />
    );
  }

  // Otherwise, show the candidate selector
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-normal text-gray-900">Select Candidate for Interview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Choose a candidate from your shortlist to schedule an interview.
          </p>
          
          <CandidateSelector
            selectedCandidate={selectedCandidate}
            onCandidateSelect={handleCandidateSelect}
            placeholder="Select a candidate to schedule interview"
          />

          {selectedCandidate && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedCandidate.name}</strong> selected. Click the selector again to change or close this dialog.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
