import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlist, removeFromWishlist } from '../api/wishlistApi';
import { addToCart } from '../api/cartApi';
import { useCartStore } from '../store/cartStore';
import Navbar from '../components/Navbar';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { incrementCount } = useCartStore();

  // Fetch wishlist from backend
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });

  // Remove from wishlist mutation
  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
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

  const wishlist = data?.wishlist ?? [];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Your wishlist
          {wishlist.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-2">
              ({wishlist.length} item{wishlist.length !== 1 ? 's' : ''})
            </span>
          )}
        </h1>

        {/* Empty state */}
        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Save products you love for later
            </p>
            <Link
              to="/shop"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item: any) => {
              const product = item.product;
              const formattedPrice = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
              }).format(Number(product.price));

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Product image */}
                  <Link to={`/shop/${product.id}`}>
                    <div className="h-44 bg-gray-50 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </div>
                  </Link>

                  {/* Product info */}
                  <div className="p-4">
                    <p className="text-xs font-medium text-indigo-600 mb-1">
                      {product.category.name}
                    </p>
                    <Link to={`/shop/${product.id}`}>
                      <h3 className="text-sm font-medium text-gray-900 mb-1 hover:text-indigo-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-base font-semibold text-gray-900 mb-4">
                      {formattedPrice}
                    </p>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {/* Add to cart */}
                      <button
                        onClick={() => addToCartMutation.mutate(product.id)}
                        disabled={product.stock === 0 || addToCartMutation.isPending}
                        className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
                      </button>

                      {/* Remove from wishlist */}
                      <button
                        onClick={() => removeMutation.mutate(product.id)}
                        disabled={removeMutation.isPending}
                        className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Remove from wishlist"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}