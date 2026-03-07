# SMTP2GO Email Integration

## Overview
Comprehensive email service integration using SMTP2GO API for sending transactional emails with database logging and modular architecture.

## Features Implemented

### 1. Email Service (`server/services/emailService.ts`)
- **Modular Architecture**: Single service class handling all email types
- **Database Logging**: All email requests and responses logged to PostgreSQL
- **Error Handling**: Graceful error handling with detailed logging
- **Template Support**: HTML and text email templates for all scenarios

### 2. Email Types Supported

#### Account Creation Emails
- **Trigger**: User registration (job seekers and recruiters)
- **Content**: Welcome message with dashboard link and feature overview
- **Integration**: Automatically sent after successful registration

#### Job Application Notifications
- **Recruiter Email**: New application notification with candidate details, resume link, and cover letter
- **Candidate Email**: Application confirmation with job details and next steps
- **Integration**: Sent automatically when job applications are submitted (both authenticated and guest users)

#### Shortlisted Notifications
- **Trigger**: When recruiter shortlists a candidate
- **Content**: Congratulatory message with next steps and company details
- **Integration**: Available via `/api/recruiter/shortlist` endpoint

### 3. Database Schema

#### Email Logs Table (`email_logs`)
```sql
- id: SERIAL PRIMARY KEY
- email_type: VARCHAR(50) -- 'account_creation', 'job_application', 'shortlisted', 'candidate_notification'
- sender_email: VARCHAR(255)
- recipient_email: VARCHAR(255)
- subject: VARCHAR(500)
- request_data: JSONB -- Full SMTP2GO request payload
- response_data: JSONB -- SMTP2GO response
- status: VARCHAR(20) -- 'pending', 'sent', 'failed'
- error_message: TEXT
- user_id: UUID REFERENCES users(id)
- job_id: INTEGER REFERENCES job_postings(id)
- application_id: INTEGER REFERENCES job_applications(id)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### 4. API Configuration

#### Environment Variables
```env
SMTP2GO_API_KEY=api-46E3A066DD694FDA839FA5DD4763F7A6
FROM_EMAIL=noreply@cvzen.com
FROM_NAME=CVZen
APP_URL=https://yourdomain.com
```

#### SMTP2GO API Details
- **Endpoint**: `https://api.smtp2go.com/v3/email/send`
- **Authentication**: API Key in `X-Smtp2go-Api-Key` header
- **Request Format**: JSON with sender, recipients, subject, and body

### 5. Integration Points

#### User Registration
- **Job Seekers**: `server/routes/jobSeekerAuthSimple.ts`
- **Recruiters**: `server/routes/recruiterAuthSimple.ts`
- **Trigger**: After successful user creation
- **Email Type**: `account_creation`

#### Job Applications
- **Route**: `server/routes/jobApplications.ts`
- **Authenticated Users**: `/api/job-applications`
- **Guest Users**: `/api/job-applications/guest`
- **Email Types**: `candidate_notification` (to recruiter), `job_application` (to candidate)

#### Candidate Shortlisting
- **Route**: `server/routes/recruiterActions.ts`
- **Endpoint**: `POST /api/recruiter/shortlist`
- **Email Type**: `shortlisted`
- **Authentication**: Required (recruiter only)

### 6. Email Templates

#### Professional Design Features
- **Responsive HTML**: Mobile-friendly email templates
- **Brand Consistency**: CVZen branding with gradient headers
- **Clear CTAs**: Prominent action buttons
- **Fallback Text**: Plain text versions for all emails
- **Professional Styling**: Clean, modern design with proper spacing

#### Template Types
1. **Welcome Email**: Account creation with feature highlights
2. **Application Notification**: Detailed candidate information for recruiters
3. **Application Confirmation**: Status update for candidates
4. **Shortlisted Notification**: Congratulatory message with next steps

### 7. Logging and Monitoring

