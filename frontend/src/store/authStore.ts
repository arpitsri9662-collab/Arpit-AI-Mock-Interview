import { create } from 'zustand';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  checkToken: () => Promise<boolean>;
  startAutoLogout: () => void;
  stopAutoLogout: () => void;
}

// Timer ID for the periodic expiry check
let autoLogoutTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Decode a JWT and return its payload.
 * Returns null when the token is malformed.
 */
const decodeToken = (token: string): { exp?: number; id?: string } | null => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

/**
 * Check whether a token is still valid (i.e. not expired).
 */
const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload?.exp) return false;
  // Add a 10-second buffer so we logout slightly before actual expiry
  return Date.now() < payload.exp * 1000 - 10_000;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    get().stopAutoLogout();
    set({ token: null, user: null });
  },

  checkToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Quick client-side expiry check
    if (!isTokenValid(token)) {
      get().logout();
      return false;
    }

    try {
      const payload = decodeToken(token);
      const expiry = (payload?.exp ?? 0) * 1000;
      const remaining = expiry - Date.now();

      // If less than 15 min remaining, verify with server that user is still valid
      if (remaining < 15 * 60 * 1000) {
        const response = await authAPI.getMe();
        set({ user: response.data });
        localStorage.setItem('user', JSON.stringify(response.data));
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      // Server rejected the token — force logout
      get().logout();
      return false;
    }
  },

  /**
   * Start a background timer that checks token expiry every 60 seconds.
   * Automatically logs the user out when the token expires.
   */
  startAutoLogout: () => {
    // Clear any existing timer first
    if (autoLogoutTimer) {
      clearInterval(autoLogoutTimer);
      autoLogoutTimer = null;
    }

    autoLogoutTimer = setInterval(() => {
      const token = get().token;
      if (!isTokenValid(token)) {
        console.log('Token expired — auto logging out');
        get().logout();
        // Redirect to login page
        window.location.href = '/login';
      }
    }, 60_000); // Check every 60 seconds
  },

  stopAutoLogout: () => {
    if (autoLogoutTimer) {
      clearInterval(autoLogoutTimer);
      autoLogoutTimer = null;
    }
  },
}));
