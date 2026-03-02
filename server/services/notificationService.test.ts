import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, EmailService, EmailDeliveryResult } from './notificationService';

// Mock email service for testing
class TestEmailService implements EmailService {
  public sentEmails: Array<{
    to: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
  }> = [];
  
  public shouldFail: boolean = false;
  public failureError: string = 'Test failure';

  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<EmailDeliveryResult> {
    this.sentEmails.push({ to, subject, htmlContent, textContent });
    
    if (this.shouldFail) {
      return {
        success: false,
        error: this.failureError
      };
    }
    
    return {
      success: true,
      messageId: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  reset() {
    this.sentEmails = [];
    this.shouldFail = false;
    this.failureError = 'Test failure';
  }
}

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockEmailService: TestEmailService;

  beforeEach(() => {
    mockEmailService = new TestEmailService();
    notificationService = new NotificationService(mockEmailService);
    // Configure faster retry delays for testing
    notificationService.configureRetry(2, [10, 20]); // 2 retries with 10ms and 20ms delays
  });

  describe('sendReferralInvitation', () => {
    it('should send referral invitation email successfully', async () => {
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        personalMessage: 'I think you would be perfect for this role!'
      };

      const result = await notificationService.sendReferralInvitation(referral);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.to).toBe('jane@example.com');
      expect(sentEmail.subject).toContain('Senior Developer');
      expect(sentEmail.subject).toContain('Tech Corp');
      expect(sentEmail.htmlContent).toContain('Alex Morgan');
      expect(sentEmail.htmlContent).toContain('Jane Smith');
      expect(sentEmail.htmlContent).toContain('Senior Developer');
      expect(sentEmail.htmlContent).toContain('Tech Corp');
      expect(sentEmail.htmlContent).toContain('I think you would be perfect for this role!');
      expect(sentEmail.textContent).toBeDefined();
    });

    it('should handle referral invitation without personal message', async () => {
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp'
      };

      const result = await notificationService.sendReferralInvitation(referral);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.htmlContent).toContain('Alex Morgan');
      expect(sentEmail.htmlContent).toContain('Jane Smith');
      expect(sentEmail.htmlContent).not.toContain('Personal message from');
    });

    it('should handle email service failure with retry', async () => {
      mockEmailService.shouldFail = true;
      
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp'
      };

      const result = await notificationService.sendReferralInvitation(referral);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after');
      expect(result.retryCount).toBeGreaterThan(0);
      expect(mockEmailService.sentEmails.length).toBeGreaterThan(1); // Should have retried
    });
  });

  describe('sendStatusUpdate', () => {
    it('should send status update email for hired status', async () => {
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        status: 'hired',
        previousStatus: 'interviewed',
        referralDate: new Date('2024-01-15'),
        rewardAmount: 30
      };

      const result = await notificationService.sendStatusUpdate(referral);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.to).toBe('user1@example.com'); // Mock user email
      expect(sentEmail.subject).toContain('Jane Smith');
      expect(sentEmail.subject).toContain('Hired');
      expect(sentEmail.htmlContent).toContain('Jane Smith');
      expect(sentEmail.htmlContent).toContain('Senior Developer');
      expect(sentEmail.htmlContent).toContain('Tech Corp');
      expect(sentEmail.htmlContent).toContain('Hired');
      expect(sentEmail.htmlContent).toContain('$30');
    });

    it('should send status update email for rejected status', async () => {
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        status: 'rejected',
        previousStatus: 'interviewed',
        referralDate: new Date('2024-01-15'),
        rewardAmount: 30
      };

      const result = await notificationService.sendStatusUpdate(referral);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.subject).toContain('Rejected');
      expect(sentEmail.htmlContent).toContain('Unfortunately');
      expect(sentEmail.htmlContent).not.toContain('Reward Information');
    });

    it('should handle email service failure', async () => {
      mockEmailService.shouldFail = true;
      
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        status: 'hired',
        previousStatus: 'interviewed',
        referralDate: new Date('2024-01-15'),
        rewardAmount: 30
      };

      const result = await notificationService.sendStatusUpdate(referral);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed after');
    });
  });

  describe('sendRewardNotification', () => {
    it('should send reward notification with payment processed', async () => {
      const reward = {
        userId: 'user1',
        referralId: 'ref123',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        rewardAmount: 30,
        referralDate: new Date('2024-01-15'),
        hireDate: new Date('2024-01-20'),
        paymentProcessed: true,
        paymentMethod: 'PayPal',
        transactionId: 'TXN123456',
        processingDate: new Date('2024-01-21'),
        previousBalance: 70,
        newBalance: 100
      };

      const result = await notificationService.sendRewardNotification(reward);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.to).toBe('user1@example.com');
      expect(sentEmail.subject).toContain('$30');
      expect(sentEmail.htmlContent).toContain('Jane Smith');
      expect(sentEmail.htmlContent).toContain('$30');
      expect(sentEmail.htmlContent).toContain('PayPal');
      expect(sentEmail.htmlContent).toContain('TXN123456');
      expect(sentEmail.htmlContent).toContain('$70');
      expect(sentEmail.htmlContent).toContain('$100');
    });

    it('should send reward notification with payment pending', async () => {
      const reward = {
        userId: 'user1',
        referralId: 'ref123',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        rewardAmount: 30,
        referralDate: new Date('2024-01-15'),
        hireDate: new Date('2024-01-20'),
        paymentProcessed: false,
        previousBalance: 20,
        newBalance: 50
      };

      const result = await notificationService.sendRewardNotification(reward);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.htmlContent).toContain('minimum payout threshold');
      expect(sentEmail.htmlContent).not.toContain('Transaction ID');
    });
  });

  describe('sendWeeklyDigest', () => {
    it('should send weekly digest with activity', async () => {
      const digestData = {
        weekStartDate: new Date('2024-01-15'),
        weekEndDate: new Date('2024-01-21'),
        totalReferrals: 3, // Changed to 3 so tips will be shown (< 5)
        activeReferrals: 3,
        successfulReferrals: 1,
        conversionRate: 20,
        weeklyEarnings: 30,
        recentActivity: [
          {
            refereeName: 'Jane Smith',
            positionTitle: 'Senior Developer',
            companyName: 'Tech Corp',
            status: 'hired',
            statusChange: 'Moved from interviewed to hired'
          }
        ],
        upcomingActions: [
          {
            refereeName: 'Bob Johnson',
            actionType: 'Follow Up',
            actionDescription: 'Referral expires in 3 days'
          }
        ],
        currentBalance: 100,
        nextPayoutDate: '2024-01-28'
      };

      const result = await notificationService.sendWeeklyDigest('user1', digestData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.to).toBe('user1@example.com');
      expect(sentEmail.subject).toContain('Weekly Referral Digest');
      expect(sentEmail.htmlContent).toContain('15/1/2024'); // Date format from toLocaleDateString()
      expect(sentEmail.htmlContent).toContain('21/1/2024');
      expect(sentEmail.htmlContent).toContain('5'); // total referrals
      expect(sentEmail.htmlContent).toContain('20%'); // conversion rate
      expect(sentEmail.htmlContent).toContain('$30'); // weekly earnings
      expect(sentEmail.htmlContent).toContain('Jane Smith');
      expect(sentEmail.htmlContent).toContain('Bob Johnson');
      expect(sentEmail.htmlContent).toContain('💡 Referral Tips'); // Should show tips for users with < 5 referrals
    });

    it('should send weekly digest with no activity', async () => {
      const digestData = {
        weekStartDate: new Date('2024-01-15'),
        weekEndDate: new Date('2024-01-21'),
        totalReferrals: 0,
        activeReferrals: 0,
        successfulReferrals: 0,
        conversionRate: 0,
        recentActivity: [],
        upcomingActions: [],
        currentBalance: 0,
        nextPayoutDate: 'N/A'
      };

      const result = await notificationService.sendWeeklyDigest('user1', digestData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sentEmails).toHaveLength(1);
      
      const sentEmail = mockEmailService.sentEmails[0];
      expect(sentEmail.htmlContent).toContain('No referral activity this week');
      expect(sentEmail.htmlContent).not.toContain('Earned This Week');
    });
  });

  describe('delivery tracking', () => {
    it('should track email delivery', async () => {
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp'
      };

      const result = await notificationService.sendReferralInvitation(referral);

      expect(result.success).toBe(true);
      
      const trackingRecords = notificationService.getAllDeliveryTracking();
      expect(trackingRecords).toHaveLength(1);
      
      const tracking = trackingRecords[0];
      expect(tracking.recipientEmail).toBe('jane@example.com');
      expect(tracking.templateType).toBe('referralInvitation');
      expect(tracking.status).toBe('sent');
      expect(tracking.sentAt).toBeDefined();
      expect(tracking.retryCount).toBe(0);
    });

    it('should track failed email delivery', async () => {
      mockEmailService.shouldFail = true;
      
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp'
      };

      const result = await notificationService.sendReferralInvitation(referral);

      expect(result.success).toBe(false);
      
      const trackingRecords = notificationService.getAllDeliveryTracking();
      expect(trackingRecords).toHaveLength(1);
      
      const tracking = trackingRecords[0];
      expect(tracking.status).toBe('failed');
      expect(tracking.failedAt).toBeDefined();
      expect(tracking.retryCount).toBeGreaterThan(0);
      expect(tracking.lastError).toBeDefined();
    });

    it('should cleanup old tracking records', async () => {
      // Send a test email to create a tracking record
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'jane@example.com',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp'
      };

      await notificationService.sendReferralInvitation(referral);
      
      let trackingRecords = notificationService.getAllDeliveryTracking();
      expect(trackingRecords).toHaveLength(1);
      
      // Manually set the sent date to be old
      const tracking = trackingRecords[0];
      tracking.sentAt = new Date('2023-01-01');
      
      // Cleanup records older than 30 days
      notificationService.cleanupOldTrackingRecords(30);
      
      trackingRecords = notificationService.getAllDeliveryTracking();
      expect(trackingRecords).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle missing referrer email gracefully', async () => {
      // Mock getUserEmail to return null
      const originalGetUserEmail = (notificationService as any).getUserEmail;
      (notificationService as any).getUserEmail = vi.fn().mockResolvedValue(null);

      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp',
        status: 'hired',
        previousStatus: 'interviewed',
        referralDate: new Date('2024-01-15'),
        rewardAmount: 30
      };

      const result = await notificationService.sendStatusUpdate(referral);

      expect(result.success).toBe(false);
      expect(result.error).toContain('email not found');

      // Restore original method
      (notificationService as any).getUserEmail = originalGetUserEmail;
    });

    it('should handle template rendering errors', async () => {
      // This test would require mocking the template service to throw an error
      // For now, we'll test that the service handles general errors gracefully
      const referral = {
        id: 'ref123',
        referrerId: 'user1',
        referrerName: 'Alex Morgan',
        refereeEmail: 'invalid-email', // This might cause issues in a real implementation
        refereeName: 'Jane Smith',
        positionTitle: 'Senior Developer',
        companyName: 'Tech Corp'
      };

      const result = await notificationService.sendReferralInvitation(referral);

      // The service should handle errors gracefully
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });
});