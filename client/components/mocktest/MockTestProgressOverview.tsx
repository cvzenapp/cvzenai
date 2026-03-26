import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { mockTestApi, MockTestProgress } from '../../services/mockTestApi';
import { MockTestProgressBadge } from './MockTestProgressBadge';

interface MockTestProgressOverviewProps {
  interviewId?: number;
  onStartTest?: (level: string) => void;
  compact?: boolean;
}

export const MockTestProgressOverview: React.FC<MockTestProgressOverviewProps> = ({
  interviewId,
  onStartTest,
  compact = false
}) => {
  const [progress, setProgress] = useState<MockTestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockTestApi.getProgress(interviewId);
      
      if (response.success) {
        // Ensure we have progress for all levels
        const levels: Array<'basic' | 'moderate' | 'complex'> = ['basic', 'moderate', 'complex'];
        const progressMap = new Map(response.progress.map(p => [p.testLevel, p]));
        
        const completeProgress = levels.map(level => {
          const existing = progressMap.get(level);
          if (existing) {
            return existing;
          }
          
          // Create empty progress for levels not yet attempted
          return {
            id: 0,
            candidateId: '',
            interviewId,
            testLevel: level,
            bestScore: 0,
            currentAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          } as MockTestProgress;
        });
        
        setProgress(completeProgress);
      } else {
        setError('Failed to load progress');
      }
    } catch (err: any) {
      console.error('Error loading progress:', err);
      setError(err.message || 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [interviewId]);

  const handleStartTest = (level: string) => {
    if (onStartTest) {
      onStartTest(level);
    }
  };

  const getOverallStats = () => {
    const totalAttempts = progress.reduce((sum, p) => sum + p.currentAttempts, 0);
    const completedLevels = progress.filter(p => p.currentAttempts > 0).length;
    const averageScore = progress.length > 0 
      ? progress.reduce((sum, p) => sum + p.bestScore, 0) / progress.length 
      : 0;

    return { totalAttempts, completedLevels, averageScore };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-brand-main animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-jakarta">Loading progress...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 font-jakarta">Error</h3>
            <p className="text-sm text-red-600 mt-1 font-jakarta">{error}</p>
            <button 
              onClick={loadProgress}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-jakarta"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getOverallStats();

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Overall Stats */}
        {stats.totalAttempts > 0 && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-slate-900">{stats.completedLevels}/3</div>
                <div className="text-xs text-slate-600">Levels Started</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{stats.totalAttempts}</div>
                <div className="text-xs text-slate-600">Total Attempts</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-900">{stats.averageScore.toFixed(0)}%</div>
                <div className="text-xs text-slate-600">Avg Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Level Progress */}
        <div className="space-y-2">
          {progress.map(levelProgress => (
            <MockTestProgressBadge
              key={levelProgress.testLevel}
              progress={levelProgress}
              onStartTest={handleStartTest}
              compact={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-900 font-jakarta mb-4">
          Mock Test Progress
        </h2>
        
        {stats.totalAttempts > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{stats.completedLevels}/3</div>
              <div className="text-sm text-slate-600">Levels Started</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{stats.totalAttempts}</div>
              <div className="text-sm text-slate-600">Total Attempts</div>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <div className="text-2xl font-bold text-slate-900">{stats.averageScore.toFixed(0)}%</div>
              <div className="text-sm text-slate-600">Average Score</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-600 font-jakarta mb-4">
              Start your mock test journey! Each level has up to 3 attempts.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>75%+ = Strong</span>
              <span>•</span>
              <span>50-74% = Good Start</span>
              <span>•</span>
              <span>&lt;50% = Needs Improvement</span>
            </div>
          </div>
        )}
      </div>

      {/* Level Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {progress.map(levelProgress => (
          <MockTestProgressBadge
            key={levelProgress.testLevel}
            progress={levelProgress}
            onStartTest={handleStartTest}
            compact={false}
          />
        ))}
      </div>
    </div>
  );
};