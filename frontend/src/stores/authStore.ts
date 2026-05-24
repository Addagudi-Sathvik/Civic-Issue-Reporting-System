import { create } from 'zustand';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin' | 'department';
  department?: string | null;
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
    const normalizedUser = {
      ...user,
      id: user.id || user._id,
      role: user.role?.toLowerCase(),
    } as User;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    set({ user: normalizedUser, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    set({ user: null, token: null });
  },
  setInitialState: () => {
    if (typeof window !== 'undefined') {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr && userStr !== 'undefined') {
          const storedUser = JSON.parse(userStr);
          const normalizedUser = {
            ...storedUser,
            id: storedUser.id || storedUser._id,
            role: storedUser.role?.toLowerCase(),
          };
          set({ user: normalizedUser, token });
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
