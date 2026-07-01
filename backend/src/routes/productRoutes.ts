import { Router } from 'express';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getProductById,
} from '../controllers/productController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// PUBLIC — anyone can browse products and view a single product
router.get('/', getProducts);
router.get('/:id', getProductById);

// OWNER ONLY — create, update, delete products
router.post('/', authenticate, authorize('OWNER'), createProduct);
router.put('/:id', authenticate, authorize('OWNER'), updateProduct);
router.delete('/:id', authenticate, authorize('OWNER'), deleteProduct);

export default router;