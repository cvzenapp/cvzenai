import React from 'react';
import { X, CheckCircle, XCircle, Clock, Star, Award, TrendingUp } from 'lucide-react';
import { CVZenLogo } from '../CVZenLogo';
import type { InterviewInvitation } from '@shared/api';

interface InterviewResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewInvitation;
}

export const InterviewResultsModal: React.FC<InterviewResultsModalProps> = ({
  isOpen,
  onClose,
  interview
}) => {
  if (!isOpen) return null;

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(interview.proposedDatetime);

  const getStatusIcon = () => {
    switch (interview.applicationStatus) {
      case 'accepted':
        return <CheckCircle className="w-8 h-8 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Clock className="w-8 h-8 text-amber-600" />;
    }
  };

  const getStatusColor = () => {
    switch (interview.applicationStatus) {
      case 'accepted':
        return 'from-emerald-50 to-green-50 border-emerald-200';
      case 'rejected':
        return 'from-red-50 to-rose-50 border-red-200';
      default:
        return 'from-amber-50 to-yellow-50 border-amber-200';
    }
  };

  const getStatusText = () => {
    switch (interview.applicationStatus) {
      case 'accepted':
        return 'Congratulations! You have been selected';
      case 'rejected':
        return 'Thank you for your time';
      default:
        return 'Your application is under review';
    }
  };

  const getOverallScore = () => {
    if (!interview.evaluationMetrics || !Array.isArray(interview.evaluationMetrics)) {
      return null;
    }
    
    const scoredMetrics = interview.evaluationMetrics.filter(m => m.checked && m.score);
    if (scoredMetrics.length === 0) return null;
    
    const total = scoredMetrics.reduce((sum, metric) => {
      const score = parseFloat(metric.score || '0');
      return sum + score;
    }, 0);
    
    return (total / scoredMetrics.length).toFixed(1);
  };

  const getScoreColor = (score: string | null) => {
    if (!score) return 'text-slate-400';
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'text-emerald-600';
    if (numScore >= 6) return 'text-amber-600';
    return 'text-red-600';
  };

  const overallScore = getOverallScore();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with CVZen Branding */}
        <div className="bg-brand-background text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <CVZenLogo className="h-8 w-auto" showCaption={false} />
            <div>
              <h2 className="text-xl font-bold">Interview Results</h2>
              <p className="text-sm text-brand-auxiliary-1">Your interview evaluation and feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-brand-auxiliary-1 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Interview Summary */}
          <div className="bg-gradient-to-br from-brand-main/5 to-brand-background/5 border border-brand-main/10 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4 font-jakarta">Interview Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Position</p>
                <p className="font-semibold text-slate-900 font-jakarta">{interview.title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Company</p>
                <p className="font-semibold text-slate-900 font-jakarta">
                  {interview.recruiter?.company || 'Company'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Interview Date</p>
                <p className="font-medium text-slate-900 font-jakarta">{dateStr}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-jakarta">Interviewer</p>
                <p className="font-medium text-slate-900 font-jakarta">
                  {interview.recruiter?.name || 'Recruiter'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className={`bg-gradient-to-br ${getStatusColor()} rounded-xl p-6 border`}>
            <div className="flex items-center gap-4 mb-4">
              {getStatusIcon()}
              <div>
                <h3 className="text-xl font-bold text-slate-900 font-jakarta">
                  {interview.applicationStatus === 'accepted' ? 'Hired' : 
                   interview.applicationStatus === 'rejected' ? 'Not Selected' : 'Under Review'}
                </h3>
                <p className="text-slate-700 font-jakarta">{getStatusText()}</p>
              </div>
            </div>
          </div>

          {/* Overall Score */}
          {overallScore && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 font-jakarta">Overall Performance</h3>
                  <p className="text-slate-600 font-jakarta">Your interview evaluation score</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(overallScore)} font-jakarta`}>
                    {overallScore}
                  </div>
                  <div className="text-sm text-slate-500 font-jakarta">out of 10</div>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        parseFloat(overallScore) >= 8 ? 'bg-emerald-500' :
                        parseFloat(overallScore) >= 6 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(parseFloat(overallScore) / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1 font-jakarta">
                    <span>Poor</span>
                    <span>Average</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluation Metrics */}
          {interview.evaluationMetrics && Array.isArray(interview.evaluationMetrics) && 
           interview.evaluationMetrics.filter(m => m.checked).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-brand-main" />
                <h3 className="text-lg font-semibold text-slate-900 font-jakarta">Performance Breakdown</h3>
              </div>
              <div className="space-y-4">
                {interview.evaluationMetrics
                  .filter(metric => metric.checked)
                  .map((metric, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 font-jakarta">{metric.metric}</p>
                      </div>
                      {metric.score && (
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(metric.score)} font-jakarta`}>
                            {metric.score}
                          </span>
                          <span className="text-sm text-slate-500 font-jakarta">/10</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Recruiter Feedback */}
          {interview.recruiterFeedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900 font-jakarta">Feedback from Interviewer</h3>
              </div>
              <div className="prose max-w-none">
                <p className="text-blue-800 leading-relaxed whitespace-pre-wrap font-jakarta">
                  {interview.recruiterFeedback}
                </p>
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3 font-jakarta">Next Steps</h3>
            {interview.applicationStatus === 'accepted' ? (
              <div className="space-y-2">
                <p className="text-slate-700 font-jakarta">
                  🎉 Congratulations! The recruiter will contact you soon with next steps regarding your offer.
                </p>
                <p className="text-sm text-slate-600 font-jakarta">
                  Keep an eye on your email for further communication from the hiring team.
                </p>
              </div>
            ) : interview.applicationStatus === 'rejected' ? (
              <div className="space-y-2">
                <p className="text-slate-700 font-jakarta">
                  While this opportunity didn't work out, use this feedback to improve for future interviews.
                </p>
                <p className="text-sm text-slate-600 font-jakarta">
                  Continue applying to other positions that match your skills and experience.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-700 font-jakarta">
                  Your application is still under review. The hiring team will contact you with updates.
                </p>
                <p className="text-sm text-slate-600 font-jakarta">
                  This process may take a few days. Thank you for your patience.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
          <p className="text-xs text-gray-500 font-jakarta">
            Powered by CVZen - Intelligent Hiring OS
          </p>
          <button
            onClick={onClose}
            className="h-10 px-6 bg-brand-main text-white rounded-lg hover:bg-brand-background transition-colors font-jakarta font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};