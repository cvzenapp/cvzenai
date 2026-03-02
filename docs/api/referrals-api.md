# Referrals System API Documentation

## Overview

The Referrals System API provides endpoints for managing referrals, rewards, and administrative functions. All endpoints require authentication unless otherwise specified.

## Authentication

All API requests must include a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Base URL

```
https://api.cvzen.com/api
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Referrals Endpoints

### Create Referral

Create a new referral for a job opportunity.

**Endpoint:** `POST /referrals`

**Request Body:**
```json
{
  "referee_name": "John Smith",
  "referee_email": "john@example.com",
  "position_title": "Software Engineer",
  "company_name": "Tech Corp",
  "job_description": "We are looking for a skilled software engineer...",
  "personal_message": "I think you would be perfect for this role!",
  "expected_salary": 120000,
  "location": "San Francisco, CA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "referee_name": "John Smith",
    "referee_email": "john@example.com",
    "position_title": "Software Engineer",
    "company_name": "Tech Corp",
    "status": "pending",
    "referral_token": "abc123def456",
    "created_at": "2024-01-15T10:30:00Z",
    "expires_at": "2024-04-15T10:30:00Z"
  }
}
```

**Validation Rules:**
- `referee_name`: Required, 2-100 characters
- `referee_email`: Required, valid email format, not already referred by this user
- `position_title`: Required, 2-200 characters
- `company_name`: Required, 2-200 characters
- `personal_message`: Optional, max 1000 characters
- `expected_salary`: Optional, positive number
- `location`: Optional, max 200 characters

### Get User's Referrals

Retrieve all referrals created by the authenticated user.

**Endpoint:** `GET /referrals`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `contacted`, `interviewed`, `hired`, `rejected`)
- `limit` (optional): Number of results per page (default: 20, max: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `sort` (optional): Sort field (`created_at`, `status`, `referee_name`) (default: `created_at`)
- `order` (optional): Sort order (`asc`, `desc`) (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "referee_name": "John Smith",
      "referee_email": "john@example.com",
      "position_title": "Software Engineer",
      "company_name": "Tech Corp",
      "status": "contacted",
      "reward_amount": 500,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T14:20:00Z",
      "status_history": [
        {
          "status": "pending",
          "timestamp": "2024-01-15T10:30:00Z",
          "notes": "Referral created"
        },
        {
          "status": "contacted",
          "timestamp": "2024-01-16T14:20:00Z",
          "notes": "Referee responded positively"
        }
      ]
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### Get Referral Details

Get detailed information about a specific referral.

**Endpoint:** `GET /referrals/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "referee_name": "John Smith",
    "referee_email": "john@example.com",
    "position_title": "Software Engineer",
    "company_name": "Tech Corp",
    "job_description": "We are looking for a skilled software engineer...",
    "personal_message": "I think you would be perfect for this role!",
    "status": "interviewed",
    "reward_amount": 500,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-18T09:15:00Z",
    "expires_at": "2024-04-15T10:30:00Z",
    "status_history": [
      {
        "status": "pending",
        "timestamp": "2024-01-15T10:30:00Z",
        "notes": "Referral created"
      },
      {
        "status": "contacted",
        "timestamp": "2024-01-16T14:20:00Z",
        "notes": "Referee responded positively"
      },
      {
        "status": "interviewed",
        "timestamp": "2024-01-18T09:15:00Z",
        "notes": "First round interview completed"
      }
    ],
    "referee_response": {
      "interested": true,
      "response_date": "2024-01-16T14:20:00Z",
      "comments": "Very interested in this opportunity!"
    }
  }
}
```

### Update Referral Status

Update the status of a referral (typically done by recruiters or system).

**Endpoint:** `PUT /referrals/:id/status`

**Request Body:**
```json
{
  "status": "interviewed",
  "notes": "First round interview completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "interviewed",
    "updated_at": "2024-01-18T09:15:00Z"
  }
}
```

**Valid Status Transitions:**
- `pending` → `contacted`, `rejected`
- `contacted` → `interviewed`, `rejected`
- `interviewed` → `hired`, `rejected`
- `hired` → (final state)
- `rejected` → (final state)

### Get Referral Statistics

Get statistics about the user's referral activity.

**Endpoint:** `GET /referrals/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "total_referrals": 25,
    "pending_referrals": 5,
    "contacted_referrals": 8,
    "interviewed_referrals": 4,
    "hired_referrals": 6,
    "rejected_referrals": 2,
    "total_rewards_earned": 3000,
    "pending_rewards": 750,
    "conversion_rate": 0.24,
    "average_time_to_hire": 21,
    "monthly_stats": [
      {
        "month": "2024-01",
        "referrals_created": 8,
        "referrals_hired": 2,
        "rewards_earned": 1000
      }
    ]
  }
}
```

## Referee Response Endpoints

### Get Referral by Token

Get referral details using the referral token (for referee response page).

**Endpoint:** `GET /referee/referral/:token`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "referee_name": "John Smith",
    "position_title": "Software Engineer",
    "company_name": "Tech Corp",
    "job_description": "We are looking for a skilled software engineer...",
    "personal_message": "I think you would be perfect for this role!",
    "referrer_name": "Jane Doe",
    "expected_salary": 120000,
    "location": "San Francisco, CA",
    "expires_at": "2024-04-15T10:30:00Z",
    "already_responded": false
  }
}
```

