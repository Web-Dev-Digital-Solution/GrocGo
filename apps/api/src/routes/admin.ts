import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { parsePagination } from '../utils/helpers';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

// ─── LIST ALL STORES ─────────────────────────────────────────
router.get('/stores', async (req, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const search = req.query.search as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [stores, total] = await Promise.all([
      prisma.store.findMany({
        where,
        include: {
          subscription: true,
          _count: { select: { products: true, customers: true, orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.store.count({ where }),
    ]);

    res.json({
      stores,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// ─── TOGGLE STORE STATUS ────────────────────────────────────
router.patch('/stores/:id/toggle', async (req, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.params.id } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { isActive: !store.isActive },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle store' });
  }
});

// ─── UPDATE STORE SUBSCRIPTION ───────────────────────────────
router.patch('/stores/:id/subscription', async (req, res: Response) => {
  try {
    const { plan, maxOrders, maxProducts, maxCustomers, endDate } = req.body;

    const subscription = await prisma.subscription.update({
      where: { storeId: req.params.id },
      data: {
        ...(plan && { plan }),
        ...(maxOrders && { maxOrders }),
        ...(maxProducts && { maxProducts }),
        ...(maxCustomers && { maxCustomers }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
    });

    res.json(subscription);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ─── PLATFORM-WIDE STATS ────────────────────────────────────
router.get('/stats', async (_req, res: Response) => {
  try {
    const [
      totalStores,
      activeStores,
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.store.count(),
      prisma.store.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.customer.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { store: { select: { name: true } }, customer: { select: { name: true, phone: true } } },
      }),
    ]);

    res.json({
      stores: { total: totalStores, active: activeStores },
      orders: { total: totalOrders },
      revenue: { total: totalRevenue._sum.totalAmount || 0 },
      customers: { total: totalCustomers },
      products: { total: totalProducts },
      recentOrders,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// ─── LIST ALL USERS ──────────────────────────────────────────
router.get('/users', async (req, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, store: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
