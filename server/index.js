import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🎰 Royal Spin Casino Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
