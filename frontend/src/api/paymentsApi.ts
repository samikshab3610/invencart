import api from './axiosInstance';

// Step 1 of payment flow — creates a Razorpay order on your backend,
// which then calls Razorpay's API and returns a razorpayOrderId.
export async function createRazorpayOrder(orderId: string) {
  const response = await api.post(`/api/payments/create-order/${orderId}`);
  return response.data;
}

// Step 2 of payment flow — after Razorpay confirms payment on the frontend,
// send the payment details to your backend for signature verification.
// Only after this succeeds is the order marked PAID.
export async function verifyPayment(data: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const response = await api.post('/api/payments/verify', data);
  return response.data;
}