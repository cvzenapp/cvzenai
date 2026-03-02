import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingUp, Rocket, Building2 } from 'lucide-react';
import type { SubscriptionPlan } from '@shared/subscription';

interface RecruiterPlanSelectorProps {
  currentPlanId?: string;
  onSelectPlan: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
}

export function RecruiterPlanSelector({ currentPlanId, onSelectPlan }: RecruiterPlanSelectorProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'starter',
      displayName: 'Starter',
      userType: 'recruiter',
      priceMonthly: 199900,
      priceYearly: 1999000,
      features: {
        active_job_postings: true,
        ai_candidate_screening: true,
        ai_jd_generation: true,
        bulk_application_management: true
      },
      limits: {
        job_postings: 5,
        ai_screening_monthly: 100,
        jd_generation_monthly: 20
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'growth',
      name: 'growth',
      displayName: 'Growth',
      userType: 'recruiter',
      priceMonthly: 499900,
      priceYearly: 4999000,
      features: {
        active_job_postings: true,
        ai_candidate_screening: true,
        unlimited_jd_generation: true,
        analytics_dashboard: true,
        bulk_batch_screening: true
      },
      limits: {
        job_postings: 25,
        ai_screening_monthly: 500,
        jd_generation_monthly: -1
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'scale',
      name: 'scale',
      displayName: 'Scale',
      userType: 'recruiter',
      priceMonthly: 999900,
      priceYearly: 9999000,
      features: {
        unlimited_job_postings: true,
        unlimited_screening: true,
        api_access_webhooks: true,
        white_label_option: true,
        priority_support: true
      },
      limits: {
        job_postings: -1,
        ai_screening_monthly: -1,
        jd_generation_monthly: -1
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'enterprise',
      name: 'enterprise',
      displayName: 'Enterprise',
      userType: 'recruiter',
      priceMonthly: 0,
      priceYearly: 0,
      features: {
        all_scale_features: true,
        private_local_deployment: true,
        custom_integrations: true,
        sla_support: true,
        dedicated_account_manager: true
      },
      limits: {
        job_postings: -1,
        ai_screening_monthly: -1,
        jd_generation_monthly: -1,
        resume_parsing_monthly: -1
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price / 100);
  };

  const getPlanIcon = (planName: string) => {
    const icons: Record<string, any> = {
      starter: Zap,
      growth: TrendingUp,
      scale: Rocket,
      enterprise: Building2
    };
    return icons[planName] || Zap;
  };

  const getPlanColor = (planName: string) => {
    const colors: Record<string, string> = {
      starter: 'from-[#1891db] to-[#0a0a37]',
      growth: 'from-[#1891db] to-[#cfe2f3]',
      scale: 'from-[#0a0a37] to-[#1891db]',
      enterprise: 'from-gray-700 to-gray-900'
    };
    return colors[planName] || 'from-[#1891db] to-[#0a0a37]';
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features: string[] = [];
    
    if (plan.limits.job_postings === -1) {
      features.push('Unlimited job postings');
    } else {
      features.push(`${plan.limits.job_postings} active job postings`);
    }
    
    if (plan.limits.ai_screening_monthly === -1) {
      features.push('Unlimited AI screening');
    } else {
      features.push(`${plan.limits.ai_screening_monthly} AI screenings/month`);
    }
    
    if (plan.limits.jd_generation_monthly === -1) {
      features.push('Unlimited JD generation');
    } else {
      features.push(`${plan.limits.jd_generation_monthly} JD generations/month`);
    }
    
    if (plan.features.analytics_dashboard) {
      features.push('Analytics dashboard');
    }
    
    if (plan.features.api_access_webhooks) {
      features.push('API access & webhooks');
    }
    
    if (plan.features.white_label_option) {
      features.push('White-label option');
    }
    
    if (plan.features.priority_support) {
      features.push('Priority support');
    }
    
    if (plan.features.dedicated_account_manager) {
      features.push('Dedicated account manager');
    }
    
    if (plan.features.custom_integrations) {
      features.push('Custom integrations');
    }
    
    if (plan.features.sla_support) {
      features.push('SLA support');
    }
    
    return features;
  };

  const handleSelectPlan = (planId: string) => {
    if (loading || currentPlanId === planId) return;
    setSelectedPlanId(planId);
  };

  const handleSubscribe = () => {
    if (!selectedPlanId || loading) return;
    setLoading(true);
    onSelectPlan(selectedPlanId, billingCycle);
  };

  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant={billingCycle === 'monthly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('monthly')}
          className={billingCycle === 'monthly' ? 'bg-[#1891db] hover:bg-[#0a0a37]' : ''}
        >
          Monthly
        </Button>
        <Button
          variant={billingCycle === 'yearly' ? 'default' : 'outline'}
          onClick={() => setBillingCycle('yearly')}
          className={`relative ${billingCycle === 'yearly' ? 'bg-[#1891db] hover:bg-[#0a0a37]' : ''}`}
        >
          Yearly
          <Badge className="ml-2 bg-green-500 hover:bg-green-500">Save 17%</Badge>
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const gradientColor = getPlanColor(plan.name);
          const price = billingCycle === 'monthly' ? plan.priceMonthly : (plan.priceYearly || plan.priceMonthly * 10);
          const isCurrentPlan = currentPlanId === plan.id;
          const isEnterprise = plan.name === 'enterprise';
          const features = getPlanFeatures(plan);

          return (
            <Card
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`relative cursor-pointer transition-all ${
                selectedPlanId === plan.id ? 'border-[#1891db] border-2 shadow-lg ring-2 ring-[#1891db]/20' : ''
              } ${isCurrentPlan ? 'border-[#0a0a37] border-2 shadow-lg' : ''
              } ${plan.name === 'growth' && !selectedPlanId ? 'border-[#1891db] border-2 shadow-lg' : ''} hover:shadow-xl`}
            >
              {plan.name === 'growth' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#1891db] text-white border-0">Most Popular</Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-[#0a0a37] text-white border-0">Current Plan</Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 bg-gradient-to-r ${gradientColor} rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{plan.displayName}</CardTitle>
                </div>
                
                <div className="mt-4">
                  {isEnterprise ? (
                    <div className="text-3xl font-bold">Custom</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{formatPrice(price)}</div>
                      <div className="text-sm text-gray-500">
                        per {billingCycle === 'monthly' ? 'month' : 'year'}
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Subscribe Button */}
      {selectedPlanId && (
        <div className="flex justify-center mt-6">
          <Button
            size="lg"
            className="bg-[#1891db] hover:bg-[#0a0a37] text-white px-12 py-6 text-lg"
            disabled={loading}
            onClick={handleSubscribe}
          >
            {loading ? 'Processing...' : 'Subscribe Now'}
          </Button>
        </div>
      )}
    </div>
  );
}
