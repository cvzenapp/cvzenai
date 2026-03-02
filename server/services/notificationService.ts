import * as crypto from 'crypto';
import { emailTemplateService, ReferralInvitationData, StatusUpdateData, RewardConfirmationData, WeeklyDigestData } from './emailTemplateService';

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

export interface EmailDeliveryTracking {
  id: string;
  recipientEmail: string;
  templateType: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  retryCount: number;
  lastError?: string;
}

export interface UserNotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  statusUpdates: boolean;
  rewardNotifications: boolean;
  weeklyDigest: boolean;
  referralInvitations: boolean;
}

// Mock email service interface - in production this would integrate with SendGrid, AWS SES, etc.
export interface EmailService {
  sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<EmailDeliveryResult>;
}

// Mock implementation for development/testing
class MockEmailService implements EmailService {
  async sendEmail(to: string, subject: string, htmlContent: string, textContent?: string): Promise<EmailDeliveryResult> {
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate occasional failures for testing retry logic
    if (Math.random() < 0.05) { // 5% failure rate
      return {
        success: false,
        error: 'Temporary email service unavailable'
      };
    }
    
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

export class NotificationService {
  private emailService: EmailService;
  private deliveryTracking: Map<string, EmailDeliveryTracking> = new Map();
  private maxRetries: number = 3;
  private retryDelays: number[] = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor(emailService?: EmailService) {
    this.emailService = emailService || new MockEmailService();
  }

  // Configure retry settings (useful for testing)
  public configureRetry(maxRetries: number, retryDelays: number[]) {
    this.maxRetries = maxRetries;
    this.retryDelays = retryDelays;
  }

  // Generate secure referral token
  private generateReferralToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate secure links for referral emails
  private generateReferralLinks(referralId: string, token: string) {
    const baseUrl = process.env.BASE_URL || 'https://cvzen.com';
    return {
      referralLink: `${baseUrl}/referral/${referralId}?token=${token}`,
      declineLink: `${baseUrl}/referral/${referralId}/decline?token=${token}`,
      unsubscribeLink: `${baseUrl}/unsubscribe?token=${token}`
    };
  }

  // Check user notification preferences
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    // In production, this would query the database
    // For now, return default preferences
    return {
      userId,
      emailNotifications: true,
      statusUpdates: true,
      rewardNotifications: true,
      weeklyDigest: true,
      referralInvitations: true
    };
  }

  // Send referral invitation with secure token generation
  public async sendReferralInvitation(referral: {
    id: string;
    referrerId: string;
    referrerName: string;
    refereeEmail: string;
    refereeName: string;
    positionTitle: string;
    companyName: string;
    personalMessage?: string;
  }): Promise<EmailDeliveryResult> {
    try {
      // Check if referrer has email notifications enabled
      const preferences = await this.getUserPreferences(referral.referrerId);
      if (!preferences.emailNotifications || !preferences.referralInvitations) {
        return { success: false, error: 'User has disabled referral invitation emails' };
      }

      // Generate secure token and links
      const token = this.generateReferralToken();
      const links = this.generateReferralLinks(referral.id, token);

      // Prepare template data
      const templateData: ReferralInvitationData = {
        referrerName: referral.referrerName,
        refereeEmail: referral.refereeEmail,
        refereeName: referral.refereeName,
        positionTitle: referral.positionTitle,
        companyName: referral.companyName,
        personalMessage: referral.personalMessage,
        referralLink: links.referralLink,
        declineLink: links.declineLink,
        unsubscribeLink: links.unsubscribeLink
      };

      // Render email template
      const htmlContent = emailTemplateService.renderReferralInvitation(templateData);
      const textContent = emailTemplateService.generatePlainTextVersion(htmlContent);

      // Create delivery tracking record
      const trackingId = crypto.randomUUID();
      const tracking: EmailDeliveryTracking = {
        id: trackingId,
        recipientEmail: referral.refereeEmail,
        templateType: 'referralInvitation',
        status: 'pending',
        retryCount: 0
      };
      this.deliveryTracking.set(trackingId, tracking);

      // Send email with retry logic
      const result = await this.sendEmailWithRetry(
        referral.refereeEmail,
        `You've been referred for a ${referral.positionTitle} position at ${referral.companyName}`,
        htmlContent,
        textContent,
        trackingId
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Send status update notification with proper recipient targeting
  public async sendStatusUpdate(referral: {
    id: string;
    referrerId: string;
    refereeName: string;
    positionTitle: string;
    companyName: string;
    status: string;
    previousStatus: string;
    referralDate: Date;
    rewardAmount: number;
  }): Promise<EmailDeliveryResult> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(referral.referrerId);
      if (!preferences.emailNotifications || !preferences.statusUpdates) {
        return { success: false, error: 'User has disabled status update emails' };
      }

      // Get referrer email (in production, query from database)
      const referrerEmail = await this.getUserEmail(referral.referrerId);
      if (!referrerEmail) {
        return { success: false, error: 'Referrer email not found' };
      }

      // Generate status-specific message
      const statusMessages = {
        signed_up: 'Your referee has signed up for CVZen!',
        trial_user: 'Your referee is now using CVZen as a trial user.',
        paid_user: 'Congratulations! Your referee became a paid subscriber.',
        declined: 'Unfortunately, your referee declined to join CVZen.',
        expired: 'This referral has expired due to inactivity.'
      };

      // Prepare template data
      const templateData: StatusUpdateData = {
        refereeName: referral.refereeName,
        positionTitle: referral.positionTitle,
        companyName: referral.companyName,
        status: referral.status,
        statusDisplay: this.formatStatusDisplay(referral.status),
        referralDate: referral.referralDate.toLocaleDateString(),
        lastUpdated: new Date().toLocaleDateString(),
        statusMessage: statusMessages[referral.status as keyof typeof statusMessages],
        showRewardInfo: referral.status === 'paid_user',
        rewardEarned: referral.status === 'paid_user',
        rewardAmount: referral.rewardAmount,
        dashboardLink: `${process.env.BASE_URL || 'https://cvzen.com'}/dashboard/referrals`,
        unsubscribeLink: `${process.env.BASE_URL || 'https://cvzen.com'}/unsubscribe?userId=${referral.referrerId}`
      };

      // Render email template
      const htmlContent = emailTemplateService.renderStatusUpdate(templateData);
      const textContent = emailTemplateService.generatePlainTextVersion(htmlContent);

      // Create delivery tracking record
      const trackingId = crypto.randomUUID();
      const tracking: EmailDeliveryTracking = {
        id: trackingId,
        recipientEmail: referrerEmail,
        templateType: 'statusUpdate',
        status: 'pending',
        retryCount: 0
      };
      this.deliveryTracking.set(trackingId, tracking);

      // Send email
      const result = await this.sendEmailWithRetry(
        referrerEmail,
        `Referral Update: ${referral.refereeName} - ${this.formatStatusDisplay(referral.status)}`,
        htmlContent,
        textContent,
        trackingId
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Send reward notification with payment details
  public async sendRewardNotification(reward: {
    userId: string;
    referralId: string;
    refereeName: string;
    positionTitle: string;
    companyName: string;
    rewardAmount: number;
    referralDate: Date;
    hireDate: Date;
    paymentProcessed: boolean;
    paymentMethod?: string;
    transactionId?: string;
    processingDate?: Date;
    previousBalance: number;
    newBalance: number;
  }): Promise<EmailDeliveryResult> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(reward.userId);
      if (!preferences.emailNotifications || !preferences.rewardNotifications) {
        return { success: false, error: 'User has disabled reward notification emails' };
      }

      // Get user email
      const userEmail = await this.getUserEmail(reward.userId);
      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }

      // Prepare template data
      const templateData: RewardConfirmationData = {
        refereeName: reward.refereeName,
        positionTitle: reward.positionTitle,
        companyName: reward.companyName,
        rewardAmount: reward.rewardAmount,
        referralDate: reward.referralDate.toLocaleDateString(),
        hireDate: reward.hireDate.toLocaleDateString(),
        paymentProcessed: reward.paymentProcessed,
        paymentMethod: reward.paymentMethod,
        transactionId: reward.transactionId,
        processingDate: reward.processingDate?.toLocaleDateString(),
        minPayoutThreshold: 100, // This should come from configuration
        previousBalance: reward.previousBalance,
        newBalance: reward.newBalance,
        rewardsDashboardLink: `${process.env.BASE_URL || 'https://cvzen.com'}/dashboard/rewards`,
        referralDashboardLink: `${process.env.BASE_URL || 'https://cvzen.com'}/dashboard/referrals`,
        unsubscribeLink: `${process.env.BASE_URL || 'https://cvzen.com'}/unsubscribe?userId=${reward.userId}`
      };

      // Render email template
      const htmlContent = emailTemplateService.renderRewardConfirmation(templateData);
      const textContent = emailTemplateService.generatePlainTextVersion(htmlContent);

      // Create delivery tracking record
      const trackingId = crypto.randomUUID();
      const tracking: EmailDeliveryTracking = {
        id: trackingId,
        recipientEmail: userEmail,
        templateType: 'rewardConfirmation',
        status: 'pending',
        retryCount: 0
      };
      this.deliveryTracking.set(trackingId, tracking);

      // Send email
      const result = await this.sendEmailWithRetry(
        userEmail,
        `Congratulations! You've earned $${reward.rewardAmount} for your referral`,
        htmlContent,
        textContent,
        trackingId
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Send weekly digest with user preference checking
  public async sendWeeklyDigest(userId: string, digestData: {
    weekStartDate: Date;
    weekEndDate: Date;
    totalReferrals: number;
    activeReferrals: number;
    successfulReferrals: number;
    conversionRate: number;
    weeklyEarnings?: number;
    recentActivity: Array<{
      refereeName: string;
      positionTitle: string;
      companyName: string;
      status: string;
      statusChange?: string;
    }>;
    upcomingActions: Array<{
      refereeName: string;
      actionType: string;
      actionDescription: string;
    }>;
    currentBalance: number;
    nextPayoutDate: string;
  }): Promise<EmailDeliveryResult> {
    try {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId);
      if (!preferences.emailNotifications || !preferences.weeklyDigest) {
        return { success: false, error: 'User has disabled weekly digest emails' };
      }

      // Get user email
      const userEmail = await this.getUserEmail(userId);
      if (!userEmail) {
        return { success: false, error: 'User email not found' };
      }

      // Prepare template data
      const templateData: WeeklyDigestData = {
        weekStartDate: digestData.weekStartDate.toLocaleDateString(),
        weekEndDate: digestData.weekEndDate.toLocaleDateString(),
        totalReferrals: digestData.totalReferrals,
        activeReferrals: digestData.activeReferrals,
        successfulReferrals: digestData.successfulReferrals,
        conversionRate: digestData.conversionRate,
        weeklyEarnings: digestData.weeklyEarnings,
        recentActivity: digestData.recentActivity.map(activity => ({
          ...activity,
          statusDisplay: this.formatStatusDisplay(activity.status)
        })),
        upcomingActions: digestData.upcomingActions,
        currentBalance: digestData.currentBalance,
        nextPayoutDate: digestData.nextPayoutDate,
        showTips: digestData.totalReferrals < 5, // Show tips for new users
        newReferralLink: `${process.env.BASE_URL || 'https://cvzen.com'}/referrals/new`,
        dashboardLink: `${process.env.BASE_URL || 'https://cvzen.com'}/dashboard/referrals`,
        unsubscribeLink: `${process.env.BASE_URL || 'https://cvzen.com'}/unsubscribe?userId=${userId}`,
        preferencesLink: `${process.env.BASE_URL || 'https://cvzen.com'}/preferences`
      };

      // Render email template
      const htmlContent = emailTemplateService.renderWeeklyDigest(templateData);
      const textContent = emailTemplateService.generatePlainTextVersion(htmlContent);

      // Create delivery tracking record
      const trackingId = crypto.randomUUID();
      const tracking: EmailDeliveryTracking = {
        id: trackingId,
        recipientEmail: userEmail,
        templateType: 'weeklyDigest',
        status: 'pending',
        retryCount: 0
      };
      this.deliveryTracking.set(trackingId, tracking);

      // Send email
      const result = await this.sendEmailWithRetry(
        userEmail,
        `Your Weekly Referral Digest - ${digestData.weekStartDate.toLocaleDateString()} to ${digestData.weekEndDate.toLocaleDateString()}`,
        htmlContent,
        textContent,
        trackingId
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Email delivery tracking and retry mechanisms
  private async sendEmailWithRetry(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    trackingId: string
  ): Promise<EmailDeliveryResult> {
    const tracking = this.deliveryTracking.get(trackingId);
    if (!tracking) {
      return { success: false, error: 'Tracking record not found' };
    }

    let lastError: string | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Add delay for retries
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelays[attempt - 1] || 15000));
        }

        const result = await this.emailService.sendEmail(to, subject, htmlContent, textContent);
        
        if (result.success) {
          // Update tracking record
          tracking.status = 'sent';
          tracking.sentAt = new Date();
          tracking.retryCount = attempt;
          this.deliveryTracking.set(trackingId, tracking);
          
          return { ...result, retryCount: attempt };
        } else {
          lastError = result.error;
          tracking.retryCount = attempt;
          tracking.lastError = result.error;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        tracking.retryCount = attempt;
        tracking.lastError = lastError;
      }
    }

    // All retries failed
    tracking.status = 'failed';
    tracking.failedAt = new Date();
    this.deliveryTracking.set(trackingId, tracking);

    return {
      success: false,
      error: `Failed after ${this.maxRetries + 1} attempts. Last error: ${lastError}`,
      retryCount: this.maxRetries + 1
    };
  }

  // Helper method to get user email (mock implementation)
  private async getUserEmail(userId: string): Promise<string | null> {
    // In production, this would query the database
    // For testing, return a mock email
    return `${userId}@example.com`;
  }

  // Helper method to format status display names
  private formatStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      signed_up: 'Signed Up',
      trial_user: 'Trial User',
      paid_user: 'Paid User',
      declined: 'Declined',
      expired: 'Expired'
    };
    return statusMap[status] || status;
  }

  // Get delivery tracking information
  public getDeliveryTracking(trackingId: string): EmailDeliveryTracking | undefined {
    return this.deliveryTracking.get(trackingId);
  }

  // Get all delivery tracking records for debugging
  public getAllDeliveryTracking(): EmailDeliveryTracking[] {
    return Array.from(this.deliveryTracking.values());
  }

  // Clean up old tracking records (should be called periodically)
  public cleanupOldTrackingRecords(olderThanDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    for (const [id, tracking] of this.deliveryTracking.entries()) {
      const recordDate = tracking.sentAt || tracking.failedAt;
      if (recordDate && recordDate < cutoffDate) {
        this.deliveryTracking.delete(id);
      }
    }
  }
}

export const notificationService = new NotificationService();