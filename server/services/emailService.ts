/**
 * Email Service using Nodemailer with Gmail SMTP
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;

  /**
   * Initialize email transporter with SMTP configuration
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Validate configuration
    if (!config.auth.user || !config.auth.pass) {
      throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env');
    }

    this.transporter = nodemailer.createTransport(config);

    // Verify connection
    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      throw new Error('Failed to connect to email service');
    }

    return this.transporter;
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: `${process.env.SMTP_FROM_NAME || 'CVZen'} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const info = await transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Send welcome email with account credentials
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    password: string,
    resumeUrl: string
  ): Promise<boolean> {
    const subject = 'Welcome to CVZen - Your Account Details';
    const html = this.generateWelcomeEmailHTML(name, email, password, resumeUrl);
    const text = this.generateWelcomeEmailText(name, email, password, resumeUrl);

    return this.sendEmail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Generate HTML email template for welcome email
   */
  private generateWelcomeEmailHTML(name: string, email: string, password: string, resumeUrl: string): string {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CVZen</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: #ffffff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .credentials-box {
      background: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .credentials-box h3 {
      margin-top: 0;
      color: #1e40af;
      font-size: 18px;
    }
    .credential-row {
      margin: 15px 0;
      font-size: 15px;
    }
    .label {
      font-weight: 600;
      color: #1e40af;
      display: inline-block;
      min-width: 100px;
    }
    .value {
      color: #1f2937;
      font-family: 'Courier New', monospace;
      background: #ffffff;
      padding: 6px 12px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      display: inline-block;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 5px;
      font-weight: 600;
      font-size: 16px;
    }
    .button-secondary {
      background: #10b981;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .warning strong {
      color: #92400e;
    }
    .features {
      margin: 25px 0;
    }
    .features ul {
      padding-left: 20px;
    }
    .features li {
      margin: 10px 0;
      color: #4b5563;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #6b7280;
      font-size: 14px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to CVZen!</h1>
    </div>
    
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      
      <p>Thank you for applying through CVZen! We've created an account for you so you can track your applications and manage your resume.</p>
      
      <div class="credentials-box">
        <h3>Your Login Credentials</h3>
        <div class="credential-row">
          <span class="label">Email:</span>
          <span class="value">${email}</span>
        </div>
        <div class="credential-row">
          <span class="label">Password:</span>
          <span class="value">${password}</span>
        </div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> Please save these credentials in a secure location. We recommend changing your password after your first login for security.
      </div>
      
      <div class="features">
        <h3>What's Next?</h3>
        <ul>
          <li>Log in to your account to track your application status</li>
          <li>View and edit your parsed resume</li>
          <li>Apply to more jobs with one click</li>
          <li>Get AI-powered job recommendations</li>
          <li>Customize your resume with multiple templates</li>
        </ul>
      </div>
      
      <div class="button-container">
        <a href="${loginUrl}/login" class="button">
          🔐 Log In Now
        </a>
        <a href="${resumeUrl}" class="button button-secondary">
          📄 View Your Resume
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        Your resume has been parsed and is ready to use. You can view it anytime using the link above.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>CVZen</strong> - Your AI-Powered Career Partner</p>
      <p>This is an automated email. Please do not reply to this message.</p>
      <p>© ${new Date().getFullYear()} CVZen. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text version of welcome email
   */
  private generateWelcomeEmailText(name: string, email: string, password: string, resumeUrl: string): string {
    const loginUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    return `
Welcome to CVZen!

Hello ${name},

Thank you for applying through CVZen! We've created an account for you so you can track your applications and manage your resume.

Your Login Credentials:
- Email: ${email}
- Password: ${password}

⚠️ Important: Please save these credentials in a secure location. We recommend changing your password after your first login for security.

What's Next?
- Log in to your account to track your application status
- View and edit your parsed resume
- Apply to more jobs with one click
- Get AI-powered job recommendations
- Customize your resume with multiple templates

Log In: ${loginUrl}/login
View Your Resume: ${resumeUrl}

Your resume has been parsed and is ready to use.

---
CVZen - Your AI-Powered Career Partner
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} CVZen. All rights reserved.
    `.trim();
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();
