import React, { useState, useEffect, useMemo } from 'react';
import { 
  Referral, 
  ReferralStatus, 
  ReferralFilters,
  ReferralStats,
  getReferralStatusColor,
  getReferralStatusLabel,
  formatRewardAmount
} from '@shared/referrals';
import { useAuth } from '@/contexts/AuthContext';
import { unifiedAuthService } from '@/services/unifiedAuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  RefreshCw,
  Calendar,
  User,
  Building,
  Mail,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ReferralDashboardProps {
  userId: string;
  onReferralCreate?: () => void;
}

interface ReferralDashboardState {
  referrals: Referral[];
  stats: ReferralStats | null;
  loading: boolean;
  error: string | null;
  selectedReferrals: Set<number>;
  filters: ReferralFilters;
  showFilters: boolean;
  selectedReferral: Referral | null;
  showDetailsModal: boolean;
  statusHistory: any[];
  total: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 10;

export function ReferralDashboard({ userId, onReferralCreate }: ReferralDashboardProps) {
  const { toast } = useToast();
  const [state, setState] = useState<ReferralDashboardState>({
    referrals: [],
    stats: null,
    loading: true,
    error: null,
    selectedReferrals: new Set(),
    filters: {
      limit: ITEMS_PER_PAGE,
      offset: 0
    },
    showFilters: false,
    selectedReferral: null,
    showDetailsModal: false,
    statusHistory: [],
    total: 0,
    hasMore: false
  });

  // Fetch referrals data
  const fetchReferrals = async (newFilters?: Partial<ReferralFilters>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const filters = { ...state.filters, ...newFilters };
      const queryParams = new URLSearchParams();
      
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(status => queryParams.append('status', status));
      }
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);
      if (filters.limit) queryParams.set('limit', filters.limit.toString());
      if (filters.offset) queryParams.set('offset', filters.offset.toString());

