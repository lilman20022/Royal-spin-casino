# Royal Spin Casino - Complete Setup Guide

This guide will walk you through setting up the complete real-money online casino platform from scratch.

## System Requirements

- Node.js 18+ (download from nodejs.org)
- PostgreSQL 12+ (download from postgresql.org)
- npm or yarn package manager
- Stripe account (for payment processing)
- A modern web browser

## Step 1: Install PostgreSQL

### Windows
1. Download PostgreSQL installer from postgresql.org
2. Run the installer and follow the setup wizard
3. Remember the password you set for the `postgres` user
4. Default port is 5432

### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 2: Create Database User and Database

Open PostgreSQL command line:

```bash
psql -U postgres
```

Then execute:

```sql
CREATE USER casino_user WITH PASSWORD 'secure_password';
CREATE DATABASE casino_db OWNER casino_user;
GRANT ALL PRIVILEGES ON DATABASE casino_db TO casino_user;
\q
```

## Step 3: Clone and Install Dependencies

```bash
cd /home/ubuntu/casino-platform
npm install
```

This installs all required packages for both backend and frontend.

## Step 4: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://casino_user:secure_password@localhost:5432/casino_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=casino_db
DB_USER=casino_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_very_secure_random_string_here_at_least_32_characters
JWT_EXPIRY=7d

# Stripe (Get these from your Stripe dashboard)
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Casino Configuration
HOUSE_EDGE=0.05
MIN_BET=1
MAX_BET=10000
DAILY_WITHDRAWAL_LIMIT=50000

# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
```

### Getting Stripe Keys

1. Go to stripe.com and create an account
2. Navigate to the Dashboard
3. Go to Developers → API Keys
4. Copy your Secret Key and Publishable Key
5. Paste them into your `.env` file

## Step 5: Initialize Database

Run the database setup script:

```bash
npm run db:setup
```

This will:
- Create all necessary tables
- Set up indexes for performance
- Initialize the schema

You should see output like:
```
✅ Database setup completed successfully!
```

## Step 6: Seed Sample Games

```bash
npm run db:seed
```

This adds 6 popular slot machines to the database:
- Buffalo Gold
- Dragon Link
- Lightning Link
- 88 Fortunes
- Wheel of Fortune
- Dancing Drums

## Step 7: Start Development Servers

```bash
npm run dev
```

This starts both servers concurrently:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

You should see output like:
```
🎰 Royal Spin Casino Server running on port 5000
Environment: development
```

## Step 8: Access the Platform

Open your browser and go to: **http://localhost:3000**

You should see the Royal Spin Casino login page.

## First Time Setup

### Create a Test Account

1. Click "Register"
2. Enter test credentials:
   - Email: test@example.com
   - Username: testuser
   - Password: TestPassword123
   - First Name: Test
   - Last Name: User
3. Click "Register"

### Login

1. Use the credentials you just created
2. You'll be taken to the dashboard

### Add Test Funds

1. Go to Wallet → Deposit
2. Enter an amount (e.g., $10)
3. Use Stripe test card: 4242 4242 4242 4242
4. Expiry: Any future date (e.g., 12/25)
5. CVC: Any 3 digits (e.g., 123)
6. Complete the payment

### Play a Game

1. Go to Casino Lobby
2. Select a game (e.g., Buffalo Gold)
3. Set your bet amount
4. Click "Spin"
5. Watch the results

## API Testing

### Using cURL

Test the health endpoint:

```bash
curl http://localhost:5000/api/health
```

Register a user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Using Postman

1. Download Postman from postman.com
2. Import the API collection (create requests for each endpoint)
3. Set the base URL to http://localhost:5000/api
4. Test each endpoint

## Troubleshooting

### "Cannot connect to database"

1. Verify PostgreSQL is running:
   ```bash
   psql -U postgres
   ```
2. Check your `.env` database credentials
3. Ensure the database exists:
   ```bash
   psql -U casino_user -d casino_db
   ```

### "Port 5000 already in use"

Change the port in `.env`:
```env
PORT=5001
```

### "Stripe key not working"

1. Verify you're using test keys (start with `sk_test_` or `pk_test_`)
2. Check your Stripe dashboard for the correct keys
3. Make sure you've copied the entire key without spaces

### "npm install fails"

1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete node_modules and package-lock.json:
   ```bash
   rm -rf node_modules package-lock.json
   ```
3. Reinstall:
   ```bash
   npm install
   ```

### "Frontend not loading"

1. Check that Vite is running (you should see output on port 3000)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Check browser console for errors (F12)

## Production Deployment

### Before Going Live

1. **Obtain Gaming License**: Contact your jurisdiction's gaming authority
2. **Legal Review**: Have lawyers review your terms and conditions
3. **Security Audit**: Conduct a security audit of the codebase
4. **Compliance Check**: Ensure all compliance features are enabled
5. **Payment Processor**: Set up production Stripe account

### Deployment Steps

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Deploy backend to a server (Heroku, Railway, AWS, etc.)

3. Deploy frontend to a CDN (Vercel, Netlify, AWS S3, etc.)

4. Set production environment variables

5. Use production Stripe keys

6. Enable SSL/HTTPS

7. Set up database backups

8. Monitor logs and analytics

## Useful Commands

```bash
# Start development
npm run dev

# Build frontend
npm run build

# Preview production build
npm run preview

# Setup database
npm run db:setup

# Seed games
npm run db:seed

# Start only backend
npm run server:dev

# Start only frontend
npm run client:dev
```

## Database Management

### Connect to Database

```bash
psql -U casino_user -d casino_db
```

### Useful SQL Queries

View all users:
```sql
SELECT id, email, username, kyc_status, account_status FROM users;
```

View all transactions:
```sql
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

View game statistics:
```sql
SELECT name, COUNT(*) as spins, SUM(bet_amount) as total_wagered 
FROM games g 
LEFT JOIN spins s ON g.id = s.game_id 
GROUP BY g.id, g.name;
```

Check wallet balances:
```sql
SELECT u.username, w.balance FROM users u JOIN wallets w ON u.id = w.user_id;
```

## Support

For issues or questions:

1. Check the README.md for detailed documentation
2. Review API endpoint documentation
3. Check browser console for errors (F12)
4. Check server logs for backend errors
5. Contact: support@royalspincasino.com

## Next Steps

1. Customize the UI with your branding
2. Add more slot games
3. Implement additional payment methods
4. Set up email notifications
5. Create admin dashboard UI
6. Implement responsible gaming features
7. Set up analytics and reporting
8. Prepare for production deployment

---

**Congratulations!** Your Royal Spin Casino platform is now ready for development and testing. Follow the steps above to get started.
