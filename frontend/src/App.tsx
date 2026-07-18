import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { getMe } from './api/authApi';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';

// Admin placeholder — will be built in Phase 6
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

  useEffect(() => {
    getMe()
      .then((user) => setUser(user))
      .catch(() => clearUser());
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/shop" replace />} />

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

      {/* Shop routes — ShopPage handles all /shop/* paths */}
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/*" element={<ShopPage />} />

      <Route path="/shop/:id" element={<ProductDetailPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="OWNER">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/shop" replace />} />
    </Routes>
  );
}