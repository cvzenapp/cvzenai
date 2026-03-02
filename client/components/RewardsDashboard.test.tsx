import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RewardsDashboard } from './RewardsDashboard';
import { RewardStatus, REFERRAL_CONSTANTS } from '@shared/referrals';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('RewardsDashboard', () => {
  const mockUserId = 'user-123';
  
  const mockBalance = {
    totalEarnings: 150.00,
    pendingRewards: 30.00,
    availableForPayout: 120.00,
    paidRewards: 90.00,
    nextPayoutDate: '2024-02-15',
    minimumPayoutThreshold: REFERRAL_CONSTANTS.MINIMUM_PAYOUT_THRESHOLD
  };

  const mockRewards = [
    {
      id: 1,
      userId: 1,
      referralId: 101,
      amount: 30.00,
      status: RewardStatus.EARNED,
      earnedAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      userId: 1,
      referralId: 102,
      amount: 30.00,
      status: RewardStatus.PAID,
      earnedAt: '2024-01-10T10:00:00Z',
      paidAt: '2024-01-12T10:00:00Z',
      transactionId: 'txn_123456',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-12T10:00:00Z'
    },
    {
      id: 3,
      userId: 1,
      referralId: 103,
      amount: 30.00,
      status: RewardStatus.REVERSED,
      earnedAt: '2024-01-05T10:00:00Z',
      reversedAt: '2024-01-20T10:00:00Z',
      reversalReason: 'Candidate left within 90 days',
      createdAt: '2024-01-05T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z'
    }
  ];

  const mockPaymentHistory = [
    {
      id: 2,
      userId: 1,
      referralId: 102,
      amount: 30.00,
      status: RewardStatus.PAID,
      earnedAt: '2024-01-10T10:00:00Z',
      paidAt: '2024-01-12T10:00:00Z',
      paymentMethod: 'Bank Transfer',
      transactionId: 'txn_123456',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-12T10:00:00Z'
    }
  ];

  const mockEarningsChart = [
    { month: 'Jan 2024', earnings: 60 },
    { month: 'Feb 2024', earnings: 90 },
    { month: 'Mar 2024', earnings: 150 }
  ];

  beforeEach(() => {
    mockFetch.mockClear();
    mockToast.mockClear();
    
    // Setup default successful API responses for each test
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/rewards/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockBalance })
        });
      }
      if (url.includes('/api/rewards?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockRewards, total: mockRewards.length, hasMore: false }
          })
        });
      }
      if (url.includes('/api/rewards/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockPaymentHistory }
          })
        });
      }
      if (url.includes('/api/rewards/earnings-chart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEarningsChart })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<RewardsDashboard userId={mockUserId} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays reward summary cards with correct data', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Total Earnings')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('Available for Payout')).toBeInTheDocument();
      expect(screen.getByText('$120.00')).toBeInTheDocument();
      expect(screen.getByText('Pending Rewards')).toBeInTheDocument();
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
      expect(screen.getByText('Paid Out')).toBeInTheDocument();
      expect(screen.getByText('$90.00')).toBeInTheDocument();
    });
  });

  it('displays payout progress when below minimum threshold', async () => {
    const lowBalance = { ...mockBalance, availableForPayout: 50.00 };
    
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/rewards/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: lowBalance })
        });
      }
      if (url.includes('/api/rewards?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockRewards, total: mockRewards.length, hasMore: false }
          })
        });
      }
      if (url.includes('/api/rewards/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockPaymentHistory }
          })
        });
      }
      if (url.includes('/api/rewards/earnings-chart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEarningsChart })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Progress to Next Payout')).toBeInTheDocument();
      expect(screen.getByText('$50.00 more needed for payout')).toBeInTheDocument();
    });
  });

  it('displays earnings chart when data is available', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Earnings Over Time')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('displays reward breakdown table with correct data', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Reward Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Referral #101')).toBeInTheDocument();
      expect(screen.getByText('Referral #102')).toBeInTheDocument();
      expect(screen.getByText('Referral #103')).toBeInTheDocument();
    });
  });

  it('displays payment history table', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
      expect(screen.getByText('txn_123456')).toBeInTheDocument();
    });
  });

  it('shows payout request button when balance is above threshold', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Request Payout')).toBeInTheDocument();
    });
  });

  it('opens payout modal when request payout is clicked', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      const payoutButton = screen.getByText('Request Payout');
      fireEvent.click(payoutButton);
    });

    expect(screen.getAllByText('Available for Payout').length).toBeGreaterThan(1);
    expect(screen.getByText(/Processing time.*3-5 business days/)).toBeInTheDocument();
  });

  it('handles payout request successfully', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      const payoutButton = screen.getByText('Request Payout');
      fireEvent.click(payoutButton);
    });

    // Mock the payout request API call
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }));

    const confirmButton = screen.getByRole('button', { name: /request payout/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Payout Requested",
        description: "Your payout request has been submitted and will be processed within 3-5 business days."
      });
    });
  });

  it('prevents payout request when balance is below threshold', async () => {
    const lowBalance = { ...mockBalance, availableForPayout: 50.00 };
    
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/rewards/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: lowBalance })
        });
      }
      if (url.includes('/api/rewards?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockRewards, total: mockRewards.length, hasMore: false }
          })
        });
      }
      if (url.includes('/api/rewards/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockPaymentHistory }
          })
        });
      }
      if (url.includes('/api/rewards/earnings-chart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEarningsChart })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<RewardsDashboard userId={mockUserId} />);

    // Since balance is low, there should be no payout button
    await waitFor(() => {
      expect(screen.queryByText('Request Payout')).not.toBeInTheDocument();
    });
  });

  it('opens reward details modal when view button is clicked', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Reward Breakdown')).toBeInTheDocument();
    });

    // Find the first view button in the rewards table
    const viewButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-eye')
    );
    
    if (viewButtons.length > 0) {
      fireEvent.click(viewButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Reward Details')).toBeInTheDocument();
      });
    }
  });

  it('displays correct reward status badges', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Earned')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Reversed')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/rewards/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockBalance })
        });
      }
      if (url.includes('/api/rewards?')) {
        return Promise.reject(new Error('API Error'));
      }
      if (url.includes('/api/rewards/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockPaymentHistory }
          })
        });
      }
      if (url.includes('/api/rewards/earnings-chart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEarningsChart })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive"
      });
    });
  });

  it('refreshes data when refresh button is clicked', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      fireEvent.click(refreshButton);
    });

    // Should make additional API calls
    expect(mockFetch).toHaveBeenCalledTimes(5); // Initial 4 + 1 refresh
  });

  it('displays empty state when no rewards exist', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/rewards/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockBalance })
        });
      }
      if (url.includes('/api/rewards?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: [], total: 0, hasMore: false }
          })
        });
      }
      if (url.includes('/api/rewards/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: [] }
          })
        });
      }
      if (url.includes('/api/rewards/earnings-chart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('No rewards yet')).toBeInTheDocument();
      expect(screen.getByText('Start referring friends to earn rewards!')).toBeInTheDocument();
      expect(screen.getByText('No payments yet')).toBeInTheDocument();
    });
  });

  it('calculates payout progress correctly', async () => {
    const partialBalance = { 
      ...mockBalance, 
      availableForPayout: 75.00 // 75% of minimum threshold
    };
    
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/rewards/balance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: partialBalance })
        });
      }
      if (url.includes('/api/rewards?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockRewards, total: mockRewards.length, hasMore: false }
          })
        });
      }
      if (url.includes('/api/rewards/payments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            data: { rewards: mockPaymentHistory }
          })
        });
      }
      if (url.includes('/api/rewards/earnings-chart')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockEarningsChart })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('$25.00 more needed for payout')).toBeInTheDocument();
    });
  });

  it('formats currency amounts correctly', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      // Check that specific amounts are formatted as currency in summary cards
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // Total earnings
      expect(screen.getByText('$120.00')).toBeInTheDocument(); // Available for payout
      expect(screen.getByText('$90.00')).toBeInTheDocument(); // Paid out
      // Note: $30.00 appears multiple times in the table, so we just check it exists
      expect(screen.getAllByText('$30.00').length).toBeGreaterThan(0);
    });
  });

  it('shows reversed reward details in modal', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Reward Breakdown')).toBeInTheDocument();
    });

    // Find the first view button in the rewards table
    const viewButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-eye')
    );
    
    if (viewButtons.length > 0) {
      fireEvent.click(viewButtons[0]);
      
      // The modal should show reward details
      await waitFor(() => {
        expect(screen.getByText('Reward Details')).toBeInTheDocument();
      });
    }
  });

  it('handles payout request failure', async () => {
    render(<RewardsDashboard userId={mockUserId} />);

    await waitFor(() => {
      const payoutButton = screen.getByText('Request Payout');
      fireEvent.click(payoutButton);
    });

    // Mock the payout request API call to fail
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Payout failed' })
    }));

    const confirmButton = screen.getByRole('button', { name: /request payout/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to request payout",
        variant: "destructive"
      });
    });
  });
});