import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// CUSTOMER — get all products in their wishlist.
export async function getWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // Fetch all wishlist items for this user with full product details.
    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — add a product to wishlist.
export async function addToWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const productId = req.params['productId'] as string;

    // Confirm the product actually exists before adding to wishlist.
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Use upsert — if already wishlisted, do nothing (no duplicate rows).
    // This means calling "add to wishlist" twice is safe — idempotent.
    const wishlistItem = await prisma.wishlist.upsert({
      where: {
        userId_productId: { userId, productId },
      },
      update: {}, // nothing to update — just ensure it exists
      create: { userId, productId },
    });

    return res.status(200).json({
      message: 'Product added to wishlist',
      wishlistItem,
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — remove a product from wishlist.
export async function removeFromWishlist(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const productId = req.params['productId'] as string;

    // Find the wishlist item first to confirm it exists and belongs to this user.
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (!wishlistItem) {
      return res.status(404).json({ message: 'Product not in wishlist' });
    }

    // IDOR protection is built into the query itself —
    // we look up by BOTH userId AND productId, so a user
    // can never accidentally remove another user's wishlist item.
    await prisma.wishlist.delete({
      where: {
        userId_productId: { userId, productId },
      },
    });

    return res.status(200).json({ message: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}