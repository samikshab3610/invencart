import type { Response } from 'express';
import { prisma } from '../config/prisma';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

// OWNER — get sales summary for a given period (daily/weekly/monthly).
export async function getSalesSummary(req: AuthenticatedRequest, res: Response) {
  try {
    // Read period from query param — defaults to 'monthly' if not provided.
    // e.g. /api/reports/sales?period=weekly
    const period = (req.query['period'] as string) || 'monthly';

    // Calculate the start date based on the requested period.
    const now = new Date();
    let startDate: Date;

    if (period === 'daily') {
      // Start of today
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'weekly') {
      // 7 days ago
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // 30 days ago (monthly)
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch all PAID orders within the period.
    // We only count PAID orders — PENDING/CANCELLED don't count as revenue.
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
        createdAt: { gte: startDate },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    // Calculate total revenue by summing all order totals.
    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    // Count total items sold across all orders.
    const totalItemsSold = orders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    return res.status(200).json({
      period,
      startDate,
      endDate: now,
      totalOrders: orders.length,
      totalRevenue,
      totalItemsSold,
      averageOrderValue:
        orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
    });
  } catch (error) {
    console.error('Sales summary error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — get best-selling and slow-moving products.
export async function getProductPerformance(req: AuthenticatedRequest, res: Response) {
  try {
    // Aggregate total quantity sold per product across all PAID orders.
    // groupBy sums up quantities from OrderItems, grouped by productId.
    const productSales = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { orderId: true },
      orderBy: { _sum: { quantity: 'desc' } }, // highest selling first
    });

    // Fetch product details for each result.
    const productsWithSales = await Promise.all(
      productSales.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, price: true, stock: true },
        });
        return {
          product,
          totalSold: item._sum.quantity ?? 0,
          totalOrders: item._count.orderId,
          totalRevenue: Number(product?.price ?? 0) * (item._sum.quantity ?? 0),
        };
      })
    );

    // Split into best sellers (top 5) and slow movers (bottom 5).
    const bestSellers = productsWithSales.slice(0, 5);
    const slowMovers = productsWithSales.slice(-5).reverse();

    return res.status(200).json({ bestSellers, slowMovers });
  } catch (error) {
    console.error('Product performance error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — get low stock alerts (products running low).
export async function getLowStockAlerts(req: AuthenticatedRequest, res: Response) {
  try {
    // Default threshold is 10 units — owner can override via query param.
    // e.g. /api/reports/low-stock?threshold=5
    const threshold = parseInt((req.query['threshold'] as string) || '10');

    const lowStockProducts = await prisma.product.findMany({
      where: { stock: { lte: threshold } }, // lte = less than or equal to
      include: { category: true },
      orderBy: { stock: 'asc' }, // most critical (lowest stock) first
    });

    return res.status(200).json({
      threshold,
      count: lowStockProducts.length,
      products: lowStockProducts,
    });
  } catch (error) {
    console.error('Low stock alerts error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — get top customers by total spend.
export async function getTopCustomers(req: AuthenticatedRequest, res: Response) {
  try {
    // Group orders by userId and sum their total amounts.
    const customerSpend = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] },
      },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: 'desc' } }, // highest spenders first
      take: 10, // top 10 customers only
    });

    // Fetch user details for each result.
    const topCustomers = await Promise.all(
      customerSpend.map(async (item) => {
        const user = await prisma.user.findUnique({
          where: { id: item.userId },
          select: { id: true, name: true, email: true }, // safe fields only
        });
        return {
          user,
          totalSpend: Number(item._sum.totalAmount ?? 0),
          totalOrders: item._count.id,
        };
      })
    );

    return res.status(200).json({ topCustomers });
  } catch (error) {
    console.error('Top customers error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}

// OWNER — get inventory performance overview.
export async function getInventoryOverview(req: AuthenticatedRequest, res: Response) {
  try {
    // Get all products with their stock levels.
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        category: { select: { name: true } },
      },
    });

    // Calculate total inventory value (stock × price for each product).
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + Number(p.price) * p.stock,
      0
    );

    // Count products by stock status.
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const inStock = products.filter((p) => p.stock > 10).length;

    return res.status(200).json({
      totalProducts: products.length,
      totalInventoryValue,
      stockStatus: { outOfStock, lowStock, inStock },
      products,
    });
  } catch (error) {
    console.error('Inventory overview error:', error);
    return res.status(500).json({ message: 'Something went wrong' });
  }
}