      const response = await fetch(`/api/referrals?${queryParams}`, {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          referrals: data.data.referrals,
          total: data.data.total,
          hasMore: data.data.hasMore,
          filters,
          loading: false
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch referrals');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      }));
      toast({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive"
      });
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/referrals/stats', {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, stats: data.data }));
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchReferrals();
    fetchStats();
  }, []);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReferrals();
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [state.filters]);

  // Handle search
  const handleSearch = (search: string) => {
    fetchReferrals({ search, offset: 0 });
  };

  // Handle status filter
  const handleStatusFilter = (status: ReferralStatus[]) => {
    fetchReferrals({ status, offset: 0 });
  };

  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    fetchReferrals({ offset: newOffset });
  };

  // Handle referral selection
  const handleReferralSelect = (referralId: number, selected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedReferrals);
      if (selected) {
        newSelected.add(referralId);
      } else {
        newSelected.delete(referralId);
      }
      return { ...prev, selectedReferrals: newSelected };
    });
  };

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedReferrals: selected 
        ? new Set(prev.referrals.map(r => r.id))
        : new Set()
    }));
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async (status: ReferralStatus) => {
    if (state.selectedReferrals.size === 0) return;

    try {
      const promises = Array.from(state.selectedReferrals).map(referralId =>
        fetch(`/api/referrals/${referralId}/status`, {
          method: 'PUT',
          headers: unifiedAuthService.getAuthHeaders(),
          body: JSON.stringify({ status })
        })
      );

      await Promise.all(promises);
      
      setState(prev => ({ ...prev, selectedReferrals: new Set() }));
      fetchReferrals();
      fetchStats();
      
      toast({
        title: "Success",
        description: `Updated ${state.selectedReferrals.size} referrals`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update referrals",
        variant: "destructive"
      });
    }
  };

  // Handle view details
  const handleViewDetails = async (referral: Referral) => {
    try {
      // Fetch status history
      const response = await fetch(`/api/referrals/${referral.id}/history`, {
        headers: unifiedAuthService.getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          selectedReferral: referral,
          statusHistory: data.success ? data.data : [],
          showDetailsModal: true
        }));
      }
    } catch (error) {
      console.error('Failed to fetch referral history:', error);
      setState(prev => ({
        ...prev,
        selectedReferral: referral,
        statusHistory: [],
        showDetailsModal: true
      }));
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: ReferralStatus }) => {
    const getVariant = (status: ReferralStatus) => {
      switch (status) {
        case ReferralStatus.HIRED:
          return 'default';
        case ReferralStatus.REJECTED:
        case ReferralStatus.EXPIRED:
        case ReferralStatus.DECLINED:
          return 'destructive';
        case ReferralStatus.INTERVIEWED:
          return 'secondary';
        default:
          return 'outline';
      }
    };

    return (
      <Badge variant={getVariant(status)} className="whitespace-nowrap">
        {getReferralStatusLabel(status)}
      </Badge>
    );
  };

  // Stats cards
  const statsCards = useMemo(() => {
    if (!state.stats) return [];

    return [
      {
        title: 'Total Referrals',
        value: state.stats.totalReferrals,
        icon: User,
        color: 'text-blue-600'
      },
      {
        title: 'Successful Hires',
        value: state.stats.successfulReferrals,
        icon: CheckCircle2,
        color: 'text-green-600'
      },
      {
        title: 'Pending',
        value: state.stats.pendingReferrals,
        icon: Clock,
        color: 'text-yellow-600'
      },
      {
        title: 'Total Earnings',
        value: formatRewardAmount(state.stats.totalEarnings),
        icon: DollarSign,
        color: 'text-green-600'
      }
    ];
  }, [state.stats]);

  if (state.loading && state.referrals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {state.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Dashboard Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Referral Dashboard</CardTitle>
              <CardDescription>
                Track and manage your referrals
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, showFilters: !prev.showFilters }))}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReferrals()}
                disabled={state.loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${state.loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {onReferralCreate && (
                <Button onClick={onReferralCreate}>
                  Create Referral
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          {state.showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <Input
                    placeholder="Search referrals..."
                    value={state.filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select
                    value={state.filters.status?.[0] || 'all'}
                    onValueChange={(value) => 
                      handleStatusFilter(value === 'all' ? [] : [value as ReferralStatus])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(ReferralStatus).map(status => (
                        <SelectItem key={status} value={status}>
                          {getReferralStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {state.selectedReferrals.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {state.selectedReferrals.size} referral(s) selected
                </span>
                <div className="flex items-center space-x-2">
                  <Select onValueChange={(value) => handleBulkStatusUpdate(value as ReferralStatus)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ReferralStatus).map(status => (
                        <SelectItem key={status} value={status}>
                          {getReferralStatusLabel(status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Referrals Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={state.selectedReferrals.size === state.referrals.length && state.referrals.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Referee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.referrals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <User className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No referrals found</p>
                        {onReferralCreate && (
                          <Button variant="outline" onClick={onReferralCreate}>
                            Create your first referral
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  state.referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>
                        <Checkbox
                          checked={state.selectedReferrals.has(referral.id)}
                          onCheckedChange={(checked) => 
                            handleReferralSelect(referral.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{referral.refereeName}</div>
                          <div className="text-sm text-muted-foreground">{referral.refereeEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{referral.positionTitle}</TableCell>
                      <TableCell>{referral.companyName}</TableCell>
                      <TableCell>
                        <StatusBadge status={referral.status} />
                      </TableCell>
                      <TableCell>{formatRewardAmount(referral.rewardAmount)}</TableCell>
                      <TableCell>
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(referral)}
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

          {/* Pagination */}
          {state.total > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {state.filters.offset! + 1} to {Math.min(state.filters.offset! + ITEMS_PER_PAGE, state.total)} of {state.total} referrals
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(0, state.filters.offset! - ITEMS_PER_PAGE))}
                  disabled={state.filters.offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(state.filters.offset! + ITEMS_PER_PAGE)}
                  disabled={!state.hasMore}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Details Modal */}
      <Dialog open={state.showDetailsModal} onOpenChange={(open) => 
        setState(prev => ({ ...prev, showDetailsModal: open }))
      }>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Referral Details</DialogTitle>
          </DialogHeader>
          
          {state.selectedReferral && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Referee Name</label>
                  <p className="font-medium">{state.selectedReferral.refereeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{state.selectedReferral.refereeEmail}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                  <p className="font-medium">{state.selectedReferral.positionTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Company</label>
                  <p className="font-medium">{state.selectedReferral.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <StatusBadge status={state.selectedReferral.status} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reward Amount</label>
                  <p className="font-medium">{formatRewardAmount(state.selectedReferral.rewardAmount)}</p>
                </div>
              </div>

              {/* Personal Message */}
              {state.selectedReferral.personalMessage && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Personal Message</label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{state.selectedReferral.personalMessage}</p>
                </div>
              )}

              {/* Status Timeline */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Status Timeline</label>
                <div className="space-y-3">
                  {state.statusHistory.map((entry, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0">
                        <StatusBadge status={entry.new_status} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          {entry.previous_status ? 
                            `Changed from ${getReferralStatusLabel(entry.previous_status)} to ${getReferralStatusLabel(entry.new_status)}` :
                            `Initial status: ${getReferralStatusLabel(entry.new_status)}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString()}
                          {entry.changed_by_name && ` by ${entry.changed_by_name}`}
                        </p>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}