import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token') || null,
  user: null,
  loading: false,
  error: null,

  register: async (email, username, password, firstName, lastName) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        username,
        password,
        firstName,
        lastName
      });
      set({ loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      set({ loading: false, error: errorMsg });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ token, user, loading: false });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      set({ loading: false, error: errorMsg });
      throw error;
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, loading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ token: null, user: null, loading: false, error: 'Session expired' });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, error: null });
  },

  updateProfile: async (profileData) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data.user });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}));