### Submit Referee Response

Submit referee's response to the referral invitation.

**Endpoint:** `POST /referee/referral/:token/respond`

**Authentication:** Not required

**Request Body:**
```json
{
  "interested": true,
  "comments": "I'm very interested in this opportunity!",
  "resume_url": "https://example.com/resume.pdf",
  "availability": "Available immediately",
  "create_account": true,
  "account_details": {
    "first_name": "John",
    "last_name": "Smith",
    "email": "john@example.com",
    "password": "securepassword123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response_id": 456,
    "referral_id": 123,
    "interested": true,
    "account_created": true,
    "user_id": 789
  }
}
```

## Rewards Endpoints

### Get User Rewards

Get all rewards earned by the authenticated user.

**Endpoint:** `GET /rewards`

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `paid`, `reversed`)
- `limit` (optional): Number of results per page (default: 20)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_earned": 3000,
      "pending_amount": 750,
      "paid_amount": 2250,
      "can_request_payout": true,
      "minimum_payout_threshold": 100
    },
    "rewards": [
      {
        "id": 456,
        "referral_id": 123,
        "amount": 500,
        "status": "paid",
        "created_at": "2024-01-18T09:15:00Z",
        "paid_at": "2024-01-25T10:00:00Z",
        "referee_name": "John Smith",
        "position_title": "Software Engineer",
        "company_name": "Tech Corp"
      }
    ]
  }
}
```

### Request Payout

Request a payout of pending rewards.

**Endpoint:** `POST /rewards/payout`

**Request Body:**
```json
{
  "payment_method": "paypal",
  "payment_details": {
    "paypal_email": "user@example.com"
  },
  "amount": 750
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "payout_id": 789,
    "amount": 750,
    "status": "processing",
    "estimated_completion": "2024-02-01T10:00:00Z"
  }
}
```

## Admin Endpoints

### Get Admin Statistics

Get comprehensive statistics for admin dashboard.

**Endpoint:** `GET /admin/referrals/stats`

**Required Role:** Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "total_referrals": 1250,
    "pending_approvals": 8,
    "flagged_for_review": 3,
    "program_status": "active",
    "total_rewards": 125000,
    "pending_payouts": 15000,
    "fraud_alerts": 2,
    "monthly_metrics": [
      {
        "month": "2024-01",
        "referrals_created": 150,
        "referrals_hired": 35,
        "rewards_paid": 17500,
        "conversion_rate": 0.23
      }
    ],
    "top_referrers": [
      {
        "user_id": 123,
        "name": "Jane Doe",
        "referrals_count": 25,
        "hire_count": 8,
        "total_rewards": 4000
      }
    ]
  }
}
```

### Get Program Configuration

Get current referral program configuration.

**Endpoint:** `GET /admin/referrals/config`

