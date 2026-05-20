import { create } from 'zustand';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  isOnline: boolean;
  lastActive: string | Date;
  pinnedConversations?: string[];
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  checkSession: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  checkSession: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      set({ user: data.user, loading: false });
      return data.user;
    } catch (err) {
      console.error('Session check failed:', err);
      set({ user: null, loading: false });
      return null;
    }
  },
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      set({ user: null });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  },
}));
