/**
 * Referral Admin Panel Component
 * Comprehensive admin interface for managing the referrals system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Shield, 
  Users, 
  DollarSign,
  Play,
  Pause,
  Flag,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { ReferralStatus } from '../../shared/referrals';

interface AdminStats {
  totalReferrals: number;
  pendingApprovals: number;
  flaggedForReview: number;
  programStatus: 'active' | 'paused';
  totalRewards: number;
  pendingPayouts: number;
  fraudAlerts: number;
}

interface ProgramConfig {
  default_reward_amount: string;
  minimum_payout_threshold: string;
  referral_expiry_days: string;
  max_referrals_per_day: string;
  high_value_threshold: string;
  program_status: string;
  auto_approve_rewards: string;
  fraud_detection_enabled: string;
}

interface PendingApproval {
  id: number;
  referrer_name: string;
  referrer_email: string;
  referee_name: string;
  position_title: string;
  company_name: string;
  reward_amount: number;
  created_at: string;
}

interface FraudDetectionResult {
  suspiciousReferrals: SuspiciousReferral[];
  patterns: FraudPattern[];
  riskScore: number;
  recommendations: string[];
}

interface SuspiciousReferral {
  referralId: number;
  referrerId: number;
  referrerName: string;
  referrerEmail: string;
  riskFactors: string[];
  riskScore: number;
  flaggedAt: string;
}

interface FraudPattern {
  type: string;
  description: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
  affectedReferrals: number[];
}

export const ReferralAdminPanel: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [config, setConfig] = useState<ProgramConfig | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [fraudResults, setFraudResults] = useState<FraudDetectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReferrals, setSelectedReferrals] = useState<number[]>([]);

  // Fetch admin data
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, configRes, approvalsRes, fraudRes] = await Promise.all([
        fetch('/api/admin/referrals/stats'),
        fetch('/api/admin/referrals/config'),
        fetch('/api/admin/referrals/pending-approvals'),
        fetch('/api/admin/referrals/fraud-detection')
      ]);

      if (!statsRes.ok || !configRes.ok || !approvalsRes.ok || !fraudRes.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const [statsData, configData, approvalsData, fraudData] = await Promise.all([
        statsRes.json(),
        configRes.json(),
        approvalsRes.json(),
        fraudRes.json()
      ]);

      setStats(statsData.data);
      setConfig(configData.data);
      setPendingApprovals(approvalsData.data);
      setFraudResults(fraudData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Update program configuration
  const updateConfig = async (updates: Partial<ProgramConfig>) => {
    try {
      const response = await fetch('/api/admin/referrals/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update configuration');

      setConfig(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError('Failed to update configuration');
    }
  };

  // Approve or reject reward
  const processApproval = async (referralId: number, approved: boolean, notes?: string) => {
    try {
      const response = await fetch(`/api/admin/referrals/${referralId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, notes })
      });

      if (!response.ok) throw new Error('Failed to process approval');

      // Remove from pending approvals
      setPendingApprovals(prev => prev.filter(approval => approval.id !== referralId));
      
      // Refresh stats
      fetchAdminData();
    } catch (err) {
      setError('Failed to process approval');
    }
  };

  // Bulk update referral statuses
  const bulkUpdateStatus = async (newStatus: ReferralStatus, notes?: string) => {
    if (selectedReferrals.length === 0) return;

    try {
      const response = await fetch('/api/admin/referrals/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralIds: selectedReferrals,
          newStatus,
          notes
        })
      });

      if (!response.ok) throw new Error('Failed to bulk update');

      setSelectedReferrals([]);
      fetchAdminData();
    } catch (err) {
      setError('Failed to bulk update referrals');
    }
  };

  // Toggle program status
  const toggleProgramStatus = async (reason?: string) => {
    if (!stats) return;

    const newStatus = stats.programStatus === 'active' ? 'paused' : 'active';

    try {
      const response = await fetch('/api/admin/referrals/program-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (!response.ok) throw new Error('Failed to update program status');

      setStats(prev => prev ? { ...prev, programStatus: newStatus } : null);
    } catch (err) {
      setError('Failed to update program status');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAdminData}>Retry</Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Referral Admin Panel</h1>
          <p className="text-gray-600">Manage and monitor the referral program</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={stats?.programStatus === 'active' ? 'destructive' : 'default'}
            onClick={() => toggleProgramStatus()}
          >
            {stats?.programStatus === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Program
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume Program
              </>
            )}
          </Button>
          <Button onClick={fetchAdminData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Program Status Alert */}
      {stats?.programStatus === 'paused' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">Referral Program is Currently Paused</span>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalRewards)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fraud Alerts</p>
                  <p className="text-2xl font-bold">{stats.fraudAlerts}</p>
                </div>
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="approvals">
            Pending Approvals
            {stats && stats.pendingApprovals > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="fraud">
            Fraud Detection
            {stats && stats.fraudAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.fraudAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Program Configuration
              </CardTitle>
              <CardDescription>
                Configure referral program settings and thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {config && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="defaultReward">Default Reward Amount ($)</Label>
                    <Input
                      id="defaultReward"
                      type="number"
                      step="0.01"
                      value={config.default_reward_amount}
                      onChange={(e) => updateConfig({ default_reward_amount: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payoutThreshold">Minimum Payout Threshold ($)</Label>
                    <Input
                      id="payoutThreshold"
                      type="number"
                      step="0.01"
                      value={config.minimum_payout_threshold}
                      onChange={(e) => updateConfig({ minimum_payout_threshold: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiryDays">Referral Expiry (Days)</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      value={config.referral_expiry_days}
                      onChange={(e) => updateConfig({ referral_expiry_days: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPerDay">Max Referrals Per Day</Label>
                    <Input
                      id="maxPerDay"
                      type="number"
                      value={config.max_referrals_per_day}
                      onChange={(e) => updateConfig({ max_referrals_per_day: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="highValueThreshold">High Value Threshold ($)</Label>
                    <Input
                      id="highValueThreshold"
                      type="number"
                      step="0.01"
                      value={config.high_value_threshold}
                      onChange={(e) => updateConfig({ high_value_threshold: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoApprove"
                      checked={config.auto_approve_rewards === 'true'}
                      onCheckedChange={(checked) => 
                        updateConfig({ auto_approve_rewards: checked.toString() })
                      }
                    />
                    <Label htmlFor="autoApprove">Auto-approve rewards below threshold</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="fraudDetection"
                      checked={config.fraud_detection_enabled === 'true'}
                      onCheckedChange={(checked) => 
                        updateConfig({ fraud_detection_enabled: checked.toString() })
                      }
                    />
                    <Label htmlFor="fraudDetection">Enable fraud detection</Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reward Approvals</CardTitle>
              <CardDescription>
                High-value rewards requiring manual approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No pending approvals</p>
                ) : (
                  pendingApprovals.map((approval) => (
                    <div key={approval.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{approval.referee_name}</h3>
                          <p className="text-sm text-gray-600">
                            {approval.position_title} at {approval.company_name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Referred by: {approval.referrer_name} ({approval.referrer_email})
                          </p>
                          <p className="text-lg font-bold text-green-600 mt-2">
                            {formatCurrency(approval.reward_amount)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => processApproval(approval.id, true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => processApproval(approval.id, false)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Fraud Detection Dashboard
              </CardTitle>
              <CardDescription>
                Automated fraud detection and suspicious activity monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fraudResults && (
                <div className="space-y-6">
                  {/* Risk Score */}
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">
                      <span className={fraudResults.riskScore > 70 ? 'text-red-600' : fraudResults.riskScore > 40 ? 'text-yellow-600' : 'text-green-600'}>
                        {fraudResults.riskScore}%
                      </span>
                    </div>
                    <p className="text-gray-600">Overall Risk Score</p>
                  </div>

                  {/* Fraud Patterns */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Detected Patterns</h3>
                    <div className="space-y-3">
                      {fraudResults.patterns.length === 0 ? (
                        <p className="text-gray-500">No suspicious patterns detected</p>
                      ) : (
                        fraudResults.patterns.map((pattern, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{pattern.description}</h4>
                                <p className="text-sm text-gray-600">
                                  {pattern.count} occurrences • {pattern.affectedReferrals.length} referrals affected
                                </p>
                              </div>
                              <Badge className={getSeverityColor(pattern.severity)}>
                                {pattern.severity.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {fraudResults.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Recommendations</h3>
                      <ul className="space-y-2">
                        {fraudResults.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <span className="text-sm">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Perform bulk operations on multiple referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="referralIds">Referral IDs (comma-separated)</Label>
                  <Input
                    id="referralIds"
                    placeholder="1, 2, 3, 4, 5"
                    value={selectedReferrals.join(', ')}
                    onChange={(e) => {
                      const ids = e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                      setSelectedReferrals(ids);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={(value) => bulkUpdateStatus(value as ReferralStatus)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="interviewed">Interviewed</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    disabled={selectedReferrals.length === 0}
                    onClick={() => bulkUpdateStatus(ReferralStatus.REJECTED, 'Bulk rejection')}
                  >
                    Bulk Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};