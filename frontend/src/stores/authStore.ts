import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'dealer' | 'admin';
  avatar_url?: string;
  dealerStats?: {
    completed_orders: number;
    rating_avg: number;
    xp: number;
    rank: string;
  } | null;
  wallet?: { points: number } | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string; role?: string }) => Promise<void>;
  fetchMe: () => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await api<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  register: async (registerData) => {
    set({ loading: true });
    try {
      const data = await api<{ token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: registerData,
      });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  fetchMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const data = await api<{ user: User }>('/auth/me');
      set({ user: data.user, token });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));
