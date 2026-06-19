import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../index.js';

const router = express.Router();

// Middleware to verify JWT
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, email, username, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, created_at`,
      [userId, email, username, hashedPassword, firstName || null, lastName || null]
    );

    // Create wallet for user
    await pool.query(
      'INSERT INTO wallets (id, user_id, balance) VALUES ($1, $2, $3)',
      [uuidv4(), userId, 0.00]
    );

    // Log compliance event
    await pool.query(
      `INSERT INTO compliance_logs (user_id, event_type, description)
       VALUES ($1, $2, $3)`,
      [userId, 'account_created', `New account created for ${email}`]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, username, password_hash, account_status FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check account status
    if (user.account_status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    // Log compliance event
    await pool.query(
      `INSERT INTO compliance_logs (user_id, event_type, description)
       VALUES ($1, $2, $3)`,
      [user.id, 'login', 'User logged in']
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Current User
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, date_of_birth, 
              country, phone, kyc_status, account_status, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update Profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, country, phone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           date_of_birth = COALESCE($3, date_of_birth),
           country = COALESCE($4, country),
           phone = COALESCE($5, phone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, username, first_name, last_name, country, phone`,
      [firstName, lastName, dateOfBirth, country, phone, req.user.id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
