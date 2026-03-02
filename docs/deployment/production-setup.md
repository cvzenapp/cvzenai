# Production Deployment and Monitoring Setup

## Overview

This guide covers the complete production deployment setup for the CVZen referrals system, including infrastructure configuration, monitoring, and maintenance procedures.

## Infrastructure Requirements

### Server Specifications

#### Application Server
- **CPU**: 4+ cores (8 recommended for high traffic)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 100GB SSD (with auto-scaling)
- **OS**: Ubuntu 20.04 LTS or CentOS 8

#### Database Server
- **CPU**: 4+ cores
- **RAM**: 16GB minimum (32GB for large datasets)
- **Storage**: 500GB SSD with backup storage
- **Database**: SQLite for development, PostgreSQL for production

#### Load Balancer
- **Type**: Application Load Balancer (AWS ALB, Nginx, or similar)
- **SSL**: TLS 1.3 certificates
- **Health Checks**: Configured for all endpoints

### Network Configuration
- **CDN**: CloudFlare or AWS CloudFront for static assets
- **DNS**: Route 53 or equivalent with health checks
- **Security Groups**: Restrictive firewall rules
- **VPC**: Private subnets for database and application servers

## Database Setup

### Production Database Migration

#### PostgreSQL Setup
```sql
-- Create production database
CREATE DATABASE cvzen_referrals_prod;
CREATE USER referrals_app WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE cvzen_referrals_prod TO referrals_app;

-- Enable required extensions
\c cvzen_referrals_prod;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

#### Database Optimization
```sql
-- Performance tuning
ALTER SYSTEM SET shared_buffers = '4GB';
ALTER SYSTEM SET effective_cache_size = '12GB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
SELECT pg_reload_conf();
```

#### Indexes for Performance
```sql
-- Critical indexes for referrals system
CREATE INDEX CONCURRENTLY idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX CONCURRENTLY idx_referrals_status ON referrals(status);
CREATE INDEX CONCURRENTLY idx_referrals_created_at ON referrals(created_at);
CREATE INDEX CONCURRENTLY idx_referrals_referee_email ON referrals(referee_email);

CREATE INDEX CONCURRENTLY idx_rewards_user_id ON rewards(user_id);
CREATE INDEX CONCURRENTLY idx_rewards_status ON rewards(status);
CREATE INDEX CONCURRENTLY idx_rewards_created_at ON rewards(created_at);

CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX CONCURRENTLY idx_audit_logs_action ON audit_logs(action);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_referrals_user_status ON referrals(referrer_id, status);
CREATE INDEX CONCURRENTLY idx_rewards_user_status ON rewards(user_id, status);
```

### Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# Daily backup script
BACKUP_DIR="/backups/referrals"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cvzen_referrals_prod"

# Create backup
pg_dump -h localhost -U referrals_app -d $DB_NAME | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 for offsite storage
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://cvzen-backups/referrals/
```

#### Point-in-Time Recovery
```bash
# Enable WAL archiving in postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://cvzen-wal-archive/%f'
wal_level = replica
```

## Application Deployment

### Environment Configuration

#### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000
API_BASE_URL=https://api.cvzen.com

# Database
DATABASE_URL=postgresql://postgres:Zen%401142@db.thapzkrgadmuusfuygzt.supabase.co:5432/postgres
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here

# Email Service
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@cvzen.com
ADMIN_EMAIL=admin@cvzen.com

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Redis (for caching and sessions)
REDIS_URL=redis://redis-server:6379
REDIS_PASSWORD=your-redis-password

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://cvzen.com,https://www.cvzen.com
```

### Docker Configuration

#### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

#### Docker Compose (Production)
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: cvzen_referrals_prod
      POSTGRES_USER: referrals_app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U referrals_app"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Nginx Configuration

```nginx
upstream app_servers {
    server app:3000;
    # Add more servers for load balancing
    # server app2:3000;
    # server app3:3000;
}