**Required Role:** Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "default_reward_amount": "500",
    "minimum_payout_threshold": "100",
    "referral_expiry_days": "90",
    "max_referrals_per_day": "10",
    "high_value_threshold": "1000",
    "program_status": "active",
    "auto_approve_rewards": "true",
    "fraud_detection_enabled": "true"
  }
}
```

### Update Program Configuration

Update referral program settings.

**Endpoint:** `PUT /admin/referrals/config`

**Required Role:** Admin

**Request Body:**
```json
{
  "default_reward_amount": "750",
  "minimum_payout_threshold": "150",
  "auto_approve_rewards": "false"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated_fields": ["default_reward_amount", "minimum_payout_threshold", "auto_approve_rewards"],
    "updated_at": "2024-01-20T15:30:00Z"
  }
}
```

### Get Pending Approvals

Get referrals requiring manual approval.

**Endpoint:** `GET /admin/referrals/pending-approvals`

**Required Role:** Admin

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "referrer_name": "Jane Doe",
      "referrer_email": "jane@example.com",
      "referee_name": "John Smith",
      "position_title": "Senior Engineer",
      "company_name": "Big Tech Corp",
      "reward_amount": 1500,
      "created_at": "2024-01-15T10:30:00Z",
      "requires_approval_reason": "High value reward"
    }
  ]
}
```

### Approve/Reject Referral

Approve or reject a referral requiring manual review.

**Endpoint:** `POST /admin/referrals/:id/approve`

**Required Role:** Admin

**Request Body:**
```json
{
  "approved": true,
  "notes": "Approved after verification"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referral_id": 123,
    "approved": true,
    "processed_by": 456,
    "processed_at": "2024-01-20T16:00:00Z"
  }
}
```

### Bulk Update Referrals

Update multiple referrals at once.

**Endpoint:** `POST /admin/referrals/bulk-update`

**Required Role:** Admin

**Request Body:**
```json
{
  "referral_ids": [123, 124, 125],
  "new_status": "rejected",
  "notes": "Bulk rejection due to policy violation"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated_count": 3,
    "failed_updates": [],
    "updated_at": "2024-01-20T16:15:00Z"
  }
}
```

### Get Fraud Detection Results

Get fraud detection analysis and suspicious activity.

**Endpoint:** `GET /admin/referrals/fraud-detection`

**Required Role:** Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "overall_risk_score": 25,
    "suspicious_referrals": [
      {
        "referral_id": 123,
        "referrer_id": 456,
        "referrer_name": "Suspicious User",
        "risk_factors": ["Sequential emails", "Rapid creation"],
        "risk_score": 85,
        "flagged_at": "2024-01-20T10:00:00Z"
      }
    ],
    "patterns": [
      {
        "type": "sequential_emails",
        "description": "Sequential email pattern detected",
        "count": 5,
        "severity": "high",
        "affected_referrals": [123, 124, 125, 126, 127]
      }
    ],
    "recommendations": [
      "Review referrals with sequential email patterns",
      "Consider implementing additional email validation"
    ]
  }
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per minute per user
- **Referral creation**: 10 requests per hour per user
- **Admin endpoints**: 200 requests per minute per admin

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
```

## Webhooks

The system can send webhooks for important events:

### Webhook Events

- `referral.created` - New referral created
- `referral.status_updated` - Referral status changed
- `referral.hired` - Referral marked as hired
- `reward.earned` - New reward earned
- `reward.paid` - Reward paid out
- `fraud.detected` - Suspicious activity detected

### Webhook Payload Example

```json
{
  "event": "referral.hired",
  "timestamp": "2024-01-20T16:30:00Z",
  "data": {
    "referral_id": 123,
    "referrer_id": 456,
    "referee_name": "John Smith",
    "position_title": "Software Engineer",
    "company_name": "Tech Corp",
    "reward_amount": 500
  }
}
```

## SDKs and Libraries

Official SDKs are available for:
- JavaScript/TypeScript
- Python
- PHP
- Ruby

Example usage (JavaScript):
```javascript
import { ReferralsAPI } from '@cvzen/referrals-sdk';

const api = new ReferralsAPI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.cvzen.com'
});

// Create a referral
const referral = await api.referrals.create({
  referee_name: 'John Smith',
  referee_email: 'john@example.com',
  position_title: 'Software Engineer',
  company_name: 'Tech Corp'
});
```

## Support

For API support, contact:
- Email: api-support@cvzen.com
- Documentation: https://docs.cvzen.com/api
- Status Page: https://status.cvzen.com