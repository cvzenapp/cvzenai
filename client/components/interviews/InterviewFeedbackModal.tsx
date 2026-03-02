import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface InterviewFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (decision: 'hired' | 'rejected' | 'hold', feedback: string) => Promise<void>;
  interviewTitle: string;
  candidateName: string;
}

export const InterviewFeedbackModal: React.FC<InterviewFeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  interviewTitle,
  candidateName
}) => {
  const [decision, setDecision] = useState<'hired' | 'rejected' | 'hold' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!decision) return;

    try {
      setSubmitting(true);
      await onSubmit(decision, feedback);
      onClose();
      setDecision(null);
      setFeedback('');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">Complete Interview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Interview Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Interview</p>
            <p className="font-normal text-slate-900">{interviewTitle}</p>
            <p className="text-sm text-slate-600 mt-2">Candidate: {candidateName}</p>
          </div>

          {/* Decision Selection */}
          <div>
            <Label className="text-sm font-normal text-slate-700 mb-3 block">
              Hiring Decision *
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDecision('hired')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'hired'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${
                  decision === 'hired' ? 'text-green-600' : 'text-slate-400'
                }`} />
                <p className={`text-sm font-normal ${
                  decision === 'hired' ? 'text-green-700' : 'text-slate-600'
                }`}>
                  Hired
                </p>
              </button>

              <button
                onClick={() => setDecision('rejected')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'rejected'
                    ? 'border-red-500 bg-red-50'
                    : 'border-slate-200 hover:border-red-300'
                }`}
              >
                <XCircle className={`w-6 h-6 mx-auto mb-2 ${
                  decision === 'rejected' ? 'text-red-600' : 'text-slate-400'
                }`} />
                <p className={`text-sm font-normal ${
                  decision === 'rejected' ? 'text-red-700' : 'text-slate-600'
                }`}>
                  Rejected
                </p>
              </button>

              <button
                onClick={() => setDecision('hold')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  decision === 'hold'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                <Clock className={`w-6 h-6 mx-auto mb-2 ${
                  decision === 'hold' ? 'text-amber-600' : 'text-slate-400'
                }`} />
                <p className={`text-sm font-normal ${
                  decision === 'hold' ? 'text-amber-700' : 'text-slate-600'
                }`}>
                  On Hold
                </p>
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-sm font-normal text-slate-700 mb-2 block">
              Feedback for Candidate
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback about the interview performance..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              This feedback will be visible to the candidate in their applications
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!decision || submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? 'Submitting...' : 'Complete Interview'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