server {
    listen 80;
    server_name api.cvzen.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.cvzen.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://app_servers;
    }

    # Static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Monitoring and Alerting

### Application Performance Monitoring

#### New Relic Setup
```javascript
// newrelic.js
'use strict'

exports.config = {
  app_name: ['CVZen Referrals API'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: {
    enabled: true
  },
  logging: {
    level: 'info'
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404]
  },
  transaction_tracer: {
    enabled: true,
    transaction_threshold: 'apdex_f'
  }
}
```

#### Custom Metrics
```javascript
// metrics.js
const newrelic = require('newrelic');

class MetricsCollector {
  static recordReferralCreated(userId, companyName) {
    newrelic.recordMetric('Custom/Referrals/Created', 1);
    newrelic.addCustomAttribute('userId', userId);
    newrelic.addCustomAttribute('company', companyName);
  }

  static recordRewardEarned(userId, amount) {
    newrelic.recordMetric('Custom/Rewards/Earned', amount);
    newrelic.addCustomAttribute('userId', userId);
  }

  static recordFraudDetected(userId, riskScore) {
    newrelic.recordMetric('Custom/Fraud/Detected', 1);
    newrelic.addCustomAttribute('userId', userId);
    newrelic.addCustomAttribute('riskScore', riskScore);
  }
}
```

### Health Checks

#### Application Health Endpoint
```javascript
// health.js
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  try {
    // Database check
    await db.raw('SELECT 1');
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Redis check
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch (error) {
    health.checks.redis = 'unhealthy';
    health.status = 'unhealthy';
  }

  try {
    // Email service check
    await emailService.verify();
    health.checks.email = 'healthy';
  } catch (error) {
    health.checks.email = 'unhealthy';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### Log Management

#### Structured Logging
```javascript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'referrals-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Usage examples
logger.info('Referral created', {
  userId: 123,
  referralId: 456,
  refereeEmail: 'user@example.com'
});

logger.error('Payment processing failed', {
  userId: 123,
  paymentId: 789,
  error: error.message
});
```

### Alerting Configuration

#### CloudWatch Alarms (AWS)
```yaml
# cloudwatch-alarms.yml
Resources:
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ReferralsAPI-HighErrorRate
      AlarmDescription: High error rate detected
      MetricName: ErrorRate
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopicArn

  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ReferralsAPI-HighLatency
      AlarmDescription: High response latency detected
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopicArn

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: ReferralsDB-HighConnections
      AlarmDescription: High database connection count
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopicArn
```

## Security Configuration

### SSL/TLS Setup
```bash
# Generate SSL certificate with Let's Encrypt
certbot certonly --webroot -w /var/www/html -d api.cvzen.com

# Auto-renewal cron job
0 12 * * * /usr/bin/certbot renew --quiet
```

### Security Headers
```javascript
// security.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting
```javascript
// rate-limiting.js
const rateLimit = require('express-rate-limit');

const createReferralLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 referrals per hour
  message: 'Too many referrals created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/referrals', createReferralLimiter);
app.use('/api/', generalLimiter);
```

## Deployment Pipeline

### CI/CD Configuration (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build-files
          path: dist/
      - name: Deploy to production
        run: |
          # Deploy using your preferred method
          # Docker, Kubernetes, or direct server deployment
```

### Blue-Green Deployment
```bash
#!/bin/bash
# blue-green-deploy.sh

CURRENT_COLOR=$(docker ps --format "table {{.Names}}" | grep app | head -1 | cut -d'-' -f2)
NEW_COLOR="blue"
if [ "$CURRENT_COLOR" = "blue" ]; then
    NEW_COLOR="green"
fi

echo "Deploying to $NEW_COLOR environment..."

# Build and start new version
docker-compose -f docker-compose.$NEW_COLOR.yml up -d

