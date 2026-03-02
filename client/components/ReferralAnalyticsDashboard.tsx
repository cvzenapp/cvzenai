/**
 * Referral Analytics Dashboard Component
 * Displays comprehensive analytics and reporting for the referrals system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target, 
  Download,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { ReferralStatus } from '../../shared/referrals';

interface ReferralAnalytics {
  totalReferrals: number;
  conversionRate: number;
  totalRewards: number;
  averageRewardAmount: number;
  referralsByStatus: Record<ReferralStatus, number>;
  monthlyTrends: MonthlyTrend[];
  topPerformingCompanies: CompanyPerformance[];
  averageTimeToHire: number;
}

interface ConversionFunnel {
  pending: { count: number; percentage: number };
  contacted: { count: number; percentage: number; dropOffFromPrevious: number };
  interviewed: { count: number; percentage: number; dropOffFromPrevious: number };
  hired: { count: number; percentage: number; dropOffFromPrevious: number };
  rejected: { count: number; percentage: number };
  expired: { count: number; percentage: number };
  declined: { count: number; percentage: number };
}

interface TopReferrer {
  userId: number;
  userName: string;
  userEmail: string;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  totalEarnings: number;
  pendingRewards: number;
  paidRewards: number;
  averageRewardAmount: number;
  lastReferralDate: string;
}

interface MonthlyTrend {
  month: string;
  year: number;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  totalRewards: number;
}

interface CompanyPerformance {
  companyName: string;
  totalReferrals: number;
  successfulReferrals: number;
  conversionRate: number;
  averageTimeToHire: number;
}

interface RealTimeData {
  totalReferralsToday: number;
  totalReferralsThisWeek: number;
  totalReferralsThisMonth: number;
  pendingReferrals: number;
  recentActivity: any[];
}

interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  companyName?: string;
  status?: ReferralStatus[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export const ReferralAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [conversionFunnel, setConversionFunnel] = useState<ConversionFunnel | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.companyName) queryParams.append('companyName', filters.companyName);
      if (filters.status) {
        filters.status.forEach(status => queryParams.append('status', status));
      }

      const [analyticsRes, funnelRes, referrersRes, realTimeRes] = await Promise.all([
        fetch(`/api/analytics/referrals?${queryParams}`),
        fetch(`/api/analytics/conversion-funnel?${queryParams}`),
        fetch(`/api/analytics/top-referrers?${queryParams}&limit=10`),
        fetch('/api/analytics/real-time')
      ]);

      if (!analyticsRes.ok || !funnelRes.ok || !referrersRes.ok || !realTimeRes.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const [analyticsData, funnelData, referrersData, realTimeDataRes] = await Promise.all([
        analyticsRes.json(),
        funnelRes.json(),
        referrersRes.json(),
        realTimeRes.json()
      ]);

      setAnalytics(analyticsData.data);
      setConversionFunnel(funnelData.data);
      setTopReferrers(referrersData.data);
      setRealTimeData(realTimeDataRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
      if (filters.companyName) queryParams.append('companyName', filters.companyName);
      if (filters.status) {
        filters.status.forEach(status => queryParams.append('status', status));
      }

      const response = await fetch(`/api/analytics/export?${queryParams}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `referrals-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  // Update filters
  const updateFilters = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAnalytics}>Retry</Button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Prepare chart data
  const statusChartData = analytics ? Object.entries(analytics.referralsByStatus).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    count,
    fill: COLORS[Object.keys(analytics.referralsByStatus).indexOf(status) % COLORS.length]
  })) : [];

  const funnelChartData = conversionFunnel ? [
    { name: 'Pending', value: conversionFunnel.pending.count, percentage: conversionFunnel.pending.percentage },
    { name: 'Contacted', value: conversionFunnel.contacted.count, percentage: conversionFunnel.contacted.percentage },
    { name: 'Interviewed', value: conversionFunnel.interviewed.count, percentage: conversionFunnel.interviewed.percentage },
    { name: 'Hired', value: conversionFunnel.hired.count, percentage: conversionFunnel.hired.percentage }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Referral Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your referral program performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilters({ dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilters({ dateTo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="companyName">Company</Label>
              <Input
                id="companyName"
                placeholder="Filter by company..."
                value={filters.companyName || ''}
                onChange={(e) => updateFilters({ companyName: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time metrics */}
      {realTimeData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold">{realTimeData.totalReferralsToday}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold">{realTimeData.totalReferralsThisWeek}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold">{realTimeData.totalReferralsThisMonth}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{realTimeData.pendingReferrals}</p>
                </div>
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main analytics */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                  <p className="text-2xl font-bold">{analytics.totalReferrals}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(analytics.conversionRate)}</p>
                </div>
                <Target className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalRewards)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Time to Hire</p>
                  <p className="text-2xl font-bold">{analytics.averageTimeToHire.toFixed(1)} days</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and detailed analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Referrers</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Referrals by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="totalReferrals" stroke="#8884d8" name="Total Referrals" />
                    <Line type="monotone" dataKey="successfulReferrals" stroke="#82ca9d" name="Successful" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel Analysis</CardTitle>
              <CardDescription>Track how referrals progress through each stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionFunnel && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{conversionFunnel.pending.count}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                      <div className="text-xs text-gray-500">{formatPercentage(conversionFunnel.pending.percentage)}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{conversionFunnel.contacted.count}</div>
                      <div className="text-sm text-gray-600">Contacted</div>
                      <div className="text-xs text-gray-500">{formatPercentage(conversionFunnel.contacted.percentage)}</div>
                      {conversionFunnel.contacted.dropOffFromPrevious > 0 && (
                        <div className="text-xs text-red-500">-{formatPercentage(conversionFunnel.contacted.dropOffFromPrevious)} drop-off</div>
                      )}
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{conversionFunnel.interviewed.count}</div>
                      <div className="text-sm text-gray-600">Interviewed</div>
                      <div className="text-xs text-gray-500">{formatPercentage(conversionFunnel.interviewed.percentage)}</div>
                      {conversionFunnel.interviewed.dropOffFromPrevious > 0 && (
                        <div className="text-xs text-red-500">-{formatPercentage(conversionFunnel.interviewed.dropOffFromPrevious)} drop-off</div>
                      )}
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{conversionFunnel.hired.count}</div>
                      <div className="text-sm text-gray-600">Hired</div>
                      <div className="text-xs text-gray-500">{formatPercentage(conversionFunnel.hired.percentage)}</div>
                      {conversionFunnel.hired.dropOffFromPrevious > 0 && (
                        <div className="text-xs text-red-500">-{formatPercentage(conversionFunnel.hired.dropOffFromPrevious)} drop-off</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers Leaderboard</CardTitle>
              <CardDescription>Users with the highest referral performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReferrers.map((referrer, index) => (
                  <div key={referrer.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{referrer.userName}</div>
                        <div className="text-sm text-gray-600">{referrer.userEmail}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(referrer.totalEarnings)}</div>
                      <div className="text-sm text-gray-600">
                        {referrer.successfulReferrals}/{referrer.totalReferrals} referrals
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatPercentage(referrer.conversionRate)} conversion
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalReferrals" fill="#8884d8" name="Total Referrals" />
                  <Bar dataKey="successfulReferrals" fill="#82ca9d" name="Successful Referrals" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};