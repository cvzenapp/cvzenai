import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  AlertTriangle,
  Brain,
  Save
} from 'lucide-react';
import { mockTestApi, MockTestSession, MockTestQuestion } from '../services/mockTestApi';

export const MockTestSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<MockTestSession | null>(null);
  const [questions, setQuestions] = useState<MockTestQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadSession();
    }
  }, [sessionId]);

  useEffect(() => {
    if (session && session.status === 'in_progress') {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const expires = new Date(session.expiresAt).getTime();
        const remaining = Math.max(0, expires - now);
        
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          handleAutoSubmit();
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [sessionResponse, questionsResponse] = await Promise.all([
        mockTestApi.getSession(parseInt(sessionId!)),
        mockTestApi.getQuestions(parseInt(sessionId!))
      ]);
      
      if (sessionResponse.success && questionsResponse.success) {
        setSession(sessionResponse.session);
        setQuestions(questionsResponse.questions);
        
        // If test is completed, redirect to results
        if (sessionResponse.session.status === 'completed') {
          navigate(`/mock-test/results/${sessionId}`);
          return;
        }
        
        // Calculate time remaining
        const now = new Date().getTime();
        const expires = new Date(sessionResponse.session.expiresAt).getTime();
        setTimeRemaining(Math.max(0, expires - now));
      } else {
        setError('Failed to load test session');
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load test session');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const saveAnswer = async (questionId: number, answer: string | string[]) => {
    try {
      await mockTestApi.submitAnswer(parseInt(sessionId!), questionId, answer);
    } catch (err: any) {
      console.error('Error saving answer:', err);
      // Don't show error to user for auto-save failures
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    
    if (currentAnswer !== undefined) {
      saveAnswer(currentQuestion.id, currentAnswer);
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionJump = (index: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    
    if (currentAnswer !== undefined) {
      saveAnswer(currentQuestion.id, currentAnswer);
    }
    
    setCurrentQuestionIndex(index);
  };

  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);
      
      // Save all answers first
      const savePromises = Object.entries(answers).map(([questionId, answer]) =>
        saveAnswer(parseInt(questionId), answer)
      );
      
      await Promise.all(savePromises);
      
      // Complete the test
      await mockTestApi.completeTest(parseInt(sessionId!));
      
      // Navigate to results
      navigate(`/mock-test/results/${sessionId}`);
      
    } catch (err: any) {
      console.error('Error submitting test:', err);
      setError(err.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (session?.status === 'in_progress') {
      await handleSubmitTest();
    }
  };

  const formatTime = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = (): number => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-brand-main/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-brand-main border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm text-slate-600 font-jakarta">Loading test session...</p>
        </div>
      </div>
    );
  }

  if (error || !session || !questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 font-jakarta mb-2">
            Unable to Load Test
          </h2>
          <p className="text-slate-600 font-jakarta mb-4">
            {error || 'Test session not found or has expired.'}
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

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/mock-test/${session.interviewId}`)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-main to-brand-background rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 font-jakarta capitalize">
                    {session.testLevel} Level Mock Test
                  </h1>
                  <p className="text-sm text-slate-600 font-jakarta">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300000 ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-semibold">
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 font-jakarta">
                  {getAnsweredCount()}/{questions.length} answered
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-brand-main h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sticky top-24">
              <h3 className="font-semibold text-slate-900 font-jakarta mb-4">Questions</h3>
              <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                {questions.map((question, index) => {
                  const isAnswered = answers[question.id] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <button
                      key={question.id}
                      onClick={() => handleQuestionJump(index)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold font-jakarta transition-colors ${
                        isCurrent
                          ? 'bg-brand-main text-white'
                          : isAnswered
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowSubmitConfirm(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors flex items-center justify-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Submit Test
                </button>
              </div>
            </div>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-brand-main/10 text-brand-main px-3 py-1 rounded-full text-sm font-semibold font-jakarta">
                    {currentQuestion.questionType.toUpperCase()}
                  </span>
                  {currentQuestion.questionCategory && (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-jakarta">
                      {currentQuestion.questionCategory}
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-500 font-jakarta">
                  {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Question Text */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
                  {currentQuestion.questionText}
                </h2>
              </div>

              {/* Answer Input */}
              <div className="mb-8">
                {currentQuestion.questionType === 'mcq' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={(answers[currentQuestion.id] as string[] || []).includes(option.id)}
                          onChange={(e) => {
                            const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
                            const newAnswers = e.target.checked
                              ? [...currentAnswers, option.id]
                              : currentAnswers.filter(id => id !== option.id);
                            handleAnswerChange(currentQuestion.id, newAnswers);
                          }}
                          className="mt-1 w-4 h-4 text-brand-main border-slate-300 rounded focus:ring-brand-main"
                        />
                        <span className="text-slate-700 font-jakarta flex-1">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {currentQuestion.questionType === 'single_selection' && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option.id}
                          checked={answers[currentQuestion.id] === option.id}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="mt-1 w-4 h-4 text-brand-main border-slate-300 focus:ring-brand-main"
                        />
                        <span className="text-slate-700 font-jakarta flex-1">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(currentQuestion.questionType === 'objective' || currentQuestion.questionType === 'coding') && (
                  <div>
                    <textarea
                      value={(answers[currentQuestion.id] as string) || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder={
                        currentQuestion.questionType === 'coding'
                          ? 'Write your code here...'
                          : 'Type your answer here...'
                      }
                      className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-main focus:border-transparent resize-none font-jakarta"
                      style={currentQuestion.questionType === 'coding' ? { fontFamily: 'monospace' } : {}}
                    />
                    <p className="text-sm text-slate-500 font-jakarta mt-2">
                      {currentQuestion.questionType === 'coding'
                        ? 'Provide a complete solution with proper syntax and comments.'
                        : 'Provide a detailed answer explaining your reasoning.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-jakarta"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  {/* Auto-save indicator */}
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-jakarta">
                    <Save className="w-4 h-4" />
                    Auto-saved
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={isLastQuestion}
                    className="flex items-center gap-2 bg-brand-main hover:bg-brand-background text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
              Submit Test?
            </h3>
            <p className="text-slate-600 font-jakarta mb-6">
              You have answered {getAnsweredCount()} out of {questions.length} questions. 
              Once submitted, you cannot make changes to your answers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold font-jakarta transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Test'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};