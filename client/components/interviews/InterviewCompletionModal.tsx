import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import { CVZenLogo } from '../CVZenLogo';
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

    // Validate all scores are within 1-10 range
    const invalidScores = evaluationMetrics.filter(metric => 
      metric.checked && metric.score && (parseFloat(metric.score) < 1 || parseFloat(metric.score) > 10)
    );

    if (invalidScores.length > 0) {
      alert('Please ensure all scores are between 1.0 and 10.0 before submitting.');
      return;
    }

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
    <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with CVZen Branding */}
        <div className="bg-brand-background text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <CVZenLogo className="h-8 w-auto" showCaption={false} />
            <div>
              <h2 className="text-xl font-bold">Complete Interview</h2>
              <p className="text-sm text-brand-auxiliary-1">Provide evaluation and hiring decision</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-brand-auxiliary-1 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interview Info */}
          <div className="bg-gradient-to-br from-brand-main/5 to-brand-background/5 border border-brand-main/10 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-3 font-jakarta">Interview Summary</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Interview</p>
                <p className="font-semibold text-slate-900 font-jakarta">{interview.title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Candidate</p>
                <p className="font-medium text-slate-900 font-jakarta">
                  {interview.candidate?.name || interview.guestCandidateName || 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Date & Time</p>
                <p className="font-medium text-slate-900 font-jakarta">
                  {new Date(interview.proposedDatetime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Evaluation Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900 font-jakarta">
                Evaluation Metrics & Scoring
              </h4>
              {overallScore && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-main/10 to-brand-background/10 border border-brand-main/20 rounded-xl">
                  <Star className="w-5 h-5 text-brand-main" />
                  <span className="text-sm font-semibold text-slate-700 font-jakarta">
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
          </div>

          {/* Decision Selection */}
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4 font-jakarta">
              Hiring Decision *
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setDecision('hired')}
                className={`p-6 rounded-xl border-2 transition-all font-jakarta ${
                  decision === 'hired'
                    ? 'border-green-500 bg-green-50 shadow-lg'
                    : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <CheckCircle className={`w-8 h-8 mx-auto mb-3 ${
                  decision === 'hired' ? 'text-green-600' : 'text-slate-400'
                }`} />
                <p className={`text-base font-semibold mb-1 ${
                  decision === 'hired' ? 'text-green-700' : 'text-slate-600'
                }`}>
                  Hired
                </p>
                <p className={`text-sm ${
                  decision === 'hired' ? 'text-green-600' : 'text-slate-500'
                }`}>
                  Move to next round or extend offer
                </p>
              </button>

              <button
                onClick={() => setDecision('rejected')}
                className={`p-6 rounded-xl border-2 transition-all font-jakarta ${
                  decision === 'rejected'
                    ? 'border-red-500 bg-red-50 shadow-lg'
                    : 'border-slate-200 hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                <XCircle className={`w-8 h-8 mx-auto mb-3 ${
                  decision === 'rejected' ? 'text-red-600' : 'text-slate-400'
                }`} />
                <p className={`text-base font-semibold mb-1 ${
                  decision === 'rejected' ? 'text-red-700' : 'text-slate-600'
                }`}>
                  Rejected
                </p>
                <p className={`text-sm ${
                  decision === 'rejected' ? 'text-red-600' : 'text-slate-500'
                }`}>
                  Not a good fit for this role
                </p>
              </button>

              <button
                onClick={() => setDecision('hold')}
                className={`p-6 rounded-xl border-2 transition-all font-jakarta ${
                  decision === 'hold'
                    ? 'border-amber-500 bg-amber-50 shadow-lg'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <Clock className={`w-8 h-8 mx-auto mb-3 ${
                  decision === 'hold' ? 'text-amber-600' : 'text-slate-400'
                }`} />
                <p className={`text-base font-semibold mb-1 ${
                  decision === 'hold' ? 'text-amber-700' : 'text-slate-600'
                }`}>
                  On Hold
                </p>
                <p className={`text-sm ${
                  decision === 'hold' ? 'text-amber-600' : 'text-slate-500'
                }`}>
                  Need more time to decide
                </p>
              </button>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="feedback" className="block text-lg font-semibold text-slate-900 mb-3 font-jakarta">
              Feedback for Candidate
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide constructive feedback about the interview performance..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-main/20 focus:border-brand-main transition-colors font-jakarta resize-none"
            />
            <p className="text-sm text-slate-500 mt-2 font-jakarta">
              This feedback will be visible to the candidate in their applications and email notification
            </p>
          </div>

          {/* Email Notification Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm">📧</span>
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-1 font-jakarta">Email Notification</p>
                <p className="text-sm text-blue-700 font-jakarta">
                  The candidate will receive an email notification with your decision and feedback.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <p className="text-xs text-gray-500 font-jakarta">
            Powered by CVZen - Intelligent Hiring OS
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="h-10 px-6 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-jakarta font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!decision || submitting}
              className="h-10 px-8 bg-gradient-to-r from-brand-main to-brand-background text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-jakarta font-medium"
            >
              {submitting ? 'Submitting...' : 'Complete Interview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};