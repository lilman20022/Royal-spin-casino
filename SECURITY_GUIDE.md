# Royal Spin Casino - Security Best Practices Guide

Comprehensive security guidelines for operating a real-money online casino platform.

## 1. Data Security

### 1.1 Encryption at Rest

All sensitive data must be encrypted:

```javascript
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

function encryptData(data) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

function decryptData(encryptedData) {
  const [iv, encrypted, authTag] = encryptedData.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}
```

### 1.2 Database Encryption

PostgreSQL with encryption:

```sql
-- Enable SSL
ALTER SYSTEM SET ssl = on;
ALTER SYSTEM SET ssl_cert_file = '/etc/ssl/certs/server.crt';
ALTER SYSTEM SET ssl_key_file = '/etc/ssl/private/server.key';

-- Create encrypted columns
CREATE TABLE sensitive_data (
  id UUID PRIMARY KEY,
  encrypted_value BYTEA,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 Encryption in Transit

All data must use HTTPS/TLS 1.2+:

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
ssl_prefer_server_ciphers on;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
```

---

## 2. Authentication & Authorization

### 2.1 Password Security

```javascript
import bcrypt from 'bcryptjs';

// Hash with salt rounds
const hashedPassword = await bcrypt.hash(password, 12);

// Verify
const isValid = await bcrypt.compare(password, hashedPassword);

// Enforce password policy
function validatePassword(password) {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  return password.length >= minLength && 
         hasUppercase && hasLowercase && 
         hasNumbers && hasSpecial;
}
```

### 2.2 JWT Security

```javascript
import jwt from 'jsonwebtoken';

// Create token with expiration
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET,
  { 
    expiresIn: '1h',
    algorithm: 'HS256'
  }
);

// Verify token
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### 2.3 Session Management

```javascript
// Session timeout after 30 minutes of inactivity
const SESSION_TIMEOUT = 30 * 60 * 1000;

app.use((req, res, next) => {
  if (req.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    
    if (now - lastActivity > SESSION_TIMEOUT) {
      req.session.destroy();
      return res.status(401).json({ error: 'Session expired' });
    }
    
    req.session.lastActivity = now;
  }
  next();
});
```

---

## 3. Payment Security

### 3.1 PCI DSS Compliance

Never store credit card data:

```javascript
// ❌ WRONG - Never do this
const card = {
  number: req.body.cardNumber,
  cvv: req.body.cvv,
  expiry: req.body.expiry
};

// ✅ CORRECT - Use Stripe tokenization
const token = await stripe.tokens.create({
  card: {
    number: req.body.cardNumber,
    exp_month: req.body.expMonth,
    exp_year: req.body.expYear,
    cvc: req.body.cvc
  }
});

// Store only the token
await pool.query(
  'INSERT INTO payments (user_id, stripe_token) VALUES ($1, $2)',
  [userId, token.id]
);
```

### 3.2 Payment Verification

```javascript
// Verify payment before crediting wallet
async function verifyPayment(paymentIntentId) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status !== 'succeeded') {
    throw new Error('Payment not completed');
  }
  
  // Verify amount matches
  const deposit = await pool.query(
    'SELECT amount FROM deposits WHERE stripe_payment_intent_id = $1',
    [paymentIntentId]
  );
  
  if (paymentIntent.amount !== Math.round(deposit.rows[0].amount * 100)) {
    throw new Error('Payment amount mismatch');
  }
  
  return true;
}
```

### 3.3 Refund Security

```javascript
// Only allow refunds within 90 days
async function processRefund(transactionId, amount) {
  const transaction = await pool.query(
    'SELECT created_at, amount FROM transactions WHERE id = $1',
    [transactionId]
  );
  
  const daysSinceTransaction = Math.floor(
    (Date.now() - new Date(transaction.rows[0].created_at)) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceTransaction > 90) {
    throw new Error('Refund period expired');
  }
  
  if (amount > transaction.rows[0].amount) {
    throw new Error('Refund amount exceeds transaction amount');
  }
  
  // Process refund
  const refund = await stripe.refunds.create({
    charge: transaction.rows[0].stripe_charge_id,
    amount: Math.round(amount * 100)
  });
  
  return refund;
}
```

---

## 4. API Security

### 4.1 Input Validation

```javascript
import { body, validationResult } from 'express-validator';

