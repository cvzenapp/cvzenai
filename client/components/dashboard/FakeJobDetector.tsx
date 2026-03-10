import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, Loader2, AlertCircle, Copy } from 'lucide-react';
import { fakeJobDetectionApi, type JobDetectionResult } from '@/services/fakeJobDetectionApi';

export function FakeJobDetector() {
  const [jobText, setJobText] = useState('');
  const [result, setResult] = useState<JobDetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobText.trim()) {
      setError('Please paste a job posting to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Send the entire text as job_description
      const response = await fakeJobDetectionApi.analyzeJob({
        job_description: jobText
      });
      
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to analyze job posting');
      }
    } catch (err: any) {
      console.error('Fake job detection error:', err);
      // Extract error message properly
      const errorMessage = err?.message || err?.userMessage || 'An error occurred while analyzing the job';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setJobText('');
    setResult(null);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJobText(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">JD Trust Score</h2>
          <p className="text-sm text-gray-600">AI-powered fraud detection trained on 3000+ job postings</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Job Posting Text Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Paste Job Posting <span className="text-red-500">*</span>
            </label>
            <button
              onClick={handlePaste}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Paste from clipboard
            </button>
          </div>
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste the complete job posting here including title, company name, description, requirements, salary, location, etc..."
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Tip: Copy the entire job posting from the website and paste it here for best results
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAnalyze}
            disabled={loading || !jobText.trim()}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Analyze Job
              </>
            )}
          </button>

          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className={`border-2 rounded-lg p-6 ${
            result.isFake 
              ? 'bg-red-50 border-red-300' 
              : 'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-start gap-4">
              {result.isFake ? (
                <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  result.isFake ? 'text-red-900' : 'text-green-900'
                }`}>
                  {result.isFake ? '⚠️ Potential Fake Job' : '✓ Appears Legitimate'}
                </h3>

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-700">Confidence Score:</span>
                    <span className={`text-lg font-bold ${
                      result.isFake ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        result.isFake ? 'bg-red-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Analysis:</p>
                  <p className="text-sm text-gray-800">{result.reasoning}</p>
                </div>

                {result.redFlags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-2">Red Flags Detected:</p>
                    <ul className="space-y-1">
                      {result.redFlags.map((flag, idx) => (
                        <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.isFake && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-900 mb-1">⚠️ Recommendation:</p>
                    <p className="text-sm text-red-800">
                      Exercise caution with this job posting. Verify the company independently, 
                      never pay upfront fees, and be wary of requests for personal financial information.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
