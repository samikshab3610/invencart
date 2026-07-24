import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { createRazorpayOrder, verifyPayment } from '../api/paymentsApi';
import { useRazorpay } from '../hooks/useRazorpay';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, cancelOrder } from '../api/ordersApi';
import Navbar from '../components/Navbar';
import type { OrderStatus } from '../types';

// Color and label for each order status
const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending payment', color: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  SHIPPED: { label: 'Shipped', color: 'bg-blue-100 text-blue-700' },
  DELIVERED: { label: 'Delivered', color: 'bg-indigo-100 text-indigo-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  RETURNED: { label: 'Returned', color: 'bg-gray-100 text-gray-700' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Fetch order details
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id!),
    enabled: !!id,
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const { user } = useAuthStore();
  const { openCheckout } = useRazorpay();
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  async function handlePayNow() {
    if (!id) return;
    setPaymentLoading(true);
    setPaymentError('');

    try {
      // Step 1: Create Razorpay order on your backend
      const razorpayData = await createRazorpayOrder(id);

      // Step 2: Open Razorpay checkout popup
      await openCheckout({
        key: razorpayData.keyId,
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        name: 'InvenCart',
        description: `Order #${id.slice(0, 8).toUpperCase()}`,
        order_id: razorpayData.razorpayOrderId,
        prefill: {
          name: user?.name,
          email: user?.email ?? undefined,
        },
        // Step 3: Payment succeeded — verify with backend
        onSuccess: async (response) => {
          try {
            await verifyPayment({
              orderId: id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Refresh order data to show PAID status
            queryClient.invalidateQueries({ queryKey: ['order', id] });
          } catch {
            setPaymentError('Payment verification failed. Please contact support.');
          } finally {
            setPaymentLoading(false);
          }
        },
        // User closed the popup without paying
        onDismiss: () => {
          setPaymentLoading(false);
        },
      });
    } catch (error: any) {
      setPaymentError(
        error.response?.data?.message || 'Failed to initiate payment.'
      );
      setPaymentLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-48" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500 mb-4">Order not found</p>
          <Link to="/shop/orders" className="text-indigo-600 hover:underline text-sm">
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  const order = data.order;
  const status = statusConfig[order.status as OrderStatus];

  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(order.totalAmount));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Order details</h1>
            <p className="text-sm text-gray-400 mt-1">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <span className={`text-sm px-3 py-1.5 rounded-full font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Order placed confirmation banner */}
        {order.status === 'PENDING' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-indigo-800">Order placed successfully!</p>
                <p className="text-xs text-indigo-600 mt-0.5">
                  Complete payment to confirm your order.
                </p>
              </div>
            </div>

            {/* Payment error */}
            {paymentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                <p className="text-red-600 text-xs">{paymentError}</p>
              </div>
            )}

            {/* Pay Now button */}
            <button
              onClick={handlePayNow}
              disabled={paymentLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {paymentLoading ? 'Opening payment...' : 'Pay Now'}
            </button>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Items ordered</h2>
          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product?.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {item.product?.name ?? 'Product'}
                  </p>
                  <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(Number(item.priceAtPurchase) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-sm font-semibold text-gray-900">{formattedTotal}</span>
          </div>
        </div>

        {/* Order metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Order info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Order date</span>
              <span className="text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID</span>
              <span className="text-gray-900 font-mono text-xs">
                {order.id}
              </span>
            </div>
            {order.stripePaymentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Payment ID</span>
                <span className="text-gray-900 font-mono text-xs">
                  {order.stripePaymentId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/shop/orders"
            className="flex-1 text-center border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            All orders
          </Link>

          {/* Cancel button — only for PENDING orders */}
          {order.status === 'PENDING' && (
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1 border border-red-300 text-red-600 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel order'}
            </button>
          )}

          <Link
            to="/shop"
            className="flex-1 text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}