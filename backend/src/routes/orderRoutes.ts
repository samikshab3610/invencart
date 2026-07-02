import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// CUSTOMER routes — must be logged in
router.post('/', authenticate, authorize('CUSTOMER'), placeOrder);
router.get('/my-orders', authenticate, authorize('CUSTOMER'), getMyOrders);
router.get('/my-orders/:id', authenticate, authorize('CUSTOMER'), getOrderById);

// OWNER routes — must be logged in as owner
router.get('/', authenticate, authorize('OWNER'), getAllOrders);
router.put('/:id/status', authenticate, authorize('OWNER'), updateOrderStatus);

export default router;
