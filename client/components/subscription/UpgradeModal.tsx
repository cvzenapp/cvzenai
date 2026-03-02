import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Zap } from 'lucide-react';
import { subscriptionApi } from '@/services/subscriptionApi';
import type { SubscriptionPlan } from '@shared/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
  requiredPlan?: string;
  feature?: string;
  onSuccess?: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  requiredPlan,
  feature,
  onSuccess
}: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const plans: Record<string, { name: string; price: string; features: string[] }> = {
    pro: {
      name: 'Pro',
      price: '₹149/month',
      features: [
        'AI-powered job matching',
        'Priority search visibility',
        'Resume optimization suggestions',
        'Unlimited template customization',
        'All free features'
      ]
    },
    starter: {
      name: 'Starter',
      price: '₹1,999/month',
      features: [
        '5 active job postings',
        'AI candidate screening (100/mo)',
        'AI job description generation (20/mo)',
        'Resume parsing (100/mo)',
        'ATS scoring & improvement'
      ]
    },
    growth: {
      name: 'Growth',
      price: '₹4,999/month',
      features: [
        '25 active job postings',
        'AI screening (500/mo)',
        'Unlimited JD generation',
        'Resume parsing (500/mo)',
        'Analytics dashboard',
        'Bulk batch screening'
      ]
    },
    scale: {
      name: 'Scale',
      price: '₹9,999/month',
      features: [
        'Unlimited job postings',
        'Unlimited screening & parsing',
        'API access',
        'White-label option',
        'Priority support'
      ]
    }
  };

  const targetPlan = requiredPlan && plans[requiredPlan] ? plans[requiredPlan] : plans.pro;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError('');
      
      // In production, integrate with payment gateway (Razorpay/Stripe)
      // For now, just change the plan
      await subscriptionApi.changePlan(requiredPlan as any);
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-brand-main" />
            Upgrade Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {feature && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>{feature}</strong> requires {targetPlan.name} plan or higher
              </p>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-normal">{targetPlan.name}</h3>
              <div className="text-2xl font-normal text-brand-main">
                {targetPlan.price}
              </div>
            </div>

            <ul className="space-y-2 mb-6">
              {targetPlan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleUpgrade}
                className="flex-1 bg-brand-main hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            No credit card required for free trial. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
