import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'casino_db'
});

const games = [
  {
    name: 'Buffalo Gold',
    theme: 'buffalo_gold',
    description: 'Classic buffalo-themed slot with Hold & Spin bonus',
    rtp: 0.94,
    volatility: 'high',
    min_bet: 0.25,
    max_bet: 100,
    paylines: 40,
    reels: 5
  },
  {
    name: 'Dragon Link',
    theme: 'dragon_link',
    description: 'Asian-inspired dragon slot with progressive jackpot',
    rtp: 0.96,
    volatility: 'medium',
    min_bet: 0.50,
    max_bet: 250,
    paylines: 50,
    reels: 5
  },
  {
    name: 'Lightning Link',
    theme: 'lightning_link',
    description: 'Electric-themed slot with link bonus feature',
    rtp: 0.95,
    volatility: 'high',
    min_bet: 0.25,
    max_bet: 100,
    paylines: 40,
    reels: 5
  },
  {
    name: '88 Fortunes',
    theme: 'fortunes',
    description: 'Lucky number 88 themed Asian slot',
    rtp: 0.93,
    volatility: 'medium',
    min_bet: 0.88,
    max_bet: 88,
    paylines: 25,
    reels: 5
  },
  {
    name: 'Wheel of Fortune',
    theme: 'wheel_of_fortune',
    description: 'Classic wheel-based slot with bonus wheel',
    rtp: 0.92,
    volatility: 'low',
    min_bet: 1.00,
    max_bet: 50,
    paylines: 20,
    reels: 3
  },
  {
    name: 'Dancing Drums',
    theme: 'dancing_drums',
    description: 'Festive Asian-themed slot with drum symbols',
    rtp: 0.94,
    volatility: 'medium',
    min_bet: 0.30,
    max_bet: 150,
    paylines: 40,
    reels: 5
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to casino database...');
    await client.connect();

    console.log('Seeding games...');
    
    for (const game of games) {
      const existingGame = await client.query(
        'SELECT id FROM games WHERE name = $1',
        [game.name]
      );

      if (existingGame.rows.length === 0) {
        await client.query(
          `INSERT INTO games (name, theme, description, rtp, volatility, min_bet, max_bet, paylines, reels)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [game.name, game.theme, game.description, game.rtp, game.volatility, 
           game.min_bet, game.max_bet, game.paylines, game.reels]
        );
        console.log(`✅ Seeded: ${game.name}`);
      } else {
        console.log(`⏭️  Already exists: ${game.name}`);
      }
    }

    console.log('✅ Database seeding completed!');
    await client.end();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
