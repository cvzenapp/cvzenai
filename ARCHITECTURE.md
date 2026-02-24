# 🏗️ CVZen AI - System Architecture

## Overview

CVZen AI is built as a modern microservices architecture with three main components:

1. **Frontend Service** - React SPA with Nginx
2. **Backend Service** - Flask REST API
3. **DSPy Optimizer Service** - AI-powered prompt optimization

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Internet                                    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    Load Balancer        │
                    │    (Nginx/CloudFlare)   │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
       ┌────────▼────────┐  ┌───▼────┐  ┌───────▼────────┐
       │   Frontend       │  │Backend │  │  DSPy Service  │
       │   (React+Nginx)  │  │(Flask) │  │   (Flask)      │
       │   Port 80        │  │Port5000│  │   Port 5001    │
       └────────┬─────────┘  └───┬────┘  └───────┬────────┘
                │                │                │
                │                │                │
                │         ┌──────▼──────┐  ┌─────▼────────┐
                │         │   SQLite    │  │   Training   │
                │         │   Database  │  │   Dataset    │
                │         │             │  │  (2.4K CVs)  │
                │         └─────────────┘  └──────────────┘
                │
                │         ┌─────────────────────────────────┐
                └────────►│   Static Assets (CDN Ready)     │
                          └─────────────────────────────────┘
```

## Component Details

### 1. Frontend Service

**Technology**: React 19 + Vite + TailwindCSS

**Responsibilities**:
- User interface rendering
- Client-side routing
- Form validation
- State management
- API communication

**Key Features**:
- Server-side rendering ready
- Code splitting for optimal loading
- Progressive Web App (PWA) ready
- Responsive design
- Accessibility compliant

**File Structure**:
```
resume_frontend/
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # Reusable UI components (50+)
│   │   ├── Dashboard.jsx
│   │   ├── ResumeEditor.jsx
│   │   └── ResumeUpload.jsx
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions
│   └── main.jsx        # Entry point
├── public/             # Static assets
└── nginx.conf          # Nginx configuration
```

### 2. Backend Service

**Technology**: Flask 2.3 + SQLAlchemy + JWT

**Responsibilities**:
- REST API endpoints
- Authentication & authorization
- Database operations
- File upload handling
- Resume parsing (traditional NLP)

**Key Features**:
- JWT-based authentication
- CORS support
- Request validation
- Error handling
- Health checks

**File Structure**:
```
resume_backend/
├── src/
│   ├── routes/         # API endpoints
│   │   ├── auth.py
│   │   ├── resume.py
│   │   └── user.py
│   ├── models/         # Database models
│   ├── utils/          # Helper functions
│   │   ├── resume_parser.py
│   │   └── pdf_generator.py
│   └── main.py         # Application entry
├── data_sets/          # Training data
└── requirements.txt    # Dependencies
```

### 3. DSPy Optimizer Service

**Technology**: Flask + DSPy + OpenAI

**Responsibilities**:
- Prompt optimization
- AI-powered resume parsing
- Model training and evaluation
- Performance metrics

**Key Features**:
- Self-improving prompts
- Category-aware parsing
- Continuous learning
- A/B testing support

**File Structure**:
```
resume_backend/
├── src/
│   ├── services/
│   │   └── dspy_optimizer.py
│   ├── routes/
│   │   └── dspy_routes.py
│   └── dspy_service.py
├── models/             # Saved optimized prompts
└── optimize_prompts.py # CLI tool
```

## Data Flow

### Resume Upload & Parsing Flow

```
User Upload
    │
    ▼
Frontend Validation
    │
    ▼
Backend API (/api/resumes/parse)
    │
    ├──► Traditional Parser (spaCy, NLTK)
    │        │
    │        ▼
    │    Extract: Skills, Experience, Education
    │        │
    └────────┼──► DSPy Optimizer (/api/dspy/parse)
             │        │
             │        ▼
             │    AI-Enhanced Extraction
             │        │
             ▼        ▼
         Merge Results
             │
             ▼
         Confidence Scoring
             │
             ▼
         Return to Frontend
             │
             ▼
         User Review & Edit
             │
             ▼
         Save to Database
