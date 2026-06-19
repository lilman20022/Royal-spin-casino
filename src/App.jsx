import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CasinoLobby from './pages/CasinoLobby';
import GamePlay from './pages/GamePlay';
import Wallet from './pages/Wallet';
import Deposit from './pages/Deposit';
import Withdrawal from './pages/Withdrawal';
import TransactionHistory from './pages/TransactionHistory';
import Profile from './pages/Profile';
import './App.css';

function App() {
  const { token, user, loadUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, [token, loadUser]);

  return (
    <Router>
      <div className="app">
        {token && <Navigation />}
        <main className="main-content">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/lobby" element={token ? <CasinoLobby /> : <Navigate to="/login" />} />
            <Route path="/game/:gameId" element={token ? <GamePlay /> : <Navigate to="/login" />} />
            <Route path="/wallet" element={token ? <Wallet /> : <Navigate to="/login" />} />
            <Route path="/deposit" element={token ? <Deposit /> : <Navigate to="/login" />} />
            <Route path="/withdrawal" element={token ? <Withdrawal /> : <Navigate to="/login" />} />
            <Route path="/transactions" element={token ? <TransactionHistory /> : <Navigate to="/login" />} />
            <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />

            {/* Default Route */}
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
