import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useCartStore } from './store/cartStore';
import { getMe } from './api/authApi';
import { getCart } from './api/cartApi';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import OrderDetailPage from './pages/OrderDetailPage';

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

  const { setItemCount, resetCount } = useCartStore();

  useEffect(() => {
    getMe()
      .then((user) => {
        setUser(user);
        // If customer, also fetch cart count for navbar badge
        if (user.role === 'CUSTOMER') {
          getCart()
            .then((data) => setItemCount(data.cartItems.length))
            .catch(() => setItemCount(0));
        }
      })
      .catch(() => {
        clearUser();
        resetCount();
      });
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

      {/* Order detail — requires login */}
      <Route
        path="/shop/orders/:id"
        element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Cart — requires login */}
      <Route
        path="/shop/cart"
        element={
          <ProtectedRoute requiredRole="CUSTOMER">
            <CartPage />
          </ProtectedRoute>
        }
      />

      <Route path="/shop/:id" element={<ProductDetailPage />} />

      {/* Shop routes — ShopPage handles all /shop/* paths */}
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/shop/*" element={<ShopPage />} />


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