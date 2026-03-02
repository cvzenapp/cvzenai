import React, { useState } from 'react';
import { recruiterInterviewApi } from '../../services/recruiterInterviewApi';
import { interviewApi } from '../../services/interviewApi';

export const InterviewAuthTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testRecruiterAuth = async () => {
    setLoading(true);
    try {
      // Check what tokens are available
      const recruiterToken = localStorage.getItem('recruiter_token');
      const authToken = localStorage.getItem('authToken');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const recruiterUser = JSON.parse(localStorage.getItem('recruiter_user') || '{}');

      setResult(`Auth Status:
Recruiter Token: ${recruiterToken ? 'Present (' + recruiterToken.substring(0, 20) + '...)' : 'Missing'}
Auth Token: ${authToken ? 'Present (' + authToken.substring(0, 20) + '...)' : 'Missing'}
User Type: ${user.type || 'Unknown'}
Recruiter Email: ${recruiterUser.email || 'Unknown'}

Testing recruiter interview API...`);

      const interviews = await recruiterInterviewApi.getMyInterviews();
      setResult(prev => prev + `\n✅ Recruiter API Success: Found ${interviews.length} interviews`);
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Recruiter API Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testJobSeekerAuth = async () => {
    setLoading(true);
    try {
      setResult('Testing job seeker interview API...');
      const interviews = await interviewApi.getMyInterviews();
      setResult(prev => prev + `\n✅ Job Seeker API Success: Found ${interviews.length} interviews`);
    } catch (error: any) {
      setResult(prev => prev + `\n❌ Job Seeker API Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg border space-y-4">
      <h3 className="text-lg font-semibold">Interview Authentication Test</h3>
      
      <div className="flex space-x-4">
        <button
          onClick={testRecruiterAuth}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Recruiter API
        </button>
        
        <button
          onClick={testJobSeekerAuth}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Job Seeker API
        </button>
        
        <button
          onClick={() => setResult('')}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};