app.post('/api/wallet/deposit', [
  body('amount')
    .isFloat({ min: 1, max: 100000 })
    .withMessage('Amount must be between 1 and 100000'),
  body('currency')
    .isIn(['USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process request
});
```

### 4.2 SQL Injection Prevention

```javascript
// ❌ WRONG - SQL Injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ CORRECT - Parameterized queries
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

### 4.3 CORS Security

```javascript
const allowedOrigins = [
  'https://royalspincasino.com',
  'https://www.royalspincasino.com'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

## 5. Compliance & Audit

### 5.1 Audit Logging

```javascript
async function logAuditEvent(userId, eventType, details) {
  await pool.query(
    `INSERT INTO compliance_logs (user_id, event_type, description, metadata)
     VALUES ($1, $2, $3, $4)`,
    [userId, eventType, details.description, JSON.stringify(details)]
  );
}

// Log all sensitive operations
app.post('/api/wallet/withdrawal', verifyToken, async (req, res) => {
  try {
    // ... process withdrawal
    
    await logAuditEvent(req.user.id, 'withdrawal_requested', {
      description: `Withdrawal of $${amount} requested`,
      amount,
      paymentMethod,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    // Log error
    await logAuditEvent(req.user.id, 'withdrawal_failed', {
      description: `Withdrawal failed: ${error.message}`,
      ip: req.ip
    });
  }
});
```

### 5.2 KYC Verification

```javascript
async function verifyKYC(userId, kycData) {
  // Validate document
  if (!kycData.documentType || !kycData.documentNumber) {
    throw new Error('Invalid KYC data');
  }
  
  // Check for duplicates
  const existing = await pool.query(
    'SELECT id FROM users WHERE kyc_document_number = $1 AND id != $2',
    [kycData.documentNumber, userId]
  );
  
  if (existing.rows.length > 0) {
    throw new Error('Document already used');
  }
  
  // Update KYC status
  await pool.query(
    `UPDATE users SET kyc_status = 'verified', kyc_verified_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [userId]
  );
  
  // Log event
  await logAuditEvent(userId, 'kyc_verified', {
    description: 'KYC verification completed',
    documentType: kycData.documentType
  });
}
```

### 5.3 AML Monitoring

```javascript
async function checkAML(userId, amount) {
  // Check for suspicious patterns
  const dailyTotal = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
     WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
    [userId]
  );
  
  if (dailyTotal.rows[0].total + amount > 50000) {
    await logAuditEvent(userId, 'aml_alert_large_transaction', {
      description: `Large transaction detected: $${amount}`,
      dailyTotal: dailyTotal.rows[0].total,
      amount
    });
    
    // Notify compliance team
    // ... send alert email
  }
}
```

---

## 6. Infrastructure Security

### 6.1 Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (from app server only)
sudo ufw enable
```

### 6.2 DDoS Protection

Use CloudFlare or AWS Shield:

```javascript
// Rate limiting per IP
const ipLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:ip:'
  }),
  keyGenerator: (req) => req.ip,
  windowMs: 15 * 60 * 1000,
  max: 1000
});

app.use(ipLimiter);
```

### 6.3 Web Application Firewall (WAF)

```javascript
import helmet from 'helmet';

app.use(helmet());
app.use(helmet.contentSecurityPolicy());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
```

---

## 7. Incident Response

### 7.1 Security Incident Plan

1. **Detect** — Monitor for suspicious activity
2. **Respond** — Isolate affected systems
3. **Investigate** — Determine scope and impact
4. **Remediate** — Fix vulnerabilities
5. **Communicate** — Notify affected users
6. **Document** — Create incident report

### 7.2 Breach Notification

```javascript
async function notifyBreach(affectedUsers, breachType) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
  for (const user of affectedUsers) {
    await transporter.sendMail({
      to: user.email,
      subject: 'Security Notice - Action Required',
      html: `
        <h2>Security Notice</h2>
        <p>We detected unauthorized activity on your account.</p>
        <p>Please reset your password immediately.</p>
        <a href="https://royalspincasino.com/reset-password">Reset Password</a>
      `
    });
  }
  
  // Log incident
  await pool.query(
    `INSERT INTO security_incidents (type, affected_users, timestamp)
     VALUES ($1, $2, CURRENT_TIMESTAMP)`,
    [breachType, affectedUsers.length]
  );
}
```

---

## 8. Regular Security Tasks

### 8.1 Weekly Tasks
- [ ] Review access logs
- [ ] Check for failed login attempts
- [ ] Verify backup integrity
- [ ] Monitor system performance

### 8.2 Monthly Tasks
- [ ] Security patch updates
- [ ] Database optimization
- [ ] Compliance report review
- [ ] User activity analysis

### 8.3 Quarterly Tasks
- [ ] Penetration testing
- [ ] Security audit
- [ ] Disaster recovery drill
- [ ] Compliance review

### 8.4 Annual Tasks
- [ ] Full security assessment
- [ ] Compliance certification
- [ ] Infrastructure review
- [ ] Policy updates

---

## 9. Security Checklist

- [ ] SSL/TLS certificates valid and up-to-date
- [ ] Database encrypted at rest and in transit
- [ ] All passwords hashed with bcrypt
- [ ] JWT tokens have expiration
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention in place
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Audit logging enabled
- [ ] KYC verification required
- [ ] AML monitoring active
- [ ] Backup system operational
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Security headers configured
- [ ] DDoS protection enabled

---

## 10. Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Stripe Security](https://stripe.com/docs/security)

---

**Last Updated:** 2024-01-15
**Version:** 1.0
**Status:** Production Ready
