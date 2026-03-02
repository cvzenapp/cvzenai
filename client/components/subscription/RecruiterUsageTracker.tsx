import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Briefcase, Brain, FileText, TrendingUp } from 'lucide-react';
import type { SubscriptionUsage, CompanySubscription } from '@shared/subscription';

interface RecruiterUsageTrackerProps {
  subscription: CompanySubscription;
  usage: SubscriptionUsage[];
}

export function RecruiterUsageTracker({ subscription, usage }: RecruiterUsageTrackerProps) {
  const getUsageForFeature = (featureKey: string): number => {
    const featureUsage = usage.find(u => u.featureKey === featureKey);
    return featureUsage?.usageCount || 0;
  };

  const getLimitForFeature = (featureKey: string): number => {
    const limits = subscription.plan?.limits || {};
    return limits[featureKey] || 0;
  };

  const calculatePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100;
    return Math.min((used / limit) * 100, 100);
  };

  const isNearLimit = (used: number, limit: number): boolean => {
    if (limit === -1) return false;
    return used >= limit * 0.8;
  };

  const features = [
    {
      key: 'job_postings',
      label: 'Active Job Postings',
      icon: Briefcase,
      color: 'blue'
    },
    {
      key: 'ai_screening_monthly',
      label: 'AI Screenings',
      icon: Brain,
      color: 'purple'
    },
    {
      key: 'jd_generation_monthly',
      label: 'JD Generations',
      icon: FileText,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Usage This Period</h3>
        <Badge variant="outline">
          {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => {
          const used = getUsageForFeature(feature.key);
          const limit = getLimitForFeature(feature.key);
          const percentage = calculatePercentage(used, limit);
          const nearLimit = isNearLimit(used, limit);
          const Icon = feature.icon;
          const isUnlimited = limit === -1;

          return (
            <Card key={feature.key} className={nearLimit ? 'border-amber-300' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 bg-${feature.color}-100 rounded-lg`}>
                      <Icon className={`w-4 h-4 text-${feature.color}-600`} />
                    </div>
                    <CardTitle className="text-sm font-medium">{feature.label}</CardTitle>
                  </div>
                  {nearLimit && !isUnlimited && (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">{used}</span>
                    <span className="text-sm text-gray-500">
                      {isUnlimited ? 'Unlimited' : `of ${limit}`}
                    </span>
                  </div>
                  
                  {!isUnlimited && (
                    <>
                      <Progress 
                        value={percentage} 
                        className={nearLimit ? 'bg-amber-100' : ''}
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{percentage.toFixed(0)}% used</span>
                        {nearLimit && (
                          <span className="text-amber-600 font-medium">Near limit</span>
                        )}
                      </div>
                    </>
                  )}
                  
                  {isUnlimited && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      <span>Unlimited usage</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Warning if any feature is near limit */}
      {features.some(f => isNearLimit(getUsageForFeature(f.key), getLimitForFeature(f.key))) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900">Approaching Usage Limits</h4>
                <p className="text-sm text-amber-700 mt-1">
                  You're approaching your monthly limits. Consider upgrading your plan for unlimited access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
