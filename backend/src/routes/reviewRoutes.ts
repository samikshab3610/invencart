import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  deleteReview,
  moderateReview,
} from '../controllers/reviewController';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';

const router = Router();

// PUBLIC — anyone can read reviews
router.get('/:productId', getProductReviews);

// CUSTOMER — submit and delete their own review
router.post('/:productId', authenticate, authorize('CUSTOMER'), createReview);
router.delete('/my/:reviewId', authenticate, authorize('CUSTOMER'), deleteReview);

// OWNER — moderate (delete) any review
router.delete('/moderate/:reviewId', authenticate, authorize('OWNER'), moderateReview);

export default router;