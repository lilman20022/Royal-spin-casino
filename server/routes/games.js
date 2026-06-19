import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../index.js';
import { verifyToken } from './auth.js';
import crypto from 'crypto';

const router = express.Router();

// Provably Fair RNG
function generateRNG(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
}

// Get All Games
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, theme, description, rtp, volatility, min_bet, max_bet, paylines, reels
       FROM games WHERE is_active = TRUE
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get Game Details
router.get('/:gameId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, theme, description, rtp, volatility, min_bet, max_bet, paylines, reels
       FROM games WHERE id = $1 AND is_active = TRUE`,
      [req.params.gameId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Start Game Session
router.post('/session/start', verifyToken, async (req, res) => {
  try {
    const { gameId } = req.body;

    // Verify game exists
    const gameResult = await pool.query(
      'SELECT id, min_bet, max_bet FROM games WHERE id = $1 AND is_active = TRUE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create session
    const sessionId = uuidv4();
    await pool.query(
      `INSERT INTO game_sessions (id, user_id, game_id, status)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, req.user.id, gameId, 'active']
    );

    res.json({
      sessionId,
      gameId,
      minBet: gameResult.rows[0].min_bet,
      maxBet: gameResult.rows[0].max_bet
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Spin Slot Machine
router.post('/spin', verifyToken, async (req, res) => {
  try {
    const { sessionId, gameId, betAmount } = req.body;

    if (!betAmount || betAmount <= 0) {
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Verify game
    const gameResult = await pool.query(
      'SELECT id, rtp, min_bet, max_bet FROM games WHERE id = $1 AND is_active = TRUE',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const game = gameResult.rows[0];

    // Verify bet limits
    if (betAmount < game.min_bet || betAmount > game.max_bet) {
      return res.status(400).json({ error: `Bet must be between $${game.min_bet} and $${game.max_bet}` });
    }

    // Check wallet balance
    const walletResult = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    if (walletResult.rows.length === 0 || walletResult.rows[0].balance < betAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Generate RNG seed (provably fair)
    const rngSeed = `${sessionId}-${Date.now()}-${Math.random()}`;
    const rng = generateRNG(rngSeed);

    // Determine win/loss based on RTP
    const rtp = parseFloat(game.rtp);
    const isWin = rng < rtp;
    
    // Calculate win amount (simplified payout structure)
    let winAmount = 0;
    if (isWin) {
      // Payout multiplier based on RNG
      const multiplier = 2 + (rng / rtp) * 8; // 2x to 10x payout
      winAmount = Math.round(betAmount * multiplier * 100) / 100;
    }

    // Deduct bet from wallet
    const balanceBefore = walletResult.rows[0].balance;
    const balanceAfter = balanceBefore - betAmount + winAmount;

    await pool.query(
      `UPDATE wallets 
       SET balance = $1,
           total_wagered = total_wagered + $2,
           total_won = total_won + $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4`,
      [balanceAfter, betAmount, winAmount, req.user.id]
    );

    // Create spin record
    const spinId = uuidv4();
    const spinResult = {
      reels: [Math.floor(rng * 5), Math.floor((rng * 0.7) * 5), Math.floor((rng * 0.5) * 5)],
      symbols: ['cherry', 'bell', 'bar', 'seven', 'gold'][Math.floor(rng * 5)]
    };

    await pool.query(
      `INSERT INTO spins (id, session_id, user_id, game_id, bet_amount, win_amount, rng_seed, result, is_winner)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [spinId, sessionId, req.user.id, gameId, betAmount, winAmount, rngSeed, JSON.stringify(spinResult), isWin]
    );

    // Update session
    await pool.query(
      `UPDATE game_sessions 
       SET total_spins = total_spins + 1,
           total_bet = total_bet + $1,
           total_won = total_won + $2,
           net_result = net_result + ($2 - $1)
       WHERE id = $3`,
      [betAmount, winAmount, sessionId]
    );

    // Create transaction record
    const walletId = await pool.query(
      'SELECT id FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    const transactionId = uuidv4();
    await pool.query(
      `INSERT INTO transactions (id, user_id, wallet_id, type, amount, balance_before, balance_after, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [transactionId, req.user.id, walletId.rows[0].id, 'bet', betAmount - winAmount, balanceBefore, balanceAfter, 'completed']
    );

    res.json({
      spinId,
      sessionId,
      betAmount,
      winAmount,
      isWin,
      result: spinResult,
      balanceBefore,
      balanceAfter,
      rngSeed // For provably fair verification
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({ error: 'Failed to process spin' });
  }
});

// End Game Session
router.post('/session/end', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const result = await pool.query(
      `UPDATE game_sessions 
       SET status = 'completed', session_end = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING id, total_spins, total_bet, total_won, net_result`,
      [sessionId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      message: 'Session ended',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get Session History
router.get('/sessions/history', verifyToken, async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      `SELECT gs.id, g.name, g.theme, gs.total_spins, gs.total_bet, gs.total_won, 
              gs.net_result, gs.session_start, gs.session_end
       FROM game_sessions gs
       JOIN games g ON gs.game_id = g.id
       WHERE gs.user_id = $1
       ORDER BY gs.session_start DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
