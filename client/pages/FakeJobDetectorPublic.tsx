import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Info, Sparkles, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '@/components/AuthModal';

interface DetectionResult {
  isFake: boolean;
  confidence: number;
  reasoning: string;
  redFlags: string[];
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

interface PublicStats {
  totalAnalyses: number;
  fakeJobsDetected: number;
  legitimateJobs: number;
  avgConfidence: number;
  highRiskCount: number;
  avgDurationMs: number;
}

export default function FakeJobDetectorPublic() {
  const navigate = useNavigate();
  const [jobPosting, setJobPosting] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    fetchRateLimitStatus();
    fetchStats();
    
    // Add blob animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes blob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      .animate-blob {
        animation: blob 7s infinite;
      }
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      .animation-delay-4000 {
        animation-delay: 4s;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/public/fake-job-detection/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchRateLimitStatus = async () => {
    try {
      const response = await fetch('/api/public/fake-job-detection/rate-limit-status');
      const data = await response.json();
      if (data.success) {
        setRateLimitInfo(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rate limit status:', err);
    }
  };

  const parseJobPosting = (text: string) => {
    // Simple parser to extract job details from pasted text
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      title: lines[0] || '',
      description: text,
      location: '',
      salary_range: '',
      company_profile: '',
      requirements: '',
      benefits: '',
      employment_type: '',
      required_experience: '',
      required_education: '',
      department: '',
      industry: '',
      function: ''
    };
  };

  const handleAnalyze = async () => {
    if (!jobPosting.trim()) {
      setError('Please paste a job posting to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const jobData = parseJobPosting(jobPosting);
      
      const response = await fetch('/api/public/fake-job-detection/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(data.message || 'Rate limit exceeded. Please try again later.');
          const retryAfter = response.headers.get('Retry-After');
          if (retryAfter) {
            setError(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
          }
        } else {
          setError(data.message || 'Failed to analyze job posting');
        }
        return;
      }

      if (data.success) {
        setResult(data.data);
        fetchRateLimitStatus();
        fetchStats(); // Refresh stats after analysis
      } else {
        setError(data.message || 'Failed to analyze job posting');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (confidence: number) => {
    if (confidence >= 61) return 'text-red-600 bg-red-50 border-red-200';
    if (confidence >= 31) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskIcon = (confidence: number) => {
    if (confidence >= 61) return <XCircle className="w-6 h-6" />;
    if (confidence >= 31) return <AlertTriangle className="w-6 h-6" />;
    return <CheckCircle className="w-6 h-6" />;
  };

  const getRiskLabel = (confidence: number) => {
    if (confidence >= 61) return 'High Risk - Likely Fake';
    if (confidence >= 31) return 'Medium Risk - Exercise Caution';
    return 'Low Risk - Appears Legitimate';
  };

  const handleAuthSuccess = () => {
    setIsAuthModalOpen(false);
    // Redirect to dashboard after successful auth
    navigate('/dashboard');
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img 
                src="/assets/cvzen_logo.png" 
                alt="CVZen Logo" 
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              <button 
                onClick={openLoginModal}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                Login
              </button>
              <button 
                onClick={openSignupModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Hero with Analysis Interface */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full mb-4">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI-Powered Fraud Detection</span>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Fake Job Detector
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            Paste any job posting below and get instant AI analysis to detect fraud patterns
          </p>

          {/* AI Capabilities Background */}
          <div className="max-w-3xl mx-auto mb-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {stats ? stats.totalAnalyses.toLocaleString() : '0'}
                </h3>
                <p className="text-xs text-slate-600">Jobs Analyzed</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {stats ? stats.fakeJobsDetected.toLocaleString() : '0'}
                </h3>
                <p className="text-xs text-slate-600">Scams Detected</p>
              </div>
              
              <div className="flex flex-col items-center text-center p-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">
                  {stats ? `${Math.round((stats.fakeJobsDetected / Math.max(stats.totalAnalyses, 1)) * 100)}%` : '0%'}
                </h3>
                <p className="text-xs text-slate-600">Detection Rate</p>
              </div>
            </div>
          </div>

          {/* Stats Counter */}
          {stats && stats.totalAnalyses > 0 && (
            <div className="flex items-center justify-center gap-8 text-sm text-slate-600 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Powered by AI</span>
              </div>
              <div className="w-1 h-4 bg-slate-300" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Instant Results</span>
              </div>
            </div>
          )}
        </div>

        {/* Rate Limit Info */}
        {rateLimitInfo && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between text-sm">
            <span className="text-slate-700">
              <strong>{rateLimitInfo.remaining}</strong> of {rateLimitInfo.limit} free analyses remaining
            </span>
            <span className="text-slate-500">Resets hourly</span>
          </div>
        )}

        {/* Analysis Interface */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mb-6">
          <textarea
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            placeholder="Paste the complete job posting here..."
            className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-slate-700"
            disabled={loading}
          />
          
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {jobPosting.length.toLocaleString()} characters
            </span>
            <button
              onClick={handleAnalyze}
              disabled={loading || !jobPosting.trim() || (rateLimitInfo?.remaining === 0)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Analyze
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 mb-6">
            {/* Risk Badge */}
            <div className={`p-5 rounded-lg border-2 mb-5 ${getRiskColor(result.confidence)}`}>
              <div className="flex items-center gap-3 mb-3">
                {getRiskIcon(result.confidence)}
                <div className="flex-1">
                  <h3 className="text-lg font-bold">
                    {getRiskLabel(result.confidence)}
                  </h3>
                  <p className="text-sm opacity-90">
                    Confidence: {result.confidence}%
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Analysis</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{result.reasoning}</p>
            </div>

            {/* Red Flags */}
            {result.redFlags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">
                  Red Flags ({result.redFlags.length})
                </h4>
                <ul className="space-y-2">
                  {result.redFlags.map((flag, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Simple Stats */}
        {stats && stats.totalAnalyses === 0 && (
          <div className="text-center py-6 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Be the first to analyze a job posting!
            </p>
          </div>
        )}

        {/* Footer CTA */}
        <div className="text-center py-8 border-t border-slate-200">
          <p className="text-slate-600 mb-4">
            Want unlimited analyses?
          </p>
          <button 
            onClick={openSignupModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Create Free Account
          </button>
        </div>

        {/* Disclaimer */}
        <div className="max-w-3xl mx-auto mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-700 mb-2">Important Disclaimer</p>
              <p className="mb-2">
                This AI-powered tool provides fraud probability assessments for awareness purposes only. Results are not 100% accurate and should not be considered definitive proof of fraud. Always conduct your own due diligence before applying to any job posting.
              </p>
              <p className="mb-2">
                <span className="font-medium text-slate-700">Data Collection:</span> We store partial job content (job title and first 500 characters of description), analysis results, and anonymized metadata (IP address, user agent) to improve our AI model and provide statistics. No personally identifiable information is collected.
              </p>
              <p>
                <span className="font-medium text-slate-700">Limitations:</span> AI analysis may produce false positives or miss sophisticated scams. Use this tool as one of many resources in your job search safety toolkit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultMode={authModalMode}
      />
    </div>
  );
}
