import React, { useState } from 'react';
import { interviewApi } from '../../services/interviewApi';

export const InterviewTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testCreateInterview = async () => {
    setLoading(true);
    try {
      const response = await interviewApi.createInterview({
        candidateId: 1,
        resumeId: 1,
        title: 'Test Interview',
        description: 'This is a test interview',
        interviewType: 'video_call',
        proposedDatetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 60
      });
      setResult(`Success: Interview created with ID ${response.interviewId}`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetInterviews = async () => {
    setLoading(true);
    try {
      const interviews = await interviewApi.getMyInterviews();
      setResult(`Success: Found ${interviews.length} interviews`);
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Interview API Test</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-4">
          <button
            onClick={testCreateInterview}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Create Interview
          </button>
          
          <button
            onClick={testGetInterviews}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Test Get Interviews
          </button>
        </div>
        
        {result && (
          <div className={`p-3 rounded ${
            result.startsWith('Success') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
};