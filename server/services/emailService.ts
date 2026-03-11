import { initializeDatabase, closeDatabase } from '../database/connection';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EmailRequest {
  sender: string;
  to: string[];
  subject: string;
  text_body?: string;
  html_body?: string;
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface EmailLogData {
  emailType: 'account_creation' | 'job_application' | 'shortlisted' | 'candidate_notification' | 'recruiter_notification';
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  requestData: EmailRequest;
  responseData?: any;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string;
  userId?: string;
  jobId?: number;
  applicationId?: number;
}

class EmailService {
  private apiKey: string;
  private apiUrl: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    this.apiKey = process.env.SMTP2GO_API_KEY || 'api-46E3A066DD694FDA839FA5DD4763F7A6';
    this.apiUrl = 'https://api.smtp2go.com/v3/email/send';
    this.fromEmail = process.env.FROM_EMAIL || 'cvzen@cvzen.ai';
    this.fromName = process.env.FROM_NAME || 'CVZen';
  }

  private async logEmail(logData: EmailLogData): Promise<number | null> {
    let db;
    try {
      db = await initializeDatabase();
      
      const query = `
        INSERT INTO email_logs (
          email_type, sender_email, recipient_email, subject, 
          request_data, response_data, status, error_message,
          user_id, job_id, application_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id
      `;

      const values = [
        logData.emailType,
        logData.senderEmail,
        logData.recipientEmail,
        logData.subject,
        JSON.stringify(logData.requestData),
        logData.responseData ? JSON.stringify(logData.responseData) : null,
        logData.status,
        logData.errorMessage || null,
        logData.userId || null,
        logData.jobId || null,
        logData.applicationId || null
      ];

      const result = await db.query(query, values);
      return result.rows[0]?.id || null;
    } catch (error) {
      console.error('❌ Failed to log email:', error);
      return null;
    } finally {
      if (db) await closeDatabase(db);
    }
  }

  private async updateEmailLog(logId: number, responseData: any, status: 'sent' | 'failed', errorMessage?: string): Promise<void> {
    let db;
    try {
      db = await initializeDatabase();
      
      const query = `
        UPDATE email_logs 
        SET response_data = $1, status = $2, error_message = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `;

      await db.query(query, [
        JSON.stringify(responseData),
        status,
        errorMessage || null,
        logId
      ]);
    } catch (error) {
      console.error('❌ Failed to update email log:', error);
    } finally {
      if (db) await closeDatabase(db);
    }
  }

  private async sendEmail(emailRequest: EmailRequest): Promise<EmailResponse> {
    try {
      console.log('📧 Sending email via SMTP2GO:', {
        to: emailRequest.to,
        subject: emailRequest.subject,
        sender: emailRequest.sender
      });

      // Format request for SMTP2GO API
      const smtp2goRequest = {
        api_key: this.apiKey,
        to: emailRequest.to,
        sender: emailRequest.sender,
        subject: emailRequest.subject,
        text_body: emailRequest.text_body,
        html_body: emailRequest.html_body,
        ...(emailRequest.cc && { cc: emailRequest.cc }),
        ...(emailRequest.bcc && { bcc: emailRequest.bcc }),
        ...((emailRequest as any).attachments && { attachments: (emailRequest as any).attachments }),
        ...((emailRequest as any).reply_to && { 
          custom_headers: [{ 
            header: "Reply-To", 
            value: (emailRequest as any).reply_to 
          }] 
        })
      };

      console.log('📧 SMTP2GO request payload:', {
        api_key: this.apiKey.substring(0, 10) + '...',
        to: smtp2goRequest.to,
        sender: smtp2goRequest.sender,
        subject: smtp2goRequest.subject,
        hasHtml: !!smtp2goRequest.html_body,
        hasText: !!smtp2goRequest.text_body,
        hasAttachments: !!smtp2goRequest.attachments,
        hasCustomHeaders: !!smtp2goRequest.custom_headers,
        customHeaders: smtp2goRequest.custom_headers,
        senderValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtp2goRequest.sender)
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smtp2goRequest),
      });

      const responseData = await response.json();

      console.log('📧 SMTP2GO response:', {
        status: response.status,
        ok: response.ok,
        data: responseData,
        fullResponse: JSON.stringify(responseData, null, 2)
      });

      if (response.ok && responseData.data && responseData.data.succeeded > 0) {
        console.log('✅ Email sent successfully:', responseData);
        return { success: true, data: responseData };
      } else {
        console.error('❌ Email sending failed:', {
          status: response.status,
          response: responseData,
          failures: responseData.data?.failures || [],
          errors: responseData.data?.errors || []
        });
        
        // Extract specific failure message
        let errorMessage = 'Failed to send email';
        if (responseData.data?.failures && responseData.data.failures.length > 0) {
          const failure = responseData.data.failures[0];
          errorMessage = failure.error || failure.message || errorMessage;
        } else if (responseData.data?.errors && responseData.data.errors.length > 0) {
          errorMessage = responseData.data.errors[0];
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendAccountCreationEmail(
    recipientEmail: string, 
    recipientName: string, 
    userId?: string
  ): Promise<EmailResponse> {
    const subject = 'Welcome to CVZen - Your Account is Ready!';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CVZen</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CVZen!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your professional journey starts here</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1891db; margin-top: 0;">Hi ${recipientName}!</h2>
          
          <p>Congratulations! Your CVZen account has been successfully created. You're now part of a community that's revolutionizing the way professionals create and share their resumes.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1891db;">
            <h3 style="margin-top: 0; color: #1891db;">What you can do now:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Create professional resumes with our AI-powered builder</li>
              <li>Apply to jobs with one-click applications</li>
              <li>Get personalized cover letters for each application</li>
              <li>Track your job applications and responses</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://cvzen.com'}/dashboard" 
               style="background: #1891db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Get Started Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or visit our <a href="${process.env.APP_URL || 'https://cvzen.com'}/support" style="color: #1891db;">support center</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent by CVZen. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Welcome to CVZen, ${recipientName}!
      
      Congratulations! Your CVZen account has been successfully created.
      
      What you can do now:
      • Create professional resumes with our AI-powered builder
      • Apply to jobs with one-click applications  
      • Get personalized cover letters for each application
      • Track your job applications and responses
      
      Get started: ${process.env.APP_URL || 'https://cvzen.com'}/dashboard
      
      Need help? Reply to this email or visit our support center.
      
      Best regards,
      The CVZen Team
    `;

    const emailRequest: EmailRequest = {
      sender: this.fromEmail,
      to: [recipientEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'account_creation',
      senderEmail: this.fromEmail,
      recipientEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }
  async sendRecruiterAccountCreationEmail(
    recipientEmail: string,
    recipientName: string,
    companyName?: string,
    userId?: string
  ): Promise<EmailResponse> {
    const subject = 'Welcome to CVZen - Start Hiring Top Talent!';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CVZen - Recruiter Platform</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CVZen!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your recruitment platform is ready</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1891db; margin-top: 0;">Hi ${recipientName}!</h2>

          <p>Congratulations! Your CVZen recruiter account has been successfully created${companyName ? ` for ${companyName}` : ''}. You're now ready to connect with top talent and streamline your hiring process.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1891db;">
            <h3 style="margin-top: 0; color: #1891db;">What you can do now:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Post job openings and attract qualified candidates</li>
              <li>Browse and search through candidate profiles</li>
              <li>Schedule and conduct AI-powered interviews</li>
              <li>Manage applications and track hiring progress</li>
              <li>Build your company profile to attract talent</li>
            </ul>
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #28a745;">🚀 Pro Tips for Success:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Complete your company profile to increase visibility</li>
              <li>Use detailed job descriptions for better candidate matching</li>
              <li>Leverage our AI screening tools to save time</li>
              <li>Set up interview templates for consistent evaluation</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://cvzen.com'}/recruiter/dashboard"
               style="background: #1891db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Access Recruiter Dashboard
            </a>
            <a href="${process.env.APP_URL || 'https://cvzen.com'}/recruiter/company-profile"
               style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Setup Company Profile
            </a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Need help getting started? Reply to this email or visit our <a href="${process.env.APP_URL || 'https://cvzen.com'}/recruiter/support" style="color: #1891db;">recruiter support center</a>.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent by CVZen Recruiter Platform. If you didn't create an account, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Welcome to CVZen Recruiter Platform, ${recipientName}!

      Congratulations! Your CVZen recruiter account has been successfully created${companyName ? ` for ${companyName}` : ''}.

      What you can do now:
      • Post job openings and attract qualified candidates
      • Browse and search through candidate profiles
      • Schedule and conduct AI-powered interviews
      • Manage applications and track hiring progress
      • Build your company profile to attract talent

      Pro Tips for Success:
      • Complete your company profile to increase visibility
      • Use detailed job descriptions for better candidate matching
      • Leverage our AI screening tools to save time
      • Set up interview templates for consistent evaluation

      Get started: ${process.env.APP_URL || 'https://cvzen.com'}/recruiter/dashboard
      Setup company profile: ${process.env.APP_URL || 'https://cvzen.com'}/recruiter/company-profile

      Need help? Reply to this email or visit our recruiter support center.

      Best regards,
      The CVZen Recruitment Team
    `;

    const emailRequest: EmailRequest = {
      sender: this.fromEmail,
      to: [recipientEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'recruiter_account_creation',
      senderEmail: this.fromEmail,
      recipientEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }


  async sendJobApplicationEmail(
    recruiterEmail: string,
    recruiterName: string,
    candidateName: string,
    candidateEmail: string,
    jobTitle: string,
    companyName: string,
    resumeUrl: string,
    coverLetter?: string,
    jobId?: number,
    applicationId?: number,
    userId?: string
  ): Promise<EmailResponse> {
    const subject = `New Job Application: ${candidateName} for ${jobTitle}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Application</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">New Job Application</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">You have a new candidate!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1891db; margin-top: 0;">Hi ${recruiterName}!</h2>
          
          <p>Great news! You have received a new job application for the <strong>${jobTitle}</strong> position at ${companyName}.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1891db;">
            <h3 style="margin-top: 0; color: #1891db;">Candidate Details:</h3>
            <p><strong>Name:</strong> ${candidateName}</p>
            <p><strong>Email:</strong> ${candidateEmail}</p>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resumeUrl}" 
               style="background: #1891db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 10px;">
              View Resume
            </a>
          </div>
          
          ${coverLetter ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1891db;">Cover Letter:</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">
${coverLetter}
            </div>
          </div>
          ` : ''}
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can review this application and respond to the candidate through your CVZen recruiter dashboard.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent by CVZen. Manage your email preferences in your account settings.
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      New Job Application - ${jobTitle}
      
      Hi ${recruiterName}!
      
      You have received a new job application:
      
      Candidate: ${candidateName}
      Email: ${candidateEmail}
      Position: ${jobTitle}
      Company: ${companyName}
      
      Resume: ${resumeUrl}
      
      ${coverLetter ? `Cover Letter:\n${coverLetter}\n\n` : ''}
      
      Review this application in your CVZen recruiter dashboard.
      
      Best regards,
      The CVZen Team
    `;

    const emailRequest: EmailRequest = {
      sender: this.fromEmail,
      to: [recruiterEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'candidate_notification',
      senderEmail: this.fromEmail,
      recipientEmail: recruiterEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
      jobId,
      applicationId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }

  async sendApplicationConfirmationEmail(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    resumeUrl: string,
    jobId?: number,
    applicationId?: number,
    userId?: string
  ): Promise<EmailResponse> {
    const subject = `Application Submitted: ${jobTitle} at ${companyName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Submitted</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Application Submitted!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your application is on its way</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1891db; margin-top: 0;">Hi ${candidateName}!</h2>
          
          <p>Great news! Your job application has been successfully submitted and sent to the hiring team.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1891db;">
            <h3 style="margin-top: 0; color: #1891db;">Application Details:</h3>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #2d5a2d;"><strong>✓ Your resume and cover letter have been sent to the recruiter</strong></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resumeUrl}" 
               style="background: #1891db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Your Resume
            </a>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1891db;">What happens next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>The hiring team will review your application</li>
              <li>You'll be notified if you're selected for an interview</li>
              <li>Keep an eye on your email for updates</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You can track your applications and create more resumes in your <a href="${process.env.APP_URL || 'https://cvzen.com'}/dashboard" style="color: #1891db;">CVZen dashboard</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent by CVZen. Good luck with your application!
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Application Submitted - ${jobTitle}
      
      Hi ${candidateName}!
      
      Your job application has been successfully submitted:
      
      Position: ${jobTitle}
      Company: ${companyName}
      Submitted: ${new Date().toLocaleDateString()}
      
      ✓ Your resume and cover letter have been sent to the recruiter
      
      What happens next?
      • The hiring team will review your application
      • You'll be notified if you're selected for an interview
      • Keep an eye on your email for updates
      
      View your resume: ${resumeUrl}
      
      Track your applications: ${process.env.APP_URL || 'https://cvzen.com'}/dashboard
      
      Good luck!
      The CVZen Team
    `;

    const emailRequest: EmailRequest = {
      sender: this.fromEmail,
      to: [candidateEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'job_application',
      senderEmail: this.fromEmail,
      recipientEmail: candidateEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
      jobId,
      applicationId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }

  async sendShortlistedNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    companyName: string,
    recruiterName: string,
    nextSteps?: string,
    jobId?: number,
    applicationId?: number,
    userId?: string
  ): Promise<EmailResponse> {
    const subject = `Great News! You've been shortlisted for ${jobTitle} at ${companyName}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>You've Been Shortlisted!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've been shortlisted!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #10b981; margin-top: 0;">Hi ${candidateName}!</h2>
          
          <p>Excellent news! Your application for the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong> has impressed the hiring team, and you've been shortlisted for the next round.</p>
          
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #10b981;">Application Status: SHORTLISTED ✓</h3>
            <p><strong>Position:</strong> ${jobTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Recruiter:</strong> ${recruiterName}</p>
          </div>
          
          ${nextSteps ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1891db;">Next Steps:</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.5;">
${nextSteps}
            </div>
          </div>
          ` : `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1891db;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>The hiring team will contact you soon with next steps</li>
              <li>This may include scheduling an interview or assessment</li>
              <li>Keep an eye on your email and phone</li>
              <li>Prepare for potential interview questions</li>
            </ul>
          </div>
          `}
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #92400e;"><strong>💡 Pro Tip:</strong> Research the company and role further to prepare for your interview!</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is a significant step forward in your job search. Best of luck with the next stages!
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This email was sent by CVZen on behalf of ${companyName}. Congratulations on your progress!
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      🎉 Congratulations! You've been shortlisted!
      
      Hi ${candidateName}!
      
      Excellent news! Your application for the ${jobTitle} position at ${companyName} has impressed the hiring team, and you've been shortlisted for the next round.
      
      Application Status: SHORTLISTED ✓
      Position: ${jobTitle}
      Company: ${companyName}
      Recruiter: ${recruiterName}
      
      ${nextSteps ? `Next Steps:\n${nextSteps}\n\n` : `What's Next?
      • The hiring team will contact you soon with next steps
      • This may include scheduling an interview or assessment
      • Keep an eye on your email and phone
      • Prepare for potential interview questions
      
      `}💡 Pro Tip: Research the company and role further to prepare for your interview!
      
      This is a significant step forward in your job search. Best of luck with the next stages!
      
      Best regards,
      The CVZen Team
    `;

    const emailRequest: EmailRequest = {
      sender: this.fromEmail,
      to: [candidateEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'shortlisted',
      senderEmail: this.fromEmail,
      recipientEmail: candidateEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
      jobId,
      applicationId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }
  async sendInterviewInvitationEmail(
    candidateEmail: string,
    candidateName: string,
    recruiterName: string,
    companyName: string,
    interviewDetails: {
      title: string;
      description?: string;
      interviewType: string;
      proposedDatetime: string;
      durationMinutes: number;
      timezone: string;
      meetingLink?: string;
      meetingLocation?: string;
      meetingInstructions?: string;
    },
    interviewId: string,
    userId?: string,
    recruiterEmail?: string
  ): Promise<EmailResponse> {
    const interviewDate = new Date(interviewDetails.proposedDatetime);
    const endDate = new Date(interviewDate.getTime() + (interviewDetails.durationMinutes * 60 * 1000));
    
    const subject = `Interview Invitation: ${interviewDetails.title}`;
    
    // Generate ICS calendar invite
    const icsContent = this.generateICSInvite({
      title: interviewDetails.title,
      description: interviewDetails.description || '',
      startDate: interviewDate,
      endDate: endDate,
      location: this.formatLocationForICS(interviewDetails.meetingLocation || interviewDetails.meetingLink || ''),
      organizer: {
        name: recruiterName,
        email: recruiterEmail || this.fromEmail
      },
      attendee: {
        name: candidateName,
        email: candidateEmail
      },
      uid: `interview-${interviewId}@cvzen.ai`
    });

    const formatDateTime = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const getInterviewTypeIcon = (type: string) => {
      switch (type) {
        case 'video_call': return '📹';
        case 'phone': return '📞';
        case 'in_person': return '🏢';
        case 'technical': return '💻';
        default: return '📅';
      }
    };

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Invitation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${getInterviewTypeIcon(interviewDetails.interviewType)} Interview Invitation</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You're invited to an interview!</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1891db; margin-top: 0;">Hi ${candidateName}!</h2>
          
          <p>Great news! ${recruiterName} from <strong>${companyName}</strong> would like to schedule an interview with you.</p>
          
          <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #1891db; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #1891db; font-size: 20px;">${interviewDetails.title}</h3>
            
            <div style="display: grid; gap: 15px; margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">📅</span>
                <div>
                  <strong>Date & Time:</strong><br>
                  <span style="color: #1891db; font-weight: 600;">${formatDateTime(interviewDate)}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">⏱️</span>
                <div>
                  <strong>Duration:</strong> ${interviewDetails.durationMinutes} minutes
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${getInterviewTypeIcon(interviewDetails.interviewType)}</span>
                <div>
                  <strong>Type:</strong> ${interviewDetails.interviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
              
              ${interviewDetails.meetingLink ? `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🔗</span>
                <div>
                  <strong>Meeting Link:</strong><br>
                  <a href="${interviewDetails.meetingLink}" style="color: #1891db; word-break: break-all;">${interviewDetails.meetingLink}</a>
                </div>
              </div>
              ` : ''}
              
              ${interviewDetails.meetingLocation ? `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">📍</span>
                <div>
                  <strong>Location:</strong><br>
                  ${this.formatLocationWithMapLink(interviewDetails.meetingLocation)}
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          
          ${interviewDetails.description ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1891db;">About this Interview:</h3>
            <p style="margin: 0; white-space: pre-wrap;">${interviewDetails.description}</p>
          </div>
          ` : ''}
          
          ${interviewDetails.meetingInstructions ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="margin-top: 0; color: #1565c0;">📋 Instructions:</h3>
            <div style="white-space: pre-wrap; color: #1565c0;">${interviewDetails.meetingInstructions}</div>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>📎 Calendar Invite:</strong> A calendar invite (.ics file) is attached to this email. Add it to your calendar to get reminders!</p>
          </div>
          
          // <div style="text-align: center; margin: 30px 0;">
          //   <p style="margin-bottom: 15px; color: #666;">Please confirm your attendance:</p>
          //   <div style="display: inline-block;">
          //     <a href="${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/accept" 
          //        style="background: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; display: inline-block;">
          //       ✅ Accept
          //     </a>
          //     <a href="${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/decline" 
          //        style="background: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          //       ❌ Decline
          //     </a>
          //   </div>
          // </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1891db;">Need to reschedule?</h3>
            <p style="margin: 0;">If you need to reschedule this interview, please reply to this email or contact ${recruiterName} as soon as possible.</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            We're excited to speak with you! If you have any questions, please don't hesitate to reach out.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This interview invitation was sent by CVZen on behalf of ${companyName}.<br>
            Interview ID: ${interviewId}
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Interview Invitation: ${interviewDetails.title}
      
      Hi ${candidateName}!
      
      Great news! ${recruiterName} from ${companyName} would like to schedule an interview with you.
      
      Interview Details:
      • Title: ${interviewDetails.title}
      • Date & Time: ${formatDateTime(interviewDate)}
      • Duration: ${interviewDetails.durationMinutes} minutes
      • Type: ${interviewDetails.interviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      ${interviewDetails.meetingLink ? `• Meeting Link: ${interviewDetails.meetingLink}` : ''}
      ${interviewDetails.meetingLocation ? `• Location: ${this.formatLocationForText(interviewDetails.meetingLocation)}` : ''}
      
      ${interviewDetails.description ? `About this Interview:\n${interviewDetails.description}\n\n` : ''}
      ${interviewDetails.meetingInstructions ? `Instructions:\n${interviewDetails.meetingInstructions}\n\n` : ''}
      
      📎 A calendar invite (.ics file) is attached to this email.
      
      Please confirm your attendance:
      Accept: ${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/accept
      Decline: ${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/decline
      
      Need to reschedule? Please reply to this email or contact ${recruiterName}.
      
      We're excited to speak with you!
      
      Best regards,
      ${recruiterName}
      ${companyName}
      
      ---
      Interview ID: ${interviewId}
      Sent via CVZen
    `;

    const emailRequest: EmailRequest = {
      sender: `"${companyName}" <${this.fromEmail}>`,
      to: [candidateEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
      ...(recruiterEmail && { reply_to: recruiterEmail })
    };

    // Add ICS attachment for SMTP2GO format
    const icsAttachment = {
      filename: 'interview-invite.ics',
      fileblob: Buffer.from(icsContent).toString('base64'),
      mimetype: 'text/calendar'
    };

    // Add attachment to email request
    (emailRequest as any).attachments = [icsAttachment];

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'candidate_notification',
      senderEmail: recruiterEmail || this.fromEmail,
      recipientEmail: candidateEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }

  async sendInterviewRescheduleEmail(
    candidateEmail: string,
    candidateName: string,
    recruiterName: string,
    companyName: string,
    interviewDetails: {
      title: string;
      description?: string;
      interviewType: string;
      proposedDatetime: string;
      durationMinutes: number;
      timezone: string;
      meetingLink?: string;
      meetingLocation?: string;
      meetingInstructions?: string;
    },
    interviewId: string,
    userId?: string,
    recruiterEmail?: string
  ): Promise<EmailResponse> {
    const interviewDate = new Date(interviewDetails.proposedDatetime);
    const endDate = new Date(interviewDate.getTime() + (interviewDetails.durationMinutes * 60 * 1000));
    
    const subject = `Interview Rescheduled: ${interviewDetails.title}`;
    
    // Generate ICS calendar invite for the rescheduled interview
    const icsContent = this.generateICSInvite({
      title: interviewDetails.title,
      description: interviewDetails.description || '',
      startDate: interviewDate,
      endDate: endDate,
      location: this.formatLocationForICS(interviewDetails.meetingLocation || interviewDetails.meetingLink || 'Online'),
      organizer: { name: recruiterName, email: recruiterEmail || 'noreply@cvzen.com' },
      attendee: { name: candidateName, email: candidateEmail },
      uid: `interview-${interviewId}-${Date.now()}@cvzen.com`
    });

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    // HTML email template for reschedule
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Rescheduled</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #4facfe 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Interview Rescheduled</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your interview has been updated with new details</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${candidateName},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">Your interview with <strong>${companyName}</strong> has been rescheduled. Please find the updated details below:</p>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #1891db;">
            <h3 style="color: #1891db; margin: 0 0 15px 0; font-size: 20px;">${interviewDetails.title}</h3>
            
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #495057; min-width: 80px;">📅 Date:</span>
                <span style="color: #212529;">${formatDate(interviewDate)}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #495057; min-width: 80px;">⏰ Time:</span>
                <span style="color: #212529;">${formatTime(interviewDate)}</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #495057; min-width: 80px;">⏱️ Duration:</span>
                <span style="color: #212529;">${interviewDetails.durationMinutes} minutes</span>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #495057; min-width: 80px;">📍 Type:</span>
                <span style="color: #212529;">${interviewDetails.interviewType === 'video_call' ? 'Video Call' : 
                  interviewDetails.interviewType === 'phone' ? 'Phone Call' : 
                  interviewDetails.interviewType === 'in_person' ? 'In Person' : 'Technical Interview'}</span>
              </div>
              
              ${interviewDetails.meetingLink ? `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #495057; min-width: 80px;">🔗 Link:</span>
                <a href="${interviewDetails.meetingLink}" style="color: #1891db; text-decoration: none;">${interviewDetails.meetingLink}</a>
              </div>
              ` : ''}
              
              ${interviewDetails.meetingLocation ? `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 600; color: #495057; min-width: 80px;">📍 Location:</span>
                <span style="color: #212529;">${this.formatLocationWithMapLink(interviewDetails.meetingLocation)}</span>
              </div>
              ` : ''}
            </div>
          </div>
          
          ${interviewDetails.description ? `
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1565c0; margin: 0 0 10px 0;">Interview Details:</h4>
            <p style="margin: 0; color: #1976d2;">${interviewDetails.description}</p>
          </div>
          ` : ''}
          
          ${interviewDetails.meetingInstructions ? `
          <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #ef6c00; margin: 0 0 10px 0;">Instructions:</h4>
            <p style="margin: 0; color: #f57c00;">${interviewDetails.meetingInstructions}</p>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;"><strong>📎 Calendar Invite:</strong> A calendar invite (.ics file) is attached to this email. Add it to your calendar to get reminders!</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 16px; margin-bottom: 20px;">Please confirm your availability for the new time:</p>
            <div style="display: inline-block; gap: 15px;">
              <a href="${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/accept${userId ? `?userId=${userId}` : ''}" 
                 style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px; display: inline-block;">
                ✅ Accept New Time
              </a>
              <a href="${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/decline${userId ? `?userId=${userId}` : ''}" 
                 style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 0 10px; display: inline-block;">
                ❌ Decline
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 30px; text-align: center; color: #6c757d;">
            <p style="margin: 0; font-size: 14px;">Best regards,<br><strong>${recruiterName}</strong><br>${companyName}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>This email was sent by CVZen Interview Scheduler</p>
        </div>
      </body>
      </html>
    `;

    // Plain text version for reschedule
    const textContent = `
      Interview Rescheduled: ${interviewDetails.title}
      
      Dear ${candidateName},
      
      Your interview with ${companyName} has been rescheduled. Here are the updated details:
      
      Interview: ${interviewDetails.title}
      Date: ${formatDate(interviewDate)}
      Time: ${formatTime(interviewDate)}
      Duration: ${interviewDetails.durationMinutes} minutes
      Type: ${interviewDetails.interviewType === 'video_call' ? 'Video Call' : 
        interviewDetails.interviewType === 'phone' ? 'Phone Call' : 
        interviewDetails.interviewType === 'in_person' ? 'In Person' : 'Technical Interview'}
      
      ${interviewDetails.meetingLink ? `Meeting Link: ${interviewDetails.meetingLink}\n` : ''}
      ${interviewDetails.meetingLocation ? `Location: ${this.formatLocationForText(interviewDetails.meetingLocation)}\n` : ''}
      ${interviewDetails.description ? `\nDetails:\n${interviewDetails.description}\n` : ''}
      ${interviewDetails.meetingInstructions ? `Instructions:\n${interviewDetails.meetingInstructions}\n\n` : ''}
      
      📎 A calendar invite (.ics file) is attached to this email.
      
      Please confirm your attendance for the new time:
      Accept: ${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/accept${userId ? `?userId=${userId}` : ''}
      Decline: ${process.env.APP_URL || 'https://cvzen.com'}/interview/${interviewId}/decline${userId ? `?userId=${userId}` : ''}
      
      Best regards,
      ${recruiterName}
      ${companyName}
    `;

    const emailRequest: EmailRequest = {
      sender: `"${companyName}" <${this.fromEmail}>`,
      to: [candidateEmail],
      subject,
      html_body: htmlContent,
      text_body: textContent,
      ...(recruiterEmail && { reply_to: recruiterEmail })
    };

    // Add ICS attachment for SMTP2GO format
    const icsAttachment = {
      filename: 'interview-reschedule.ics',
      fileblob: Buffer.from(icsContent).toString('base64'),
      mimetype: 'text/calendar'
    };

    // Add attachment to email request
    (emailRequest as any).attachments = [icsAttachment];

    // Log email attempt
    console.log('📧 Sending interview reschedule email:', {
      to: candidateEmail,
      subject: subject,
      hasAttachment: true,
      interviewId: interviewId
    });

    const result = await this.sendEmail(emailRequest);

    // Log the result
    if (result.success) {
      console.log('✅ Interview reschedule email sent successfully');
    } else {
      console.error('❌ Failed to send interview reschedule email:', result.error);
    }

    return result;
  }

  // Send interview decision notification to candidate
  async sendInterviewDecisionNotification(
    candidateEmail: string,
    candidateName: string,
    recruiterName: string,
    companyName: string,
    interviewDetails: {
      title: string;
      proposedDatetime: string;
      decision: 'hired' | 'rejected' | 'hold';
      feedback?: string;
      evaluationMetrics?: any[];
    },
    jobTitle?: string,
    userId?: string
  ): Promise<EmailResponse> {
    const interviewDate = new Date(interviewDetails.proposedDatetime);
    const decision = interviewDetails.decision;
    const isHired = decision === 'hired';
    const isRejected = decision === 'rejected';
    const isOnHold = decision === 'hold';
    
    const subject = `Interview Update: ${isHired ? 'Congratulations!' : isRejected ? 'Interview Feedback' : 'Interview Status Update'} - ${interviewDetails.title}`;
    
    const formatDateTime = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const getDecisionIcon = (decision: string) => {
      switch (decision) {
        case 'hired': return '🎉';
        case 'rejected': return '📝';
        case 'hold': return '⏳';
        default: return '📋';
      }
    };

    const getDecisionColor = (decision: string) => {
      switch (decision) {
        case 'hired': return '#10b981';
        case 'rejected': return '#6b7280';
        case 'hold': return '#f59e0b';
        default: return '#6b7280';
      }
    };

    const getOverallScore = () => {
      if (!interviewDetails.evaluationMetrics || !Array.isArray(interviewDetails.evaluationMetrics)) {
        return null;
      }
      
      const scoredMetrics = interviewDetails.evaluationMetrics.filter(m => m.checked && m.score);
      if (scoredMetrics.length === 0) return null;
      
      const total = scoredMetrics.reduce((sum, metric) => {
        const score = parseFloat(metric.score || '0');
        return sum + score;
      }, 0);
      
      return (total / scoredMetrics.length).toFixed(1);
    };

    const overallScore = getOverallScore();

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Decision</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${getDecisionColor(decision)} 0%, ${getDecisionColor(decision)}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${getDecisionIcon(decision)} ${isHired ? 'Congratulations!' : isRejected ? 'Interview Feedback' : 'Interview Update'}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            ${isHired ? 'Great news about your interview!' : isRejected ? 'Thank you for your time and interest' : 'Update on your interview status'}
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: ${getDecisionColor(decision)}; margin-top: 0;">Hi ${candidateName}!</h2>
          
          ${isHired ? `
          <p>🎉 <strong>Congratulations!</strong> We're excited to inform you that you've been selected for the position following your interview with ${companyName}.</p>
          ` : isRejected ? `
          <p>Thank you for taking the time to interview with us for the ${interviewDetails.title} position. After careful consideration, we have decided to move forward with other candidates at this time.</p>
          ` : `
          <p>Thank you for your interview with ${companyName}. We wanted to provide you with an update on your application status.</p>
          `}
          
          <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${getDecisionColor(decision)}; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: ${getDecisionColor(decision)}; font-size: 20px;">${interviewDetails.title}</h3>
            
            <div style="display: grid; gap: 15px; margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">🏢</span>
                <div>
                  <strong>Company:</strong> ${companyName}
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">👤</span>
                <div>
                  <strong>Interviewer:</strong> ${recruiterName}
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">📅</span>
                <div>
                  <strong>Interview Date:</strong><br>
                  <span style="color: ${getDecisionColor(decision)}; font-weight: 600;">${formatDateTime(interviewDate)}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${getDecisionIcon(decision)}</span>
                <div>
                  <strong>Decision:</strong> <span style="color: ${getDecisionColor(decision)}; font-weight: 600; text-transform: uppercase;">${decision === 'hired' ? 'Selected' : decision === 'rejected' ? 'Not Selected' : 'On Hold'}</span>
                </div>
              </div>
              
              ${overallScore ? `
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">⭐</span>
                <div>
                  <strong>Interview Score:</strong> <span style="color: ${getDecisionColor(decision)}; font-weight: 600;">${overallScore}/10</span>
                </div>
              </div>
              ` : ''}
            </div>
          </div>
          
          ${interviewDetails.feedback ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="margin-top: 0; color: #1891db;">💬 Feedback from ${recruiterName}:</h3>
            <p style="margin: 0; white-space: pre-wrap; font-style: italic; color: #555;">"${interviewDetails.feedback}"</p>
          </div>
          ` : ''}
          
          ${isHired ? `
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46;">🎯 Next Steps</h3>
            <p style="margin: 0; color: #065f46;">Someone from our team will be in touch with you soon regarding the next steps in the hiring process. Congratulations again on this achievement!</p>
          </div>
          ` : isRejected ? `
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
            <h3 style="margin-top: 0; color: #374151;">🚀 Keep Going</h3>
            <p style="margin: 0; color: #374151;">We encourage you to continue pursuing opportunities that align with your skills and interests. Thank you for considering ${companyName} as a potential employer.</p>
          </div>
          ` : `
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #92400e;">⏳ Status: On Hold</h3>
            <p style="margin: 0; color: #92400e;">Your application is currently on hold. We will keep you updated if there are any changes to your application status.</p>
          </div>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://cvzen.com'}/dashboard" 
               style="background: #1891db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              📋 View Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            ${isHired ? 
              "We're excited to have you join our team! Welcome aboard!" : 
              isRejected ?
              "We appreciate the time you invested in the interview process and wish you the best in your job search." :
              "We'll keep you updated on any changes to your application status."
            }
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This interview decision was sent by CVZen on behalf of ${companyName}.<br>
            ${jobTitle ? `Position: ${jobTitle}` : ''}
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Interview Decision: ${isHired ? 'Congratulations!' : isRejected ? 'Interview Feedback' : 'Interview Update'}
      
      Hi ${candidateName}!
      
      ${isHired ? 
        `🎉 Congratulations! We're excited to inform you that you've been selected for the position following your interview with ${companyName}.` :
        isRejected ?
        `Thank you for taking the time to interview with us for the ${interviewDetails.title} position. After careful consideration, we have decided to move forward with other candidates at this time.` :
        `Thank you for your interview with ${companyName}. We wanted to provide you with an update on your application status.`
      }
      
      Interview Details:
      • Position: ${interviewDetails.title}
      • Company: ${companyName}
      • Interviewer: ${recruiterName}
      • Interview Date: ${formatDateTime(interviewDate)}
      • Decision: ${decision === 'hired' ? 'Selected' : decision === 'rejected' ? 'Not Selected' : 'On Hold'}
      ${overallScore ? `• Interview Score: ${overallScore}/10` : ''}
      
      ${interviewDetails.feedback ? `Feedback from ${recruiterName}:\n"${interviewDetails.feedback}"\n\n` : ''}
      
      ${isHired ? 
        "🎯 Next Steps\nSomeone from our team will be in touch with you soon regarding the next steps in the hiring process. Congratulations again on this achievement!" :
        isRejected ?
        "🚀 Keep Going\nWe encourage you to continue pursuing opportunities that align with your skills and interests. Thank you for considering " + companyName + " as a potential employer." :
        "⏳ Status: On Hold\nYour application is currently on hold. We will keep you updated if there are any changes to your application status."
      }
      
      View your dashboard: ${process.env.APP_URL || 'https://cvzen.com'}/dashboard
      
      ${isHired ? 
        "We're excited to have you join our team! Welcome aboard!" : 
        isRejected ?
        "We appreciate the time you invested in the interview process and wish you the best in your job search." :
        "We'll keep you updated on any changes to your application status."
      }
      
      Best regards,
      ${recruiterName}
      ${companyName}
      
      ---
      Sent via CVZen
      ${jobTitle ? `Position: ${jobTitle}` : ''}
    `;

    const emailRequest: EmailRequest = {
      sender: `"${companyName}" <${this.fromEmail}>`,
      to: [candidateEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'candidate_notification',
      senderEmail: this.fromEmail,
      recipientEmail: candidateEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }

  // Send interview response notification to recruiter
  async sendInterviewResponseNotification(
    recruiterEmail: string,
    recruiterName: string,
    candidateName: string,
    interviewDetails: {
      title: string;
      proposedDatetime: string;
      interviewType: string;
      status: 'accepted' | 'declined';
      candidateResponse?: string;
    },
    interviewId: string,
    companyName?: string,
    userId?: string
  ): Promise<EmailResponse> {
    const interviewDate = new Date(interviewDetails.proposedDatetime);
    const isAccepted = interviewDetails.status === 'accepted';
    
    const subject = `Interview ${isAccepted ? 'Accepted' : 'Declined'}: ${candidateName} - ${interviewDetails.title}`;
    
    const formatDateTime = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    };

    const getStatusIcon = (status: string) => {
      return status === 'accepted' ? '✅' : '❌';
    };

    const getStatusColor = (status: string) => {
      return status === 'accepted' ? '#10b981' : '#ef4444';
    };

    const getInterviewTypeIcon = (type: string) => {
      switch (type) {
        case 'video_call': return '📹';
        case 'phone': return '📞';
        case 'in_person': return '🏢';
        case 'technical': return '💻';
        default: return '📅';
      }
    };

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Response</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${getStatusColor(interviewDetails.status)} 0%, ${getStatusColor(interviewDetails.status)}dd 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${getStatusIcon(interviewDetails.status)} Interview ${isAccepted ? 'Accepted' : 'Declined'}</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${candidateName} has responded to your interview invitation</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: ${getStatusColor(interviewDetails.status)}; margin-top: 0;">Hi ${recruiterName}!</h2>
          
          <p><strong>${candidateName}</strong> has <strong style="color: ${getStatusColor(interviewDetails.status)};">${interviewDetails.status}</strong> your interview invitation.</p>
          
          <div style="background: white; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid ${getStatusColor(interviewDetails.status)}; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: ${getStatusColor(interviewDetails.status)}; font-size: 20px;">${interviewDetails.title}</h3>
            
            <div style="display: grid; gap: 15px; margin-top: 20px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">👤</span>
                <div>
                  <strong>Candidate:</strong> ${candidateName}
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">📅</span>
                <div>
                  <strong>Scheduled Date & Time:</strong><br>
                  <span style="color: ${getStatusColor(interviewDetails.status)}; font-weight: 600;">${formatDateTime(interviewDate)}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${getInterviewTypeIcon(interviewDetails.interviewType)}</span>
                <div>
                  <strong>Interview Type:</strong> ${interviewDetails.interviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
              
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 18px;">${getStatusIcon(interviewDetails.status)}</span>
                <div>
                  <strong>Status:</strong> <span style="color: ${getStatusColor(interviewDetails.status)}; font-weight: 600; text-transform: uppercase;">${interviewDetails.status}</span>
                </div>
              </div>
            </div>
          </div>
          
          ${interviewDetails.candidateResponse ? `
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <h3 style="margin-top: 0; color: #1891db;">💬 Candidate's Message:</h3>
            <p style="margin: 0; white-space: pre-wrap; font-style: italic; color: #555;">"${interviewDetails.candidateResponse}"</p>
          </div>
          ` : ''}
          
          ${isAccepted ? `
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46;">🎉 Great News!</h3>
            <p style="margin: 0; color: #065f46;">The candidate has accepted your interview invitation. Make sure to prepare for the interview and send any additional materials if needed.</p>
          </div>
          ` : `
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <h3 style="margin-top: 0; color: #991b1b;">📋 Next Steps</h3>
            <p style="margin: 0; color: #991b1b;">The candidate has declined this interview. You may want to consider rescheduling or reaching out to discuss alternative arrangements.</p>
          </div>
          `}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.APP_URL || 'https://cvzen.com'}/recruiter/interviews" 
               style="background: #1891db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              📋 View All Interviews
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            ${isAccepted ? 
              "The interview is confirmed! Make sure to prepare and reach out if you need to make any changes." : 
              "Don't worry - there are many great candidates out there. Keep up the great work!"
            }
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            This notification was sent by CVZen${companyName ? ` on behalf of ${companyName}` : ''}.<br>
            Interview ID: ${interviewId}
          </p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
      Interview ${isAccepted ? 'Accepted' : 'Declined'}: ${candidateName}
      
      Hi ${recruiterName}!
      
      ${candidateName} has ${interviewDetails.status} your interview invitation.
      
      Interview Details:
      • Candidate: ${candidateName}
      • Title: ${interviewDetails.title}
      • Scheduled Date & Time: ${formatDateTime(interviewDate)}
      • Interview Type: ${interviewDetails.interviewType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      • Status: ${interviewDetails.status.toUpperCase()}
      
      ${interviewDetails.candidateResponse ? `Candidate's Message:\n"${interviewDetails.candidateResponse}"\n\n` : ''}
      
      ${isAccepted ? 
        "🎉 Great News!\nThe candidate has accepted your interview invitation. Make sure to prepare for the interview and send any additional materials if needed." :
        "📋 Next Steps\nThe candidate has declined this interview. You may want to consider rescheduling or reaching out to discuss alternative arrangements."
      }
      
      View all interviews: ${process.env.APP_URL || 'https://cvzen.com'}/recruiter/interviews
      
      ${isAccepted ? 
        "The interview is confirmed! Make sure to prepare and reach out if you need to make any changes." : 
        "Don't worry - there are many great candidates out there. Keep up the great work!"
      }
      
      Best regards,
      CVZen Team
      
      ---
      Interview ID: ${interviewId}
      ${companyName ? `Company: ${companyName}` : ''}
    `;

    const emailRequest: EmailRequest = {
      sender: `"CVZen" <${this.fromEmail}>`,
      to: [recruiterEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody
    };

    // Log email attempt
    const logId = await this.logEmail({
      emailType: 'recruiter_notification',
      senderEmail: this.fromEmail,
      recipientEmail: recruiterEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId,
    });

    // Send email
    const result = await this.sendEmail(emailRequest);

    // Update log with result
    if (logId) {
      await this.updateEmailLog(
        logId,
        result.data,
        result.success ? 'sent' : 'failed',
        result.error
      );
    }

    return result;
  }

  private formatLocationWithMapLink(location: string): string {
    if (!location) return '';
    
    // Check if location contains Google Maps URL
    const mapUrlMatch = location.match(/Google Maps:\s*(https:\/\/[^\s\n]+)/);
    
    if (mapUrlMatch) {
      const mapUrl = mapUrlMatch[1];
      const address = location.replace(/\n\nGoogle Maps:.*/, '').trim();
      
      return `
        <div>
          <span style="color: #212529;">${address}</span><br>
          <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" 
             style="color: #1891db; text-decoration: none; font-size: 14px; margin-top: 5px; display: inline-flex; align-items: center; gap: 5px;">
            <span>📍 View on Google Maps</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      `;
    }
    
    // If no Google Maps URL, return plain location
    return `<span style="color: #212529;">${location}</span>`;
  }

  private formatLocationForText(location: string): string {
    if (!location) return '';
    
    // Check if location contains Google Maps URL
    const mapUrlMatch = location.match(/Google Maps:\s*(https:\/\/[^\s\n]+)/);
    
    if (mapUrlMatch) {
      const mapUrl = mapUrlMatch[1];
      const address = location.replace(/\n\nGoogle Maps:.*/, '').trim();
      
      return `${address}\nGoogle Maps: ${mapUrl}`;
    }
    
    // If no Google Maps URL, return plain location
    return location;
  }

  private formatLocationForICS(location: string): string {
    if (!location) return '';
    
    // Check if location contains Google Maps URL
    const mapUrlMatch = location.match(/Google Maps:\s*(https:\/\/[^\s\n]+)/);
    
    if (mapUrlMatch) {
      const mapUrl = mapUrlMatch[1];
      const address = location.replace(/\n\nGoogle Maps:.*/, '').trim();
      
      // For ICS files, we can include the URL directly in the location field
      // Many calendar apps will make this clickable
      return `${address} - ${mapUrl}`;
    }
    
    // If no Google Maps URL, return plain location
    return location;
  }

  private generateICSInvite(details: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    organizer: { name: string; email: string };
    attendee: { name: string; email: string };
    uid: string;
  }): string {
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeICSText = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');
    };

    const now = new Date();
    const timestamp = formatICSDate(now);

    // Enhanced description with location link if available
    let enhancedDescription = details.description;
    
    // Check if location contains Google Maps URL and add it to description
    const mapUrlMatch = details.location.match(/(https:\/\/[^\s]+)/);
    if (mapUrlMatch) {
      const mapUrl = mapUrlMatch[1];
      const address = details.location.replace(` - ${mapUrl}`, '').trim();
      
      enhancedDescription += `\n\n📍 Location: ${address}\n🗺️ Google Maps: ${mapUrl}\n\nClick the Google Maps link to get directions to the interview location.`;
    }

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CVZen//Interview Scheduler//EN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${details.uid}`,
      `DTSTAMP:${timestamp}`,
      `DTSTART:${formatICSDate(details.startDate)}`,
      `DTEND:${formatICSDate(details.endDate)}`,
      `SUMMARY:${escapeICSText(details.title)}`,
      `DESCRIPTION:${escapeICSText(enhancedDescription)}`,
      `LOCATION:${escapeICSText(details.location)}`,
      `ORGANIZER;CN=${escapeICSText(details.organizer.name)}:MAILTO:${details.organizer.email}`,
      `ATTENDEE;CN=${escapeICSText(details.attendee.name)};RSVP=TRUE:MAILTO:${details.attendee.email}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${escapeICSText(details.title)}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
  }

  async sendPasswordSetupEmail(
    recipientEmail: string,
    recipientName: string,
    setupUrl: string,
    resumeUrl?: string
  ): Promise<EmailResponse> {
    const subject = 'Complete Your CVZen Account Setup';
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complete Your CVZen Account Setup</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1891db 0%, #1565c0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to CVZen!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Complete your account setup</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1891db; margin-top: 0;">Hi ${recipientName}!</h2>
          
          <p>Great news! Your CVZen account has been created successfully and your resume has been processed. To complete your account setup and secure your account, please set up your password.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1891db;">
            <h3 style="margin-top: 0; color: #1891db;">What's ready for you:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>✅ Your account has been created</li>
              <li>✅ Your resume has been processed and analyzed</li>
              <li>✅ You can start applying to jobs immediately</li>
              <li>🔐 Just set up your password to secure your account</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${setupUrl}" 
               style="background: #1891db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Set Up Your Password
            </a>
          </div>
          
          ${resumeUrl ? `
          <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #2d5a2d; font-weight: bold;">🎉 Your resume is ready!</p>
            <a href="${resumeUrl}" 
               style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;">
              View Your Resume
            </a>
          </div>
          ` : ''}
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⏰ Important:</strong> This setup link will expire in 24 hours for security reasons. Please complete your setup soon.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Need help? Reply to this email or visit our <a href="${process.env.APP_URL || 'https://cvzen.com'}/support" style="color: #1891db;">support center</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <div style="text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This email was sent to ${recipientEmail}. If you didn't create a CVZen account, please ignore this email.
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              © ${new Date().getFullYear()} CVZen. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
Hi ${recipientName}!

Welcome to CVZen! Your account has been created successfully and your resume has been processed.

To complete your account setup and secure your account, please set up your password by clicking the link below:

${setupUrl}

What's ready for you:
✅ Your account has been created
✅ Your resume has been processed and analyzed  
✅ You can start applying to jobs immediately
🔐 Just set up your password to secure your account

${resumeUrl ? `🎉 Your resume is ready! View it here: ${resumeUrl}` : ''}

⏰ Important: This setup link will expire in 24 hours for security reasons. Please complete your setup soon.

Need help? Reply to this email or visit our support center at ${process.env.APP_URL || 'https://cvzen.com'}/support

This email was sent to ${recipientEmail}. If you didn't create a CVZen account, please ignore this email.

© ${new Date().getFullYear()} CVZen. All rights reserved.
    `;

    const emailRequest: EmailRequest = {
      sender: `${this.fromName} <${this.fromEmail}>`,
      to: [recipientEmail],
      subject,
      html_body: htmlBody,
      text_body: textBody,
    };

    // Log the email attempt
    const logId = await this.logEmail({
      emailType: 'account_creation',
      senderEmail: this.fromEmail,
      recipientEmail,
      subject,
      requestData: emailRequest,
      status: 'pending',
      userId: undefined
    });

    try {
      const result = await this.sendEmail(emailRequest);
      
      // Update log with result
      if (logId) {
        await this.updateEmailLog(
          logId,
          result.data,
          result.success ? 'sent' : 'failed',
          result.error
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update log with error
      if (logId) {
        await this.updateEmailLog(logId, null, 'failed', errorMessage);
      }

      return { success: false, error: errorMessage };
    }
  }

}

export const emailService = new EmailService();