```

### Authentication Flow

```
User Login
    │
    ▼
POST /api/auth/login
    │
    ▼
Validate Credentials
    │
    ├──► Invalid ──► 401 Error
    │
    ▼
Generate JWT Token
    │
    ▼
Return Token to Client
    │
    ▼
Store in LocalStorage
    │
    ▼
Include in API Headers
    │
    ▼
Backend Validates Token
    │
    ├──► Invalid ──► 401 Error
    │
    ▼
Process Request
```

## Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resumes Table
CREATE TABLE resumes (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    original_filename TEXT,
    parsed_content TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Work Experience Table
CREATE TABLE work_experiences (
    id INTEGER PRIMARY KEY,
    resume_id INTEGER NOT NULL,
    company_name TEXT,
    job_title TEXT,
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    is_current BOOLEAN DEFAULT 0,
    description TEXT,
    display_order INTEGER,
    FOREIGN KEY (resume_id) REFERENCES resumes (id)
);

-- Education Table
CREATE TABLE educations (
    id INTEGER PRIMARY KEY,
    resume_id INTEGER NOT NULL,
    institution_name TEXT,
    degree_type TEXT,
    field_of_study TEXT,
    start_date TEXT,
    end_date TEXT,
    gpa REAL,
    description TEXT,
    display_order INTEGER,
    FOREIGN KEY (resume_id) REFERENCES resumes (id)
);

-- Skills Table
CREATE TABLE skills (
    id INTEGER PRIMARY KEY,
    resume_id INTEGER NOT NULL,
    skill_name TEXT NOT NULL,
    skill_category TEXT,
    proficiency_level TEXT,
    display_order INTEGER,
    FOREIGN KEY (resume_id) REFERENCES resumes (id)
);
```

## Deployment Architecture

### Docker Compose Setup

```yaml
services:
  frontend:
    - Nginx serving React build
    - Port 80
    - Health checks enabled
  
  backend:
    - Gunicorn with 4 workers
    - Port 5000
    - Connected to SQLite
    - Health checks enabled
  
  dspy-optimizer:
    - Gunicorn with 2 workers
    - Port 5001
    - Access to training dataset
    - Health checks enabled
```

### Production Considerations

1. **Scalability**
   - Horizontal scaling with load balancer
   - Database migration to PostgreSQL
   - Redis for caching
   - CDN for static assets

2. **Security**
   - HTTPS/TLS encryption
   - Rate limiting
   - Input sanitization
   - CORS configuration
   - Environment variable management

3. **Monitoring**
   - Prometheus metrics
   - Health check endpoints
   - Error logging
   - Performance tracking

4. **Backup & Recovery**
   - Database backups
   - Volume persistence
   - Disaster recovery plan

## API Architecture

### RESTful Design Principles

- **Resource-based URLs**: `/api/resumes`, `/api/users`
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: 200, 201, 400, 401, 404, 500
- **JSON Responses**: Consistent format
- **Versioning**: `/api/v1/` (future)

### Error Handling

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

## Performance Optimization

1. **Frontend**
   - Code splitting
   - Lazy loading
   - Image optimization
   - Caching strategies

2. **Backend**
   - Database indexing
   - Query optimization
   - Connection pooling
   - Response compression

3. **DSPy Service**
   - Prompt caching
   - Batch processing
   - Model optimization
   - Async operations

## Security Architecture

### Authentication
- JWT tokens with expiration
- Refresh token mechanism
- Password hashing (bcrypt)
- Session management

### Authorization
- Role-based access control (RBAC)
- Resource ownership validation
- API key management

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CSRF tokens
- File upload validation

## Monitoring & Observability

### Metrics
- Request rate
- Response time
- Error rate
- Resource usage

### Logging
- Application logs
- Access logs
- Error logs
- Audit logs

### Health Checks
- Service availability
- Database connectivity
- External API status
- Resource thresholds
