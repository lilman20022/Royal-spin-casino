# 🚀 Royal Spin Casino - Quick Deployment (5 Minutes)

The fastest way to get your casino live.

## Prerequisites (Have These Ready)

- GitHub account
- Railway account (railway.app)
- Vercel account (vercel.com)
- Your Stripe keys (already configured)

## Step 1: Push to GitHub (2 minutes)

```bash
cd /home/ubuntu/casino-platform

git init
git add .
git commit -m "Royal Spin Casino - Production Ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/royal-spin-casino.git
git push -u origin main
```

## Step 2: Deploy Backend to Railway (2 minutes)

1. Go to railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your `royal-spin-casino` repository
4. Add PostgreSQL service (click "Add Service" → "PostgreSQL")
5. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=[auto-filled from PostgreSQL]
   JWT_SECRET=generate_a_random_secure_string_here_32_chars_minimum
   STRIPE_SECRET_KEY=[your stripe secret key]
   STRIPE_PUBLISHABLE_KEY=[your stripe publishable key]
   STRIPE_WEBHOOK_SECRET=whsec_test_secret_placeholder
   HOUSE_EDGE=0.05
   MIN_BET=1
   MAX_BET=10000
   DAILY_WITHDRAWAL_LIMIT=50000
   ```
6. Click "Deploy"
7. Wait for deployment (2-3 minutes)
8. Copy your Railway URL (e.g., `https://royal-spin-casino-prod.railway.app`)

## Step 3: Initialize Database (1 minute)

In Railway dashboard:

1. Click on your PostgreSQL service
2. Click "Connect" → "psql"
3. Run:
   ```bash
   npm run db:setup
   npm run db:seed
   ```

Or use Railway CLI:
```bash
railway run npm run db:setup
railway run npm run db:seed
```

## Step 4: Deploy Frontend to Vercel (1 minute)

1. Go to vercel.com
2. Click "New Project"
3. Select your `royal-spin-casino` repository
4. Framework: Vite (auto-detected)
5. Add environment variables:
   ```
   VITE_API_URL=https://[your-railway-url]/api
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51TWiUQ1N8jdqEfR4Z40EWMJcIf2KIUtHt6cCZFq0HKIxjiMlwWXJBkoK9XSlYUWXVGPbqgF5JyGrD7I53kKxv5BO00GP0cR3SJ
   ```
6. Click "Deploy"
7. Wait for deployment (1-2 minutes)
8. Copy your Vercel URL (e.g., `https://royal-spin-casino.vercel.app`)

## Step 5: Configure Stripe Webhooks (1 minute)

1. Go to stripe.com dashboard
2. Developers → Webhooks → "Add endpoint"
3. Endpoint URL: `https://[your-railway-url]/api/webhooks/stripe`
4. Select events:
   - payment_intent.succeeded
   - payment_intent.payment_failed
   - charge.refunded
5. Copy webhook secret
6. Add to Railway environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=[your webhook secret]
   ```

## ✅ You're Live!

**Your casino is now live at:**

- **Frontend:** https://[your-vercel-url]
- **Backend API:** https://[your-railway-url]/api
- **Admin:** https://[your-vercel-url]/admin

## Test It

1. Open https://[your-vercel-url]
2. Register test account
3. Deposit test funds (use card: 4242 4242 4242 4242)
4. Play a game
5. Request withdrawal

## Next Steps

1. **Custom Domain** (optional) — Add your domain in Vercel settings
2. **Monitoring** — Set up alerts in Railway and Vercel
3. **Compliance** — Configure KYC and AML
4. **Marketing** — Announce your casino
5. **Support** — Set up support email

## Troubleshooting

**Backend not deploying?**
- Check Railway logs: `railway logs`
- Verify all environment variables are set
- Check GitHub repository is connected

**Frontend not loading?**
- Verify VITE_API_URL is correct
- Check Vercel build logs
- Clear browser cache

**Payments not working?**
- Verify Stripe keys are correct
- Check webhook is configured
- Review Stripe dashboard for errors

## Support

- Railway: support@railway.app
- Vercel: support@vercel.com
- Stripe: support@stripe.com

---

**Congratulations! Your Royal Spin Casino is live! 🎰**

Total time: ~10 minutes
Status: ✅ Production Ready
Players: Ready to accept