#### Request Logging
- **Pre-send**: Log email attempt with request data
- **Post-send**: Update log with response and status
- **Error Tracking**: Detailed error messages and stack traces

#### Database Queries
- **Email History**: Track all emails by user, job, or application
- **Status Monitoring**: Monitor delivery success rates
- **Error Analysis**: Identify and debug email failures

### 8. Testing and Development

#### Test Endpoint (`server/routes/emailTest.ts`)
- **Development Only**: Available in non-production environments
- **Test All Types**: Send test emails for all supported types
- **Log Viewing**: Access email logs for debugging
- **Endpoints**:
  - `POST /api/email/test` - Send test emails
  - `GET /api/email/logs` - View recent email logs

#### Usage Examples
```bash
# Test account creation email
POST /api/email/test
{
  "type": "account_creation",
  "email": "test@example.com",
  "name": "Test User"
}

# Test job application email
POST /api/email/test
{
  "type": "job_application",
  "email": "recruiter@example.com"
}
```

### 9. Error Handling

#### Graceful Failures
- **Non-blocking**: Email failures don't prevent core functionality
- **Async Processing**: Emails sent asynchronously to avoid blocking requests
- **Retry Logic**: Built-in error handling with detailed logging
- **Fallback**: System continues to work even if email service is down

#### Error Types Handled
- **Network Errors**: SMTP2GO API connectivity issues
- **Authentication Errors**: Invalid API key or permissions
- **Validation Errors**: Invalid email addresses or missing data
- **Rate Limiting**: SMTP2GO API rate limit handling

### 10. Security and Compliance

#### Data Protection
- **No Sensitive Data**: Only necessary information stored in logs
- **Secure API**: HTTPS-only communication with SMTP2GO
- **Environment Variables**: Sensitive credentials stored securely

#### Email Best Practices
- **SPF/DKIM**: Proper email authentication (handled by SMTP2GO)
- **Unsubscribe**: Professional email footers with contact information
- **Content Guidelines**: Professional, branded email content

## Usage Instructions

### 1. Setup
1. Ensure environment variables are configured
2. Run database migration: `053_email_logs.sql`
3. Verify SMTP2GO API key is valid

### 2. Integration
- Email service is automatically integrated into existing flows
- No additional client-side changes required
- All emails are sent asynchronously

### 3. Monitoring
- Check email logs table for delivery status
- Use test endpoints for debugging
- Monitor error logs for issues

### 4. Customization
- Modify email templates in `emailService.ts`
- Add new email types by extending the service
- Update database schema for additional fields

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/recruiter/shortlist` | POST | Shortlist candidate | Yes (Recruiter) |
| `/api/recruiter/applications` | GET | Get applications | Yes (Recruiter) |
| `/api/email/test` | POST | Send test email | No (Dev only) |
| `/api/email/logs` | GET | View email logs | No (Dev only) |

## Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `email_logs` | Email tracking | `email_type`, `status`, `recipient_email` |
| `job_applications` | Application data | `id`, `job_id`, `user_id` |
| `job_postings` | Job information | `id`, `title`, `company_id` |
| `users` | User data | `id`, `email`, `first_name`, `last_name` |

## Success Metrics

✅ **Account Creation Emails**: Sent automatically on user registration  
✅ **Job Application Emails**: Sent to both recruiters and candidates  
✅ **Shortlisted Notifications**: Available via recruiter dashboard  
✅ **Database Logging**: All emails tracked with status and errors  
✅ **Error Handling**: Graceful failures with detailed logging  
✅ **Professional Templates**: Branded, responsive email designs  
✅ **Test Infrastructure**: Development testing and monitoring tools  

## Next Steps

1. **Monitor Email Delivery**: Track success rates and optimize templates
2. **Add More Email Types**: Interview scheduling, rejection notifications, etc.
3. **Enhanced Analytics**: Email open rates, click tracking
4. **Template Customization**: Company-specific email branding
5. **Bulk Email Support**: Newsletter and announcement capabilities