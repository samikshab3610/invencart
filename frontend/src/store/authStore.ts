import { create } from 'zustand';
import type { User } from '../types';

// This store holds who is currently logged in across the entire app.
// Any component can read from or write to this store without prop drilling.
interface AuthState {
  user: User | null;        // null means not logged in
  isLoading: boolean;       // true while checking /api/auth/me on app load
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true, // starts as true — app checks login status on load

  // Called after successful login or signup
  setUser: (user) => set({ user, isLoading: false }),

  // Called after logout or when /api/auth/me returns 401
  clearUser: () => set({ user: null, isLoading: false }),

  // Called while the app is checking if user is logged in
  setLoading: (loading) => set({ isLoading: loading }),
}));