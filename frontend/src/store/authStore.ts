import { create } from 'zustand';
import api from '../api/axios';

const saveUserToStorage = (user, token) => {
  if (!user || !user.role) return;
  const key = user.role === 'admin' ? 'admin_user' : 'client_user';
  localStorage.setItem(key, JSON.stringify(user));
  localStorage.setItem('token', token);
  localStorage.setItem('active_role', user.role);
};

const clearUserFromStorage = (role) => {
  if (role === 'admin') {
    localStorage.removeItem('admin_user');
  } else {
    localStorage.removeItem('client_user');
  }
  localStorage.removeItem('token');
  localStorage.removeItem('active_role');
};

const loadUserFromStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('active_role');
    if (!token || !role) return { user: null, token: null };
    const key = role === 'admin' ? 'admin_user' : 'client_user';
    const user = JSON.parse(localStorage.getItem(key) || 'null');
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
};

const { user: storedUser, token: storedToken } = loadUserFromStorage();

export const useAuthStore = create((set, get) => ({
  user: storedUser,
  token: storedToken,
  loading: true,

  setUser: (user) => set({ user }),

  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    saveUserToStorage(data, data.token);
    set({ user: data, token: data.token });
  },

  signup: async (userData) => {
    const { data } = await api.post('/auth/signup', userData);
    saveUserToStorage(data, data.token);
    set({ user: data, token: data.token });
  },

  logout: () => {
    const { user } = get();
    clearUserFromStorage(user?.role);
    window.dispatchEvent(new CustomEvent('auth:logout'));
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      saveUserToStorage(data, token);
      set({ user: data, loading: false });
    } catch {
      clearUserFromStorage();
      set({ user: null, token: null, loading: false });
    }
  },
}));