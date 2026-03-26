import React from 'react';
import { Target, Brain, Trophy, CheckCircle, Lock, Circle } from 'lucide-react';
import { MockTestProgress } from '../../services/mockTestApi';
import {
  getScoreTier,
  getAttemptDisplay,
  getAttemptStatus,
  formatLevelName,
  canTakeAttempt,
  getNextAttemptNumber
} from '../../utils/mockTestUtils';

interface MockTestProgressBadgeProps {
  progress: MockTestProgress;
  onStartTest?: (level: string) => void;
  compact?: boolean;
}

export const MockTestProgressBadge: React.FC<MockTestProgressBadgeProps> = ({
  progress,
  onStartTest,
  compact = false
}) => {
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'basic': return Target;
      case 'moderate': return Brain;
      case 'complex': return Trophy;
      default: return Brain;
    }
  };

  const LevelIcon = getLevelIcon(progress.testLevel);
  const canStart = canTakeAttempt(progress);
  const nextAttempt = getNextAttemptNumber(progress);

  const renderAttemptDot = (attemptNumber: 1 | 2 | 3) => {
    const status = getAttemptStatus(progress, attemptNumber);
    const scores = [
      progress.attempt1Score,
      progress.attempt2Score,
      progress.attempt3Score
    ];
    const score = scores[attemptNumber - 1];

    if (status === 'completed' && score !== null && score !== undefined) {
      const tier = getScoreTier(score);
      return (
        <div className={`w-3 h-3 rounded-full border-2 ${tier.borderColor} ${tier.bgColor} flex items-center justify-center`}>
          <CheckCircle className="w-2 h-2 text-green-600" />
        </div>
      );
    } else if (status === 'available') {
      return (
        <div className="w-3 h-3 rounded-full border-2 border-slate-300 bg-white">
          <Circle className="w-2 h-2 text-slate-400" />
        </div>
      );
    } else {
      return (
        <div className="w-3 h-3 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
          <Lock className="w-1.5 h-1.5 text-slate-400" />
        </div>
      );
    }
  };

  const renderAttemptLabel = (attemptNumber: 1 | 2 | 3) => {
    const scores = [
      progress.attempt1Score,
      progress.attempt2Score,
      progress.attempt3Score
    ];
    const score = scores[attemptNumber - 1];

    if (score === null || score === undefined) {
      return null;
    }

    const display = getAttemptDisplay(progress, attemptNumber);
    const tier = getScoreTier(score);

    return (
      <span className={`text-xs font-medium ${tier.color}`}>
        {display}
      </span>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-main to-brand-background rounded-lg flex items-center justify-center">
          <LevelIcon className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-900">
              {formatLevelName(progress.testLevel)}
            </span>
            {progress.bestScore > 0 && (
              <span className="text-xs text-slate-600">
                Best: {progress.bestScore.toFixed(0)}%
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3].map(num => renderAttemptDot(num as 1 | 2 | 3))}
            {progress.currentAttempts > 0 && (
              <span className="ml-2 text-xs text-slate-500">
                {progress.currentAttempts}/3 attempts
              </span>
            )}
          </div>
        </div>

        {canStart && onStartTest && (
          <button
            onClick={() => onStartTest(progress.testLevel)}
            className="px-3 py-1 text-xs font-medium text-brand-main border border-brand-main rounded-md hover:bg-brand-main hover:text-white transition-colors"
          >
            {nextAttempt === 1 ? 'Start' : `Try ${nextAttempt}`}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center">
            <LevelIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 font-jakarta">
              {formatLevelName(progress.testLevel)} Level
            </h3>
            {progress.bestScore > 0 && (
              <p className="text-sm text-slate-600">
                Best Score: {progress.bestScore.toFixed(0)}%
              </p>
            )}
          </div>
        </div>

        {canStart && onStartTest && (
          <button
            onClick={() => onStartTest(progress.testLevel)}
            className="bg-brand-main hover:bg-brand-background text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors"
          >
            {nextAttempt === 1 ? 'Start Test' : `Attempt ${nextAttempt}`}
          </button>
        )}
      </div>

      {/* Attempts Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Progress</span>
          <span className="text-sm text-slate-500">
            {progress.currentAttempts}/3 attempts
          </span>
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map(attemptNumber => {
            const num = attemptNumber as 1 | 2 | 3;
            const status = getAttemptStatus(progress, num);
            const scores = [
              progress.attempt1Score,
              progress.attempt2Score,
              progress.attempt3Score
            ];
            const score = scores[num - 1];

            return (
              <div key={num} className="flex items-center gap-3">
                {renderAttemptDot(num)}
                
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Attempt {num}
                  </span>
                  
                  {status === 'completed' && score !== null && score !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {score.toFixed(0)}%
                      </span>
                      {renderAttemptLabel(num)}
                    </div>
                  )}
                  
                  {status === 'locked' && (
                    <span className="text-xs text-slate-400">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Best Score Highlight */}
      {progress.bestScore > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Best Performance</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {progress.bestScore.toFixed(0)}%
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreTier(progress.bestScore).color} ${getScoreTier(progress.bestScore).bgColor}`}>
                {getScoreTier(progress.bestScore).label}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};