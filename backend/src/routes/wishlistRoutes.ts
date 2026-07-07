import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlistController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// ALL wishlist routes are customer-only — a wishlist belongs to a logged-in customer.
router.get('/', authenticate, authorize('CUSTOMER'), getWishlist);
router.post('/:productId', authenticate, authorize('CUSTOMER'), addToWishlist);
router.delete('/:productId', authenticate, authorize('CUSTOMER'), removeFromWishlist);

export default router;