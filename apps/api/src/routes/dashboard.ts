import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate, requireStoreAccess);

// ─── SHOPKEEPER DASHBOARD STATS ──────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      newOrders,
      preparingOrders,
      readyOrders,
      collectedOrders,
      cancelledOrders,
      totalCustomers,
      newCustomersMonth,
      totalProducts,
      totalRevenue,
      monthRevenue,
    ] = await Promise.all([
      prisma.order.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: weekStart } } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: monthStart } } }),
      prisma.order.count({ where: { storeId, status: 'NEW' } }),
      prisma.order.count({ where: { storeId, status: 'PREPARING' } }),
      prisma.order.count({ where: { storeId, status: 'READY_FOR_PICKUP' } }),
      prisma.order.count({ where: { storeId, status: 'COLLECTED' } }),
      prisma.order.count({ where: { storeId, status: 'CANCELLED' } }),
      prisma.customer.count({ where: { storeId } }),
      prisma.customer.count({ where: { storeId, createdAt: { gte: monthStart } } }),
      prisma.product.count({ where: { storeId, isActive: true } }),
      prisma.order.aggregate({ where: { storeId, paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { storeId, paymentStatus: 'PAID', createdAt: { gte: monthStart } }, _sum: { totalAmount: true } }),
    ]);

    res.json({
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
        byStatus: {
          new: newOrders,
          preparing: preparingOrders,
          ready: readyOrders,
          collected: collectedOrders,
          cancelled: cancelledOrders,
        },
      },
      customers: {
        total: totalCustomers,
        newThisMonth: newCustomersMonth,
      },
      products: { total: totalProducts },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        thisMonth: monthRevenue._sum.totalAmount || 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// ─── RECENT ORDERS ───────────────────────────────────────────
router.get('/recent-orders', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const limit = Math.min(parseInt(req.query.limit as string || '10'), 50);

    const orders = await prisma.order.findMany({
      where: { storeId },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { select: { productName: true, quantity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// ─── TOP PRODUCTS ────────────────────────────────────────────
router.get('/top-products', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const limit = parseInt(req.query.limit as string || '10');

    const items = await prisma.orderItem.groupBy({
      by: ['productName'],
      where: { order: { storeId } },
      _sum: { quantity: true, totalPrice: true },
      _count: true,
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

// ─── SALES CHART DATA ────────────────────────────────────────
router.get('/sales-chart', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const days = parseInt(req.query.days as string || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get daily sales
    const sales = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as orders,
        COALESCE(SUM(total_amount), 0)::float as revenue
      FROM "Order"
      WHERE store_id = ${storeId}
        AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json(sales);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sales chart data' });
  }
});

// ─── SUPER ADMIN DASHBOARD ───────────────────────────────────
router.get('/admin/stats', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const [totalStores, activeStores, totalOrders, totalRevenue, totalCustomers, totalProducts] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.customer.count(),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    res.json({
      stores: { total: totalStores, active: activeStores },
      orders: { total: totalOrders },
      revenue: { total: totalRevenue._sum.totalAmount || 0 },
      customers: { total: totalCustomers },
      products: { total: totalProducts },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

export default router;
