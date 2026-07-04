import type { Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config/prisma';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// Initialize Razorpay with your credentials from .env
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

// CUSTOMER — create a Razorpay order for a pending InvenCart order.
// This is step 2-4 in the flow above.
export async function createRazorpayOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const orderId = req.params['orderId'] as string;

    // Step 1: Find the InvenCart order and confirm it belongs to this user.
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR check — confirm this order belongs to the logged-in customer.
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Not your order' });
    }

    // Only PENDING orders can be paid — prevent double payment.
    if (order.status !== 'PENDING') {
      return res.status(400).json({ message: 'Order is not in a payable state' });
    }

    // Step 2: Create a Razorpay order.
    // Amount must be in paise (Indian cents) — multiply rupees by 100.
    // e.g. ₹74,999 = 7,499,900 paise
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(Number(order.totalAmount) * 100), // paise
      currency: 'INR',
      receipt: order.id, // our internal order ID as reference
    });

    // Step 3: Send the Razorpay order details to the frontend.
    // The frontend needs razorpayOrderId to open the checkout popup.
    return res.status(200).json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // frontend needs this to init checkout
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — verify payment signature and mark order as PAID.
// This is step 8-10 in the flow above — the critical security step.
export async function verifyPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId, // our internal InvenCart order ID
    } = req.body;

    // Step 1: Find our internal order and verify ownership.
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Not your order' });
    }

    // Step 2: THE CRITICAL SECURITY CHECK — verify the signature.
    // Razorpay creates: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
    // We recreate the same hash independently and compare.
    // If someone tampered with the payment data, the hashes won't match.
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest('hex');

    // Signature comparison — if they don't match, payment is fake/tampered.
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Step 3: Signature is valid — check for duplicate payment processing.
    // If this order is already PAID, don't process it again.
    // This handles Razorpay retrying the same webhook/callback.
    if (order.status === 'PAID') {
      return res.status(200).json({ message: 'Payment already processed' });
    }

    // Step 4: Mark the order as PAID and store the Razorpay payment ID.
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        stripePaymentId: razorpay_payment_id, // reusing this field for Razorpay payment ID
      },
    });

    return res.status(200).json({
      message: 'Payment verified successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}
