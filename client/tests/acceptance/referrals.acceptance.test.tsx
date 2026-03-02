/**
 * User Acceptance Testing for Referrals System
 * Tests from the perspective of different user personas
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReferralForm } from '../../components/ReferralForm';
import { ReferralDashboard } from '../../components/ReferralDashboard';
import { RewardsDashboard } from '../../components/RewardsDashboard';
import { ReferralAdminPanel } from '../../components/ReferralAdminPanel';
import { RefereeResponse } from '../../pages/RefereeResponse';

// Mock API responses
const mockFetch = vi.fn();
global.fetch = mockFetch;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Referrals System - User Acceptance Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Referrer User Journey', () => {
    it('should allow referrer to create a new referral successfully', async () => {
      const user = userEvent.setup();

      // Mock successful referral creation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 1,
            referee_name: 'John Smith',
            referee_email: 'john@example.com',
            status: 'pending'
          }
        })
      });

      render(
        <TestWrapper>
          <ReferralForm />
        </TestWrapper>
      );

      // Fill out the referral form
      await user.type(screen.getByLabelText(/referee name/i), 'John Smith');
      await user.type(screen.getByLabelText(/referee email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/position title/i), 'Software Engineer');
      await user.type(screen.getByLabelText(/company name/i), 'Tech Corp');
      await user.type(
        screen.getByLabelText(/personal message/i),
        'I think you would be perfect for this role!'
      );

      // Submit the form
      await user.click(screen.getByRole('button', { name: /send referral/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/referral sent successfully/i)).toBeInTheDocument();
      });

      // Verify API was called with correct data
      expect(mockFetch).toHaveBeenCalledWith('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referee_name: 'John Smith',
          referee_email: 'john@example.com',
          position_title: 'Software Engineer',
          company_name: 'Tech Corp',
          personal_message: 'I think you would be perfect for this role!'
        })
      });
    });

    it('should display validation errors for invalid form data', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ReferralForm />
        </TestWrapper>
      );

      // Try to submit empty form
      await user.click(screen.getByRole('button', { name: /send referral/i }));

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/referee name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/referee email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/position title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
      });

      // Fill invalid email
      await user.type(screen.getByLabelText(/referee email/i), 'invalid-email');
      await user.click(screen.getByRole('button', { name: /send referral/i }));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show referrer dashboard with referral tracking', async () => {
      // Mock referrals data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            {
              id: 1,
              referee_name: 'John Smith',
              referee_email: 'john@example.com',
              position_title: 'Software Engineer',
              company_name: 'Tech Corp',
              status: 'contacted',
              created_at: '2024-01-15T10:00:00Z',
              reward_amount: 500
            },
            {
              id: 2,
              referee_name: 'Jane Doe',
              referee_email: 'jane@example.com',
              position_title: 'Product Manager',
              company_name: 'Startup Inc',
              status: 'hired',
              created_at: '2024-01-10T10:00:00Z',
              reward_amount: 750
            }
          ]
        })
      });

      render(
        <TestWrapper>
          <ReferralDashboard />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText('Contacted')).toBeInTheDocument();
      expect(screen.getByText('Hired')).toBeInTheDocument();

      // Check reward amounts
      expect(screen.getByText('$500')).toBeInTheDocument();
      expect(screen.getByText('$750')).toBeInTheDocument();
    });

    it('should allow filtering and sorting of referrals', async () => {
      const user = userEvent.setup();

      // Mock initial data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 1, referee_name: 'John Smith', status: 'pending', created_at: '2024-01-15T10:00:00Z' },
            { id: 2, referee_name: 'Jane Doe', status: 'hired', created_at: '2024-01-10T10:00:00Z' }
          ]
        })
      });

      render(
        <TestWrapper>
          <ReferralDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
      });

      // Mock filtered data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 2, referee_name: 'Jane Doe', status: 'hired', created_at: '2024-01-10T10:00:00Z' }
          ]
        })
      });

      // Filter by status
      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      await user.click(statusFilter);
      await user.click(screen.getByText('Hired'));

      // Verify filtered results
      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
      });
    });
  });

  describe('Referee User Journey', () => {
    it('should allow referee to respond to referral invitation', async () => {
      const user = userEvent.setup();

      // Mock referral data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 1,
            referee_name: 'John Smith',
            position_title: 'Software Engineer',
            company_name: 'Tech Corp',
            referrer_name: 'Jane Doe',
            personal_message: 'Great opportunity for you!',
            job_description: 'We are looking for a skilled software engineer...'
          }
        })
      });

      // Mock response submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <TestWrapper>
          <RefereeResponse />
        </TestWrapper>
      );

      // Wait for referral data to load
      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Tech Corp')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });

      // Express interest
      await user.click(screen.getByRole('button', { name: /i'm interested/i }));

      // Fill out response form
      await user.type(
        screen.getByLabelText(/additional comments/i),
        'I am very interested in this opportunity!'
      );

      // Submit response
      await user.click(screen.getByRole('button', { name: /submit response/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/response submitted successfully/i)).toBeInTheDocument();
      });
    });

    it('should allow referee to decline referral with feedback', async () => {
      const user = userEvent.setup();

      // Mock referral data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 1,
            referee_name: 'John Smith',
            position_title: 'Software Engineer',
            company_name: 'Tech Corp',
            referrer_name: 'Jane Doe'
          }
        })
      });

      // Mock decline submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <TestWrapper>
          <RefereeResponse />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      });

      // Decline the referral
      await user.click(screen.getByRole('button', { name: /not interested/i }));

      // Provide feedback
      await user.type(
        screen.getByLabelText(/reason for declining/i),
        'Not looking for new opportunities at this time'
      );

      // Submit decline
      await user.click(screen.getByRole('button', { name: /submit response/i }));

      await waitFor(() => {
        expect(screen.getByText(/response submitted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Admin User Journey', () => {
    it('should allow admin to configure program settings', async () => {
      const user = userEvent.setup();

      // Mock admin data
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { totalReferrals: 150, pendingApprovals: 5, fraudAlerts: 2 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              default_reward_amount: '500',
              minimum_payout_threshold: '100',
              referral_expiry_days: '90',
              max_referrals_per_day: '10',
              auto_approve_rewards: 'true'
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { patterns: [], riskScore: 15 } })
        });

      // Mock config update
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <TestWrapper>
          <ReferralAdminPanel />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Total referrals
      });

      // Navigate to configuration tab
      await user.click(screen.getByRole('tab', { name: /configuration/i }));

      // Update reward amount
      const rewardInput = screen.getByLabelText(/default reward amount/i);
      await user.clear(rewardInput);
      await user.type(rewardInput, '750');

      // Verify the update was made
      expect(rewardInput).toHaveValue('750');
    });

    it('should allow admin to approve/reject high-value rewards', async () => {
      const user = userEvent.setup();

      // Mock admin data with pending approvals
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { totalReferrals: 150, pendingApprovals: 1, fraudAlerts: 0 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: [{
              id: 1,
              referrer_name: 'Jane Doe',
              referee_name: 'John Smith',
              position_title: 'Senior Engineer',
              company_name: 'Big Tech Corp',
              reward_amount: 1500,
              created_at: '2024-01-15T10:00:00Z'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: { patterns: [], riskScore: 10 } })
        });

      // Mock approval
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <TestWrapper>
          <ReferralAdminPanel />
        </TestWrapper>
      );

      // Wait for data to load and navigate to approvals
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument(); // Pending approvals count
      });

      await user.click(screen.getByRole('tab', { name: /pending approvals/i }));

      // Wait for approval data
      await waitFor(() => {
        expect(screen.getByText('John Smith')).toBeInTheDocument();
        expect(screen.getByText('$1,500')).toBeInTheDocument();
      });

      // Approve the reward
      await user.click(screen.getByRole('button', { name: /approve/i }));

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/referrals/1/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      });
    });

    it('should display fraud detection alerts and patterns', async () => {
      // Mock admin data with fraud alerts
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { totalReferrals: 150, pendingApprovals: 0, fraudAlerts: 3 }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: {} })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              riskScore: 75,
              patterns: [
                {
                  type: 'sequential_emails',
                  description: 'Sequential email pattern detected',
                  count: 5,
                  severity: 'high',
                  affectedReferrals: [1, 2, 3, 4, 5]
                }
              ],
              recommendations: [
                'Review referrals with sequential email patterns',
                'Consider implementing additional email validation'
              ]
            }
          })
        });

      render(
        <TestWrapper>
          <ReferralAdminPanel />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // Fraud alerts count
      });

      // Navigate to fraud detection tab
      const user = userEvent.setup();
      await user.click(screen.getByRole('tab', { name: /fraud detection/i }));

      // Check fraud detection content
      await waitFor(() => {
        expect(screen.getByText('75%')).toBeInTheDocument(); // Risk score
        expect(screen.getByText('Sequential email pattern detected')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument(); // Severity badge
      });
    });
  });

  describe('Rewards and Payouts Journey', () => {
    it('should display rewards dashboard with earnings breakdown', async () => {
      // Mock rewards data
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            totalEarnings: 2500,
            pendingRewards: 750,
            paidRewards: 1750,
            recentRewards: [
              {
                id: 1,
                referral_id: 1,
                amount: 500,
                status: 'paid',
                created_at: '2024-01-15T10:00:00Z',
                referee_name: 'John Smith'
              },
              {
                id: 2,
                referral_id: 2,
                amount: 750,
                status: 'pending',
                created_at: '2024-01-20T10:00:00Z',
                referee_name: 'Jane Doe'
              }
            ]
          }
        })
      });

      render(
        <TestWrapper>
          <RewardsDashboard />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('$2,500')).toBeInTheDocument(); // Total earnings
        expect(screen.getByText('$750')).toBeInTheDocument(); // Pending rewards
        expect(screen.getByText('$1,750')).toBeInTheDocument(); // Paid rewards
      });

      // Check individual rewards
      expect(screen.getByText('John Smith')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Paid')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should allow payout request when threshold is met', async () => {
      const user = userEvent.setup();

      // Mock rewards data with sufficient balance
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            totalEarnings: 500,
            pendingRewards: 500,
            paidRewards: 0,
            canRequestPayout: true,
            minimumThreshold: 100
          }
        })
      });

      // Mock payout request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <TestWrapper>
          <RewardsDashboard />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('$500')).toBeInTheDocument();
      });

      // Request payout
      const payoutButton = screen.getByRole('button', { name: /request payout/i });
      expect(payoutButton).not.toBeDisabled();
      
      await user.click(payoutButton);

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText(/payout request submitted/i)).toBeInTheDocument();
      });
    });
  });
});