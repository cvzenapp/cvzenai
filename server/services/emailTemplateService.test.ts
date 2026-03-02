import { describe, it, expect, beforeEach } from 'vitest';
import { EmailTemplateService, ReferralInvitationData, StatusUpdateData, RewardConfirmationData, WeeklyDigestData } from './emailTemplateService';

describe('EmailTemplateService', () => {
  let service: EmailTemplateService;

  beforeEach(() => {
    service = new EmailTemplateService();
  });

  describe('renderReferralInvitation', () => {
    it('should render referral invitation template with all data', () => {
      const data: ReferralInvitationData = {
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        personalMessage: 'I think you would be perfect for this role!',
        referralLink: 'https://cvzen.com/referral/abc123',
        declineLink: 'https://cvzen.com/referral/abc123/decline',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789'
      };

      const result = service.renderReferralInvitation(data);

      expect(result).toContain('Alex Morgan');
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Senior Developer');
      expect(result).toContain('Tech Corp');
      expect(result).toContain('I think you would be perfect for this role!');
      expect(result).toContain('https://cvzen.com/referral/abc123');
      expect(result).toContain('CVZen');
    });

    it('should handle missing personal message', () => {
      const data: ReferralInvitationData = {
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        referralLink: 'https://cvzen.com/referral/abc123',
        declineLink: 'https://cvzen.com/referral/abc123/decline',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789'
      };

      const result = service.renderReferralInvitation(data);

      expect(result).toContain('Alex Morgan');
      expect(result).toContain('Jane Smith');
      // Should not contain personal message section when not provided
      expect(result).not.toContain('Personal message from');
    });
  });

  describe('renderStatusUpdate', () => {
    it('should render status update template with reward information', () => {
      const data: StatusUpdateData = {
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        status: 'paid_user',
        statusDisplay: 'Paid User',
        referralDate: '2024-01-15',
        lastUpdated: '2024-01-20',
        statusMessage: 'Congratulations! Your referral became a paid subscriber.',
        showRewardInfo: true,
        rewardEarned: true,
        rewardAmount: 30,
        dashboardLink: 'https://cvzen.com/dashboard/referrals',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789'
      };

      const result = service.renderStatusUpdate(data);

      expect(result).toContain('Jane Smith');
      expect(result).toContain('Senior Developer');
      expect(result).toContain('Tech Corp');
      expect(result).toContain('Paid User');
      expect(result).toContain('status-paid_user');
      expect(result).toContain('Congratulations! Your referral became a paid subscriber.');
      expect(result).toContain('$30');
    });

    it('should handle pending status without reward info', () => {
      const data: StatusUpdateData = {
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        status: 'pending',
        statusDisplay: 'Pending',
        referralDate: '2024-01-15',
        lastUpdated: '2024-01-16',
        showRewardInfo: false,
        rewardEarned: false,
        rewardAmount: 30,
        dashboardLink: 'https://cvzen.com/dashboard/referrals',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789'
      };

      const result = service.renderStatusUpdate(data);

      expect(result).toContain('Pending');
      expect(result).toContain('status-pending');
      expect(result).not.toContain('Reward Information');
    });
  });

  describe('renderRewardConfirmation', () => {
    it('should render reward confirmation with payment processed', () => {
      const data: RewardConfirmationData = {
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        rewardAmount: 30,
        referralDate: '2024-01-15',
        subscriptionDate: '2024-01-20',
        paymentProcessed: true,
        paymentMethod: 'PayPal',
        transactionId: 'TXN123456',
        processingDate: '2024-01-21',
        minPayoutThreshold: 100,
        previousBalance: 70,
        newBalance: 100,
        rewardsDashboardLink: 'https://cvzen.com/dashboard/rewards',
        referralDashboardLink: 'https://cvzen.com/dashboard/referrals',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789'
      };

      const result = service.renderRewardConfirmation(data);

      expect(result).toContain('$30');
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Senior Developer');
      expect(result).toContain('PayPal');
      expect(result).toContain('TXN123456');
      expect(result).toContain('$70');
      expect(result).toContain('$100');
      expect(result).toContain('🎉');
    });

    it('should render reward confirmation with payment pending', () => {
      const data: RewardConfirmationData = {
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        rewardAmount: 30,
        referralDate: '2024-01-15',
        subscriptionDate: '2024-01-20',
        paymentProcessed: false,
        minPayoutThreshold: 100,
        previousBalance: 20,
        newBalance: 50,
        rewardsDashboardLink: 'https://cvzen.com/dashboard/rewards',
        referralDashboardLink: 'https://cvzen.com/dashboard/referrals',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789'
      };

      const result = service.renderRewardConfirmation(data);

      expect(result).toContain('$30');
      expect(result).toContain('minimum payout threshold of $100');
      expect(result).not.toContain('Transaction ID');
    });
  });

  describe('renderWeeklyDigest', () => {
    it('should render weekly digest with activity', () => {
      const data: WeeklyDigestData = {
        weekStartDate: '2024-01-15',
        weekEndDate: '2024-01-21',
        totalReferrals: 5,
        activeReferrals: 3,
        successfulReferrals: 1,
        conversionRate: 20,
        weeklyEarnings: 30,
        recentActivity: [
          {
            refereeName: 'Jane Smith',
            positionTitle: 'Senior Developer',
            companyName: 'Tech Corp',
            status: 'paid_user',
            statusDisplay: 'Paid User',
            statusChange: 'Moved from trial user to paid user'
          },
          {
            refereeName: 'Bob Johnson',
            positionTitle: 'Designer',
            companyName: 'Design Co',
            status: 'interviewed',
            statusDisplay: 'Interviewed'
          }
        ],
        upcomingActions: [
          {
            refereeName: 'Alice Brown',
            actionType: 'Follow Up',
            actionDescription: 'Referral expires in 3 days - consider following up'
          }
        ],
        currentBalance: 100,
        nextPayoutDate: '2024-01-28',
        showTips: true,
        newReferralLink: 'https://cvzen.com/referrals/new',
        dashboardLink: 'https://cvzen.com/dashboard/referrals',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789',
        preferencesLink: 'https://cvzen.com/preferences'
      };

      const result = service.renderWeeklyDigest(data);

      expect(result).toContain('2024-01-15');
      expect(result).toContain('2024-01-21');
      expect(result).toContain('5'); // total referrals
      expect(result).toContain('3'); // active referrals
      expect(result).toContain('20%'); // conversion rate
      expect(result).toContain('$30'); // weekly earnings
      expect(result).toContain('Jane Smith');
      expect(result).toContain('Bob Johnson');
      expect(result).toContain('Alice Brown');
      expect(result).toContain('Follow Up');
      expect(result).toContain('💡 Referral Tips');
    });

    it('should render weekly digest with no activity', () => {
      const data: WeeklyDigestData = {
        weekStartDate: '2024-01-15',
        weekEndDate: '2024-01-21',
        totalReferrals: 0,
        activeReferrals: 0,
        successfulReferrals: 0,
        conversionRate: 0,
        recentActivity: [],
        upcomingActions: [],
        currentBalance: 0,
        nextPayoutDate: 'N/A',
        showTips: false,
        newReferralLink: 'https://cvzen.com/referrals/new',
        dashboardLink: 'https://cvzen.com/dashboard/referrals',
        unsubscribeLink: 'https://cvzen.com/unsubscribe/xyz789',
        preferencesLink: 'https://cvzen.com/preferences'
      };

      const result = service.renderWeeklyDigest(data);

      expect(result).toContain('No referral activity this week');
      expect(result).not.toContain('💡 Referral Tips');
      expect(result).not.toContain('Earned This Week');
    });
  });

  describe('testTemplateRendering', () => {
    it('should test referral invitation template rendering', async () => {
      const testData: ReferralInvitationData = {
        referrerName: 'Test User',
        refereeEmail: 'test@example.com',
        refereeName: 'Test Referee',
        positionTitle: 'Test Position',
        companyName: 'Test Company',
        referralLink: 'https://test.com/referral',
        declineLink: 'https://test.com/decline',
        unsubscribeLink: 'https://test.com/unsubscribe'
      };

      const result = await service.testTemplateRendering('referralInvitation', testData);

      expect(result.html).toContain('Test User');
      expect(result.textPreview).toContain('Test Referee'); // The referee name should be in the text preview
      expect(result.estimatedSize).toBeGreaterThan(0);
      expect(result.textPreview.length).toBeLessThanOrEqual(203); // 200 + '...'
    });

    it('should throw error for unknown template', async () => {
      await expect(
        service.testTemplateRendering('unknownTemplate', {})
      ).rejects.toThrow('Unknown template: unknownTemplate');
    });
  });

  describe('generatePlainTextVersion', () => {
    it('should convert HTML to plain text', () => {
      const html = `
        <html>
          <head><style>body { color: red; }</style></head>
          <body>
            <h1>Hello World</h1>
            <p>This is a <strong>test</strong> email.</p>
            <a href="https://example.com">Click here</a>
          </body>
        </html>
      `;

      const plainText = service.generatePlainTextVersion(html);

      expect(plainText).not.toContain('<');
      expect(plainText).not.toContain('>');
      expect(plainText).not.toContain('style');
      expect(plainText).toContain('Hello World');
      expect(plainText).toContain('This is a test email');
      expect(plainText).toContain('Click here');
    });
  });
});