import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

export default function InterviewConfirmation() {
  const { interviewId, action } = useParams<{ interviewId: string; action: 'accept' | 'decline' }>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processInterviewConfirmation = async () => {
      try {
        // Check if user is logged in
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          // User is not logged in, redirect to login with return URL
          const returnUrl = encodeURIComponent(`/dashboard/interview/${interviewId}/${action}`);
          navigate(`/login?returnUrl=${returnUrl}&message=Please log in to ${action} the interview invitation`);
          return;
        }

        // Make API call to confirm interview
        const response = await fetch(`/api/interviews/${interviewId}/${action}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Success - redirect to dashboard with success message
          const message = action === 'accept' 
            ? 'Interview invitation accepted successfully!' 
            : 'Interview invitation declined';
          
          toast({
            title: "Success",
            description: message,
            variant: "default"
          });
          
          navigate('/dashboard?tab=interviews');
        } else if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          const returnUrl = encodeURIComponent(`/dashboard/interview/${interviewId}/${action}`);
          navigate(`/login?returnUrl=${returnUrl}&message=Please log in to ${action} the interview invitation`);
        } else {
          // Other error
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          toast({
            title: "Error",
            description: errorData.error || `Failed to ${action} interview invitation`,
            variant: "destructive"
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error processing interview confirmation:', error);
        toast({
          title: "Error",
          description: `Failed to ${action} interview invitation`,
          variant: "destructive"
        });
        navigate('/dashboard');
      } finally {
        setIsProcessing(false);
      }
    };

    if (interviewId && action && (action === 'accept' || action === 'decline')) {
      processInterviewConfirmation();
    } else {
      navigate('/dashboard');
    }
  }, [interviewId, action, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Interview {action === 'accept' ? 'Acceptance' : 'Decline'}
          </h2>
          <p className="text-gray-600">
            Please wait while we process your response...
          </p>
        </div>
      </div>
    );
  }

  return null;
}