import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { getProductById } from '../api/productsApi';
import { addToCart } from '../api/cartApi';
import { addToWishlist } from '../api/wishlistApi';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { incrementCount } = useCartStore();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [loginModal, setLoginModal] = useState({
    isOpen: false,
    message: '',
  });
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch single product by ID from URL params
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id, // only fetch if id exists
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: () => addToCart({ productId: id!, quantity }),
    onSuccess: () => {
      incrementCount();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setAddedToCart(true);
      // Reset "Added!" feedback after 2 seconds
      setTimeout(() => setAddedToCart(false), 2000);
    },
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: () => addToWishlist(id!),
  });

  function handleAddToCart() {
    if (!user) {
      setLoginModal({
        isOpen: true,
        message: 'Please login to add items to your cart',
      });
      return;
    }
    addToCartMutation.mutate();
  }

  function handleAddToWishlist() {
    if (!user) {
      setLoginModal({
        isOpen: true,
        message: 'Please login to save items to your wishlist',
      });
      return;
    }
    addToWishlistMutation.mutate();
  }

  // Format price
  const formattedPrice = product
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(product.price))
    : '';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 animate-pulse">
            <div className="flex gap-10">
              <div className="w-80 h-80 bg-gray-100 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-4">
                <div className="h-4 bg-gray-100 rounded w-1/4" />
                <div className="h-8 bg-gray-100 rounded w-3/4" />
                <div className="h-10 bg-gray-100 rounded w-1/3" />
                <div className="h-20 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Product not found
  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 text-lg mb-4">Product not found</p>
          <Link to="/shop" className="text-indigo-600 hover:underline text-sm">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus =
    product.stock === 0
      ? { label: 'Out of stock', color: 'text-red-600' }
      : product.stock <= 10
      ? { label: `Only ${product.stock} left`, color: 'text-yellow-600' }
      : { label: 'In stock', color: 'text-green-600' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/shop" className="hover:text-indigo-600 transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-indigo-600">{product.category.name}</span>
          <span>/</span>
          <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product detail card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row gap-10">

            {/* Product image */}
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="h-72 md:h-80 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">No image</span>
                  </div>
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="flex-1">
              {/* Category */}
              <p className="text-sm font-medium text-indigo-600 mb-2">
                {product.category.name}
              </p>

              {/* Name */}
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-3xl font-bold text-gray-900 mb-3">
                {formattedPrice}
              </p>

              {/* Stock status */}
              <p className={`text-sm font-medium mb-4 ${stockStatus.color}`}>
                {stockStatus.label}
              </p>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Quantity selector */}
              {product.stock > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-sm font-medium text-gray-700">Quantity:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      −
                    </button>
                    <span className="px-4 py-2 text-sm font-medium border-x border-gray-300">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">
                    Max: {product.stock}
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0 || addToCartMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addedToCart
                    ? '✓ Added to cart!'
                    : addToCartMutation.isPending
                    ? 'Adding...'
                    : product.stock === 0
                    ? 'Out of stock'
                    : 'Add to cart'}
                </button>

                <button
                  onClick={handleAddToWishlist}
                  disabled={addToWishlistMutation.isPending}
                  className="p-3 border border-gray-300 rounded-xl text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
                  title="Add to wishlist"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Back to shop */}
              <button
                onClick={() => navigate(-1)}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoginModal
        isOpen={loginModal.isOpen}
        onClose={() => setLoginModal({ isOpen: false, message: '' })}
        message={loginModal.message}
      />
    </div>
  );
}