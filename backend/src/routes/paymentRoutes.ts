import { Router } from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
} from '../controllers/paymentController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// CUSTOMER ONLY — create a Razorpay order for a pending InvenCart order.
// :orderId is our internal InvenCart order ID (from Phase 3).
router.post(
  '/create-order/:orderId',
  authenticate,
  authorize('CUSTOMER'),
  createRazorpayOrder
);

// CUSTOMER ONLY — verify payment signature after customer pays on frontend.
// This is what marks the order as PAID in our database.
router.post(
  '/verify',
  authenticate,
  authorize('CUSTOMER'),
  verifyPayment
);

export default router;