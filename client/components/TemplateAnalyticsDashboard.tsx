import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
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
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  CheckCircle, 
  Settings,
  Clock,
  AlertTriangle,
  Award,
  Users,
  Activity
} from 'lucide-react';
import { useTemplateAnalytics, useABTesting } from '../hooks/useTemplateAnalytics';
import { TemplateAnalytics, ABTest, ABTestResults } from '../services/templateAnalyticsService';

interface TemplateAnalyticsDashboardProps {
  templateId?: string;
  showAllTemplates?: boolean;
}

export function TemplateAnalyticsDashboard({ 
  templateId, 
  showAllTemplates = false 
}: TemplateAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'selections' | 'completions' | 'popularity'>('popularity');

  const { 
    analytics, 
    allAnalytics, 
    topTemplates, 
    performanceMetrics,
    isLoading,
    error 
  } = useTemplateAnalytics(templateId);

  const { activeTests } = useABTesting();

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (showAllTemplates && allAnalytics) {
      return allAnalytics.map(a => ({
        name: a.templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        views: a.views,
        selections: a.selections,
        completions: a.completions,
        popularity: Math.round(a.popularityScore),
        conversionRate: Math.round(a.conversionRate * 100),
        completionRate: Math.round(a.completionRate * 100),
      }));
    } else if (analytics) {
      // For single template, show trend data (mock data for demo)
      return [
        { period: 'Week 1', views: Math.round(analytics.views * 0.2), selections: Math.round(analytics.selections * 0.2), completions: Math.round(analytics.completions * 0.2) },
        { period: 'Week 2', views: Math.round(analytics.views * 0.3), selections: Math.round(analytics.selections * 0.3), completions: Math.round(analytics.completions * 0.3) },
        { period: 'Week 3', views: Math.round(analytics.views * 0.25), selections: Math.round(analytics.selections * 0.25), completions: Math.round(analytics.completions * 0.25) },
        { period: 'Week 4', views: Math.round(analytics.views * 0.25), selections: Math.round(analytics.selections * 0.25), completions: Math.round(analytics.completions * 0.25) },
      ];
    }
    return [];
  }, [analytics, allAnalytics, showAllTemplates]);

  const pieData = useMemo(() => {
    if (!analytics) return [];
    return [
      { name: 'Completed', value: analytics.completions, color: '#10b981' },
      { name: 'Selected', value: analytics.selections - analytics.completions, color: '#f59e0b' },
      { name: 'Viewed Only', value: analytics.views - analytics.selections, color: '#6b7280' },
    ];
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Failed to load analytics data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {showAllTemplates ? 'Template Analytics Overview' : 'Template Performance'}
          </h2>
          <p className="text-gray-600">
            {showAllTemplates 
              ? 'Performance metrics across all templates'
              : `Analytics for ${templateId?.replace(/-/g, ' ')}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          {showAllTemplates && <TabsTrigger value="comparison">Comparison</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Views"
              value={showAllTemplates ? allAnalytics?.reduce((sum, a) => sum + a.views, 0) || 0 : analytics?.views || 0}
              icon={<Eye className="h-4 w-4" />}
              trend={12}
              color="blue"
            />
            <MetricCard
              title="Selections"
              value={showAllTemplates ? allAnalytics?.reduce((sum, a) => sum + a.selections, 0) || 0 : analytics?.selections || 0}
              icon={<MousePointer className="h-4 w-4" />}
              trend={8}
              color="green"
            />
            <MetricCard
              title="Completions"
              value={showAllTemplates ? allAnalytics?.reduce((sum, a) => sum + a.completions, 0) || 0 : analytics?.completions || 0}
              icon={<CheckCircle className="h-4 w-4" />}
              trend={-3}
              color="purple"
            />
            <MetricCard
              title="Avg. Popularity"
              value={showAllTemplates 
                ? Math.round((allAnalytics?.reduce((sum, a) => sum + a.popularityScore, 0) || 0) / (allAnalytics?.length || 1))
                : Math.round(analytics?.popularityScore || 0)
              }
              icon={<Award className="h-4 w-4" />}
              trend={5}
              color="orange"
              suffix="/100"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {showAllTemplates ? 'Template Comparison' : 'Performance Trend'}
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="views">Views</option>
                    <option value="selections">Selections</option>
                    <option value="completions">Completions</option>
                    <option value="popularity">Popularity</option>
                  </select>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={showAllTemplates ? -45 : 0}
                      textAnchor={showAllTemplates ? 'end' : 'middle'}
                      height={showAllTemplates ? 80 : 60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar 
                      dataKey={selectedMetric} 
                      fill={getMetricColor(selectedMetric)}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Conversion Funnel or Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {showAllTemplates ? 'Top Performing Templates' : 'User Journey'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showAllTemplates ? (
                  <div className="space-y-3">
                    {topTemplates?.slice(0, 5).map((template, index) => (
                      <div key={template.templateId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">
                            {template.templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {Math.round(template.popularityScore)}/100
                          </div>
                          <div className="text-xs text-gray-500">
                            {template.completions} completions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Conversion Rates */}
          {!showAllTemplates && analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Conversion Metrics</CardTitle>
                <CardDescription>How users interact with this template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">View to Selection</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(analytics.conversionRate * 100)}%
                      </span>
                    </div>
                    <Progress value={analytics.conversionRate * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selection to Completion</span>
                      <span className="text-sm text-gray-600">
                        {Math.round(analytics.completionRate * 100)}%
                      </span>
                    </div>
                    <Progress value={analytics.completionRate * 100} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Customization Rate</span>
                      <span className="text-sm text-gray-600">
                        {Math.round((analytics.customizations / Math.max(analytics.selections, 1)) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(analytics.customizations / Math.max(analytics.selections, 1)) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceMetrics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Loading Time</span>
                      <span className={`text-sm font-semibold ${
                        performanceMetrics.loadingTime < 200 ? 'text-green-600' : 
                        performanceMetrics.loadingTime < 500 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {Math.round(performanceMetrics.loadingTime)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Error Rate</span>
                      <span className={`text-sm font-semibold ${
                        performanceMetrics.errorRate < 0.01 ? 'text-green-600' : 
                        performanceMetrics.errorRate < 0.05 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(performanceMetrics.errorRate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Bounce Rate</span>
                      <span className="text-sm font-semibold text-gray-600">
                        {(performanceMetrics.userEngagement.bounceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No performance data available</p>
                )}
              </CardContent>
            </Card>

            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Time Spent</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {Math.round(analytics.averageTimeSpent)} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Customization Rate</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {Math.round((analytics.customizations / Math.max(analytics.selections, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Popularity Score</span>
                      <span className="text-sm font-semibold text-green-600">
                        {Math.round(analytics.popularityScore)}/100
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-4">
          <ABTestingDashboard tests={activeTests || []} templateId={templateId} />
        </TabsContent>

        {showAllTemplates && (
          <TabsContent value="comparison" className="space-y-4">
            <TemplateComparisonTable analytics={allAnalytics || []} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// Helper Components
interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: number;
  color: 'blue' | 'green' | 'purple' | 'orange';
  suffix?: string;
}

function MetricCard({ title, value, icon, trend, color, suffix = '' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
  };

  return (
    <Card className={`border ${colorClasses[color].split(' ')[2]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {value.toLocaleString()}{suffix}
            </p>
            <div className="flex items-center text-sm">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(trend)}%
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">{title}</p>
      </CardContent>
    </Card>
  );
}

function ABTestingDashboard({ tests, templateId }: { tests: ABTest[]; templateId?: string }) {
  const relevantTests = templateId 
    ? tests.filter(test => test.variants.some(v => v.templateId === templateId))
    : tests;

  if (relevantTests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No active A/B tests found</p>
          <Button className="mt-4" variant="outline">
            Create New Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {relevantTests.map(test => (
        <Card key={test.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{test.name}</CardTitle>
                <CardDescription>{test.description}</CardDescription>
              </div>
              <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                {test.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {test.variants.map(variant => (
                <div key={variant.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{variant.variantName}</h4>
                    {variant.isControl && <Badge variant="outline">Control</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{variant.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Traffic:</span>
                      <span>{variant.trafficAllocation}%</span>
                    </div>
                    <Progress value={variant.trafficAllocation} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Started: {test.startDate.toLocaleDateString()}
              </div>
              <Button variant="outline" size="sm">
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TemplateComparisonTable({ analytics }: { analytics: TemplateAnalytics[] }) {
  const sortedAnalytics = [...analytics].sort((a, b) => b.popularityScore - a.popularityScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Template Performance Comparison</CardTitle>
        <CardDescription>All templates ranked by popularity score</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Template</th>
                <th className="text-right p-2">Views</th>
                <th className="text-right p-2">Selections</th>
                <th className="text-right p-2">Completions</th>
                <th className="text-right p-2">Conversion</th>
                <th className="text-right p-2">Completion</th>
                <th className="text-right p-2">Popularity</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnalytics.map((template, index) => (
                <tr key={template.templateId} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="font-medium">
                        {template.templateId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </td>
                  <td className="text-right p-2">{template.views.toLocaleString()}</td>
                  <td className="text-right p-2">{template.selections.toLocaleString()}</td>
                  <td className="text-right p-2">{template.completions.toLocaleString()}</td>
                  <td className="text-right p-2">{Math.round(template.conversionRate * 100)}%</td>
                  <td className="text-right p-2">{Math.round(template.completionRate * 100)}%</td>
                  <td className="text-right p-2">
                    <span className={`font-semibold ${
                      template.popularityScore >= 80 ? 'text-green-600' :
                      template.popularityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(template.popularityScore)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function getMetricColor(metric: string): string {
  const colors = {
    views: '#3b82f6',
    selections: '#10b981',
    completions: '#8b5cf6',
    popularity: '#f59e0b',
  };
  return colors[metric as keyof typeof colors] || '#6b7280';
}