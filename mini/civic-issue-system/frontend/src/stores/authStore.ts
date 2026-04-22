import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'DEPARTMENT';
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setInitialState: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  setInitialState: () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr && userStr !== 'undefined') {
          set({ user: JSON.parse(userStr), token });
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
        console.error('Failed to parse user session', error);
      }
    }
  }
}));
