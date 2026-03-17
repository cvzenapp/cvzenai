import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MyApplicationsList } from '@/components/jobs/MyApplicationsList';
import { jobApplicationsApi } from '@/services/jobApplicationsApi';

interface ApplicationStats {
  total: number;
  pending: number;
  reviewed: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
  thisWeek: number;
  thisMonth: number;
  successRate: number;
  averageResponseTime: number;
}

export default function JobSeekerApplications() {
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    accepted: 0,
    rejected: 0,
    thisWeek: 0,
    thisMonth: 0,
    successRate: 0,
    averageResponseTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await jobApplicationsApi.getApplicationStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load application stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: Target,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      textColor: 'text-blue-700',
      change: `+${stats.thisWeek} this week`
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'from-emerald-50 to-green-50',
      textColor: 'text-emerald-700',
      change: 'Shortlisted + Accepted'
    },
    {
      title: 'Under Review',
      value: stats.pending,
      icon: Clock,
      color: 'from-amber-500 to-orange-600',
      bgColor: 'from-amber-50 to-orange-50',
      textColor: 'text-amber-700',
      change: 'Awaiting response'
    },
    {
      title: 'Positive Responses',
      value: stats.shortlisted + stats.accepted,
      icon: Award,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-50 to-pink-50',
      textColor: 'text-purple-700',
      change: 'Shortlisted & Accepted'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Application Dashboard</h1>
                <p className="text-sm text-gray-600">Track your job search progress</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-gray-200 hover:border-blue-300"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 hover:border-blue-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-50`}></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm font-medium text-gray-600">{stat.title}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${stat.textColor} bg-white/60 px-3 py-1 rounded-full`}>
                    {stat.change}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-16 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  const recommendationsTab = document.querySelector('[data-tab="recommendations"]');
                  if (recommendationsTab) {
                    (recommendationsTab as HTMLElement).click();
                  }
                }}
              >
                <div className="text-center">
                  <Search className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-semibold">Find New Jobs</div>
                  <div className="text-xs opacity-90">Discover opportunities</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="h-16 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                onClick={() => {
                  const resumeTab = document.querySelector('[data-tab="resume"]');
                  if (resumeTab) {
                    (resumeTab as HTMLElement).click();
                  }
                }}
              >
                <div className="text-center">
                  <Award className="w-6 h-6 mx-auto mb-1 text-blue-600" />
                  <div className="font-semibold text-gray-900">Optimize Resume</div>
                  <div className="text-xs text-gray-600">Improve ATS score</div>
                </div>
              </Button>
              
              <Button 
                variant="outline"
                className="h-16 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
              >
                <div className="text-center">
                  <BarChart3 className="w-6 h-6 mx-auto mb-1 text-purple-600" />
                  <div className="font-semibold text-gray-900">View Analytics</div>
                  <div className="text-xs text-gray-600">Track performance</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Status Breakdown */}
        {stats.total > 0 && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Application Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Under Review', value: stats.pending, color: 'bg-amber-500', textColor: 'text-amber-700' },
                  { label: 'Reviewed', value: stats.reviewed, color: 'bg-blue-500', textColor: 'text-blue-700' },
                  { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-purple-500', textColor: 'text-purple-700' },
                  { label: 'Accepted', value: stats.accepted, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                  { label: 'Not Selected', value: stats.rejected, color: 'bg-red-500', textColor: 'text-red-700' }
                ].map((item, index) => {
                  const percentage = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                  return (
                    <div key={index} className="text-center">
                      <div className="relative w-16 h-16 mx-auto mb-2">
                        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                        <div 
                          className={`absolute top-0 left-0 w-16 h-16 rounded-full ${item.color}`}
                          style={{
                            background: `conic-gradient(${item.color.replace('bg-', '')} ${percentage * 3.6}deg, #e5e7eb 0deg)`
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-900">{item.value}</span>
                        </div>
                      </div>
                      <div className={`text-sm font-semibold ${item.textColor}`}>{item.label}</div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              My Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <MyApplicationsList />
          </CardContent>
        </Card>

        {/* Tips and Insights */}
        {stats.total > 0 && (
          <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-900">
                <TrendingUp className="w-6 h-6" />
                Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    What's Working Well
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {stats.successRate > 20 && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Your success rate of {stats.successRate}% is above average
                      </li>
                    )}
                    {stats.shortlisted > 0 && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        You've been shortlisted {stats.shortlisted} times - great job!
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      You're actively applying - consistency is key
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {stats.successRate < 15 && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        Consider optimizing your resume for better ATS scores
                      </li>
                    )}
                    {stats.thisWeek < 3 && (
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        Try applying to more positions this week
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      Tailor your applications to specific job requirements
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}