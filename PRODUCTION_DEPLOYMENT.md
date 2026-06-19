# Royal Spin Casino - Production Deployment Guide

Complete guide for deploying the casino platform to production with real-money transactions.

## Pre-Deployment Checklist

### Legal & Compliance
- [ ] Gaming license obtained for your jurisdiction
- [ ] Terms of Service reviewed by legal counsel
- [ ] Privacy Policy compliant with GDPR/CCPA
- [ ] Responsible Gambling Policy in place
- [ ] Anti-Money Laundering (AML) procedures documented
- [ ] Know Your Customer (KYC) procedures documented
- [ ] Data retention policies established
- [ ] Dispute resolution procedures in place

### Financial & Payment Processing
- [ ] Stripe account approved for gambling transactions
- [ ] Webhook endpoints configured in Stripe dashboard
- [ ] Payment processor backup plan (secondary processor)
- [ ] Accounting system integrated
- [ ] Tax reporting procedures established
- [ ] Audit trail logging enabled

### Security & Infrastructure
- [ ] SSL/TLS certificates installed
- [ ] Database encryption enabled
- [ ] Regular backup procedures established
- [ ] Disaster recovery plan documented
- [ ] DDoS protection configured
- [ ] Web Application Firewall (WAF) enabled
- [ ] Intrusion detection system (IDS) active
- [ ] Security monitoring and alerting configured

### Testing & Quality Assurance
- [ ] Load testing completed
- [ ] Security penetration testing completed
- [ ] User acceptance testing (UAT) completed
- [ ] Payment processing tested end-to-end
- [ ] Withdrawal system tested
- [ ] Compliance logging verified
- [ ] KYC verification workflow tested

---

## Deployment Architecture

### Recommended Production Stack

**Backend:**
- Node.js on AWS EC2 or Railway
- PostgreSQL RDS (managed database)
- Redis for caching (optional)
- Stripe for payments

**Frontend:**
- React build deployed to CDN (Vercel, Netlify, or AWS S3 + CloudFront)
- CloudFlare for DDoS protection and caching

**Infrastructure:**
- Docker containers for consistency
- Load balancer (AWS ELB or Nginx)
- Auto-scaling groups
- CloudWatch for monitoring
- CloudTrail for audit logging

---

## Step 1: Prepare Production Environment

### 1.1 Create Production Database

Using AWS RDS PostgreSQL:

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier casino-db-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username casino_admin \
  --master-user-password $(openssl rand -base64 32) \
  --allocated-storage 100 \
  --backup-retention-period 30 \
  --multi-az \
  --storage-encrypted
```

### 1.2 Configure Database Security

```sql
-- Connect to production database
psql -U casino_admin -h casino-db-prod.xxxxx.us-east-1.rds.amazonaws.com -d casino_db_prod

-- Create application user with limited privileges
CREATE USER casino_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE casino_db_prod TO casino_app;
GRANT USAGE ON SCHEMA public TO casino_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO casino_app;

-- Enable SSL
ALTER SYSTEM SET ssl = on;
SELECT pg_reload_conf();
```

### 1.3 Initialize Production Database

```bash
# Run setup script on production database
DATABASE_URL=postgresql://casino_app:password@casino-db-prod.xxxxx.us-east-1.rds.amazonaws.com:5432/casino_db_prod \
npm run db:setup

# Seed games
DATABASE_URL=postgresql://casino_app:password@casino-db-prod.xxxxx.us-east-1.rds.amazonaws.com:5432/casino_db_prod \
npm run db:seed
```

---

## Step 2: Configure Stripe Webhooks

### 2.1 Set Up Webhook Endpoint

In your Stripe Dashboard:

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`

### 2.2 Add Webhook Handler

Create `/server/webhooks/stripe.js`:

```javascript
import express from 'express';
import Stripe from 'stripe';
import { pool } from '../index.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
    }
    res.json({received: true});
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({error: 'Webhook processing failed'});
  }
});

async function handlePaymentSucceeded(paymentIntent) {
  // Update deposit status
  await pool.query(
    `UPDATE deposits SET status = 'completed', completed_at = CURRENT_TIMESTAMP 
     WHERE stripe_payment_intent_id = $1`,
    [paymentIntent.id]
  );
}

async function handlePaymentFailed(paymentIntent) {
  // Update deposit status
  await pool.query(
    `UPDATE deposits SET status = 'failed' WHERE stripe_payment_intent_id = $1`,
    [paymentIntent.id]
  );
}

async function handleRefund(charge) {
  // Handle refund logic
  console.log('Refund processed:', charge.id);
}

export default router;
```

---

## Step 3: Deploy Backend

### 3.1 Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server ./server
COPY src ./src

EXPOSE 5000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - JWT_SECRET=${JWT_SECRET}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 3.2 Deploy to AWS ECS

```bash
# Build and push Docker image
docker build -t casino-platform:latest .
docker tag casino-platform:latest YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/casino-platform:latest
docker push YOUR_AWS_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/casino-platform:latest

# Create ECS task definition
aws ecs register-task-definition \
  --family casino-platform \
  --container-definitions file://task-definition.json \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu 256 \
  --memory 512

# Create ECS service
aws ecs create-service \
  --cluster casino-prod \
  --service-name casino-platform \
  --task-definition casino-platform \
  --desired-count 2 \
  --launch-type FARGATE
```

