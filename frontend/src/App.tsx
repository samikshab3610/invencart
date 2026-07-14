import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { getMe } from './api/authApi';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

// Placeholder pages — we'll build these in upcoming phases
function ShopPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Inven<span className="text-indigo-600">Cart</span>
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Shop — coming in Phase 2</p>
      </div>
    </div>
  );
}

function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">
          Inven<span className="text-indigo-600">Cart</span> Admin
        </h1>
        <p className="text-gray-500 mt-2 text-sm">Dashboard — coming in Phase 6</p>
      </div>
    </div>
  );
}

export default function App() {
  const { setUser, clearUser } = useAuthStore();

  // Check login status once when the app first loads.
  // This restores the session from the httpOnly cookie after a page refresh.
  useEffect(() => {
    getMe()
      .then((user) => setUser(user))
      .catch(() => clearUser());
  }, []);

  return (
    <Routes>
      {/* Root redirect — send everyone to /shop by default */}
      <Route path="/" element={<Navigate to="/shop" replace />} />

      {/* Public only routes — redirect logged-in users away */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
      />

      {/* Shop routes — public browsing, some actions need login */}
      <Route path="/shop/*" element={<ShopPage />} />

      {/* Admin routes — owner only */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="OWNER">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* 404 — redirect unknown URLs to shop */}
      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
}