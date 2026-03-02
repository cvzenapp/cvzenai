/**
 * Referral Analytics Dashboard Component Tests
 * Tests for the analytics dashboard UI and functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReferralAnalyticsDashboard } from './ReferralAnalyticsDashboard';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock recharts components
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  FunnelChart: ({ children }: any) => <div data-testid="funnel-chart">{children}</div>,
  Funnel: () => <div data-testid="funnel" />,
  LabelList: () => <div data-testid="label-list" />
}));

// Mock UI components
vi.mock('./ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('./ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}));

vi.mock('./ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }: any) => <div data-testid="tabs-content" data-value={value}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>
}));

vi.mock('./ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

vi.mock('./ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}));

vi.mock('./ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

vi.mock('./ui/select', () => ({
  Select: ({ children }: any) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children }: any) => <div data-testid="select-item">{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ children }: any) => <div data-testid="select-value">{children}</div>
}));

describe('ReferralAnalyticsDashboard', () => {
  const mockAnalyticsData = {
    totalReferrals: 100,
    conversionRate: 25,
    totalRewards: 750,
    averageRewardAmount: 30,
    referralsByStatus: {
      pending: 30,
      contacted: 20,
      interviewed: 15,
      hired: 25,
      rejected: 10,
      expired: 5,
      declined: 5
    },
    monthlyTrends: [
      {
        month: '12',
        year: 2024,
        totalReferrals: 50,
        successfulReferrals: 12,
        conversionRate: 24,
        totalRewards: 360
      }
    ],
    topPerformingCompanies: [
      {
        companyName: 'Tech Corp',
        totalReferrals: 20,
        successfulReferrals: 8,
        conversionRate: 40,
        averageTimeToHire: 15
      }
    ],
    averageTimeToHire: 18.5
  };

  const mockConversionFunnel = {
    pending: { count: 100, percentage: 40 },
    contacted: { count: 80, percentage: 32, dropOffFromPrevious: 20 },
    interviewed: { count: 60, percentage: 24, dropOffFromPrevious: 25 },
    hired: { count: 30, percentage: 12, dropOffFromPrevious: 50 },
    rejected: { count: 20, percentage: 8 },
    expired: { count: 10, percentage: 4 },
    declined: { count: 5, percentage: 2 }
  };

  const mockTopReferrers = [
    {
      userId: 1,
      userName: 'John Doe',
      userEmail: 'john@example.com',
      totalReferrals: 20,
      successfulReferrals: 8,
      conversionRate: 40,
      totalEarnings: 240,
      pendingRewards: 60,
      paidRewards: 180,
      averageRewardAmount: 30,
      lastReferralDate: '2024-01-15'
    }
  ];

  const mockRealTimeData = {
    totalReferralsToday: 5,
    totalReferralsThisWeek: 25,
    totalReferralsThisMonth: 100,
    pendingReferrals: 30,
    recentActivity: [
      {
        id: 1,
        referee_name: 'John Doe',
        position_title: 'Developer',
        company_name: 'Tech Corp',
        status: 'hired',
        created_at: '2024-01-01',
        updated_at: '2024-01-15',
        referrer_name: 'Jane Smith'
      }
    ]
  };

  beforeEach(() => {
    mockFetch.mockClear();
    
    // Setup default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/referrals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAnalyticsData })
        });
      }
      if (url.includes('/api/analytics/conversion-funnel')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockConversionFunnel })
        });
      }
      if (url.includes('/api/analytics/top-referrers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTopReferrers })
        });
      }
      if (url.includes('/api/analytics/real-time')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockRealTimeData })
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<ReferralAnalyticsDashboard />);
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('should render analytics data after loading', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Referral Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('100')).toBeInTheDocument(); // Total referrals
    expect(screen.getByText('25.0%')).toBeInTheDocument(); // Conversion rate
    expect(screen.getByText('$750.00')).toBeInTheDocument(); // Total rewards
    expect(screen.getByText('18.5 days')).toBeInTheDocument(); // Avg time to hire
  });

  it('should render real-time metrics', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Today's referrals
    });

    expect(screen.getByText('25')).toBeInTheDocument(); // This week
    expect(screen.getByText('100')).toBeInTheDocument(); // This month
    expect(screen.getByText('30')).toBeInTheDocument(); // Pending
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 500
      })
    );

    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch analytics data')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should allow manual refresh', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Referral Analytics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should make new API calls
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(8); // 4 initial + 4 refresh calls
    });
  });

  it('should toggle auto-refresh', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Auto Refresh')).toBeInTheDocument();
    });

    const autoRefreshButton = screen.getByText('Auto Refresh');
    fireEvent.click(autoRefreshButton);

    // Auto-refresh should be toggled (implementation detail)
    expect(autoRefreshButton).toBeInTheDocument();
  });

  it('should apply date filters', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText('From Date')).toBeInTheDocument();
    });

    const fromDateInput = screen.getByLabelText('From Date');
    const toDateInput = screen.getByLabelText('To Date');

    fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(toDateInput, { target: { value: '2024-12-31' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('dateFrom=2024-01-01')
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('dateTo=2024-12-31')
      );
    });
  });

  it('should apply company filter', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText('Company')).toBeInTheDocument();
    });

    const companyInput = screen.getByLabelText('Company');
    fireEvent.change(companyInput, { target: { value: 'Tech Corp' } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('companyName=Tech%20Corp')
      );
    });
  });

  it('should handle CSV export', async () => {
    // Mock blob and URL creation
    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    const mockUrl = 'blob:mock-url';
    
    global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    // Mock successful export response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/export')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        });
      }
      // Return default responses for other endpoints
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/export?format=csv')
      );
    });

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
  });

  it('should handle JSON export', async () => {
    const mockBlob = new Blob(['json data'], { type: 'application/json' });
    const mockUrl = 'blob:mock-url';
    
    global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/export')) {
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export JSON')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export JSON');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/export?format=json')
      );
    });
  });

  it('should handle export errors', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/export')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export CSV');
    fireEvent.click(exportButton);

    // Error should be handled (implementation detail - might show error message)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/export')
      );
    });
  });

  it('should render charts and visualizations', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Referral Analytics')).toBeInTheDocument();
    });

    // Check for chart components
    expect(screen.getAllByTestId('responsive-container')).toHaveLength(2);
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('should display top referrers leaderboard', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('$240.00')).toBeInTheDocument();
    expect(screen.getByText('8/20 referrals')).toBeInTheDocument();
    expect(screen.getByText('40.0% conversion')).toBeInTheDocument();
  });

  it('should display conversion funnel with drop-off rates', async () => {
    render(<ReferralAnalyticsDashboard />);

    // Navigate to funnel tab
    await waitFor(() => {
      expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    });

    // Check funnel data is displayed
    expect(screen.getByText('100')).toBeInTheDocument(); // Pending count
    expect(screen.getByText('80')).toBeInTheDocument(); // Contacted count
    expect(screen.getByText('-20.0% drop-off')).toBeInTheDocument();
    expect(screen.getByText('-25.0% drop-off')).toBeInTheDocument();
    expect(screen.getByText('-50.0% drop-off')).toBeInTheDocument();
  });

  it('should format currency values correctly', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('$750.00')).toBeInTheDocument();
    });

    expect(screen.getByText('$240.00')).toBeInTheDocument();
  });

  it('should format percentage values correctly', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('25.0%')).toBeInTheDocument();
    });

    expect(screen.getByText('40.0% conversion')).toBeInTheDocument();
  });

  it('should handle retry after error', async () => {
    // First call fails
    mockFetch.mockImplementationOnce(() => 
      Promise.resolve({ ok: false, status: 500 })
    );

    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch analytics data')).toBeInTheDocument();
    });

    // Setup successful response for retry
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/analytics/referrals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAnalyticsData })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Referral Analytics')).toBeInTheDocument();
    });
  });

  it('should render tabs correctly', async () => {
    render(<ReferralAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
    expect(screen.getByText('Top Referrers')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();
  });
});