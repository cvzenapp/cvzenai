import * as fs from 'fs';
import * as path from 'path';

export interface ReferralInvitationData {
  referrerName: string;
  refereeEmail: string;
  refereeName: string;
  positionTitle: string;
  companyName: string;
  personalMessage?: string;
  referralLink: string;
  declineLink: string;
  unsubscribeLink: string;
}

export interface StatusUpdateData {
  refereeName: string;
  positionTitle: string;
  companyName: string;
  status: string;
  statusDisplay: string;
  referralDate: string;
  lastUpdated: string;
  statusMessage?: string;
  showRewardInfo: boolean;
  rewardEarned: boolean;
  rewardAmount: number;
  dashboardLink: string;
  unsubscribeLink: string;
}

export interface RewardConfirmationData {
  refereeName: string;
  positionTitle: string;
  companyName: string;
  rewardAmount: number;
  referralDate: string;
  subscriptionDate: string;
  paymentProcessed: boolean;
  paymentMethod?: string;
  transactionId?: string;
  processingDate?: string;
  minPayoutThreshold: number;
  previousBalance: number;
  newBalance: number;
  rewardsDashboardLink: string;
  referralDashboardLink: string;
  unsubscribeLink: string;
}

export interface WeeklyDigestData {
  weekStartDate: string;
  weekEndDate: string;
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
    statusDisplay: string;
    statusChange?: string;
  }>;
  upcomingActions: Array<{
    refereeName: string;
    actionType: string;
    actionDescription: string;
  }>;
  currentBalance: number;
  nextPayoutDate: string;
  showTips: boolean;
  newReferralLink: string;
  dashboardLink: string;
  unsubscribeLink: string;
  preferencesLink: string;
}

export class EmailTemplateService {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
  }

  private loadTemplate(templateName: string): string {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    try {
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;

    // Handle conditional blocks with else {{#if condition}}...{{else}}...{{/if}}
    rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
      return data[condition] ? ifContent : elseContent;
    });

    // Handle conditional blocks {{#if condition}}...{{/if}}
    rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    // Handle array iteration {{#each array}}...{{/each}}
    rendered = rendered.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, itemTemplate) => {
      const array = data[arrayName];
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemRendered = itemTemplate;
        // Replace item properties
        itemRendered = itemRendered.replace(/\{\{(\w+)\}\}/g, (itemMatch, key) => {
          return item[key] !== undefined ? String(item[key]) : itemMatch;
        });
        return itemRendered;
      }).join('');
    });

    // Handle simple variable substitution {{variable}} last
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : '';
    });

    return rendered;
  }

  public renderReferralInvitation(data: ReferralInvitationData): string {
    const template = this.loadTemplate('referralInvitation');
    return this.renderTemplate(template, data);
  }

  public renderStatusUpdate(data: StatusUpdateData): string {
    const template = this.loadTemplate('statusUpdate');
    return this.renderTemplate(template, data);
  }

  public renderRewardConfirmation(data: RewardConfirmationData): string {
    const template = this.loadTemplate('rewardConfirmation');
    return this.renderTemplate(template, data);
  }

  public renderWeeklyDigest(data: WeeklyDigestData): string {
    const template = this.loadTemplate('weeklyDigest');
    return this.renderTemplate(template, data);
  }

  // Method to test template rendering across different email clients
  public async testTemplateRendering(templateName: string, testData: Record<string, any>): Promise<{
    html: string;
    textPreview: string;
    estimatedSize: number;
  }> {
    let html: string;
    
    switch (templateName) {
      case 'referralInvitation':
        html = this.renderReferralInvitation(testData as ReferralInvitationData);
        break;
      case 'statusUpdate':
        html = this.renderStatusUpdate(testData as StatusUpdateData);
        break;
      case 'rewardConfirmation':
        html = this.renderRewardConfirmation(testData as RewardConfirmationData);
        break;
      case 'weeklyDigest':
        html = this.renderWeeklyDigest(testData as WeeklyDigestData);
        break;
      default:
        throw new Error(`Unknown template: ${templateName}`);
    }

    // Generate text preview (strip HTML tags and truncate)
    const textPreview = this.generatePlainTextVersion(html)
      .substring(0, 200) + '...';

    // Calculate estimated size in bytes
    const estimatedSize = Buffer.byteLength(html, 'utf8');

    return {
      html,
      textPreview,
      estimatedSize
    };
  }

  // Generate plain text version of email for better deliverability
  public generatePlainTextVersion(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
}

export const emailTemplateService = new EmailTemplateService();