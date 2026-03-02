import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobSeekerPlanSelector } from '@/components/subscription/JobSeekerPlanSelector';
import { subscriptionApi } from '@/services/subscriptionApi';

export default function JobSeekerSubscriptionPlans() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;

  const handleSelectPlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    if (!user?.id) {
      alert('Please log in to subscribe');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      
      const result = await subscriptionApi.createUserSubscription({
        userId: user.id,
        planId,
        billingCycle
      });
      
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else if (result.subscription) {
        navigate('/dashboard');
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
      <header className="border-b bg-slate-900 border-slate-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Unlock premium features and boost your job search
          </p>
        </div>

        <JobSeekerPlanSelector onSelectPlan={handleSelectPlan} />
      </div>
    </div>
  );
}
