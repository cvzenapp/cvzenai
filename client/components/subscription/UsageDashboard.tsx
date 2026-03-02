import { useState, useEffect } from 'react';
import { subscriptionApi } from '@/services/subscriptionApi';
import type { SubscriptionUsage, UserSubscription, CompanySubscription } from '@shared/subscription';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp } from 'lucide-react';

export function UsageDashboard() {
  const [subscription, setSubscription] = useState<UserSubscription | CompanySubscription | null>(null);
  const [usage, setUsage] = useState<Record<string, SubscriptionUsage>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sub, stats] = await Promise.all([
        subscriptionApi.getCurrentSubscription(),
        subscriptionApi.getUsageStats()
      ]);
      
      setSubscription(sub);
      setUsage(stats);
    } catch (error) {
      console.error('Failed to load usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 rounded"></div>
          <div className="h-8 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-slate-600">No active subscription</p>
      </div>
    );
  }

  const getUsagePercentage = (featureKey: string): number => {
    const limit = subscription.plan?.limits[featureKey];
    const current = usage[featureKey]?.usageCount || 0;
    
    if (!limit || limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const limits = subscription.plan?.limits || {};

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-normal text-slate-900">Usage & Limits</h3>
            <p className="text-sm text-slate-600 mt-1">
              Current Plan: <span className="font-medium">{subscription.plan?.displayName}</span>
            </p>
          </div>
          <TrendingUp className="h-5 w-5 text-slate-400" />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {Object.entries(limits).map(([featureKey, limit]) => {
          const current = usage[featureKey]?.usageCount || 0;
          const percentage = getUsagePercentage(featureKey);
          const isUnlimited = limit === -1;
          const isNearLimit = percentage >= 75;

          return (
            <div key={featureKey}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {featureKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm text-slate-600">
                  {isUnlimited ? (
                    <span className="text-green-600">Unlimited</span>
                  ) : (
                    <>
                      {current.toLocaleString()} / {limit.toLocaleString()}
                    </>
                  )}
                </span>
              </div>
              
              {!isUnlimited && (
                <>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                  
                  {isNearLimit && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-yellow-600">
                      <AlertCircle className="h-3 w-3" />
                      <span>Approaching limit</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {Object.keys(limits).length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            No usage limits for your plan
          </p>
        )}
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          Usage resets on: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
