import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test Routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'Royal Spin Casino API is running!' });
});

app.get('/api/games', (req, res) => {
  res.json({
    games: [
      { id: 1, name: 'Buffalo Gold', rtp: 0.94 },
      { id: 2, name: 'Dragon Link', rtp: 0.96 },
      { id: 3, name: 'Lightning Link', rtp: 0.95 },
      { id: 4, name: '88 Fortunes', rtp: 0.94 },
      { id: 5, name: 'Wheel of Fortune', rtp: 0.92 },
      { id: 6, name: 'Dancing Drums', rtp: 0.93 }
    ]
  });
});

app.post('/api/games/:gameId/spin', (req, res) => {
  res.json({ success: true, result: 'WIN', amount: 250 });
});

// Serve casino.html as root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/casino.html'));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎰 Royal Spin Casino Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Casino available at: http://localhost:${PORT}`);
});
