# Royal Spin Casino - Full-Scale Online Casino Platform

A complete real-money operational online casino platform featuring slot machines themed after the most popular physical casino games, with functional deposit/withdrawal features, user authentication, KYC verification, and compliance infrastructure.

## Features

### Core Features
- **User Authentication**: Secure registration and login with JWT tokens
- **Real-Money Wallet System**: Balance tracking, deposits, and withdrawals
- **Payment Processing**: Stripe integration for deposits
- **Withdrawal System**: Bank transfer and multiple payment method support
- **Transaction History**: Complete audit trail of all transactions
- **KYC Verification**: Know Your Customer compliance framework
- **Compliance Logging**: Full audit logs for regulatory compliance

### Gaming Features
- **Slot Machines**: 5+ themed slot games based on popular physical casino slots
  - Buffalo Gold
  - Dragon Link
  - Lightning Link
  - 88 Fortunes
  - Wheel of Fortune
  - And more...
- **Provably Fair Gaming**: RNG with SHA-256 verification
- **Game Sessions**: Track player sessions and statistics
- **Betting System**: Configurable min/max bets per game
- **Payout Calculations**: Realistic RTP (Return to Player) percentages

### Admin Features
- **Compliance Dashboard**: Monitor user activity and transactions
- **KYC Management**: Verify or reject user identity verification
- **Analytics**: Game statistics, player metrics, revenue tracking
- **Large Transaction Monitoring**: Flag suspicious activity
- **Account Management**: Suspend or manage user accounts

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data persistence
- **Stripe API** for payment processing
- **JWT** for authentication
- **Bcrypt** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Axios** for API calls

## Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Stripe account (for payment processing)

### 1. Clone & Install Dependencies
```bash
cd casino-platform
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/casino_db

# JWT
JWT_SECRET=your_secure_secret_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Casino Config
HOUSE_EDGE=0.05
MIN_BET=1
MAX_BET=10000
DAILY_WITHDRAWAL_LIMIT=50000
```

### 3. Database Setup
```bash
npm run db:setup
```

This will:
- Create the PostgreSQL database
- Create all required tables
- Set up indexes for performance

### 4. Seed Games (Optional)
```bash
npm run db:seed
```

### 5. Start Development Servers
```bash
npm run dev
```

This starts both:
- Backend server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/deposit` - Create deposit intent
- `POST /api/wallet/deposit/confirm` - Confirm deposit
- `POST /api/wallet/withdrawal` - Request withdrawal
- `GET /api/wallet/transactions` - Get transaction history

### Games
- `GET /api/games` - List all games
- `GET /api/games/:gameId` - Get game details
- `POST /api/games/session/start` - Start game session
- `POST /api/games/spin` - Execute spin
- `POST /api/games/session/end` - End game session
- `GET /api/games/sessions/history` - Get session history

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/summary/stats` - Get transaction summary

### Admin
- `GET /api/admin/compliance/logs` - Get compliance logs
- `GET /api/admin/compliance/user/:userId` - Get user compliance status
- `GET /api/admin/analytics/overview` - Get platform analytics
- `GET /api/admin/analytics/games` - Get game statistics
- `POST /api/admin/kyc/verify` - Verify KYC status
- `POST /api/admin/users/suspend` - Suspend user account

## Database Schema

### Core Tables
- **users** - User accounts with KYC status
- **wallets** - User wallet balances and statistics
- **transactions** - All financial transactions
- **deposits** - Deposit records with Stripe integration
- **withdrawals** - Withdrawal requests and status
- **bank_accounts** - User bank account information

### Gaming Tables
- **games** - Available slot machines
- **game_sessions** - Player gaming sessions
- **spins** - Individual spin records with RNG seeds
- **bonuses** - Player bonuses and promotions

### Compliance Tables
- **compliance_logs** - Audit trail for regulatory compliance

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Cross-origin request validation
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: (To be implemented)
- **KYC Verification**: Identity verification framework
- **Audit Logging**: Complete compliance audit trail
- **PCI Compliance**: Stripe handles payment card data

## Responsible Gaming

The platform includes features to promote responsible gaming:
- Daily withdrawal limits
- Session tracking
- Betting limits per game
- Account suspension capability
- Compliance logging for regulatory bodies

## Deployment

### Production Build
```bash
npm run build
```

### Using Docker (Optional)
```bash
docker build -t casino-platform .
docker run -p 5000:5000 -p 3000:3000 casino-platform
```

### Cloud Deployment
- **Backend**: Deploy to Heroku, Railway, or AWS
- **Frontend**: Deploy to Vercel, Netlify, or AWS S3 + CloudFront
- **Database**: Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)

## Regulatory Compliance

This platform is built with compliance in mind:
- KYC (Know Your Customer) verification framework
- AML (Anti-Money Laundering) logging
- Transaction monitoring for suspicious activity
- Complete audit trail for regulatory bodies
- Account suspension capabilities
- Daily withdrawal limits

**Note**: You must obtain proper gaming licenses in your jurisdiction before operating this platform.

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U user -d casino_db -h localhost
```

### Stripe Integration Issues
- Verify API keys in `.env`
- Check Stripe webhook configuration
- Review Stripe dashboard for errors

### Port Already in Use
```bash
# Change ports in .env or vite.config.js
PORT=5001  # Backend
# Frontend port in vite.config.js
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues and support, contact: support@royalspincasino.com

---

**⚠️ IMPORTANT LEGAL NOTICE**: 
This platform is provided as-is for demonstration purposes. Operating an online casino requires proper licensing and compliance with local, state, and international gambling regulations. The operator is solely responsible for obtaining necessary licenses and maintaining compliance with all applicable laws and regulations.
