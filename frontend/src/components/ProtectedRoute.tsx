import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Shows a loading spinner while checking login status on app load.
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'CUSTOMER' | 'OWNER';
}

// Wraps any page that requires authentication.
// If not logged in → redirect to /login
// If wrong role → redirect to correct area
// If loading → show spinner (prevents flash of wrong content)
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  // Still checking login status — show spinner, not a redirect.
  // Without this, the app would briefly redirect to /login
  // even for logged-in users (before the cookie check finishes).
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not logged in at all → go to login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role — send them to the right place.
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'OWNER' ? '/admin' : '/shop'} replace />;
  }

  // All checks passed — render the actual page.
  return <>{children}</>;
}

// Redirect logged-in users away from /login and /signup.
// An already logged-in customer visiting /login should go straight to /shop.
export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Already logged in — redirect to correct area.
  if (user) {
    return <Navigate to={user.role === 'OWNER' ? '/admin' : '/shop'} replace />;
  }

  // Not logged in — show the login/signup page.
  return <>{children}</>;
}