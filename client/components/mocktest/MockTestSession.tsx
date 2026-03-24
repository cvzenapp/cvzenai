import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight,
  Save,
  Send,
  Timer
} from 'lucide-react';
import { mockTestApi, MockTestSession as MockTestSessionData, Question } from '../../services/mockTestApi';

interface MockTestSessionProps {
  sessionId: number;
  onComplete: (sessionId: number) => void;
  onBack: () => void;
}

export const MockTestSession: React.FC<MockTestSessionProps> = ({ 
  sessionId, 
  onComplete, 
  onBack 
}) => {
  const [session, setSession] = useState<MockTestSessionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get session details
      const sessionResponse = await mockTestApi.getSession(sessionId);
      
      if (!sessionResponse.success) {
        setError('Failed to load test session');
        return;
      }

      setSession(sessionResponse.session);
      
      // For dynamic generation, get the first question
      await loadNextQuestion();
      
      // Set total questions from session
      setTotalQuestions(sessionResponse.session.totalQuestions);
      
      // Calculate time remaining
      if (sessionResponse.session.startedAt) {
        const startTime = new Date(sessionResponse.session.startedAt).getTime();
        const duration = sessionResponse.session.durationMinutes * 60 * 1000;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
        setTimeRemaining(remaining);
      } else {
        // If not started, use full duration
        const fullDuration = sessionResponse.session.durationMinutes * 60;
        setTimeRemaining(fullDuration);
      }
      
    } catch (err: any) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load test session');
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async () => {
    try {
      const response = await fetch(`/api/mock-tests/session/${sessionId}/next-question`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('recruiter_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error?.includes('All questions have been generated')) {
          // Test is complete
          handleSubmit();
          return;
        }
        throw new Error('Failed to load next question');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const transformedQuestion = {
          id: data.question.id,
          question: data.question.questionText,
          type: data.question.questionType === 'mcq' ? 'multiple_choice' : 
                data.question.questionType === 'coding' ? 'coding' : 'short_answer',
          options: data.question.options?.map((opt: any) => opt.text) || undefined
        };
        
        setQuestions([transformedQuestion]);
        setCurrentQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
      } else {
        setError('No more questions available');
      }
      
    } catch (err: any) {
      console.error('Error loading next question:', err);
      setError(err.message || 'Failed to load next question');
    }
  };

  const handleAnswerChange = async (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Submit answer immediately and get next question
    try {
      await fetch(`/api/mock-tests/session/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('recruiter_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId,
          answer
        })
      });

      // Load next question after a short delay
      setTimeout(async () => {
        if (currentQuestionNumber < totalQuestions) {
          await loadNextQuestion();
        } else {
          // All questions answered, complete the test
          handleSubmit();
        }
      }, 1000);

    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const saveProgress = async () => {
    // Progress is automatically saved when answers are submitted
    // This function can be used for manual save if needed
    console.log('Progress saved automatically');
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await mockTestApi.submitTest(sessionId, answers);
      
      if (response.success) {
        onComplete(sessionId);
      } else {
        setError('Failed to submit test');
      }
    } catch (err: any) {
      console.error('Error submitting test:', err);
      setError(err.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) {
      return "0:00";
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 600) return 'text-green-600'; // > 10 minutes
    if (timeRemaining > 300) return 'text-yellow-600'; // > 5 minutes
    return 'text-red-600'; // < 5 minutes
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
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

  if (!session || !questions || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-2">
          No Test Data
        </h3>
        <p className="text-slate-600 font-jakarta mb-4">
          Unable to load test questions.
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

  const currentQuestion = questions[0]; // Always use the first (and only) question
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (currentQuestionNumber / totalQuestions) * 100 : 0;

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
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${getTimeColor()}`}>
            <Timer className="w-4 h-4" />
            <span className="font-mono font-semibold">
              {formatTime(timeRemaining)}
            </span>
          </div>
          
          <button
            onClick={saveProgress}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Progress
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-slate-900 font-jakarta">
            {session.testLevel.charAt(0).toUpperCase() + session.testLevel.slice(1)} Level Test
          </h2>
          <span className="text-sm text-slate-600 font-jakarta">
            {currentQuestionNumber} of {totalQuestions} answered
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-brand-main h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500 font-jakarta">
            Question {currentQuestionNumber} of {totalQuestions}
          </span>
          <span className="text-sm text-slate-500 font-jakarta">
            {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 font-jakarta mb-4">
          {currentQuestion.question}
        </h3>

        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-brand-main/30 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="text-brand-main focus:ring-brand-main"
                />
                <span className="text-slate-700 font-jakarta">{option}</span>
              </label>
            ))}
          </div>
        )}

        {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'coding') && (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
            placeholder="Type your answer here..."
            rows={currentQuestion.type === 'coding' ? 10 : 4}
            className="w-full p-3 border border-slate-200 rounded-lg focus:border-brand-main focus:ring-brand-main/20 focus:ring-2 focus:outline-none font-jakarta resize-none"
            style={currentQuestion.type === 'coding' ? { fontFamily: 'monospace' } : {}}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:border-brand-main/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tests
        </button>

        <div className="text-sm text-slate-600">
          Question {currentQuestionNumber} of {totalQuestions}
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-brand-main hover:bg-brand-background text-white px-6 py-2 rounded-lg font-semibold font-jakarta transition-colors"
        >
          <Send className="w-4 h-4" />
          Complete Test
        </button>
      </div>
    </div>
  );
};