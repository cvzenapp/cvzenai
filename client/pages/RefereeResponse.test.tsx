import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import RefereeResponse from './RefereeResponse';

// Mock the react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ token: 'test-token-123' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock the toast hook
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockReferralDetails = {
  id: 1,
  refereeName: 'Alex Morgan',
  referrerName: 'Jane Smith',
  positionTitle: 'Software Engineer',
  companyName: 'Tech Corp',
  personalMessage: 'I think you would be perfect for this role!',
  rewardAmount: 30,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  status: 'pending'
};

describe('RefereeResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<RefereeResponse />, { wrapper: createWrapper() });

    expect(screen.getByText('Loading referral details...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Loading spinner
  });

  it('renders referral details when loaded successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReferralDetails
      })
    });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("You've Been Referred!")).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith thinks you\'d be perfect for this opportunity')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('I think you would be perfect for this role!')).toBeInTheDocument();
    expect(screen.getByText('Referral reward: $30')).toBeInTheDocument();
  });

  it('renders error state when referral not found', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Referral not found'
      })
    });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Referral not found')).toBeInTheDocument();
    expect(screen.getByText('Go to Homepage')).toBeInTheDocument();
  });

  it('shows expired message for expired referrals', async () => {
    const expiredReferral = {
      ...mockReferralDetails,
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: expiredReferral
      })
    });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('This referral has expired. Please contact the referrer directly if you\'re still interested.')).toBeInTheDocument();
    });

    // Should not show response form for expired referrals
    expect(screen.queryByText('Your Response')).not.toBeInTheDocument();
  });

  it('allows user to express interest', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReferralDetails
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { referralId: 1, status: 'contacted' }
        })
      });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Select interested option
    const interestedRadio = screen.getByLabelText('Yes, I\'m interested');
    fireEvent.click(interestedRadio);

    // Submit response
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/referrals/referee/test-token-123/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'interested',
          createAccount: false
        })
      });
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Response Submitted",
        description: "Thank you for your interest! The referrer has been notified."
      });
    });
  });

  it('allows user to decline with feedback', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReferralDetails
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { referralId: 1, status: 'declined' }
        })
      });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Select declined option
    const declinedRadio = screen.getByLabelText('No, not interested');
    fireEvent.click(declinedRadio);

    // Add feedback
    const feedbackTextarea = screen.getByPlaceholderText('Help us understand why this opportunity isn\'t a good fit...');
    fireEvent.change(feedbackTextarea, { target: { value: 'Not looking for new opportunities right now' } });

    // Submit response
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/referrals/referee/test-token-123/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'declined',
          feedback: 'Not looking for new opportunities right now',
          createAccount: false
        })
      });
    });
  });

  it('allows user to create account when interested', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReferralDetails
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { referralId: 1, status: 'contacted', accountCreated: true }
        })
      });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Select interested option
    const interestedRadio = screen.getByLabelText('Yes, I\'m interested');
    fireEvent.click(interestedRadio);

    // Check create account option
    const createAccountCheckbox = screen.getByLabelText('Create a CVZen account to track this opportunity');
    fireEvent.click(createAccountCheckbox);

    // Fill account information
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    const phoneInput = screen.getByLabelText('Phone Number');
    const linkedinInput = screen.getByLabelText('LinkedIn Profile URL');

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    fireEvent.change(phoneInput, { target: { value: '+1234567890' } });
    fireEvent.change(linkedinInput, { target: { value: 'https://linkedin.com/in/johndoe' } });

    // Submit response
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/referrals/referee/test-token-123/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'interested',
          createAccount: true,
          accountData: {
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            linkedinUrl: 'https://linkedin.com/in/johndoe'
          }
        })
      });
    });
  });

  it('validates required fields when creating account', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReferralDetails
      })
    });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Select interested option
    const interestedRadio = screen.getByLabelText('Yes, I\'m interested');
    fireEvent.click(interestedRadio);

    // Check create account option
    const createAccountCheckbox = screen.getByLabelText('Create a CVZen account to track this opportunity');
    fireEvent.click(createAccountCheckbox);

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    // Should show HTML5 validation errors for required fields
    const firstNameInput = screen.getByLabelText('First Name *');
    const lastNameInput = screen.getByLabelText('Last Name *');
    
    expect(firstNameInput).toBeRequired();
    expect(lastNameInput).toBeRequired();
  });

  it('shows success message after submission', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReferralDetails
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { referralId: 1, status: 'contacted' }
        })
      });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Select interested and submit
    const interestedRadio = screen.getByLabelText('Yes, I\'m interested');
    fireEvent.click(interestedRadio);

    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Response Submitted')).toBeInTheDocument();
    });

    expect(screen.getByText('Thank you for your interest! We\'ll be in touch soon with next steps.')).toBeInTheDocument();
    expect(screen.getByText('Explore CVZen')).toBeInTheDocument();
  });

  it('handles submission errors gracefully', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockReferralDetails
        })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Response already submitted'
        })
      });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Select interested and submit
    const interestedRadio = screen.getByLabelText('Yes, I\'m interested');
    fireEvent.click(interestedRadio);

    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Submission Failed",
        description: "Response already submitted",
        variant: "destructive"
      });
    });
  });

  it('requires response selection before submission', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockReferralDetails
      })
    });

    render(<RefereeResponse />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Your Response')).toBeInTheDocument();
    });

    // Try to submit without selecting response
    const submitButton = screen.getByText('Submit Response');
    fireEvent.click(submitButton);

    expect(mockToast).toHaveBeenCalledWith({
      title: "Response Required",
      description: "Please indicate whether you're interested or not.",
      variant: "destructive"
    });

    // Should not make API call
    expect(fetch).toHaveBeenCalledTimes(1); // Only the initial load call
  });
});