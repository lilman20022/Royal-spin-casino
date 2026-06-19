import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../index.js';
import { verifyToken } from './auth.js';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Get Wallet Balance
router.get('/balance', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, balance, currency, total_deposited, total_withdrawn, 
              total_wagered, total_won FROM wallets WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ error: 'Failed to fetch wallet' });
  }
});

// Create Deposit Intent (Stripe)
router.post('/deposit', verifyToken, async (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user.id,
        type: 'deposit'
      }
    });

    // Create deposit record
    const depositId = uuidv4();
    await pool.query(
      `INSERT INTO deposits (id, user_id, amount, currency, payment_method, status, stripe_payment_intent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [depositId, req.user.id, amount, currency, 'stripe', 'pending', paymentIntent.id]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      depositId
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ error: 'Failed to create deposit' });
  }
});

// Confirm Deposit
router.post('/deposit/confirm', verifyToken, async (req, res) => {
  try {
    const { paymentIntentId, depositId } = req.body;

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Update deposit status
    const depositResult = await pool.query(
      'SELECT amount FROM deposits WHERE id = $1 AND user_id = $2',
      [depositId, req.user.id]
    );

    if (depositResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    const amount = depositResult.rows[0].amount;

    // Update wallet balance
    await pool.query(
      `UPDATE wallets 
       SET balance = balance + $1,
           total_deposited = total_deposited + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [amount, req.user.id]
    );

    // Create transaction record
    const transactionId = uuidv4();
    const walletResult = await pool.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    const wallet = walletResult.rows[0];

    await pool.query(
      `INSERT INTO transactions (id, user_id, wallet_id, type, amount, balance_before, balance_after, status, payment_method, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [transactionId, req.user.id, wallet.id, 'deposit', amount, wallet.balance - amount, wallet.balance, 'completed', 'stripe', paymentIntentId]
    );

    // Update deposit status
    await pool.query(
      'UPDATE deposits SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['completed', depositId]
    );

    // Log compliance event
    await pool.query(
      `INSERT INTO compliance_logs (user_id, event_type, description, metadata)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'deposit_completed', `Deposit of $${amount} completed`, JSON.stringify({ amount, paymentIntentId })]
    );

    res.json({
      message: 'Deposit confirmed successfully',
      transactionId,
      amount,
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Deposit confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm deposit' });
  }
});

// Request Withdrawal
router.post('/withdrawal', verifyToken, async (req, res) => {
  try {
    const { amount, paymentMethod = 'bank_transfer' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    // Check wallet balance
    const walletResult = await pool.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const wallet = walletResult.rows[0];

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Check daily withdrawal limit
    const dailyLimit = parseFloat(process.env.DAILY_WITHDRAWAL_LIMIT || '50000');
    const todayWithdrawals = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals 
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE AND status = 'completed'`,
      [req.user.id]
    );

    const totalToday = parseFloat(todayWithdrawals.rows[0].total);

    if (totalToday + amount > dailyLimit) {
      return res.status(400).json({ 
        error: `Daily withdrawal limit of $${dailyLimit} exceeded. Already withdrawn: $${totalToday}` 
      });
    }

    // Create withdrawal record
    const withdrawalId = uuidv4();
    await pool.query(
      `INSERT INTO withdrawals (id, user_id, amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [withdrawalId, req.user.id, amount, paymentMethod, 'pending']
    );

    // Reserve funds (deduct from balance)
    await pool.query(
      `UPDATE wallets 
       SET balance = balance - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [amount, req.user.id]
    );

    // Create transaction record
    const transactionId = uuidv4();
    const updatedWallet = await pool.query(
      'SELECT id, balance FROM wallets WHERE user_id = $1',
      [req.user.id]
    );

    await pool.query(
      `INSERT INTO transactions (id, user_id, wallet_id, type, amount, balance_before, balance_after, status, payment_method, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [transactionId, req.user.id, updatedWallet.rows[0].id, 'withdrawal', amount, wallet.balance, updatedWallet.rows[0].balance, 'pending', paymentMethod, withdrawalId]
    );

    // Log compliance event
    await pool.query(
      `INSERT INTO compliance_logs (user_id, event_type, description, metadata)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'withdrawal_requested', `Withdrawal of $${amount} requested`, JSON.stringify({ amount, paymentMethod })]
    );

    res.json({
      message: 'Withdrawal request submitted',
      withdrawalId,
      amount,
      status: 'pending',
      newBalance: updatedWallet.rows[0].balance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
});

// Get Withdrawal Status
router.get('/withdrawal/:withdrawalId', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, amount, status, payment_method, created_at, completed_at 
       FROM withdrawals WHERE id = $1 AND user_id = $2`,
      [req.params.withdrawalId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching withdrawal:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal' });
  }
});

// Get Transaction History
router.get('/transactions', verifyToken, async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;

    const result = await pool.query(
      `SELECT id, type, amount, balance_before, balance_after, status, payment_method, created_at
       FROM transactions WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = $1',
      [req.user.id]
    );

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

export default router;
