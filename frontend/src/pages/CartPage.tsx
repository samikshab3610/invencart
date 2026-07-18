import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../store/cartStore';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../api/cartApi';
import { placeOrder } from '../api/ordersApi';
import Navbar from '../components/Navbar';
import type { CartItem } from '../types';

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setItemCount, resetCount } = useCartStore();

  const [shippingAddress, setShippingAddress] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Fetch cart from backend
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  // Update cart item quantity
  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateCartItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove item from cart
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromCart(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Update badge count
      const currentItems = cartData?.cartItems ?? [];
      setItemCount(Math.max(0, currentItems.length - 1));
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: () => placeOrder({ shippingAddress }),
    onSuccess: (data) => {
      resetCount(); // clear cart badge
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Redirect to order confirmation
      navigate(`/shop/orders/${data.order.id}`);
    },
    onError: (error: any) => {
      setOrderError(
        error.response?.data?.message || 'Failed to place order. Please try again.'
      );
    },
  });

  function handlePlaceOrder() {
    if (!shippingAddress.trim() || shippingAddress.length < 10) {
      setOrderError('Please enter a complete shipping address.');
      return;
    }
    setOrderError('');
    placeOrderMutation.mutate();
  }

  const cartItems = cartData?.cartItems ?? [];
  const total = cartData?.total ?? 0;

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(total);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 text-sm mb-6">Add some products to get started</p>
          <Link
            to="/shop"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Your cart</h1>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Cart items list */}
          <div className="flex-1 space-y-4">
            {cartItems.map((item: CartItem) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
              >
                {/* Product image */}
                <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-100">
                  {item.product.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/shop/${item.product.id}`}
                    className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.product.category.name}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(Number(item.product.price))}
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() =>
                      updateMutation.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })
                    }
                    disabled={item.quantity <= 1 || updateMutation.isPending}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                  >
                    −
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium border-x border-gray-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateMutation.mutate({ id: item.id, quantity: item.quantity + 1 })
                    }
                    disabled={updateMutation.isPending}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm"
                  >
                    +
                  </button>
                </div>

                {/* Item total */}
                <p className="text-sm font-semibold text-gray-900 w-20 text-right">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(Number(item.product.price) * item.quantity)}
                </p>

                {/* Remove button */}
                <button
                  onClick={() => removeMutation.mutate(item.id)}
                  disabled={removeMutation.isPending}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Order summary + checkout */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Order summary
              </h2>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formattedTotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formattedTotal}</span>
                </div>
              </div>

              {/* Checkout section */}
              {!showCheckout ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Proceed to checkout
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping address
                    </label>
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter your full shipping address..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {orderError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <p className="text-red-600 text-xs">{orderError}</p>
                    </div>
                  )}

                  <button
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {placeOrderMutation.isPending ? 'Placing order...' : 'Place order'}
                  </button>

                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Back to cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}