import express from 'express';
import { pool } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Middleware to verify admin (simplified - in production, check user role)
const verifyAdmin = (req, res, next) => {
  // TODO: Implement proper admin role verification
  // For now, this is a placeholder
  next();
};

// Get Compliance Logs
router.get('/compliance/logs', verifyAdmin, async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const offset = req.query.offset || 0;
    const userId = req.query.userId;

    let query = 'SELECT id, user_id, event_type, description, created_at FROM compliance_logs';
    let params = [];

    if (userId) {
      query += ' WHERE user_id = $1';
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      logs: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching compliance logs:', error);
    res.status(500).json({ error: 'Failed to fetch compliance logs' });
  }
});

// Get User Compliance Status
router.get('/compliance/user/:userId', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, kyc_status, account_status, created_at
       FROM users WHERE id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get recent transactions
    const transactions = await pool.query(
      `SELECT id, type, amount, status, created_at FROM transactions 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.params.userId]
    );

    // Get compliance logs
    const logs = await pool.query(
      `SELECT event_type, description, created_at FROM compliance_logs 
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.userId]
    );

    res.json({
      user,
      recentTransactions: transactions.rows,
      complianceLogs: logs.rows
    });
  } catch (error) {
    console.error('Error fetching user compliance:', error);
    res.status(500).json({ error: 'Failed to fetch user compliance' });
  }
});

// Get Platform Analytics
router.get('/analytics/overview', verifyAdmin, async (req, res) => {
  try {
    // Total users
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
    
    // Total deposits
    const depositsResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
       FROM deposits WHERE status = 'completed'`
    );

    // Total withdrawals
    const withdrawalsResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
       FROM withdrawals WHERE status = 'completed'`
    );

    // Total wagered
    const wagerResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'bet'`
    );

    // Total won
    const winResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'win'`
    );

    // Active sessions
    const sessionsResult = await pool.query(
      `SELECT COUNT(*) as active FROM game_sessions WHERE status = 'active'`
    );

    res.json({
      totalUsers: parseInt(usersResult.rows[0].total),
      deposits: {
        count: parseInt(depositsResult.rows[0].count),
        total: parseFloat(depositsResult.rows[0].total)
      },
      withdrawals: {
        count: parseInt(withdrawalsResult.rows[0].count),
        total: parseFloat(withdrawalsResult.rows[0].total)
      },
      totalWagered: parseFloat(wagerResult.rows[0].total),
      totalWon: parseFloat(winResult.rows[0].total),
      activeSessions: parseInt(sessionsResult.rows[0].active)
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get Game Statistics
router.get('/analytics/games', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        g.id, g.name, g.theme,
        COUNT(s.id) as total_spins,
        COALESCE(SUM(s.bet_amount), 0) as total_wagered,
        COALESCE(SUM(s.win_amount), 0) as total_paid,
        COUNT(CASE WHEN s.is_winner THEN 1 END) as winning_spins
       FROM games g
       LEFT JOIN spins s ON g.id = s.game_id
       GROUP BY g.id, g.name, g.theme
       ORDER BY total_spins DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

// Get Large Transactions (for compliance monitoring)
router.get('/compliance/large-transactions', verifyAdmin, async (req, res) => {
  try {
    const threshold = req.query.threshold || 5000;

    const result = await pool.query(
      `SELECT 
        t.id, t.user_id, u.email, u.username, t.type, t.amount, t.status, t.created_at
       FROM transactions t
       JOIN users u ON t.user_id = u.id
       WHERE t.amount > $1
       ORDER BY t.created_at DESC
       LIMIT 100`,
      [threshold]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching large transactions:', error);
    res.status(500).json({ error: 'Failed to fetch large transactions' });
  }
});

// Verify KYC Status
router.post('/kyc/verify', verifyAdmin, async (req, res) => {
  try {
    const { userId, status } = req.body; // status: verified, rejected

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET kyc_status = $1, kyc_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, kyc_status`,
      [status, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log compliance event
    await pool.query(
      `INSERT INTO compliance_logs (user_id, event_type, description)
       VALUES ($1, $2, $3)`,
      [userId, `kyc_${status}`, `KYC status updated to ${status}`]
    );

    res.json({
      message: `KYC status updated to ${status}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating KYC:', error);
    res.status(500).json({ error: 'Failed to update KYC' });
  }
});

// Suspend Account
router.post('/users/suspend', verifyAdmin, async (req, res) => {
  try {
    const { userId, reason } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET account_status = 'suspended', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, account_status`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log compliance event
    await pool.query(
      `INSERT INTO compliance_logs (user_id, event_type, description)
       VALUES ($1, $2, $3)`,
      [userId, 'account_suspended', reason || 'Account suspended by admin']
    );

    res.json({
      message: 'Account suspended',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error suspending account:', error);
    res.status(500).json({ error: 'Failed to suspend account' });
  }
});

export default router;
