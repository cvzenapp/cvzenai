/**
 * Early Bird Waitlist Email Service
 * Sends email notifications when someone joins the enterprise waitlist
 */

import nodemailer from 'nodemailer';

interface WaitlistEmailData {
  name: string;
  email: string;
  contact?: string;
  companyName?: string;
  companySize?: string;
  useCase?: string;
  interestedFeatures?: string[];
  additionalInfo?: string;
  submittedAt: Date;
}

export class WaitlistEmailService {
  private readonly notificationEmail = 'yogesh.kulkarni@cvzen.in';
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Generate HTML email template for waitlist notification
   */
  private generateWaitlistEmailHTML(data: WaitlistEmailData): string {
    const featuresHTML = data.interestedFeatures?.length
      ? `<li><strong>Interested Features:</strong> ${data.interestedFeatures.join(', ')}</li>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-list { list-style: none; padding: 0; }
            .info-list li { padding: 8px 0; border-bottom: 1px solid #ddd; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 New Early Bird Waitlist Signup!</h2>
            </div>
            <div class="content">
              <p>Someone just joined the CVZen Early Bird waitlist:</p>
              <ul class="info-list">
                <li><strong>Name:</strong> ${data.name}</li>
                <li><strong>Email:</strong> ${data.email}</li>
                ${data.contact ? `<li><strong>Contact:</strong> ${data.contact}</li>` : ''}
                ${data.companyName ? `<li><strong>Company:</strong> ${data.companyName}</li>` : ''}
                ${data.companySize ? `<li><strong>Company Size:</strong> ${data.companySize}</li>` : ''}
                ${data.useCase ? `<li><strong>Use Case:</strong> ${data.useCase}</li>` : ''}
                ${featuresHTML}
                ${data.additionalInfo ? `<li><strong>Additional Info:</strong> ${data.additionalInfo}</li>` : ''}
                <li><strong>Submitted At:</strong> ${data.submittedAt.toLocaleString()}</li>
              </ul>
            </div>
            <div class="footer">
              <p>This is an automated notification from CVZen Early Bird Waitlist System</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send notification email to admin
   */
  async sendWaitlistNotification(data: WaitlistEmailData): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: this.notificationEmail,
        subject: `🎉 New Early Bird Signup: ${data.name}`,
        html: this.generateWaitlistEmailHTML(data),
      });
      return true;
    } catch (error) {
      console.error('Failed to send waitlist notification:', error);
      return false;
    }
  }

  /**
   * Send confirmation email to the user
   */
  async sendConfirmationEmail(email: string, name: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: '🎉 Welcome to CVZen Early Bird Program!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 You're on the List!</h1>
                </div>
                <div class="content">
                  <p>Hi ${name},</p>
                  <p>Thank you for joining the CVZen Early Bird program! We're excited to have you on board.</p>
                  <p>As an early bird member, you'll be among the first to:</p>
                  <ul>
                    <li>Access new features before anyone else</li>
                    <li>Get exclusive discounts and offers</li>
                    <li>Shape the future of CVZen with your feedback</li>
                    <li>Receive priority support</li>
                  </ul>
                  <p>We'll keep you updated on our progress and notify you as soon as we're ready to launch!</p>
                  <p style="text-align: center;">
                    <a href="${process.env.APP_BASE_URL || 'https://cvzen.in'}" class="cta-button">Visit CVZen</a>
                  </p>
                  <p>Stay tuned!</p>
                  <p>Best regards,<br>The CVZen Team</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} CVZen. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }
  }

  /**
   * Send pledge confirmation email with certificate
   */
  async sendPledgeConfirmation(email: string, name: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: '🌱 Thank You for Taking the Sustainability Pledge',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .certificate { background: white; border: 3px solid #10b981; padding: 30px; margin: 20px 0; border-radius: 8px; text-align: center; }
                .certificate-title { font-size: 24px; color: #059669; margin-bottom: 15px; }
                .certificate-name { font-size: 28px; font-weight: bold; color: #047857; margin: 15px 0; }
                .impact-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
                .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🌱 Welcome to the Movement</h1>
                </div>
                <div class="content">
                  <p>Hi ${name},</p>
                  <p>Thank you for taking the <strong>"Go Papreless"</strong> pledge. You're now part of a growing community committed to sustainable hiring practices.</p>
                  
                  <div class="certificate">
                    <div class="certificate-title">🏆 Sustainability Pledge Certificate</div>
                    <p>This certifies that</p>
                    <div class="certificate-name">${name}</div>
                    <p>has pledged to embrace paperless hiring and contribute to a sustainable future.</p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px;">Date: ${new Date().toLocaleDateString()}</p>
                  </div>

                  <div class="impact-box">
                    <strong>Your Impact:</strong>
                    <p style="margin: 10px 0 0 0;">By going paperless, you're helping save trees, reduce carbon emissions, and promote efficient digital workflows in hiring.</p>
                  </div>

                  <p><strong>What's Next?</strong></p>
                  <ul>
                    <li>Share your pledge on social media and inspire others</li>
                    <li>Use CVZen's digital resume tools for paperless hiring</li>
                    <li>Join our community of sustainability advocates</li>
                  </ul>

                  <p>Together, we can make hiring more sustainable, one digital resume at a time.</p>
                  
                  <p>Best regards,<br>The CVZen Team</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} CVZen. All rights reserved.</p>
                  <p>🌍 Building a sustainable future, one resume at a time.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });
      return true;
    } catch (error) {
      console.error('Failed to send pledge confirmation email:', error);
      return false;
    }
  }

}
