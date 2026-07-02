import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { authenticate } from '../middlewares/authenticate';

const router = Router();

// ALL cart routes require authentication — a cart belongs to a logged-in user.
// Guests don't have carts in this system (no anonymous cart support).
router.get('/', authenticate, getCart);
router.post('/', authenticate, addToCart);
router.put('/:id', authenticate, updateCartItem);
router.delete('/clear', authenticate, clearCart); // must be before /:id route
router.delete('/:id', authenticate, removeFromCart);

export default router;