import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Target,
  Brain,
  Clock,
  RotateCcw,
  Download,
  Share2
} from 'lucide-react';
import { mockTestApi, MockTestResults } from '../services/mockTestApi';

export const MockTestResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [results, setResults] = useState<MockTestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (sessionId) {
      loadResults();
    }
  }, [sessionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockTestApi.getResults(parseInt(sessionId!));
      
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

  const toggleQuestionExpansion = (questionId: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return 'Outstanding performance! You\'re well-prepared for this interview.';
    if (percentage >= 80) return 'Great job! You have a strong understanding of the concepts.';
    if (percentage >= 70) return 'Good work! Consider reviewing the areas where you missed questions.';
    if (percentage >= 60) return 'Fair performance. Focus on strengthening your weak areas.';
    return 'Keep practicing! Review the explanations and try again.';
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'basic': return Target;
      case 'moderate': return Brain;
      case 'complex': return Trophy;
      default: return Brain;
    }
  };

  const formatDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const duration = end - start;
    
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
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

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 font-jakarta mb-2">
            Unable to Load Results
          </h2>
          <p className="text-slate-600 font-jakarta mb-4">
            {error || 'Test results not found.'}
          </p>
          <button
            onClick={() => navigate('/interviews')}
            className="bg-brand-main hover:bg-brand-background text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors"
          >
            Back to Interviews
          </button>
        </div>
      </div>
    );
  }

  const { session, questions } = results;
  const percentage = session.percentageScore || 0;
  const correctAnswers = questions.filter(q => q.isCorrect).length;
  const LevelIcon = getLevelIcon(session.testLevel);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`/mock-test/${session.interviewId}`)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
              <LevelIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 font-jakarta capitalize">
                {session.testLevel} Level Results
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Completed on {new Date(session.completedAt!).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Score Overview */}
        <div className={`rounded-xl border-2 p-6 mb-8 ${getScoreBgColor(percentage)}`}>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                  className={getScoreColor(percentage)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold font-jakarta ${getScoreColor(percentage)}`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-slate-900 font-jakarta mb-2">
              Your Score: {session.candidateScore}/{session.totalScore} points
            </h2>
            <p className="text-slate-600 font-jakarta mb-4">
              {getPerformanceMessage(percentage)}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 font-jakarta">
                  {correctAnswers}/{questions.length}
                </div>
                <div className="text-sm text-slate-600 font-jakarta">Correct Answers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 font-jakarta">
                  {session.startedAt && session.completedAt ? 
                    formatDuration(session.startedAt, session.completedAt) : 'N/A'}
                </div>
                <div className="text-sm text-slate-600 font-jakarta">Time Taken</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 font-jakarta capitalize">
                  {session.testLevel}
                </div>
                <div className="text-sm text-slate-600 font-jakarta">Difficulty Level</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => navigate(`/mock-test/${session.interviewId}`)}
            className="bg-brand-main hover:bg-brand-background text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Take Another Test
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Results
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Mock Test Results',
                  text: `I scored ${percentage.toFixed(0)}% on my ${session.testLevel} level mock test!`,
                  url: window.location.href
                });
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Results
          </button>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-6">
            Question Review
          </h3>
          
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);
              const isCorrect = question.isCorrect;
              
              return (
                <div
                  key={question.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div 
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleQuestionExpansion(question.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-white" />
                        ) : (
                          <XCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-600 font-jakarta">
                            Question {index + 1}
                          </span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-jakarta">
                            {question.questionType.toUpperCase()}
                          </span>
                          <span className="text-sm text-slate-500 font-jakarta">
                            {question.pointsEarned || 0}/{question.points} pts
                          </span>
                        </div>
                        <p className="text-slate-900 font-jakarta">
                          {question.questionText}
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 ml-4">
                      <svg 
                        className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                      {/* Options for MCQ/Single Selection */}
                      {(question.questionType === 'mcq' || question.questionType === 'single_selection') && question.options && (
                        <div>
                          <h5 className="font-semibold text-slate-900 font-jakarta mb-2">Options:</h5>
                          <div className="space-y-2">
                            {question.options.map((option: any) => {
                              const isSelected = question.selectedOptions?.includes(option.id);
                              const isCorrectOption = option.isCorrect;
                              
                              return (
                                <div
                                  key={option.id}
                                  className={`p-3 rounded-lg border ${
                                    isCorrectOption
                                      ? 'border-green-300 bg-green-100'
                                      : isSelected
                                        ? 'border-red-300 bg-red-100'
                                        : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-700 font-jakarta">
                                      {option.id}.
                                    </span>
                                    <span className="text-slate-700 font-jakarta flex-1">
                                      {option.text}
                                    </span>
                                    {isCorrectOption && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                    {isSelected && !isCorrectOption && (
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Your Answer */}
                      {question.candidateAnswer && (
                        <div>
                          <h5 className="font-semibold text-slate-900 font-jakarta mb-2">Your Answer:</h5>
                          <div className="bg-slate-100 rounded-lg p-3">
                            <p className="text-slate-700 font-jakarta whitespace-pre-wrap">
                              {question.candidateAnswer}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Correct Answer */}
                      <div>
                        <h5 className="font-semibold text-slate-900 font-jakarta mb-2">Correct Answer:</h5>
                        <div className="bg-green-100 rounded-lg p-3">
                          <p className="text-green-800 font-jakarta whitespace-pre-wrap">
                            {question.correctAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div>
                          <h5 className="font-semibold text-slate-900 font-jakarta mb-2">Explanation:</h5>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-800 font-jakarta whitespace-pre-wrap">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Tips */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mt-8">
          <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
            Performance Tips
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-jakarta">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 mt-0.5 text-brand-main flex-shrink-0" />
                <p>Review questions you got wrong and understand the explanations</p>
              </div>
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 mt-0.5 text-brand-main flex-shrink-0" />
                <p>Practice similar questions to strengthen weak areas</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 mt-0.5 text-brand-main flex-shrink-0" />
                <p>Take practice tests regularly to improve your speed and accuracy</p>
              </div>
              <div className="flex items-start gap-2">
                <Trophy className="w-4 h-4 mt-0.5 text-brand-main flex-shrink-0" />
                <p>Focus on understanding concepts rather than memorizing answers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};