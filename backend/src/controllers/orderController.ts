import type { Response } from 'express';
import { prisma } from '../config/prisma';
import { placeOrderSchema } from '../utils/orderSchemas';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// CUSTOMER — place an order from their current cart.
// This is the most critical function in the whole app —
// it handles the overselling prevention using an atomic transaction.
export async function placeOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // Step 1: Validate shipping address (only thing we trust from the client).
    const parsed = placeOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { shippingAddress } = parsed.data;

    // Step 2: Fetch the user's cart with full product details.
    // We need current prices and stock from the DB — not from the client.
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Step 3: Recompute the total server-side from actual DB prices.
    // If a product's price changed since the customer added it to cart,
    // they pay the current price — the client's version is never used.
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    // Step 4: THE CORE OF THE OVERSELLING FIX — wrap everything in a
    // Prisma transaction. Either ALL of this succeeds, or NONE of it does.
    // If any single product runs out of stock mid-transaction,
    // the entire order is rolled back automatically.
    const order = await prisma.$transaction(
      async (tx) => {
        // For each item in the cart, atomically check AND decrement stock
        for (const item of cartItems) {
          const updated = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
            },
          });

          if (updated.count === 0) {
            throw new Error(`Insufficient stock for product: ${item.product.name}`);
          }
        }

        // All stock decrements succeeded — create the order.
        const newOrder = await tx.order.create({
          data: {
            userId,
            totalAmount,
            status: 'PENDING',
            items: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.product.price,
              })),
            },
          },
          include: { items: true },
        });

        // Log every stock change in the StockMovement ledger.
        await tx.stockMovement.createMany({
          data: cartItems.map((item) => ({
            productId: item.productId,
            change: -item.quantity,
            reason: 'SALE',
            orderId: newOrder.id,
          })),
        });

        // Clear the user's cart now that the order is placed.
        await tx.cartItem.deleteMany({ where: { userId } });

        return newOrder;
      },
      {
        timeout: 30000, // 30 seconds — handles Neon cold starts
      }
    );

    return res.status(201).json({
      message: 'Order placed successfully',
      order,
    });
  } catch (error: any) {
    // If the error was our "insufficient stock" throw,
    // return a clear 400 message to the client.
    if (error.message?.startsWith('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Place order error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — get their own order history.
export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;

    // Filter strictly by userId from the JWT —
    // a customer can never see another customer's orders.
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// CUSTOMER — get a single order by ID.
export async function getOrderById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const id = req.params['id'] as string;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR check — confirm this order belongs to the logged-in user.
    // Never trust the order ID alone — always verify ownership.
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Not your order' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — get all orders across all customers.
export async function getAllOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            // select specific fields only — never expose password hash
          },
        },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Get all orders error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — update the status of an order (e.g. mark as SHIPPED).
export async function updateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const id = req.params['id'] as string;
    const { status } = req.body;

    // Validate the status is one of the allowed enum values.
    const validStatuses = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({ message: 'Order status updated', order: updated });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}