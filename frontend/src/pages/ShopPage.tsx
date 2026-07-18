import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { getProducts, getCategories } from '../api/productsApi';
import { addToCart } from '../api/cartApi';
import { addToWishlist } from '../api/wishlistApi';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import LoginModal from '../components/LoginModal';
import { ProductSkeletonGrid } from '../components/ProductSkeleton';
import type { Product } from '../types';

export default function ShopPage() {
  const { user } = useAuthStore();
  const { incrementCount } = useCartStore();
  const queryClient = useQueryClient();

  // Local UI state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [loginModal, setLoginModal] = useState({
    isOpen: false,
    message: '',
  });

  // Fetch products with search, category, and pagination
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', search, selectedCategory, page],
    queryFn: () =>
      getProducts({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        page,
        limit: 9,
      }),
  });

  // Fetch categories for the sidebar
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId: string) =>
      addToCart({ productId, quantity: 1 }),
    onSuccess: () => {
      incrementCount();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: (productId: string) => addToWishlist(productId),
  });

  // Handle add to cart — show login modal if not logged in
  function handleAddToCart(product: Product) {
    if (!user) {
      setLoginModal({
        isOpen: true,
        message: 'Please login to add items to your cart',
      });
      return;
    }
    addToCartMutation.mutate(product.id);
  }

  // Handle add to wishlist — show login modal if not logged in
  function handleAddToWishlist(product: Product) {
    if (!user) {
      setLoginModal({
        isOpen: true,
        message: 'Please login to save items to your wishlist',
      });
      return;
    }
    addToWishlistMutation.mutate(product.id);
  }

  // Debounced search — reset to page 1 when search changes
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  // Category select — reset to page 1 when category changes
  function handleCategorySelect(categoryId: string) {
    setSelectedCategory(categoryId);
    setPage(1);
  }

  const products = productsData?.products ?? [];
  const pagination = productsData?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onSearch={handleSearch} searchValue={search} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Category sidebar */}
          <aside className="w-48 flex-shrink-0 hidden md:block">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-24">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <ul className="space-y-1">
                {/* All products option */}
                <li>
                  <button
                    onClick={() => handleCategorySelect('')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === ''
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    All products
                  </button>
                </li>
                {categories?.map((category) => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1">
            {/* Results header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {pagination
                  ? `${pagination.total} product${pagination.total !== 1 ? 's' : ''} found`
                  : 'Loading...'}
              </p>
              {selectedCategory && (
                <button
                  onClick={() => handleCategorySelect('')}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Product grid */}
            {productsLoading ? (
              <ProductSkeletonGrid count={9} />
            ) : products.length === 0 ? (
              // Empty state
              <div className="text-center py-20">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p className="text-gray-500 text-sm">No products found</p>
                {search && (
                  <button
                    onClick={() => handleSearch('')}
                    className="mt-2 text-indigo-600 text-sm hover:underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Login modal — shown when guest tries to add to cart/wishlist */}
      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={() => setLoginModal({ isOpen: false, message: '' })}
        message={loginModal.message}
      />
    </div>
  );
}