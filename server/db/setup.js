import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

// Use DATABASE_URL if available (Railway), otherwise build from individual env vars
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/postgres`;

const client = new Client({
  connectionString
});

const createDatabaseSQL = `
  SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME || 'casino_db'}';
`;

const createTablesSQL = `
  -- Users Table
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    country VARCHAR(100),
    phone VARCHAR(20),
    kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    kyc_verified_at TIMESTAMP,
    account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Wallets Table
  CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    total_deposited DECIMAL(15, 2) DEFAULT 0.00,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00,
    total_wagered DECIMAL(15, 2) DEFAULT 0.00,
    total_won DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Transactions Table
  CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- deposit, withdrawal, bet, win, bonus, refund
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2),
    balance_after DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, cancelled
    payment_method VARCHAR(50), -- stripe, bank_transfer, crypto, etc
    reference_id VARCHAR(255), -- Stripe transaction ID, etc
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Deposits Table
  CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL, -- stripe, bank_transfer, crypto
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
    stripe_payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  );

  -- Withdrawals Table
  CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES transactions(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    bank_account_id UUID REFERENCES bank_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  );

  -- Bank Accounts Table
  CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    routing_number VARCHAR(50),
    bank_name VARCHAR(255),
    country VARCHAR(100),
    is_verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Games Table
  CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    theme VARCHAR(100) NOT NULL, -- buffalo_gold, dragon_link, lightning_link, etc
    description TEXT,
    rtp DECIMAL(5, 4) DEFAULT 0.95, -- Return to Player percentage
    volatility VARCHAR(50), -- low, medium, high
    min_bet DECIMAL(10, 2),
    max_bet DECIMAL(10, 2),
    paylines INTEGER,
    reels INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Game Sessions Table
  CREATE TABLE IF NOT EXISTS game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id),
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP,
    total_spins INTEGER DEFAULT 0,
    total_bet DECIMAL(15, 2) DEFAULT 0.00,
    total_won DECIMAL(15, 2) DEFAULT 0.00,
    net_result DECIMAL(15, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'active' -- active, completed, abandoned
  );

  -- Spins Table
  CREATE TABLE IF NOT EXISTS spins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES games(id),
    bet_amount DECIMAL(10, 2) NOT NULL,
    win_amount DECIMAL(10, 2) DEFAULT 0.00,
    rng_seed VARCHAR(255), -- For provably fair verification
    result JSONB, -- Spin result data (reels, symbols, etc)
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Bonuses Table
  CREATE TABLE IF NOT EXISTS bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bonus_type VARCHAR(50) NOT NULL, -- welcome, deposit_match, free_spins, cashback
    amount DECIMAL(15, 2),
    free_spins INTEGER,
    status VARCHAR(50) DEFAULT 'active', -- active, used, expired
    wagering_requirement DECIMAL(10, 2),
    wagering_completed DECIMAL(15, 2) DEFAULT 0.00,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Compliance Logs Table
  CREATE TABLE IF NOT EXISTS compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- kyc_submitted, kyc_verified, large_deposit, withdrawal_requested, etc
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Create Indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
  CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
  CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_spins_user_id ON spins(user_id);
  CREATE INDEX IF NOT EXISTS idx_spins_session_id ON spins(session_id);
  CREATE INDEX IF NOT EXISTS idx_compliance_logs_user_id ON compliance_logs(user_id);
`;

async function setupDatabase() {
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();

    // Check if database exists
    const dbExists = await client.query(createDatabaseSQL);
    
    if (!dbExists.rows.length) {
      console.log(`Creating database: ${process.env.DB_NAME || 'casino_db'}...`);
      await client.query(`CREATE DATABASE "${process.env.DB_NAME || 'casino_db'}"`);
    }

    await client.end();

    // Connect to the casino database
    const casinoClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'casino_db'
    });

    console.log('Connecting to casino database...');
    await casinoClient.connect();

    console.log('Creating tables...');
    await casinoClient.query(createTablesSQL);

    console.log('✅ Database setup completed successfully!');
    await casinoClient.end();
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Only run setup if explicitly called
if (process.argv[2] === 'setup') {
  setupDatabase();
} else {
  console.log('Database setup script loaded. Run with: node server/db/setup.js setup');
}
