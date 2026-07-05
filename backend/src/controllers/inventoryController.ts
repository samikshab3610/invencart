import type { Response } from 'express';
import { prisma } from '../config/prisma';
import { restockSchema, returnSchema } from '../utils/orderSchemas';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// CUSTOMER — cancel their own PENDING order.
// Stock is restored atomically in the same transaction.
export async function cancelOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const orderId = req.params['orderId'] as string;

    // Step 1: Find the order and confirm it belongs to this customer.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }, // need items to know how much stock to restore
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // IDOR check — customer can only cancel their own orders.
    if (order.userId !== userId) {
      return res.status(403).json({ message: 'Not your order' });
    }

    // Step 2: Only PENDING orders can be cancelled by the customer.
    // Once PAID/SHIPPED, cancellation must go through the owner.
    if (order.status !== 'PENDING') {
      return res.status(400).json({
        message: 'Only pending orders can be cancelled. Contact support for paid orders.',
      });
    }

    // Step 3: Cancel the order and restore stock in one atomic transaction.
    // If anything fails, the whole thing rolls back — no partial updates.
    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        // Restore stock for every item in the order.
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }, // add stock back
          });
        }

        // Log each stock restoration in the ledger.
        await tx.stockMovement.createMany({
          data: order.items.map((item) => ({
            productId: item.productId,
            change: +item.quantity, // positive = stock added back
            reason: 'CANCELLATION',
            orderId: order.id,
          })),
        });

        // Mark the order as CANCELLED.
        return tx.order.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });
      },
      { timeout: 30000 }
    );

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — process a return for a DELIVERED order.
// Stock is restored and order is marked RETURNED.
export async function processReturn(req: AuthenticatedRequest, res: Response) {
  try {
    const orderId = req.params['orderId'] as string;

    // Step 1: Validate return quantity.
    const parsed = returnSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    // Step 2: Find the order with its items.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only DELIVERED orders can be returned.
    if (order.status !== 'DELIVERED') {
      return res.status(400).json({
        message: 'Only delivered orders can be returned',
      });
    }

    // Step 3: Process return in a transaction — restore stock + log + update status.
    const updatedOrder = await prisma.$transaction(
      async (tx) => {
        // Restore stock for all items in the order.
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        // Log the return in the stock movement ledger.
        await tx.stockMovement.createMany({
          data: order.items.map((item) => ({
            productId: item.productId,
            change: +item.quantity, // positive = stock added back
            reason: 'RETURN',
            orderId: order.id,
          })),
        });

        // Mark the order as RETURNED.
        return tx.order.update({
          where: { id: orderId },
          data: { status: 'RETURNED' },
        });
      },
      { timeout: 30000 }
    );

    return res.status(200).json({
      message: 'Return processed successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Process return error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — manually restock a product.
// Used when new inventory arrives or for manual stock adjustments.
export async function restockProduct(req: AuthenticatedRequest, res: Response) {
  try {
    const productId = req.params['productId'] as string;

    // Step 1: Validate restock quantity and reason.
    const parsed = restockSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ errors: parsed.error.flatten().fieldErrors });
    }

    const { quantity, reason } = parsed.data;

    // Step 2: Confirm the product exists.
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Step 3: Update stock and log the movement in one transaction.
    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        // Increase the product's stock.
        const updated = await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: quantity } },
        });

        // Log the restock in the ledger — no orderId since this isn't order-related.
        await tx.stockMovement.create({
          data: {
            productId,
            change: +quantity, // positive = stock added
            reason,
          },
        });

        return updated;
      },
      { timeout: 30000 }
    );

    return res.status(200).json({
      message: 'Product restocked successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Restock error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — view full stock movement history for a product.
// This is the audit trail — shows every stock change and why it happened.
export async function getStockMovements(req: AuthenticatedRequest, res: Response) {
  try {
    const productId = req.params['productId'] as string;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch all stock movements for this product, newest first.
    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { id: true, status: true, createdAt: true },
        },
      },
    });

    return res.status(200).json({
      product: { id: product.id, name: product.name, currentStock: product.stock },
      movements,
    });
  } catch (error) {
    console.error('Get stock movements error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}