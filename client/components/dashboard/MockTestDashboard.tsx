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
  Building,
  Info
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
  const [generalTests, setGeneralTests] = useState<ExistingTest[]>([]);
  const [generalProgress, setGeneralProgress] = useState<Record<string, { 
    attempts: number; 
    bestScore: number; 
    lastSessionId?: number;
    attempt1Score?: number | null;
    attempt2Score?: number | null;
    attempt3Score?: number | null;
  }>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadInterviews();
    loadGeneralProgress();
  }, []);

  const loadGeneralProgress = async () => {
    try {
      // Load general test progress (interview_id = null)
      const progressResponse = await mockTestApi.getProgress();
      if (progressResponse.success) {
        const progressMap: Record<string, { 
          attempts: number; 
          bestScore: number; 
          lastSessionId?: number;
          attempt1Score?: number | null;
          attempt2Score?: number | null;
          attempt3Score?: number | null;
        }> = {};
        
        progressResponse.progress.forEach(p => {
          if (!p.interviewId) { // General tests have null interview_id
            progressMap[p.testLevel] = {
              attempts: p.currentAttempts,
              bestScore: p.bestScore,
              lastSessionId: p.attempt3SessionId || p.attempt2SessionId || p.attempt1SessionId,
              attempt1Score: p.attempt1Score,
              attempt2Score: p.attempt2Score,
              attempt3Score: p.attempt3Score
            };
          }
        });
        
        setGeneralProgress(progressMap);
      }

      // Load existing general test sessions
      const testsResponse = await mockTestApi.getMyCandidateTests();
      if (testsResponse.success) {
        // Filter for general tests (those without interview_id or with interview_id = 0)
        const generalTestSessions = testsResponse.tests.filter(test => 
          !test.interviewId || test.interviewId === 0
        );
        // Convert to ExistingTest format
        const existingTests: ExistingTest[] = generalTestSessions.map(test => ({
          id: test.id,
          testLevel: test.testLevel,
          status: test.status,
          percentageScore: test.percentageScore,
          createdAt: test.createdAt,
          completedAt: test.completedAt
        }));
        setGeneralTests(existingTests);
      }
    } catch (err) {
      console.error('Error loading general progress:', err);
    }
  };

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
        console.log('[MOCK TEST] Loaded levels:', response.levels);
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

  const generateGeneralMockTest = async (testLevel: string) => {
    try {
      setGenerating(testLevel);
      setError(null);
      
      // Create a dummy interview for general tests
      const generalInterview = {
        id: 0, // Use 0 as a special ID for general tests
        jobTitle: 'General Technical Interview',
        jobDescription: 'General technical interview covering fundamental programming concepts, problem-solving, and best practices.',
        requirements: ['Programming fundamentals', 'Problem solving', 'Technical communication'],
        companyName: 'Practice Interview'
      };
      
      const response = await mockTestApi.generateTest(generalInterview.id, testLevel);
      
      if (response.success) {
        setCurrentSessionId(response.session.id);
        setCurrentView('session');
      } else {
        setError('Failed to generate practice test');
      }
    } catch (err: any) {
      console.error('Error generating practice test:', err);
      setError(err.message || 'Failed to generate practice test');
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
    // Reload progress to update the UI
    if (interviews.length === 0) {
      loadGeneralProgress();
    } else {
      loadTestLevels();
    }
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setCurrentSessionId(null);
    // Reload progress to update the UI
    if (interviews.length === 0) {
      loadGeneralProgress();
    } else if (selectedInterview) {
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
              Practice with general technical interview questions
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
                  onClick={() => setError(null)}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 underline font-jakarta"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* General Mock Tests */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
            General Practice Tests
          </h2>
          <p className="text-slate-600 font-jakarta mb-6">
            Take general mock tests to practice common interview questions. For personalized tests based on specific job requirements, accept interview invitations first.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['basic', 'moderate', 'complex'].map((level) => {
              const Icon = getLevelIcon(level);
              const progress = generalProgress[level];
              const existingTest = generalTests.find(t => t.testLevel === level && t.status === 'completed');
              const inProgress = generalTests.find(t => t.testLevel === level && t.status === 'in_progress');
              const hasCompleted = existingTest || (progress && progress.attempts > 0);
              const canRetake = !progress || progress.attempts < 3;
              
              // Calculate attempt count - count all completed tests for this level
              const completedTests = generalTests.filter(t => t.testLevel === level && t.status === 'completed');
              const attemptCount = Math.max(completedTests.length, progress?.attempts || 0);
              
              return (
                <div
                  key={level}
                  className="bg-white rounded-xl border-2 border-slate-200 hover:border-brand-main/30 hover:shadow-lg p-6 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getLevelColor(level)} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 font-jakarta capitalize">
                        {level} Level
                      </h3>
                      <p className="text-sm text-slate-600 font-jakarta">
                        {getLevelDescription(level)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Display */}
                  {hasCompleted && progress && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-800 font-jakarta">
                          Best Score: {progress.bestScore.toFixed(1)}%
                        </span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      
                      {/* Attempt History */}
                      <div className="space-y-1">
                        {progress.attempt1Score !== undefined && progress.attempt1Score !== null && (
                          <div className="text-xs text-green-600 font-jakarta flex justify-between">
                            <span>Attempt 1:</span>
                            <span>{progress.attempt1Score.toFixed(1)}%</span>
                          </div>
                        )}
                        {progress.attempt2Score !== undefined && progress.attempt2Score !== null && (
                          <div className="text-xs text-green-600 font-jakarta flex justify-between">
                            <span>Attempt 2:</span>
                            <span>{progress.attempt2Score.toFixed(1)}%</span>
                          </div>
                        )}
                        {progress.attempt3Score !== undefined && progress.attempt3Score !== null && (
                          <div className="text-xs text-green-600 font-jakarta flex justify-between">
                            <span>Attempt 3:</span>
                            <span>{progress.attempt3Score.toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-green-600 font-jakarta mt-2 pt-2 border-t border-green-200">
                        Total Attempts: {progress?.attempts || 1}/3
                        {existingTest && (
                          <span className="ml-2">
                            • Last completed: {new Date(existingTest.completedAt!).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* In Progress Display */}
                  {inProgress && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-blue-800 font-jakarta">
                          In Progress
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 font-jakarta mt-1">
                        Started on {new Date(inProgress.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {!hasCompleted && !inProgress && canRetake && (
                      <button
                        onClick={() => generateGeneralMockTest(level)}
                        disabled={generating === level}
                        className="w-full bg-brand-main hover:bg-brand-background text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generating === level ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Start Practice Test
                          </>
                        )}
                      </button>
                    )}

                    {inProgress && (
                      <button
                        onClick={() => continueMockTest(inProgress.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Continue Test
                      </button>
                    )}

                    {hasCompleted && (
                      <div className="space-y-2">
                        <button
                          onClick={() => viewResults((existingTest?.id || progress?.lastSessionId)!)}
                          className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          View Results
                        </button>
                        
                        {canRetake && (
                          <button
                            onClick={() => generateGeneralMockTest(level)}
                            disabled={generating === level}
                            className="w-full bg-brand-main/10 hover:bg-brand-main/20 text-brand-main px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {generating === level ? (
                              <>
                                <div className="w-4 h-4 border-2 border-brand-main border-t-transparent rounded-full animate-spin"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-4 h-4" />
                                Retake Test ({(progress?.attempts || 0) + 1}/3)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {!canRetake && (
                      <div className="text-center py-2">
                        <p className="text-sm text-slate-500 font-jakarta">
                          Maximum attempts reached (3/3)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info about interview-based tests */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 font-jakarta mb-1">
                Want Personalized Tests?
              </h3>
              <p className="text-sm text-blue-600 font-jakarta">
                Accept interview invitations to get mock tests tailored to specific job descriptions and requirements.
              </p>
            </div>
          </div>
        </div>
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
              const completed = existingTest?.status === 'completed' || level.completed;
              
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
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-800 font-jakarta">
                            Best Score: {level.bestScore?.toFixed(1) || existingTest.percentageScore.toFixed(1)}%
                          </span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        
                        {/* Attempt History */}
                        <div className="space-y-1">
                          {level.attempt1Score !== undefined && level.attempt1Score !== null && (
                            <div className="text-xs text-green-600 font-jakarta flex justify-between">
                              <span>Attempt 1:</span>
                              <span>{level.attempt1Score.toFixed(1)}%</span>
                            </div>
                          )}
                          {level.attempt2Score !== undefined && level.attempt2Score !== null && (
                            <div className="text-xs text-green-600 font-jakarta flex justify-between">
                              <span>Attempt 2:</span>
                              <span>{level.attempt2Score.toFixed(1)}%</span>
                            </div>
                          )}
                          {level.attempt3Score !== undefined && level.attempt3Score !== null && (
                            <div className="text-xs text-green-600 font-jakarta flex justify-between">
                              <span>Attempt 3:</span>
                              <span>{level.attempt3Score.toFixed(1)}%</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-green-600 font-jakarta mt-2 pt-2 border-t border-green-200">
                          Total Attempts: {level.attempts || 1}/3
                          <span className="ml-2">
                            • Last completed: {new Date(existingTest.completedAt!).toLocaleDateString()}
                          </span>
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
                        
                        {level.available && (level.attempts || 0) < 3 ? (
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
                                Retake Test ({(level.attempts || 0) + 1}/3)
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="text-center py-2">
                            <p className="text-sm text-slate-500 font-jakarta">
                              Maximum attempts reached (3/3)
                            </p>
                          </div>
                        )}
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