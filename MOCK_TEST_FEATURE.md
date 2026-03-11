# Mock Test Feature - Implementation Guide

## Overview
The Mock Test feature provides AI-generated practice tests for job seekers to prepare for interviews. Tests are personalized based on job descriptions, candidate resumes, and skills.

## Navigation & Access

### 1. Sidebar Navigation
- Added "Mock Tests" button in the Dashboard sidebar
- Uses Brain icon for visual identification
- Navigates to `/interviews` page where mock tests can be accessed

### 2. Interview Integration
- Mock Test button appears in the EnterpriseInterviewManager for job seekers
- Currently visible for all interview statuses (for testing)
- Production: Should only show for `accepted` interviews
- Button navigates to `/mock-test/{interviewId}`

## Routes Structure

```
/mock-test/:interviewId          → MockTest.tsx (Level selection)
/mock-test/session/:sessionId    → MockTestSession.tsx (Taking the test)
/mock-test/results/:sessionId    → MockTestResults.tsx (View results)
```

## API Endpoints

```
POST   /api/mock-tests/generate                    → Generate new test
GET    /api/mock-tests/session/:sessionId          → Get session details
GET    /api/mock-tests/session/:sessionId/questions → Get test questions
POST   /api/mock-tests/session/:sessionId/answer   → Submit answers
POST   /api/mock-tests/session/:sessionId/complete → Complete test
GET    /api/mock-tests/session/:sessionId/results  → View results
GET    /api/mock-tests/interview/:interviewId/levels → Get available levels
```

## Database Tables

- `mock_test_sessions` - Test sessions with metadata and scoring
- `mock_test_questions` - AI-generated questions (MCQ, single selection, objective, coding)
- `mock_test_responses` - Candidate answers with evaluation

## Test Levels

1. **Basic** - Fundamental concepts (unlocked by default)
2. **Moderate** - Intermediate skills (unlocked after completing Basic)
3. **Complex** - Advanced scenarios (unlocked after completing Moderate)

#