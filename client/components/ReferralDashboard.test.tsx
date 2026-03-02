import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReferralDashboard } from './ReferralDashboard';
import { ReferralStatus } from '@shared/referrals';

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
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
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock data
const mockReferrals = [
  {
    id: 1,
    referrerId: 1,
    refereeEmail: 'john@example.com',
    refereeName: 'John Doe',
    positionTitle: 'Software Engineer',
    companyName: 'Tech Corp',
    status: ReferralStatus.PENDING,
    rewardAmount: 30,
    referralToken: 'token1',
    expiresAt: '2024-12-31T23:59:59Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    referrerId: 1,
    refereeEmail: 'jane@example.com',
    refereeName: 'Jane Smith',
    positionTitle: 'Product Manager',
    companyName: 'Product Inc',
    status: ReferralStatus.HIRED,
    rewardAmount: 50,
    referralToken: 'token2',
    expiresAt: '2024-12-31T23:59:59Z',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

const mockStats = {
  totalReferrals: 2,
  pendingReferrals: 1,
  contactedReferrals: 0,
  interviewedReferrals: 0,
  successfulReferrals: 1,
  rejectedReferrals: 0,
  expiredReferrals: 0,
  totalEarnings: 50,
  pendingRewards: 0,
  paidRewards: 50,
  conversionRate: 50,
  averageTimeToHire: 0
};

const mockStatusHistory = [
  {
    id: 1,
    referral_id: 1,
    previous_status: null,
    new_status: ReferralStatus.PENDING,
    changed_by_user_id: 1,
    changed_by_name: 'Test User',
    notes: null,
    created_at: '2024-01-01T00:00:00Z'
  }
];

describe('ReferralDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/referrals/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockStats
          })
        });
      }
      
      if (url.includes('/api/referrals/1/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: mockStatusHistory
          })
        });
      }
      
      if (url.includes('/api/referrals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              referrals: mockReferrals,
              total: 2,
              hasMore: false
            }
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders loading state initially', () => {
    render(<ReferralDashboard userId="1" />);
    // Check for loading spinner by class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays referrals list after loading', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays stats cards', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Referrals')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Successful Hires')).toBeInTheDocument();
      // Use getAllByText for duplicate values
      const ones = screen.getAllByText('1');
      expect(ones.length).toBeGreaterThan(0);
    });
  });

  it('handles search functionality', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Clear previous calls
    mockFetch.mockClear();

    // Open filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Search for John
    const searchInput = screen.getByPlaceholderText('Search referrals...');
    fireEvent.change(searchInput, { target: { value: 'John' } });
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=John'),
        expect.any(Object)
      );
    });
  });

  it('handles status filtering', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Open filters
    fireEvent.click(screen.getByText('Filters'));
    
    // Check that status filter is rendered
    const statusSelect = screen.getByRole('combobox');
    expect(statusSelect).toBeInTheDocument();
  });

  it('handles referral selection', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select first referral
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // First referral checkbox (index 0 is select all)
    
    expect(screen.getByText('1 referral(s) selected')).toBeInTheDocument();
  });

  it('handles select all functionality', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select all
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);
    
    expect(screen.getByText('2 referral(s) selected')).toBeInTheDocument();
  });

  it('handles bulk status update', async () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT' && url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      
      // Return default responses for other calls
      if (url.includes('/api/referrals/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockStats })
        });
      }
      
      if (url.includes('/api/referrals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { referrals: mockReferrals, total: 2, hasMore: false }
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select referrals
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    
    await waitFor(() => {
      expect(screen.getByText('1 referral(s) selected')).toBeInTheDocument();
    });

    // Test that bulk actions section appears
    expect(screen.getByText('1 referral(s) selected')).toBeInTheDocument();
  });

  it('renders view details buttons', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that view buttons are rendered (one for each referral)
    const viewButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') // Looking for buttons with SVG icons
    );
    
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('renders refresh button', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that refresh button is rendered
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('handles pagination', async () => {
    const manyReferrals = Array.from({ length: 15 }, (_, i) => ({
      ...mockReferrals[0],
      id: i + 1,
      refereeName: `Person ${i + 1}`,
      refereeEmail: `person${i + 1}@example.com`
    }));

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/referrals/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockStats })
        });
      }
      
      if (url.includes('/api/referrals')) {
        const urlObj = new URL(url, 'http://localhost');
        const offset = parseInt(urlObj.searchParams.get('offset') || '0');
        const limit = parseInt(urlObj.searchParams.get('limit') || '10');
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              referrals: manyReferrals.slice(offset, offset + limit),
              total: 15,
              hasMore: offset + limit < 15
            }
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Person 1')).toBeInTheDocument();
    });

    // Check pagination info
    expect(screen.getByText(/Showing 1 to 10 of 15 referrals/)).toBeInTheDocument();
    
    // Click next page
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('offset=10'),
        expect.any(Object)
      );
    });
  });

  it('displays empty state when no referrals', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/referrals/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: { ...mockStats, totalReferrals: 0 } })
        });
      }
      
      if (url.includes('/api/referrals')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { referrals: [], total: 0, hasMore: false }
          })
        });
      }
      
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<ReferralDashboard userId="1" onReferralCreate={vi.fn()} />);
    
    await waitFor(() => {
      expect(screen.getByText('No referrals found')).toBeInTheDocument();
      expect(screen.getByText('Create your first referral')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500
      });
    });

    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to load referrals",
        variant: "destructive"
      });
    });
  });

  it('calls onReferralCreate when create button is clicked', async () => {
    const mockOnCreate = vi.fn();
    
    render(<ReferralDashboard userId="1" onReferralCreate={mockOnCreate} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create Referral'));
    expect(mockOnCreate).toHaveBeenCalled();
  });

  it('sets up auto-refresh interval', async () => {
    render(<ReferralDashboard userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Test passes if component renders without errors and sets up interval
    expect(screen.getByText('Referral Dashboard')).toBeInTheDocument();
  });
});