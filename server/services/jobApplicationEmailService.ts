/**
 * Job Application Email Service
 * Sends email notifications to recruiters when candidates apply for jobs
 */

interface ApplicationEmailData {
  recruiterEmail: string;
  recruiterName: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  companyName: string;
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: Date;
}

export class JobApplicationEmailService {
  /**
   * Generate HTML email template for job application notification
   */
  private generateApplicationEmailHTML(data: ApplicationEmailData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Job Application</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      margin: 10px 0;
    }
    .label {
      font-weight: 600;
      color: #4b5563;
      display: inline-block;
      min-width: 120px;
    }
    .value {
      color: #1f2937;
    }
    .cover-letter {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-style: italic;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 5px;
      font-weight: 600;
    }
    .button:hover {
      background: #5568d3;
    }
    .button-secondary {
      background: #10b981;
    }
    .button-secondary:hover {
      background: #059669;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 New Job Application Received</h1>
  </div>
  
  <div class="content">
    <p>Hello ${data.recruiterName},</p>
    
    <p>Great news! You have received a new application for the <strong>${data.jobTitle}</strong> position at ${data.companyName}.</p>
    
    <div class="info-box">
      <h3 style="margin-top: 0; color: #667eea;">Candidate Information</h3>
      <div class="info-row">
        <span class="label">Name:</span>
        <span class="value">${data.candidateName}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span>
        <span class="value">${data.candidateEmail}</span>
      </div>
      <div class="info-row">
        <span class="label">Applied:</span>
        <span class="value">${new Date(data.appliedAt).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</span>
      </div>
    </div>
    
    ${data.coverLetter ? `
    <div class="cover-letter">
      <h4 style="margin-top: 0; color: #4b5563;">Cover Letter:</h4>
      <p>${data.coverLetter}</p>
    </div>
    ` : ''}
    
    <div style="text-align: center; margin: 30px 0;">
      ${data.resumeUrl ? `
      <a href="${data.resumeUrl}" class="button button-secondary">
        📄 View Resume
      </a>
      ` : ''}
      <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/recruiter/dashboard" class="button">
        🏢 Go to Dashboard
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      You can review this application and other candidates in your recruiter dashboard.
    </p>
  </div>
  
  <div class="footer">
    <p>This is an automated notification from CVZen</p>
    <p>© ${new Date().getFullYear()} CVZen. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate plain text version of the email
   */
  private generateApplicationEmailText(data: ApplicationEmailData): string {
    return `
New Job Application Received

Hello ${data.recruiterName},

You have received a new application for the ${data.jobTitle} position at ${data.companyName}.

Candidate Information:
- Name: ${data.candidateName}
- Email: ${data.candidateEmail}
- Applied: ${new Date(data.appliedAt).toLocaleString()}

${data.coverLetter ? `Cover Letter:\n${data.coverLetter}\n\n` : ''}

${data.resumeUrl ? `View Resume: ${data.resumeUrl}\n` : ''}

View all applications in your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:8080'}/recruiter/dashboard

---
This is an automated notification from CVZen
© ${new Date().getFullYear()} CVZen. All rights reserved.
    `.trim();
  }

  /**
   * Send application notification email to recruiter
   */
  async sendApplicationNotification(data: ApplicationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending application notification email to:', data.recruiterEmail);
      
      const htmlContent = this.generateApplicationEmailHTML(data);
      const textContent = this.generateApplicationEmailText(data);
      
      // In production, integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, we'll log the email content
      console.log('📧 Email would be sent to:', data.recruiterEmail);
      console.log('📧 Subject: New Application for', data.jobTitle);
      console.log('📧 HTML Content Length:', htmlContent.length);
      console.log('📧 Text Content Length:', textContent.length);
      
      // TODO: Integrate with actual email service
      // Example with SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: data.recruiterEmail,
      //   from: process.env.FROM_EMAIL,
      //   subject: `New Application for ${data.jobTitle}`,
      //   text: textContent,
      //   html: htmlContent,
      // });
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send application notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

export const jobApplicationEmailService = new JobApplicationEmailService();
