import { Router } from 'express';
import {
  cancelOrder,
  processReturn,
  restockProduct,
  getStockMovements,
} from '../controllers/inventoryController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// CUSTOMER — cancel their own pending order
router.post(
  '/cancel/:orderId',
  authenticate,
  authorize('CUSTOMER'),
  cancelOrder
);

// OWNER — process a return for a delivered order
router.post(
  '/return/:orderId',
  authenticate,
  authorize('OWNER'),
  processReturn
);

// OWNER — manually restock a product
router.post(
  '/restock/:productId',
  authenticate,
  authorize('OWNER'),
  restockProduct
);

// OWNER — view stock movement history for a product
router.get(
  '/movements/:productId',
  authenticate,
  authorize('OWNER'),
  getStockMovements
);

export default router;