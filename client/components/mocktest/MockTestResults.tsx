import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Clock,
  Target,
  TrendingUp,
  Award,
  RotateCcw
} from 'lucide-react';
import { mockTestApi, MockTestResult } from '../../services/mockTestApi';

interface MockTestResultsProps {
  sessionId: number;
  onBack: () => void;
  onRetake: (testLevel: string) => void;
}

export const MockTestResults: React.FC<MockTestResultsProps> = ({ 
  sessionId, 
  onBack, 
  onRetake 
}) => {
  const [results, setResults] = useState<MockTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockTestApi.getResults(sessionId);
      
      if (response.success) {
        setResults(response.results);
      } else {
        setError('Failed to load test results');
      }
    } catch (err: any) {
      console.error('Error loading results:', err);
      setError(err.message || 'Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return 'Excellent! Outstanding performance!';
    if (score >= 80) return 'Great job! You performed very well!';
    if (score >= 70) return 'Good work! Solid performance!';
    if (score >= 60) return 'Not bad! Room for improvement.';
    return 'Keep practicing! You can do better.';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-main/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-main border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">Loading test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800 font-jakarta">Error</h3>
            <p className="text-sm text-red-600 mt-1 font-jakarta">{error}</p>
            <button 
              onClick={onBack}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-jakarta"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-2">
          No Results Found
        </h3>
        <p className="text-slate-600 font-jakarta mb-4">
          Unable to load test results.
        </p>
        <button
          onClick={onBack}
          className="bg-brand-main hover:bg-brand-background text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tests
        </button>
        
        <button
          onClick={() => onRetake(results?.testLevel || 'basic')}
          className="flex items-center gap-2 bg-brand-main/10 hover:bg-brand-main/20 text-brand-main px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Test
        </button>
      </div>

      {/* Score Overview */}
      <div className={`rounded-xl border-2 p-8 text-center ${getScoreBgColor(results?.percentageScore || 0)}`}>
        <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-brand-main to-brand-background rounded-full flex items-center justify-center">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 font-jakarta mb-2">
          Test Completed!
        </h1>
        
        <div className={`text-6xl font-bold mb-2 ${getScoreColor(results?.percentageScore || 0)}`}>
          {(results?.percentageScore || 0).toFixed(1)}%
        </div>
        
        <p className="text-lg text-slate-600 font-jakarta mb-4">
          {getPerformanceMessage(results?.percentageScore || 0)}
        </p>
        
        <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>{results?.correctAnswers || 0} / {results?.totalQuestions || 0} Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{Math.round((results?.timeTaken || 0) / 60)} minutes</span>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 font-jakarta">Correct</h3>
              <p className="text-2xl font-bold text-green-600">{results?.correctAnswers || 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">
            Questions answered correctly
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 font-jakarta">Incorrect</h3>
              <p className="text-2xl font-bold text-red-600">{results?.incorrectAnswers || 0}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">
            Questions answered incorrectly
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 font-jakarta">Level</h3>
              <p className="text-2xl font-bold text-blue-600 capitalize">{results?.testLevel || 'Unknown'}</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">
            Test difficulty level
          </p>
        </div>
      </div>

      {/* Detailed Feedback */}
      {results.feedback && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Detailed Feedback
          </h3>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 font-jakarta leading-relaxed">
              {results.feedback}
            </p>
          </div>
        </div>
      )}

      {/* Question Review */}
      {results.questionResults && results.questionResults.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
            Question Review
          </h3>
          <div className="space-y-4">
            {results.questionResults.map((questionResult, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  questionResult.isCorrect 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    questionResult.isCorrect 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }`}>
                    {questionResult.isCorrect ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 font-jakarta mb-2">
                      Question {index + 1}
                    </h4>
                    <p className="text-slate-700 font-jakarta mb-2">
                      {questionResult.question}
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="font-jakarta">
                        <span className="font-semibold">Your answer:</span>{' '}
                        <span className={questionResult.isCorrect ? 'text-green-700' : 'text-red-700'}>
                          {questionResult.userAnswer || 'No answer provided'}
                        </span>
                      </p>
                      {!questionResult.isCorrect && questionResult.correctAnswer && (
                        <p className="font-jakarta">
                          <span className="font-semibold">Correct answer:</span>{' '}
                          <span className="text-green-700">{questionResult.correctAnswer}</span>
                        </p>
                      )}
                      {questionResult.explanation && (
                        <p className="font-jakarta text-slate-600 mt-2">
                          <span className="font-semibold">Explanation:</span> {questionResult.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
          What's Next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-jakarta">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
              <p>Review the questions you got wrong and understand the explanations</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
              <p>Practice similar questions to improve your weak areas</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
              <p>Retake the test to improve your score</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
              <p>Move to the next level once you're confident</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};