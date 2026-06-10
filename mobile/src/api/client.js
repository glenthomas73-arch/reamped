import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.reamped.app';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // token not available
  }
  return config;
});

// Handle 401 → clear token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Search ──────────────────────────────────────────────────────────────────
export const searchListings = (params) =>
  api.get('/api/search', { params });

export const getListing = (id) =>
  api.get(`/api/search/${id}`);

// ── Watchlist ────────────────────────────────────────────────────────────────
export const getWatchlist = () =>
  api.get('/api/watchlist');

export const addToWatchlist = (listingId) =>
  api.post('/api/watchlist', { listing_id: listingId });

export const removeFromWatchlist = (listingId) =>
  api.delete(`/api/watchlist/${listingId}`);

// ── Alerts ───────────────────────────────────────────────────────────────────
export const getAlerts = () =>
  api.get('/api/alerts');

export const createAlert = (data) =>
  api.post('/api/alerts', data);

export const deleteAlert = (alertId) =>
  api.delete(`/api/alerts/${alertId}`);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const loginUser = (email, password) =>
  api.post('/api/auth/login', { email, password });

export const registerUser = (email, password) =>
  api.post('/api/auth/register', { email, password });

export const getProfile = () =>
  api.get('/api/auth/me');

// ── Subscriptions ─────────────────────────────────────────────────────────────
export const getSubscriptionStatus = () =>
  api.get('/api/subscriptions/status');
