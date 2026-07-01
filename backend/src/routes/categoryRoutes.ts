import { Router } from 'express';
import { createCategory, getCategories } from '../controllers/categoryController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// PUBLIC: anyone can view categories — no authenticate middleware needed
router.get('/', getCategories);

// PROTECTED: only a logged-in OWNER can create a category
router.post('/', authenticate, authorize('OWNER'), createCategory);

export default router;