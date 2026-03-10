import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvaluationMetricsEditor, EvaluationMetric } from './EvaluationMetricsEditor';
import type { InterviewInvitation } from '@shared/api';

interface InterviewCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    decision: 'hired' | 'rejected' | 'hold', 
    feedback: string, 
    evaluationMetrics: EvaluationMetric[]
  ) => Promise<void>;
  interview: InterviewInvitation;
}

export const InterviewCompletionModal: React.FC<InterviewCompletionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  interview
}) => {
  const [decision, setDecision] = useState<'hired' | 'rejected' | 'hold' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [evaluationMetrics, setEvaluationMetrics] = useState<EvaluationMetric[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Initialize evaluation metrics from the interview data
  useEffect(() => {
    if (interview?.evaluationMetrics && Array.isArray(interview.evaluationMetrics)) {
      setEvaluationMetrics(interview.evaluationMetrics);
    } else {
      // Initialize with default metrics if none exist
      setEvaluationMetrics([]);
    }
  }, [interview]);

  const handleSubmit = async () => {
    if (!decision) return;

    try {
      setSubmitting(true);
      await onSubmit(decision, feedback, evaluationMetrics);
      onClose();
      setDecision(null);
      setFeedback('');
      setEvaluationMetrics([]);
    } catch (error) {
      console.error('Failed to submit interview completion:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setDecision(null);
    setFeedback('');
  };

  const getScoreColor = (score: string | null) => {
    if (!score) return 'text-slate-400';
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'text-green-600';
    if (numScore >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  const getOverallScore = () => {
    const scoredMetrics = evaluationMetrics.filter(m => m.checked && m.score);
    if (scoredMetrics.length === 0) return null;
    
    const total = scoredMetrics.reduce((sum, metric) => {
      const score = parseFloat(metric.score || '0');
      return sum + score;
    }, 0);
    
    return (total / scoredMetrics.length).toFixed(1);
  };

  const overallScore = getOverallScore();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">Complete Interview</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Interview Info */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Interview</p>
            <p className="font-normal text-slate-900">{interview.title}</p>
            <p className="text-sm text-slate-600 mt-2">
              Candidate: {interview.candidate?.name || interview.guestCandidateName || 'Unknown'}
            </p>
            <p className="text-sm text-slate-600">
              Date: {new Date(interview.proposedDatetime).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Evaluation Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">
                Evaluation Metrics & Scoring
              </Label>
              {overallScore && (
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Overall Score: <span className={getScoreColor(overallScore)}>{overallScore}/10</span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <EvaluationMetricsEditor
                value={evaluationMetrics}
                onChange={setEvaluationMetrics}
                candidateName={interview.candidate?.name || interview.guestCandidateName}
                jobTitle={interview.title}
              />
            </div>

            <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="font-medium text-blue-700 mb-1">Scoring Guide:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-blue-600">
                <span>• 1-3: Below expectations</span>
                <span>• 4-6: Meets expectations</span>
                <span>• 7-10: Exceeds expectations</span>
              </div>
            </div>
          </div>

          {/* Decision Selection */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">
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
                <p className={`text-sm font-medium ${
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
                <p className={`text-sm font-medium ${
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
                <p className={`text-sm font-medium ${
                  decision === 'hold' ? 'text-amber-700' : 'text-slate-600'
                }`}>
                  On Hold
                </p>
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-sm font-semibold text-slate-700 mb-2 block">
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
            onClick={handleClose}
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