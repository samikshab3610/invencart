import { Router } from 'express';
import {
  getSalesSummary,
  getProductPerformance,
  getLowStockAlerts,
  getTopCustomers,
  getInventoryOverview,
} from '../controllers/reportsController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// ALL report routes are owner-only —
// never expose business analytics to customers.
router.get(
  '/sales',
  authenticate,
  authorize('OWNER'),
  getSalesSummary
);

router.get(
  '/products',
  authenticate,
  authorize('OWNER'),
  getProductPerformance
);

router.get(
  '/low-stock',
  authenticate,
  authorize('OWNER'),
  getLowStockAlerts
);

router.get(
  '/customers',
  authenticate,
  authorize('OWNER'),
  getTopCustomers
);

router.get(
  '/inventory',
  authenticate,
  authorize('OWNER'),
  getInventoryOverview
);

export default router;