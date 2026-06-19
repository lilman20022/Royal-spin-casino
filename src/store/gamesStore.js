import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useGamesStore = create((set) => ({
  games: [],
  currentGame: null,
  currentSession: null,
  lastSpin: null,
  loading: false,
  error: null,

  fetchGames: async () => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/games`);
      set({ games: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch games' });
      throw error;
    }
  },

  getGame: async (gameId) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}`);
      set({ currentGame: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch game' });
      throw error;
    }
  },

  startSession: async (gameId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/games/session/start`,
        { gameId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ currentSession: response.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  spin: async (sessionId, gameId, betAmount) => {
    const token = localStorage.getItem('token');
    set({ loading: true });
    try {
      const response = await axios.post(`${API_URL}/games/spin`,
        { sessionId, gameId, betAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ lastSpin: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Spin failed' });
      throw error;
    }
  },

  endSession: async (sessionId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/games/session/end`,
        { sessionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      set({ currentSession: null });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getSessionHistory: async (limit = 20, offset = 0) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/games/sessions/history`,
        { 
          params: { limit, offset },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}));
