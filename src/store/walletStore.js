import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useWalletStore = create((set) => ({
  wallet: null,
  transactions: [],
  loading: false,
  error: null,

  fetchWallet: async () => {
    const token = localStorage.getItem('token');
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ wallet: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch wallet' });
      throw error;
    }
  },

  fetchTransactions: async (limit = 50, offset = 0) => {
    const token = localStorage.getItem('token');
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/wallet/transactions`, {
        params: { limit, offset },
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ transactions: response.data.transactions, loading: false });
      return response.data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.error || 'Failed to fetch transactions' });
      throw error;
    }
  },

  createDeposit: async (amount, currency = 'USD') => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/wallet/deposit`, 
        { amount, currency },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  confirmDeposit: async (paymentIntentId, depositId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/wallet/deposit/confirm`,
        { paymentIntentId, depositId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh wallet after deposit
      await set({ wallet: null });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  requestWithdrawal: async (amount, paymentMethod = 'bank_transfer') => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/wallet/withdrawal`,
        { amount, paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh wallet after withdrawal
      await set({ wallet: null });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getWithdrawalStatus: async (withdrawalId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/wallet/withdrawal/${withdrawalId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}));
