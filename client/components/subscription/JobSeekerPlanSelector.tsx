import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { subscriptionApi } from '@/services/subscriptionApi';
import type { SubscriptionPlan } from '@shared/subscription';

interface JobSeekerPlanSelectorProps {
  onSelectPlan: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
}

export function JobSeekerPlanSelector({ onSelectPlan }: JobSeekerPlanSelectorProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const data = await subscriptionApi.getPlans('candidate');
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceMonthly: number, priceYearly?: number) => {
    const price = billingCycle === 'yearly' && priceYearly ? priceYearly : priceMonthly;
    if (price === 0) return 'Free';
    
    const amount = price / 100;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    onSelectPlan(planId, billingCycle);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-muted p-1 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white text-[#1891db] shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              billingCycle === 'yearly'
                ? 'bg-white text-[#1891db] shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Yearly
            <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
              Save 20%
            </Badge>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isSelected = selectedPlanId === plan.id;
          const isFree = plan.priceMonthly === 0;
          
          return (
            <Card
              key={plan.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-[#1891db] shadow-lg' : ''
              }`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              {plan.name === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#1891db] hover:bg-[#1891db]">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                <CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(plan.priceMonthly, plan.priceYearly)}
                    </span>
                    {!isFree && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(plan.features).map(([key, value]) => {
                    if (typeof value === 'boolean' && value) {
                      const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{label}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                  className={`w-full ${
                    isSelected
                      ? 'bg-[#1891db] hover:bg-[#1891db]/90'
                      : 'bg-[#0a0a37] hover:bg-[#0a0a37]/90'
                  }`}
                  disabled={isSelected}
                >
                  {isSelected ? 'Selected' : isFree ? 'Get Started' : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