# Health check
sleep 30
if curl -f http://localhost:3001/health; then
    echo "Health check passed, switching traffic..."
    
    # Update load balancer to point to new version
    # Switch nginx upstream or update load balancer config
    
    # Stop old version
    OLD_COLOR="blue"
    if [ "$NEW_COLOR" = "blue" ]; then
        OLD_COLOR="green"
    fi
    docker-compose -f docker-compose.$OLD_COLOR.yml down
    
    echo "Deployment completed successfully!"
else
    echo "Health check failed, rolling back..."
    docker-compose -f docker-compose.$NEW_COLOR.yml down
    exit 1
fi
```

## Maintenance Procedures

### Database Maintenance
```bash
#!/bin/bash
# db-maintenance.sh

# Vacuum and analyze database
psql -h localhost -U referrals_app -d cvzen_referrals_prod -c "VACUUM ANALYZE;"

# Update table statistics
psql -h localhost -U referrals_app -d cvzen_referrals_prod -c "ANALYZE;"

# Check for unused indexes
psql -h localhost -U referrals_app -d cvzen_referrals_prod -f unused_indexes.sql

# Archive old audit logs (older than 1 year)
psql -h localhost -U referrals_app -d cvzen_referrals_prod -c "
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
"
```

### Log Rotation
```bash
# /etc/logrotate.d/referrals-api
/var/log/referrals-api/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 app app
    postrotate
        systemctl reload referrals-api
    endscript
}
```

### Performance Monitoring
```bash
#!/bin/bash
# performance-check.sh

# Check database performance
echo "=== Database Performance ==="
psql -h localhost -U referrals_app -d cvzen_referrals_prod -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
"

# Check application metrics
echo "=== Application Metrics ==="
curl -s http://localhost:3000/metrics | grep -E "(referrals_created|rewards_earned|fraud_detected)"

# Check system resources
echo "=== System Resources ==="
free -h
df -h
top -bn1 | head -20
```

## Disaster Recovery

### Backup Verification
```bash
#!/bin/bash
# verify-backup.sh

LATEST_BACKUP=$(ls -t /backups/referrals/backup_*.sql.gz | head -1)
echo "Testing backup: $LATEST_BACKUP"

# Create test database
createdb test_restore_$(date +%s)
TEST_DB="test_restore_$(date +%s)"

# Restore backup
gunzip -c "$LATEST_BACKUP" | psql -d "$TEST_DB"

# Verify data integrity
REFERRAL_COUNT=$(psql -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM referrals;")
REWARD_COUNT=$(psql -d "$TEST_DB" -t -c "SELECT COUNT(*) FROM rewards;")

echo "Referrals: $REFERRAL_COUNT"
echo "Rewards: $REWARD_COUNT"

# Cleanup
dropdb "$TEST_DB"

if [ "$REFERRAL_COUNT" -gt 0 ] && [ "$REWARD_COUNT" -gt 0 ]; then
    echo "Backup verification successful!"
else
    echo "Backup verification failed!"
    exit 1
fi
```

### Recovery Procedures
```bash
#!/bin/bash
# disaster-recovery.sh

echo "Starting disaster recovery process..."

# 1. Stop application
docker-compose down

# 2. Restore database from latest backup
LATEST_BACKUP=$(aws s3 ls s3://cvzen-backups/referrals/ | sort | tail -1 | awk '{print $4}')
aws s3 cp "s3://cvzen-backups/referrals/$LATEST_BACKUP" ./restore.sql.gz

# 3. Drop and recreate database
dropdb cvzen_referrals_prod
createdb cvzen_referrals_prod
gunzip -c restore.sql.gz | psql -d cvzen_referrals_prod

# 4. Restore application
docker-compose up -d

# 5. Verify system health
sleep 60
curl -f http://localhost:3000/health

echo "Disaster recovery completed!"
```

---

*This deployment guide should be reviewed and updated regularly as the system evolves.*
*Always test deployment procedures in a staging environment before applying to production.*