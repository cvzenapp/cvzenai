import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingUp, Rocket } from 'lucide-react';
import type { SubscriptionPlan } from '@shared/subscription';

interface JobSeekerPlanSelectorProps {
  currentPlanId?: string;
  onSelectPlan: (planId: string, billingCycle: 'monthly' | 'yearly') => void;
}

export function JobSeekerPlanSelector({ currentPlanId, onSelectPlan }: JobSeekerPlanSelectorProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'basic',
      displayName: 'Basic',
      userType: 'candidate',
      priceMonthly: 0,
      priceYearly: 0,
      features: {
        resume_builder: true,
        basic_templates: true,
        pdf_export: true
      },
      limits: {
        resumes: 3,
        ai_improvements_monthly: 5,
        job_applications_monthly: 10
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pro',
      name: 'pro',
      displayName: 'Pro',
      userType: 'candidate',
      priceMonthly: 49900,
      priceYearly: 499000,
      features: {
        unlimited_resumes: true,
        premium_templates: true,
        ai_resume_optimization: true,
        ats_scoring: true,
        cover_letter_generator: true
      },
      limits: {
        resumes: -1,
        ai_improvements_monthly: 50,
        job_applications_monthly: 100
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'premium',
      name: 'premium',
      displayName: 'Premium',
      userType: 'candidate',
      priceMonthly: 99900,
      priceYearly: 999000,
      features: {
        all_pro_features: true,
        unlimited_ai_improvements: true,
        priority_support: true,
        interview_preparation: true,
        job_matching_ai: true,
        career_coaching: true
      },
      limits: {
        resumes: -1,
        ai_improvements_monthly: -1,
        job_applications_monthly: -1
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
      basic: Zap,
      pro: TrendingUp,
      premium: Rocket
    };
    return icons[planName] || Zap;
  };

  const getPlanColor = (planName: string) => {
    const colors: Record<string, string> = {
      basic: 'from-gray-500 to-gray-700',
      pro: 'from-[#1891db] to-[#0a0a37]',
      premium: 'from-[#0a0a37] to-[#1891db]'
    };
    return colors[planName] || 'from-[#1891db] to-[#0a0a37]';
  };

  const getPlanFeatures = (plan: SubscriptionPlan) => {
    const features: string[] = [];
    
    if (plan.limits.resumes === -1) {
      features.push('Unlimited resumes');
    } else {
      features.push(`${plan.limits.resumes} resumes`);
    }
    
    if (plan.limits.ai_improvements_monthly === -1) {
      features.push('Unlimited AI improvements');
    } else {
      features.push(`${plan.limits.ai_improvements_monthly} AI improvements/month`);
    }
    
    if (plan.limits.job_applications_monthly === -1) {
      features.push('Unlimited job applications');
    } else {
      features.push(`${plan.limits.job_applications_monthly} job applications/month`);
    }
    
    if (plan.features.premium_templates) {
      features.push('Premium templates');
    } else if (plan.features.basic_templates) {
      features.push('Basic templates');
    }
    
    if (plan.features.ats_scoring) {
      features.push('ATS scoring');
    }
    
    if (plan.features.cover_letter_generator) {
      features.push('Cover letter generator');
    }
    
    if (plan.features.interview_preparation) {
      features.push('Interview preparation');
    }
    
    if (plan.features.job_matching_ai) {
      features.push('AI job matching');
    }
    
    if (plan.features.career_coaching) {
      features.push('Career coaching');
    }
    
    if (plan.features.priority_support) {
      features.push('Priority support');
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const gradientColor = getPlanColor(plan.name);
          const price = billingCycle === 'monthly' ? plan.priceMonthly : (plan.priceYearly || plan.priceMonthly * 10);
          const isCurrentPlan = currentPlanId === plan.id;
          const isFree = plan.priceMonthly === 0;
          const features = getPlanFeatures(plan);

          return (
            <Card
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`relative cursor-pointer transition-all ${
                selectedPlanId === plan.id ? 'border-[#1891db] border-2 shadow-lg ring-2 ring-[#1891db]/20' : ''
              } ${isCurrentPlan ? 'border-[#0a0a37] border-2 shadow-lg' : ''
              } ${plan.name === 'pro' && !selectedPlanId ? 'border-[#1891db] border-2 shadow-lg' : ''} hover:shadow-xl`}
            >
              {plan.name === 'pro' && (
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
                  {isFree ? (
                    <div className="text-3xl font-bold">Free</div>
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
