import { useState, useEffect } from 'react';
import { X, Sparkles, TrendingUp, AlertCircle, CheckCircle, XCircle, MinusCircle, Loader2 } from 'lucide-react';
import { aiScreeningApi, ScreeningResult } from '@/services/aiScreeningApi';

interface AIScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: any[];
  onScreeningComplete?: (results: ScreeningResult[]) => void;
  initialJobRequirements?: string;
}

export function AIScreeningModal({ 
  isOpen, 
  onClose, 
  candidates,
  onScreeningComplete,
  initialJobRequirements 
}: AIScreeningModalProps) {
  const [jobRequirements, setJobRequirements] = useState(initialJobRequirements || '');
  const [isScreening, setIsScreening] = useState(false);
  const [results, setResults] = useState<ScreeningResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: candidates.length, percentage: 0 });

  // Update job requirements when initialJobRequirements changes
  useEffect(() => {
    if (initialJobRequirements) {
      setJobRequirements(initialJobRequirements);
    }
  }, [initialJobRequirements]);

  if (!isOpen) return null;

  const handleScreen = async () => {
    setIsScreening(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: candidates.length, percentage: 0 });
    
    try {
      await aiScreeningApi.screenCandidatesStreaming(
        candidates,
        jobRequirements || undefined,
        (event) => {
          console.log('Streaming event:', event);

          switch (event.type) {
            case 'progress':
              setProgress({
                current: 0,
                total: candidates.length,
                percentage: 0
              });
              break;

            case 'batch':
              setResults(prev => {
                const newResults = [...prev, ...event.data.results];
                const processedCount = newResults.length;
                const percentage = Math.round((processedCount / candidates.length) * 100);
                
                setProgress({
                  current: processedCount,
                  total: candidates.length,
                  percentage
                });
                
                return newResults;
              });
              break;

            case 'batch_error':
              console.error(`Batch ${event.data.batchNumber} failed:`, event.data.error);
              break;

            case 'complete':
              setResults(event.data.results);
              setProgress({
                current: event.data.results.length,
                total: candidates.length,
                percentage: 100
              });
              onScreeningComplete?.(event.data.results);
              break;

            case 'error':
              setError(event.data.error);
              break;
          }
        }
      );
    } catch (err: any) {
      setError(err.message || 'Failed to screen candidates');
    } finally {
      setIsScreening(false);
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'Highly Recommended':
        return 'text-green-600 bg-green-50';
      case 'Recommended':
        return 'text-blue-600 bg-blue-50';
      case 'Maybe':
        return 'text-yellow-600 bg-yellow-50';
      case 'Not Recommended':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'Highly Recommended':
        return <CheckCircle className="w-5 h-5" />;
      case 'Recommended':
        return <TrendingUp className="w-5 h-5" />;
      case 'Maybe':
        return <MinusCircle className="w-5 h-5" />;
      case 'Not Recommended':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-normal text-gray-900">
                AI-Powered Candidate Screening
              </h2>
              {/* <p className="text-sm text-gray-500">
                Screening {candidates.length} candidates using AI
              </p> */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!results.length && !isScreening ? (
            <div className="space-y-6">
              {/* Job Requirements Input */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Job Requirements (Optional)
                </label>
                <textarea
                  value={jobRequirements}
                  onChange={(e) => setJobRequirements(e.target.value)}
                  placeholder="e.g., Looking for a Senior Full Stack Developer with 5+ years experience in React, Node.js, and AWS. Must have strong problem-solving skills and experience with microservices architecture."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                  disabled={isScreening}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Provide specific requirements to get more accurate screening results
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-normal mb-1">How AI Screening Works</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Fetches all candidates from the database automatically</li>
                      <li>Processes candidates in batches of 5 for optimal performance</li>
                      <li>Analyzes skills, experience, and projects against 30,000+ examples</li>
                      <li>Scores each candidate from 0-100</li>
                      <li>Provides strengths, concerns, and recommendations</li>
                      <li>Results stream in real-time as batches complete</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      <p className="font-normal">Screening Failed</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isScreening ? (
            <div className="space-y-6">
              {/* Progress Indicator */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  <h3 className="text-lg font-normal text-gray-900">
                    Screening in Progress...
                  </h3>
                </div>
                
                {progress.total > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Screened {progress.current} of {progress.total} candidates</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 text-center mt-4">
                  Processing candidates in batches to ensure quality results...
                </p>
              </div>

              {/* Partial Results */}
              {results.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-normal text-gray-900">
                    Results So Far ({results.length} candidates)
                  </h4>
                  {results
                    .sort((a, b) => b.score - a.score)
                    .map((result) => (
                      <div
                        key={result.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h5 className="font-normal text-gray-900">{result.name}</h5>
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('recruiter_token') || localStorage.getItem('authToken');
                                    const response = await fetch(`/api/ai-screening/resume-url/${result.id}`, {
                                      headers: { 'Authorization': `Bearer ${token}` }
                                    });
                                    const data = await response.json();
                                    if (data.success && data.data.resumeUrl) {
                                      window.open(data.data.resumeUrl, '_blank');
                                    }
                                  } catch (error) {
                                    console.error('Failed to fetch resume URL:', error);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-normal text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Go to CV
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{result.reasoning}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <div className="text-right">
                              <div className="text-2xl font-normal text-gray-900">{result.score}</div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getRecommendationColor(result.recommendation)}`}>
                              {getRecommendationIcon(result.recommendation)}
                              <span className="text-sm font-normal whitespace-nowrap">
                                {result.recommendation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Results Summary */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-normal text-gray-900 mb-2">Screening Complete</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-normal text-green-600">
                      {results.filter(r => r.recommendation === 'Highly Recommended').length}
                    </div>
                    <div className="text-xs text-gray-600">Highly Recommended</div>
                  </div>
                  <div>
                    <div className="text-2xl font-normal text-blue-600">
                      {results.filter(r => r.recommendation === 'Recommended').length}
                    </div>
                    <div className="text-xs text-gray-600">Recommended</div>
                  </div>
                  <div>
                    <div className="text-2xl font-normal text-yellow-600">
                      {results.filter(r => r.recommendation === 'Maybe').length}
                    </div>
                    <div className="text-xs text-gray-600">Maybe</div>
                  </div>
                  <div>
                    <div className="text-2xl font-normal text-red-600">
                      {results.filter(r => r.recommendation === 'Not Recommended').length}
                    </div>
                    <div className="text-xs text-gray-600">Not Recommended</div>
                  </div>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-3">
                {results
                  .sort((a, b) => b.score - a.score)
                  .map((result) => (
                    <div
                      key={result.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-normal text-gray-900">{result.name}</h4>
                            <button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem('recruiter_token') || localStorage.getItem('authToken');
                                  const response = await fetch(`/api/ai-screening/resume-url/${result.id}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                  });
                                  const data = await response.json();
                                  if (data.success && data.data.resumeUrl) {
                                    window.open(data.data.resumeUrl, '_blank');
                                  }
                                } catch (error) {
                                  console.error('Failed to fetch resume URL:', error);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-normal text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Go to CV
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{result.reasoning}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            <div className="text-2xl font-normal text-gray-900">{result.score}</div>
                            <div className="text-xs text-gray-500">Score</div>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getRecommendationColor(result.recommendation)}`}>
                            {getRecommendationIcon(result.recommendation)}
                            <span className="text-sm font-normal whitespace-nowrap">
                              {result.recommendation}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {result.strengths && result.strengths.length > 0 && (
                          <div>
                            <div className="text-xs font-normal text-gray-700 mb-1.5">Strengths</div>
                            <ul className="space-y-1">
                              {result.strengths.map((strength, idx) => (
                                <li key={idx} className="text-sm text-green-700 flex items-start gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.concerns && result.concerns.length > 0 && (
                          <div>
                            <div className="text-xs font-normal text-gray-700 mb-1.5">Concerns</div>
                            <ul className="space-y-1">
                              {result.concerns.map((concern, idx) => (
                                <li key={idx} className="text-sm text-orange-700 flex items-start gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                  <span>{concern}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isScreening}
          >
            {results.length ? 'Close' : 'Cancel'}
          </button>
          
          {!results.length && !isScreening && (
            <button
              onClick={handleScreen}
              disabled={isScreening}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Screen with AI
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
