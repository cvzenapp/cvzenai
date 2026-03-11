import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Trophy, 
  Target,
  ArrowLeft,
  Play,
  RotateCcw
} from 'lucide-react';
import { mockTestApi } from '../services/mockTestApi';

interface MockTestLevel {
  level: string;
  completed: boolean;
  available: boolean;
}

interface ExistingTest {
  id: number;
  testLevel: string;
  status: string;
  percentageScore?: number;
  createdAt: string;
  completedAt?: string;
}

export const MockTest: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  
  const [levels, setLevels] = useState<MockTestLevel[]>([]);
  const [existingTests, setExistingTests] = useState<ExistingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (interviewId) {
      loadTestLevels();
    }
  }, [interviewId]);

  const loadTestLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await mockTestApi.getTestLevels(parseInt(interviewId!));
      
      if (response.success) {
        setLevels(response.levels);
        setExistingTests(response.existingTests);
      } else {
        setError('Failed to load test levels');
      }
    } catch (err: any) {
      console.error('Error loading test levels:', err);
      setError(err.message || 'Failed to load test levels');
    } finally {
      setLoading(false);
    }
  };

  const generateMockTest = async (testLevel: string) => {
    try {
      setGenerating(testLevel);
      setError(null);
      
      const response = await mockTestApi.generateTest(parseInt(interviewId!), testLevel);
      
      if (response.success) {
        // Navigate to the test session
        navigate(`/mock-test/session/${response.session.id}`);
      } else {
        setError('Failed to generate mock test');
      }
    } catch (err: any) {
      console.error('Error generating mock test:', err);
      setError(err.message || 'Failed to generate mock test');
    } finally {
      setGenerating(null);
    }
  };

  const continueMockTest = (testId: number) => {
    navigate(`/mock-test/session/${testId}`);
  };

  const viewResults = (testId: number) => {
    navigate(`/mock-test/results/${testId}`);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'basic': return Target;
      case 'moderate': return Brain;
      case 'complex': return Trophy;
      default: return AlertCircle;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'basic': return 'from-green-500 to-emerald-500';
      case 'moderate': return 'from-blue-500 to-indigo-500';
      case 'complex': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getLevelDescription = (level: string) => {
    switch (level) {
      case 'basic': 
        return 'Fundamental concepts and basic knowledge assessment';
      case 'moderate': 
        return 'Intermediate skills and practical application questions';
      case 'complex': 
        return 'Advanced scenarios and complex problem-solving challenges';
      default: 
        return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-main/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-main border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">Loading mock test options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/interviews')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 font-jakarta">
                Mock Test Preparation
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Prepare for your interview with AI-generated practice tests
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 font-jakarta">Error</h3>
                  <p className="text-sm text-red-600 mt-1 font-jakarta">{error}</p>
                  <button 
                    onClick={loadTestLevels}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-jakarta"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
            Your Progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {levels.map((level) => {
              const Icon = getLevelIcon(level.level);
              const existingTest = existingTests.find(t => t.testLevel === level.level);
              
              return (
                <div
                  key={level.level}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    level.completed 
                      ? 'border-green-200 bg-green-50' 
                      : level.available 
                        ? 'border-slate-200 bg-white hover:border-brand-main/30' 
                        : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getLevelColor(level.level)} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 font-jakarta capitalize">
                        {level.level}
                      </h3>
                      {level.completed && existingTest?.percentageScore && (
                        <p className="text-sm text-green-600 font-jakarta">
                          {existingTest.percentageScore.toFixed(1)}% Score
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {level.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : level.available ? (
                      <Clock className="w-4 h-4 text-slate-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-300" />
                    )}
                    <span className={`text-sm font-jakarta ${
                      level.completed 
                        ? 'text-green-600' 
                        : level.available 
                          ? 'text-slate-600' 
                          : 'text-slate-400'
                    }`}>
                      {level.completed 
                        ? 'Completed' 
                        : level.available 
                          ? 'Available' 
                          : 'Locked'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Test Levels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {levels.map((level) => {
            const Icon = getLevelIcon(level.level);
            const existingTest = existingTests.find(t => t.testLevel === level.level);
            const inProgress = existingTest?.status === 'in_progress';
            const completed = existingTest?.status === 'completed';
            
            return (
              <div
                key={level.level}
                className={`bg-white rounded-xl border-2 p-6 transition-all ${
                  level.available 
                    ? 'border-slate-200 hover:border-brand-main/30 hover:shadow-lg' 
                    : 'border-slate-100 opacity-60'
                }`}
              >
                {/* Level Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getLevelColor(level.level)} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 font-jakarta capitalize">
                      {level.level} Level
                    </h3>
                    <p className="text-sm text-slate-600 font-jakarta">
                      {getLevelDescription(level.level)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  {completed && existingTest?.percentageScore !== undefined && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-800 font-jakarta">
                          Score: {existingTest.percentageScore.toFixed(1)}%
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-xs text-green-600 font-jakarta mt-1">
                        Completed on {new Date(existingTest.completedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {inProgress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-800 font-jakarta">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 font-jakarta mt-1">
                        Started on {new Date(existingTest.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {level.available && !completed && (
                    <>
                      {inProgress ? (
                        <button
                          onClick={() => continueMockTest(existingTest!.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Continue Test
                        </button>
                      ) : (
                        <button
                          onClick={() => generateMockTest(level.level)}
                          disabled={generating === level.level}
                          className="w-full bg-brand-main hover:bg-brand-background text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generating === level.level ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" />
                              Start Test
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}

                  {completed && (
                    <div className="space-y-2">
                      <button
                        onClick={() => viewResults(existingTest!.id)}
                        className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2"
                      >
                        <Trophy className="w-4 h-4" />
                        View Results
                      </button>
                      <button
                        onClick={() => generateMockTest(level.level)}
                        disabled={generating === level.level}
                        className="w-full bg-brand-main/10 hover:bg-brand-main/20 text-brand-main px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {generating === level.level ? (
                          <>
                            <div className="w-4 h-4 border-2 border-brand-main border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            Retake Test
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {!level.available && (
                    <div className="text-center py-2">
                      <p className="text-sm text-slate-500 font-jakarta">
                        Complete previous levels to unlock
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-3">
            How Mock Tests Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-jakarta">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
                <p>Tests are AI-generated based on your resume and the job description</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
                <p>Each level must be completed sequentially (Basic → Moderate → Complex)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
                <p>Tests include multiple choice, objective, and coding questions</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
                <p>You have 24 hours to complete each test once started</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
                <p>Detailed feedback and explanations provided after completion</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-brand-main rounded-full mt-2 flex-shrink-0"></div>
                <p>You can retake tests to improve your scores</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};