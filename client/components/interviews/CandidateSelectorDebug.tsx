import React, { useState } from 'react';
import { shortlistApi } from '../../services/shortlistApi';
import { CandidateSelector } from './CandidateSelector';

interface Candidate {
  id: number;
  name: string;
  email: string;
  resumeId: number;
  resumeTitle: string;
  source: 'shortlist' | 'application' | 'search';
  avatar?: string;
  skills?: string[];
  experience?: string;
  upvotes?: number;
}

export const CandidateSelectorDebug: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testShortlistAPI = async () => {
    setLoading(true);
    setDebugInfo('Testing shortlist API...\n');
    
    try {
      // Check authentication first
      const authToken = localStorage.getItem('recruiter_token') || localStorage.getItem('authToken');
      setDebugInfo(prev => prev + `Auth token exists: ${!!authToken}\n`);
      setDebugInfo(prev => prev + `Token preview: ${authToken ? authToken.substring(0, 20) + '...' : 'null'}\n`);
      
      // Test the API call
      const response = await shortlistApi.getMyShortlist();
      setDebugInfo(prev => prev + `API Response: ${JSON.stringify(response, null, 2)}\n`);
      
      if (response.success && response.data) {
        setDebugInfo(prev => prev + `Found ${response.data.length} shortlisted candidates\n`);
        response.data.forEach((resume, index) => {
          setDebugInfo(prev => prev + `Candidate ${index + 1}: ${resume.candidate.name} (${resume.candidate.email})\n`);
        });
      } else {
        setDebugInfo(prev => prev + 'No candidates found or API failed\n');
      }
    } catch (error: any) {
      setDebugInfo(prev => prev + `Error: ${error.message}\n`);
      console.error('Debug test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserType = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userType = user.type || 'unknown';
    setDebugInfo(prev => prev + `Current user type: ${userType}\n`);
    setDebugInfo(prev => prev + `User data: ${JSON.stringify(user, null, 2)}\n`);
  };

  return (
    <div className="p-6 bg-white rounded-lg border space-y-6">
      <h3 className="text-lg font-semibold">Candidate Selector Debug</h3>
      
      {/* Debug Controls */}
      <div className="flex space-x-4">
        <button
          onClick={testShortlistAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Shortlist API'}
        </button>
        
        <button
          onClick={checkUserType}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Check User Type
        </button>
        
        <button
          onClick={() => setDebugInfo('')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Debug
        </button>
      </div>

      {/* Debug Output */}
      {debugInfo && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Debug Output:</h4>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      {/* Actual Candidate Selector */}
      <div>
        <h4 className="font-medium mb-2">Candidate Selector:</h4>
        <CandidateSelector
          selectedCandidate={selectedCandidate}
          onCandidateSelect={setSelectedCandidate}
          placeholder="Choose a candidate to test"
        />
        
        {selectedCandidate && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <h5 className="font-medium text-green-900">Selected Candidate:</h5>
            <pre className="text-sm text-green-800 mt-1">
              {JSON.stringify(selectedCandidate, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};