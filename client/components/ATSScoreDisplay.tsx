import { ATSScore } from '@shared/api';
import { CheckCircle, AlertCircle, TrendingUp, Award, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface ATSScoreDisplayProps {
  atsScore: ATSScore;
  compact?: boolean;
  onImprove?: () => void;
  isImproving?: boolean;
}

export function ATSScoreDisplay({ atsScore, compact = false, onImprove, isImproving = false }: ATSScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Improvement';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getScoreBgColor(atsScore.overallScore)}`}>
          <span className={`text-lg font-bold ${getScoreColor(atsScore.overallScore)}`}>
            {atsScore.overallScore}
          </span>
        </div>
        <div>
          <div className="text-sm font-medium">ATS Score</div>
          <div className={`text-xs ${getScoreColor(atsScore.overallScore)}`}>
            {getScoreLabel(atsScore.overallScore)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {/* Overall Score */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-3">
          <span className="text-4xl font-bold text-white">{atsScore.overallScore}</span>
        </div>
        <h3 className="text-xl font-semibold mb-1">ATS Score</h3>
        <p className={`text-sm font-medium ${getScoreColor(atsScore.overallScore)}`}>
          {getScoreLabel(atsScore.overallScore)}
        </p>
        
        {/* Improve Button */}
        {onImprove && atsScore.overallScore < 90 && (
          <Button
            onClick={onImprove}
            disabled={isImproving}
            className="mt-4 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            {isImproving ? 'Improving...' : 'Improve ATS Score with AI'}
          </Button>
        )}
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-700 mb-3">Score Breakdown</h4>
        
        {Object.entries(atsScore.scores).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className={`font-medium ${getScoreColor(value)}`}>{value}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {atsScore.strengths && atsScore.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-green-600" />
            Strengths
          </h4>
          <ul className="space-y-1">
            {atsScore.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {atsScore.suggestions && atsScore.suggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Improvement Suggestions
          </h4>
          <ul className="space-y-1">
            {atsScore.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
