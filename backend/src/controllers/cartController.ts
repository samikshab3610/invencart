import type { Response } from 'express';
import { prisma } from '../config/prisma';
import { cartItemSchema, updateCartItemSchema } from '../utils/orderSchemas';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// CUSTOMER — get all items currently in the logged-in user's cart.
export async function getCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // Fetch all cart items for this user, including product details.
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: { category: true },
        },
      },
    });

    // Calculate the cart total server-side — never trust the client's total.
    // price is a Decimal type from Prisma, so we convert to number for arithmetic.
    const total = cartItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return res.status(200).json({ cartItems, total });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — add a product to cart, or increase quantity if already there.
export async function addToCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // Step 1: Validate input.
    const parsed = cartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { productId, quantity } = parsed.data;

    // Step 2: Confirm the product actually exists and has enough stock.
    // We check stock here as an early warning — the real enforcement
    // happens during checkout with the atomic transaction.
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Step 3: Use upsert — if this product is already in the cart,
    // increase the quantity. If not, create a new cart item.
    // This prevents duplicate rows for the same product in the same cart.
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId, productId }, // our @@unique constraint
      },
      update: {
        quantity: { increment: quantity }, // add to existing quantity
      },
      create: {
        userId,
        productId,
        quantity,
      },
    });

    return res.status(200).json({ message: 'Item added to cart', cartItem });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — update the quantity of a specific cart item.
export async function updateCartItem(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const id = req.params['id'] as string;

    // Step 1: Validate the new quantity.
    const parsed = updateCartItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { quantity } = parsed.data;

    // Step 2: Find the cart item — and confirm it belongs to THIS user.
    // This is the IDOR check: a user should never be able to modify
    // another user's cart item, even if they know the cart item ID.
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    if (cartItem.userId !== userId) {
      return res.status(403).json({ message: 'Not your cart item' });
    }

    // Step 3: Check the product still has enough stock for the new quantity.
    const product = await prisma.product.findUnique({
      where: { id: cartItem.productId },
    });
    if (!product || product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Step 4: Update the quantity.
    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    return res.status(200).json({ message: 'Cart updated', cartItem: updated });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — remove a specific item from the cart.
export async function removeFromCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const id = req.params['id'] as string;

    // IDOR check — confirm this cart item belongs to the logged-in user.
    const cartItem = await prisma.cartItem.findUnique({ where: { id } });
    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    if (cartItem.userId !== userId) {
      return res.status(403).json({ message: 'Not your cart item' });
    }

    await prisma.cartItem.delete({ where: { id } });

    return res.status(200).json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — clear all items from the cart (e.g. after placing an order).
export async function clearCart(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // deleteMany with userId filter — only deletes THIS user's cart items.
    await prisma.cartItem.deleteMany({ where: { userId } });

    return res.status(200).json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}