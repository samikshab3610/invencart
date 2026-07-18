import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { logout } from '../api/authApi';

interface NavbarProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function Navbar({ onSearch, searchValue = '' }: NavbarProps) {
  const { user, clearUser } = useAuthStore();
  const { itemCount, resetCount } = useCartStore();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      clearUser();
      resetCount();
      navigate('/shop');
    } catch {
      // Even if logout API fails, clear local state
      clearUser();
      resetCount();
      navigate('/shop');
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/shop" className="flex-shrink-0">
            <span className="text-xl font-semibold text-gray-900">
              Inven<span className="text-indigo-600">Cart</span>
            </span>
          </Link>

          {/* Search bar */}
          {onSearch && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchValue}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-4">

            {/* Wishlist — only show when logged in as customer */}
            {user?.role === 'CUSTOMER' && (
              <Link
                to="/shop/wishlist"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="hidden sm:inline">Wishlist</span>
              </Link>
            )}

            {/* Cart — show for guests and customers */}
            {user?.role !== 'OWNER' && (
              <Link
                to="/shop/cart"
                className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors relative"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {/* Cart badge — shows item count */}
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
                <span className="hidden sm:inline">Cart</span>
              </Link>
            )}

            {/* Owner dashboard link */}
            {user?.role === 'OWNER' && (
              <Link
                to="/admin"
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
              >
                Dashboard
              </Link>
            )}

            {/* Auth buttons */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 hidden sm:inline">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}