import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMe } from '../api/authApi';

// This hook checks if the user is logged in when the app first loads.
// It reads the httpOnly cookie by calling /api/auth/me —
// if the cookie exists and is valid, the user is logged in.
// If not, they're treated as a guest.
export function useAuth() {
  const { user, isLoading, setUser, clearUser } = useAuthStore();

  useEffect(() => {
    // Check login status once when the app mounts.
    // This restores the session after a page refresh.
    getMe()
      .then((user) => {
        // Cookie was valid — user is logged in, store their info.
        setUser(user);
      })
      .catch(() => {
        // Cookie missing or expired — treat as guest.
        clearUser();
      });
  }, []); // empty array = run once on mount only

  return { user, isLoading };
}