import React, { useState, useEffect, useMemo } from 'react';
import { 
  Reward, 
  RewardStatus, 
  RewardBalance,
  formatRewardAmount,
  REFERRAL_CONSTANTS
} from '@shared/referrals';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  RefreshCw,
  Calendar,
  CreditCard,
  AlertCircle,
  Eye,
  Download,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RewardsDashboardProps {
  userId: string;
}

interface RewardsDashboardState {
  balance: RewardBalance | null;
  rewards: Reward[];
  paymentHistory: Reward[];
  loading: boolean;
  error: string | null;
  showPayoutModal: boolean;
  showReferralBreakdown: boolean;
  selectedReward: Reward | null;
  earningsChartData: any[];
  total: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 10;

export function RewardsDashboard({ userId }: RewardsDashboardProps) {
  const { toast } = useToast();
  const [state, setState] = useState<RewardsDashboardState>({
    balance: null,
    rewards: [],
    paymentHistory: [],
    loading: true,
    error: null,
    showPayoutModal: false,
    showReferralBreakdown: false,
    selectedReward: null,
    earningsChartData: [],
    total: 0,
    hasMore: false
  });

  // Fetch reward balance
  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/rewards/balance', {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, balance: data.data }));
      } else {
        throw new Error(data.error || 'Failed to fetch balance');
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load balance'
      }));
    }
  };

  // Fetch rewards data
  const fetchRewards = async (offset = 0) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch(`/api/rewards?limit=${ITEMS_PER_PAGE}&offset=${offset}`, {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rewards');
      }

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          rewards: data.data.rewards,
          total: data.data.total,
          hasMore: data.data.hasMore,
          loading: false
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch rewards');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      }));
      toast({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive"
      });
    }
  };

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch('/api/rewards/payments', {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, paymentHistory: data.data.rewards }));
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

  // Fetch earnings chart data
  const fetchEarningsChart = async () => {
    try {
      const response = await fetch('/api/rewards/earnings-chart', {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch earnings chart');
      }

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, earningsChartData: data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch earnings chart:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchBalance();
    fetchRewards();
    fetchPaymentHistory();
    fetchEarningsChart();
  }, []);

  // Handle payout request
  const handlePayoutRequest = async () => {
    if (!state.balance || state.balance.availableForPayout < REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD) {
      toast({
        title: "Payout Not Available",
        description: `Minimum payout amount is ${formatRewardAmount(REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD)}`,
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/rewards/request-payout', {
        method: 'POST',
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to request payout');
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Payout Requested",
          description: "Your payout request has been submitted and will be processed within 3-5 business days."
        });
        setState(prev => ({ ...prev, showPayoutModal: false }));
        fetchBalance();
        fetchPaymentHistory();
      } else {
        throw new Error(data.error || 'Failed to request payout');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to request payout',
        variant: "destructive"
      });
    }
  };

  // Handle view reward details
  const handleViewRewardDetails = (reward: Reward) => {
    setState(prev => ({
      ...prev,
      selectedReward: reward,
      showReferralBreakdown: true
    }));
  };

  // Status badge component
  const RewardStatusBadge = ({ status }: { status: RewardStatus }) => {
    const getVariant = (status: RewardStatus) => {
      switch (status) {
        case RewardStatus.PAID:
          return 'default';
        case RewardStatus.REVERSED:
          return 'destructive';
        case RewardStatus.EARNED:
          return 'secondary';
        default:
          return 'outline';
      }
    };

    const getLabel = (status: RewardStatus) => {
      switch (status) {
        case RewardStatus.PENDING:
          return 'Pending';
        case RewardStatus.EARNED:
          return 'Earned';
        case RewardStatus.PAID:
          return 'Paid';
        case RewardStatus.REVERSED:
          return 'Reversed';
        default:
          return status;
      }
    };

    return (
      <Badge variant={getVariant(status)} className="whitespace-nowrap">
        {getLabel(status)}
      </Badge>
    );
  };

  // Calculate progress to next payout
  const payoutProgress = useMemo(() => {
    if (!state.balance) return 0;
    return Math.min(
      (state.balance.availableForPayout / REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD) * 100,
      100
    );
  }, [state.balance]);

  // Summary cards
  const summaryCards = useMemo(() => {
    if (!state.balance) return [];

    return [
      {
        title: 'Total Earnings',
        value: formatRewardAmount(state.balance.totalEarnings),
        icon: DollarSign,
        color: 'text-green-600',
        description: 'All-time earnings'
      },
      {
        title: 'Available for Payout',
        value: formatRewardAmount(state.balance.availableForPayout),
        icon: Wallet,
        color: 'text-blue-600',
        description: 'Ready to withdraw'
      },
      {
        title: 'Pending Rewards',
        value: formatRewardAmount(state.balance.pendingRewards),
        icon: Clock,
        color: 'text-yellow-600',
        description: 'Awaiting confirmation'
      },
      {
        title: 'Paid Out',
        value: formatRewardAmount(state.balance.paidRewards),
        icon: CheckCircle2,
        color: 'text-green-600',
        description: 'Successfully paid'
      }
    ];
  }, [state.balance]);

  if (state.loading && !state.balance) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payout Progress */}
      {state.balance && state.balance.availableForPayout < REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Progress to Next Payout
            </CardTitle>
            <CardDescription>
              Minimum payout amount: {formatRewardAmount(REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current: {formatRewardAmount(state.balance.availableForPayout)}</span>
                <span>{payoutProgress.toFixed(1)}%</span>
              </div>
              <Progress value={payoutProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {formatRewardAmount(REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD - state.balance.availableForPayout)} more needed for payout
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Chart */}
      {state.earningsChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Earnings Over Time
            </CardTitle>
            <CardDescription>
              Your referral earnings by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={state.earningsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatRewardAmount(value), 'Earnings']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reward Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Reward Breakdown</CardTitle>
                <CardDescription>
                  Detailed view of your rewards by referral
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRewards()}
                disabled={state.loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referral</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.rewards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <DollarSign className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No rewards yet</p>
                          <p className="text-sm text-muted-foreground">
                            Start referring friends to earn rewards!
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.rewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div className="text-sm">
                            Referral #{reward.referralId}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatRewardAmount(reward.amount)}
                        </TableCell>
                        <TableCell>
                          <RewardStatusBadge status={reward.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(reward.earnedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRewardDetails(reward)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Your payout transaction history
                </CardDescription>
              </div>
              {state.balance && state.balance.availableForPayout >= REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD && (
                <Button
                  onClick={() => setState(prev => ({ ...prev, showPayoutModal: true }))}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Request Payout
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.paymentHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No payments yet</p>
                          <p className="text-sm text-muted-foreground">
                            Payments will appear here once processed
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    state.paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {formatRewardAmount(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {payment.paymentMethod || 'Bank Transfer'}
                        </TableCell>
                        <TableCell>
                          {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.transactionId || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Request Modal */}
      <Dialog open={state.showPayoutModal} onOpenChange={(open) => 
        setState(prev => ({ ...prev, showPayoutModal: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Available for Payout</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {state.balance ? formatRewardAmount(state.balance.availableForPayout) : '$0.00'}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Payout Details:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Processing time: 3-5 business days</li>
                <li>• Payment method: Bank transfer</li>
                <li>• No processing fees</li>
                <li>• You'll receive an email confirmation</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, showPayoutModal: false }))}
              >
                Cancel
              </Button>
              <Button onClick={handlePayoutRequest}>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reward Details Modal */}
      <Dialog open={state.showReferralBreakdown} onOpenChange={(open) => 
        setState(prev => ({ ...prev, showReferralBreakdown: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reward Details</DialogTitle>
          </DialogHeader>
          
          {state.selectedReward && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reward Amount</label>
                  <p className="text-lg font-bold">{formatRewardAmount(state.selectedReward.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <RewardStatusBadge status={state.selectedReward.status} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Earned Date</label>
                  <p className="font-medium">{new Date(state.selectedReward.earnedAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referral ID</label>
                  <p className="font-medium">#{state.selectedReward.referralId}</p>
                </div>
              </div>

              {state.selectedReward.paidAt && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Paid on {new Date(state.selectedReward.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                  {state.selectedReward.transactionId && (
                    <p className="text-xs text-green-700 mt-1">
                      Transaction ID: {state.selectedReward.transactionId}
                    </p>
                  )}
                </div>
              )}

              {state.selectedReward.reversedAt && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Reversed on {new Date(state.selectedReward.reversedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {state.selectedReward.reversalReason && (
                    <p className="text-xs text-red-700 mt-1">
                      Reason: {state.selectedReward.reversalReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}