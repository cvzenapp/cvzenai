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
    
    </div>
  );
};