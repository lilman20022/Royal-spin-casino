# Royal Spin Casino - Live Deployment Instructions

Complete step-by-step guide to deploy your casino to production on Railway and Vercel.

## Prerequisites

- Railway account (railway.app)
- Vercel account (vercel.com)
- GitHub account (for automatic deployments)
- Stripe live account (already configured)
- Git installed locally

## Part 1: Prepare for Deployment

### Step 1: Create GitHub Repository

1. Go to github.com and create a new repository
2. Name it: `royal-spin-casino`
3. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/royal-spin-casino.git
   cd royal-spin-casino
   ```

### Step 2: Push Code to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: Royal Spin Casino platform"

# Push to GitHub
git push origin main
```

---

## Part 2: Deploy Backend to Railway

### Step 1: Create Railway Account

1. Go to railway.app
2. Sign up with GitHub
3. Create a new project

### Step 2: Add PostgreSQL Database

1. In Railway dashboard, click "New"
2. Select "PostgreSQL"
3. Wait for database to initialize
4. Note the connection string (you'll need it)

### Step 3: Deploy Backend Service

1. Click "New" → "GitHub Repo"
2. Select your `royal-spin-casino` repository
3. Configure environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[from PostgreSQL service]
   JWT_SECRET=[generate a secure random string]
   STRIPE_SECRET_KEY=[your stripe secret key]
   STRIPE_PUBLISHABLE_KEY=[your stripe publishable key]
   STRIPE_WEBHOOK_SECRET=[generate in Stripe dashboard]
   HOUSE_EDGE=0.05
   MIN_BET=1
   MAX_BET=10000
   DAILY_WITHDRAWAL_LIMIT=50000
   ```

4. Click "Deploy"
5. Wait for deployment to complete
6. Note the Railway URL (e.g., `https://royal-spin-casino-prod.railway.app`)

### Step 4: Initialize Production Database

Once backend is deployed:

1. In Railway dashboard, click on PostgreSQL service
2. Click "Connect" → "psql"
3. Run database setup:
   ```bash
   npm run db:setup
   npm run db:seed
   ```

Or use Railway CLI:
```bash
railway run npm run db:setup
railway run npm run db:seed
```

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Create Vercel Account

1. Go to vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### Step 2: Import Project

1. Click "New Project"
2. Select your `royal-spin-casino` repository
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`

### Step 3: Add Environment Variables

In Vercel dashboard, add:

```
VITE_API_URL=https://[your-railway-url]/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51TWiUQ1N8jdqEfR4Z40EWMJcIf2KIUtHt6cCZFq0HKIxjiMlwWXJBkoK9XSlYUWXVGPbqgF5JyGrD7I53kKxv5BO00GP0cR3SJ
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build and deployment to complete
3. Note the Vercel URL (e.g., `https://royal-spin-casino.vercel.app`)

---

## Part 4: Configure Stripe Webhooks

### Step 1: Get Webhook URL

Your backend webhook endpoint:
```
https://[your-railway-url]/api/webhooks/stripe
```

### Step 2: Add Webhook in Stripe

1. Go to stripe.com dashboard
2. Navigate to Developers → Webhooks
3. Click "Add endpoint"
4. Enter your webhook URL
5. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`

6. Click "Add endpoint"
7. Copy the webhook secret
8. Add to Railway environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=[your webhook secret]
   ```

---

## Part 5: Verify Deployment

### Test Backend

```bash
# Check health endpoint
curl https://[your-railway-url]/api/health

# Should return:
# {"status":"ok"}
```

### Test Frontend

1. Open https://[your-vercel-url]
2. You should see the Royal Spin Casino login page
3. Try registering a test account
4. Verify the app loads correctly

### Test Payment Flow

1. Login with test account
2. Go to Wallet → Deposit
3. Enter test amount
4. Use Stripe test card: 4242 4242 4242 4242
5. Verify payment completes
6. Check wallet balance updated

### Test Game Play

1. Go to Casino Lobby
2. Select a game
3. Set bet amount
4. Click Spin
5. Verify results display correctly

---

## Part 6: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel dashboard, go to Settings → Domains
2. Add your domain (e.g., royalspincasino.com)
3. Update DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

### Add Custom Domain to Railway

1. In Railway dashboard, go to Settings → Domains
2. Add your domain (e.g., api.royalspincasino.com)
3. Update DNS records
4. Wait for propagation

---

## Part 7: Monitoring & Maintenance

### Enable Monitoring

**Railway:**
- Logs: Available in dashboard
- Metrics: CPU, memory, network
- Alerts: Configure in settings

**Vercel:**
- Analytics: Dashboard shows performance
- Logs: Real-time logs available
- Alerts: Email on deployment failures

### Set Up Alerts

1. **Railway:** Go to Settings → Alerts
2. **Vercel:** Go to Settings → Notifications

### Monitor Stripe

1. Stripe Dashboard → Developers → Logs
2. Check webhook delivery status
3. Monitor payment failures

---

## Part 8: Troubleshooting

### Backend Won't Deploy

**Check logs:**
```bash
railway logs
```

**Common issues:**
- Database connection failed: Verify DATABASE_URL
- Port already in use: Change PORT variable
- Missing environment variables: Add all required vars

### Frontend Won't Deploy

**Check logs:**
- Vercel dashboard shows build errors
- Check VITE_API_URL is correct
- Verify environment variables are set

### Payments Not Working

1. Verify Stripe keys are correct
2. Check webhook is receiving events
3. Review Stripe dashboard for errors
4. Check browser console for errors

### Database Issues

1. Verify PostgreSQL is running
2. Check connection string
3. Run migrations: `railway run npm run db:setup`
4. Check database logs

---

## Part 9: Security Checklist

Before going live:

- [ ] SSL/HTTPS enabled (automatic with Vercel/Railway)
- [ ] Environment variables secured (not in code)
- [ ] Database backups configured
- [ ] Monitoring and alerts set up
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Security headers configured
- [ ] Stripe webhook secret secure
- [ ] JWT secret is strong and random

---

## Part 10: Going Live

### Soft Launch

1. Deploy to production
2. Test all features thoroughly
3. Monitor for 24-48 hours
4. Fix any issues found

### Full Launch

1. Announce platform
2. Enable user signups
3. Monitor closely
4. Be ready to support users

### Post-Launch

- Monitor performance daily
- Process withdrawals promptly
- Respond to user support requests
- Generate compliance reports
- Update security patches

---

## Useful Commands

### Railway CLI

```bash
# Login
railway login

# List projects
railway list

# View logs
railway logs

# Run command
railway run npm run db:seed

# Set environment variable
railway variables set KEY=value
```

### Vercel CLI

```bash
# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs [deployment-url]

# Set environment variable
vercel env add VARIABLE_NAME
```

### Git

```bash
# Push changes
git push origin main

# View status
git status

# Commit changes
git commit -m "message"
```

---

## Support

**Deployment Issues:**
- Railway Support: support@railway.app
- Vercel Support: support@vercel.com

**Casino Platform:**
- Technical: support@royalspincasino.com
- Compliance: compliance@royalspincasino.com

---

## Deployment Checklist

- [ ] GitHub repository created and pushed
- [ ] Railway project created
- [ ] PostgreSQL database added to Railway
- [ ] Backend deployed to Railway
- [ ] Database initialized and seeded
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Stripe webhooks configured
- [ ] Backend health endpoint tested
- [ ] Frontend loads correctly
- [ ] Test account created
- [ ] Payment flow tested
- [ ] Game play tested
- [ ] Monitoring configured
- [ ] Security checklist completed
- [ ] Ready for soft launch

---

## Live URLs (After Deployment)

**Backend API:**
```
https://[your-railway-url]/api
```

**Frontend:**
```
https://[your-vercel-url]
```

**Custom Domain (if configured):**
```
https://royalspincasino.com
https://api.royalspincasino.com
```

---

**Congratulations! Your Royal Spin Casino is now live in production!**

Next: Monitor the platform, process withdrawals, and support your players.
