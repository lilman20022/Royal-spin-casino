import express from 'express';
import { pool } from '../index.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Get All Transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;
    const type = req.query.type; // Optional filter

    let query = `SELECT id, type, amount, balance_before, balance_after, status, payment_method, created_at
                 FROM transactions WHERE user_id = $1`;
    let params = [req.user.id];

    if (type) {
      query += ` AND type = $2`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) as total FROM transactions WHERE user_id = $1 ${type ? 'AND type = $2' : ''}`;
    const countParams = [req.user.id];
    if (type) countParams.push(type);

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get Transaction Details
router.get('/:transactionId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, amount, balance_before, balance_after, status, payment_method, reference_id, description, created_at
       FROM transactions WHERE id = $1 AND user_id = $2`,
      [req.params.transactionId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Get Transaction Summary
router.get('/summary/stats', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as total_withdrawals,
        SUM(CASE WHEN type = 'bet' THEN amount ELSE 0 END) as total_wagered,
        SUM(CASE WHEN type = 'win' THEN amount ELSE 0 END) as total_won
       FROM transactions WHERE user_id = $1`,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
