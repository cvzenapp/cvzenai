import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecruiterPlanSelector } from '@/components/subscription/RecruiterPlanSelector';
import { subscriptionApi } from '@/services/subscriptionApi';

export default function RecruiterSubscriptionPlans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const recruiterData = localStorage.getItem('recruiter_user');
  const recruiter = recruiterData ? JSON.parse(recruiterData) : null;

  const handleSelectPlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!recruiter?.id) {
      alert('Please log in to subscribe');
      navigate('/recruiter/login');
      return;
    }

    try {
      setLoading(true);
      
      const result = await subscriptionApi.createCompanySubscription({
        companyId: recruiter.id,
        planId,
        billingCycle
      });
      
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else if (result.subscription) {
        navigate('/recruiter/dashboard');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      alert('Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-slate-900 border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/recruiter/dashboard')}
            className="text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <img 
            src="/assets/cvzen_logo.png" 
            alt="CVZen Logo" 
            className="h-9 w-auto"
          />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select a subscription plan to unlock premium features and grow your recruiting business
          </p>
        </div>

        <RecruiterPlanSelector onSelectPlan={handleSelectPlan} />
      </div>
    </div>
  );
}