### 3.3 Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=your_production_db_url
railway variables set STRIPE_SECRET_KEY=your_stripe_key
```

---

## Step 4: Deploy Frontend

### 4.1 Build Frontend

```bash
npm run build
```

### 4.2 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
VITE_API_URL=https://your-api-domain.com/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 4.3 Deploy to AWS S3 + CloudFront

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-casino-bucket/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## Step 5: Configure SSL/TLS

### 5.1 Using Let's Encrypt with Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location /api {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend:3000;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## Step 6: Set Up Monitoring & Logging

### 6.1 CloudWatch Monitoring

```javascript
// Add to server/index.js
import CloudWatch from 'aws-sdk/clients/cloudwatch';

const cloudwatch = new CloudWatch();

function logMetric(metricName, value) {
  cloudwatch.putMetricData({
    Namespace: 'CasinoPlatform',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  }, (err) => {
    if (err) console.error('CloudWatch error:', err);
  });
}

// Log metrics
app.use((req, res, next) => {
  res.on('finish', () => {
    logMetric('HTTPRequests', 1);
    if (res.statusCode >= 400) {
      logMetric('HTTPErrors', 1);
    }
  });
  next();
});
```

### 6.2 Error Tracking with Sentry

```bash
npm install @sentry/node
```

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## Step 7: Compliance & Audit Setup

### 7.1 Enable Audit Logging

```sql
-- Create audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255),
  operation VARCHAR(50),
  user_id UUID,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, operation, user_id, old_data, new_data)
  VALUES (TG_TABLE_NAME, TG_OP, current_user_id(), row_to_json(OLD), row_to_json(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER users_audit AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER transactions_audit AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION audit_trigger();
```

### 7.2 Daily Compliance Reports

```javascript
// server/jobs/complianceReport.js
import { pool } from '../index.js';
import nodemailer from 'nodemailer';

export async function sendDailyComplianceReport() {
  const report = await pool.query(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN kyc_status = 'verified' THEN 1 ELSE 0 END) as kyc_verified,
      SUM(CASE WHEN account_status = 'suspended' THEN 1 ELSE 0 END) as suspended_accounts
    FROM users
  `);

  const largeTransactions = await pool.query(`
    SELECT * FROM transactions WHERE amount > 10000 AND created_at > NOW() - INTERVAL '1 day'
  `);

  // Email report
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  await transporter.sendMail({
    to: process.env.COMPLIANCE_EMAIL,
    subject: `Daily Compliance Report - ${new Date().toISOString().split('T')[0]}`,
    html: `
      <h2>Daily Compliance Report</h2>
      <p>Total Users: ${report.rows[0].total_users}</p>
      <p>KYC Verified: ${report.rows[0].kyc_verified}</p>
      <p>Suspended Accounts: ${report.rows[0].suspended_accounts}</p>
      <p>Large Transactions: ${largeTransactions.rows.length}</p>
    `
  });
}

// Schedule daily at 9 AM
import cron from 'node-cron';
cron.schedule('0 9 * * *', sendDailyComplianceReport);
```

---

## Step 8: Performance Optimization

### 8.1 Database Query Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX idx_spins_user_game ON spins(user_id, game_id);
CREATE INDEX idx_wallets_balance ON wallets(balance);
```

### 8.2 Caching with Redis

```javascript
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});

// Cache game list
app.get('/api/games', async (req, res) => {
  const cached = await client.get('games_list');
  if (cached) return res.json(JSON.parse(cached));

  const games = await pool.query('SELECT * FROM games WHERE is_active = TRUE');
  await client.setex('games_list', 3600, JSON.stringify(games.rows));
  res.json(games.rows);
});
```

---

## Step 9: Backup & Disaster Recovery

### 9.1 Database Backups

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/casino"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

pg_dump $DATABASE_URL > $BACKUP_DIR/casino_db_$TIMESTAMP.sql
gzip $BACKUP_DIR/casino_db_$TIMESTAMP.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/casino_db_$TIMESTAMP.sql.gz s3://casino-backups/

# Keep only last 30 days
find $BACKUP_DIR -name "casino_db_*.sql.gz" -mtime +30 -delete
```

### 9.2 Disaster Recovery Plan

- **RTO (Recovery Time Objective)**: 1 hour
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup Location**: AWS S3 (cross-region)
- **Failover**: Automated to standby database

---

## Step 10: Security Hardening

### 10.1 Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### 10.2 CORS Configuration

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 10.3 Security Headers

```javascript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:']
  }
}));
```

---

## Monitoring Checklist

- [ ] Server uptime monitoring
- [ ] Database performance monitoring
- [ ] Payment processing monitoring
- [ ] Error rate monitoring
- [ ] User activity monitoring
- [ ] Compliance event logging
- [ ] Security incident logging
- [ ] Daily backup verification

---

## Support & Escalation

**Critical Issues:**
- Page down: Immediate notification
- Payment failures: Immediate notification
- Security breach: Immediate notification

**Contact:**
- Technical Support: support@royalspincasino.com
- Compliance: compliance@royalspincasino.com
- Security: security@royalspincasino.com

---

**Deployment Status:** Ready for production launch after completing all checklist items.
