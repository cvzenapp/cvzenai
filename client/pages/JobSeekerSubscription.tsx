import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CreditCard, BarChart3, Package } from 'lucide-react';
import { JobSeekerPlanSelector } from '@/components/subscription/JobSeekerPlanSelector';
import { JobSeekerUsageTracker } from '@/components/subscription/JobSeekerUsageTracker';
import { JobSeekerSubscriptionDashboard } from '@/components/subscription/JobSeekerSubscriptionDashboard';
import { subscriptionApi } from '@/services/subscriptionApi';
import type { UserSubscription, SubscriptionUsage } from '@shared/subscription';

export default function JobSeekerSubscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    loadSubscriptionData();
  }, [userId, navigate]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const subData = await subscriptionApi.getUserSubscription(userId.toString());
      setSubscription(subData);
      
      if (subData) {
        const usageData = await subscriptionApi.getUserUsage(userId.toString());
        setUsage(usageData);
      }
    } catch (err: any) {
      console.error('Error loading subscription:', err);
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        setSubscription(null);
        setUsage([]);
      } else {
        setError(err.message || 'Failed to load subscription data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
    try {
      setLoading(true);
      
      const result = await subscriptionApi.createUserSubscription({
        userId,
        planId,
        billingCycle
      });
      
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else if (result.subscription) {
        await loadSubscriptionData();
      }
    } catch (err: any) {
      console.error('Error selecting plan:', err);
      setError(err.message || 'Failed to select plan');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Subscription</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadSubscriptionData}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-gray-600">
          Manage your subscription, track usage, and view billing history
        </p>
      </div>

      {!subscription ? (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Choose Your Plan</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Select a subscription plan to unlock premium features and accelerate your job search.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <JobSeekerPlanSelector onSelectPlan={handleSelectPlan} />
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>
                  Your active plan and subscription details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-lg">{subscription.plan?.displayName}</h3>
                      <p className="text-sm text-gray-600">
                        {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/subscription/plans')}>
                      Change Plan
                    </Button>
                  </div>

                  <JobSeekerUsageTracker subscription={subscription} usage={usage} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics</CardTitle>
                <CardDescription>
                  Detailed breakdown of your feature usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <JobSeekerUsageTracker subscription={subscription} usage={usage} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <JobSeekerSubscriptionDashboard 
              userId={userId.toString()} 
              subscription={subscription} 
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
