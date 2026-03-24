import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Trophy, 
  Target,
  Play,
  RotateCcw,
  Calendar,
  Building
} from 'lucide-react';
import { mockTestApi, MockTestLevel, ExistingTest } from '../../services/mockTestApi';
import { interviewApi } from '../../services/interviewApi';
import { MockTestSession } from '../mocktest/MockTestSession';
import { MockTestResults } from '../mocktest/MockTestResults';

interface Interview {
  id: number;
  title: string;
  status: string;
  proposedDatetime: string;
  recruiter?: {
    name: string;
    company?: string;
  };
}

export const MockTestDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'session' | 'results'>('dashboard');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [levels, setLevels] = useState<MockTestLevel[]>([]);
  const [existingTests, setExistingTests] = useState<ExistingTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadInterviews();
  }, []);

  useEffect(() => {
    if (selectedInterview) {
      loadTestLevels();
    }
  }, [selectedInterview]);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await interviewApi.getMyInterviews();
      const acceptedInterviews = data.filter((interview: Interview) => 
        interview.status === 'accepted'
      );
      
      setInterviews(acceptedInterviews);
      
      // Auto-select first interview if available and no interview is currently selected
      if (acceptedInterviews.length > 0 && !selectedInterview) {
        setSelectedInterview(acceptedInterviews[0]);
      }
    } catch (err: any) {
      console.error('Error loading interviews:', err);
      setError(err.message || 'Failed to load interviews');
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTestLevels = async () => {
    if (!selectedInterview) return;
    
    try {
      setError(null);
      
      const response = await mockTestApi.getTestLevels(selectedInterview.id);
      
      if (response.success) {
        setLevels(response.levels);
        setExistingTests(response.existingTests);
      } else {
        setError('Failed to load test levels');
      }
    } catch (err: any) {
      console.error('Error loading test levels:', err);
      setError(err.message || 'Failed to load test levels');
    }
  };

  const generateMockTest = async (testLevel: string) => {
    if (!selectedInterview) return;
    
    try {
      setGenerating(testLevel);
      setError(null);
      
      const response = await mockTestApi.generateTest(selectedInterview.id, testLevel);
      
      if (response.success) {
        // Navigate to the test session within the dashboard
        setCurrentSessionId(response.session.id);
        setCurrentView('session');
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
    setCurrentSessionId(testId);
    setCurrentView('session');
  };

  const viewResults = (testId: number) => {
    setCurrentSessionId(testId);
    setCurrentView('results');
  };

  const handleTestComplete = (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setCurrentView('results');
    // Reload test levels to update progress
    loadTestLevels();
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentSessionId(null);
    // Reload test levels to update progress
    if (selectedInterview) {
      loadTestLevels();
    }
  };

  const handleRetakeTest = (testLevel: string) => {
    generateMockTest(testLevel);
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
      <div className="flex items-center justify-center h-64">
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

  if (interviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-2">
          No Accepted Interviews
        </h3>
        <p className="text-slate-600 font-jakarta mb-4">
          You need to have accepted interviews to access mock tests.
        </p>
      </div>
    );
  }

  // Render different views based on current state
  if (currentView === 'session' && currentSessionId) {
    return (
      <MockTestSession
        sessionId={currentSessionId}
        onComplete={handleTestComplete}
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'results' && currentSessionId) {
    return (
      <MockTestResults
        sessionId={currentSessionId}
        onBack={handleBackToDashboard}
        onRetake={handleRetakeTest}
      />
    );
  }

  // Default dashboard view

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-main to-brand-background rounded-xl flex items-center justify-center shadow-lg">
          <Brain className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-jakarta">
            Mock Test Preparation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Prepare for your interviews with AI-generated practice tests
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
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

      {/* Interview Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
          Select Interview
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {interviews.map((interview) => (
            <button
              key={interview.id}
              onClick={() => setSelectedInterview(interview)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedInterview?.id === interview.id
                  ? 'border-brand-main bg-brand-main/5'
                  : 'border-slate-200 hover:border-brand-main/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 font-jakarta">
                    {interview.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>{interview.recruiter?.name}</span>
                      {interview.recruiter?.company && (
                        <span>• {interview.recruiter.company}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(interview.proposedDatetime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                  Accepted
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Levels */}
      {selectedInterview && (
        <>
          {/* Test Levels Grid */}
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
        </>
      )}
    </div>
  );
};