import type { Response } from 'express';
import { prisma } from '../config/prisma';
import { reviewSchema } from '../utils/reviewSchemas';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// CUSTOMER — leave a review on a product they actually purchased.
export async function createReview(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const productId = req.params['productId'] as string;

    // Step 1: Validate review input (rating 1-5, comment min 10 chars).
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { rating, comment } = parsed.data;

    // Step 2: Confirm the product exists.
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 3: Verify the customer actually purchased this product.
    // This prevents fake reviews from people who never bought the item.
    // We check if any DELIVERED order belonging to this user contains this product.
    const purchaseVerification = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED', // only verified purchasers can review
        },
      },
    });

    if (!purchaseVerification) {
      return res.status(403).json({
        message: 'You can only review products you have purchased and received',
      });
    }

    // Step 4: Check if this customer already reviewed this product.
    // One review per customer per product.
    const existingReview = await prisma.review.findFirst({
      where: { userId, productId },
    });

    if (existingReview) {
      return res.status(409).json({
        message: 'You have already reviewed this product',
      });
    }

    // Step 5: Create the review.
    // Note: comment is saved as-is — sanitization against XSS happens
    // on the frontend when rendering (never render raw HTML from user input).
    const review = await prisma.review.create({
      data: { userId, productId, rating, comment },
      include: {
        user: {
          select: { id: true, name: true }, // never expose password or email
        },
      },
    });

    return res.status(201).json({ message: 'Review submitted', review });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// PUBLIC — get all reviews for a product.
export async function getProductReviews(req: AuthenticatedRequest, res: Response) {
  try {
    const productId = req.params['productId'] as string;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true }, // safe public info only
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating across all reviews.
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return res.status(200).json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10, // round to 1 decimal
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — delete their own review.
export async function deleteReview(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const reviewId = req.params['reviewId'] as string;

    // Find the review and confirm it belongs to this customer.
    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // IDOR check — customer can only delete their own reviews.
    if (review.userId !== userId) {
      return res.status(403).json({ message: 'Not your review' });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — delete any review (moderation).
export async function moderateReview(req: AuthenticatedRequest, res: Response) {
  try {
    const reviewId = req.params['reviewId'] as string;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return res.status(200).json({ message: 'Review removed by owner' });
  } catch (error) {
    console.error('Moderate review error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}