import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ─── GET MY STORE ────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.storeId) {
      return res.status(404).json({ error: 'No store associated' });
    }

    const store = await prisma.store.findUnique({
      where: { id: req.user.storeId },
      include: {
        subscription: true,
        _count: {
          select: { products: true, customers: true, orders: true },
        },
      },
    });

    res.json(store);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// ─── UPDATE STORE ────────────────────────────────────────────
const updateStoreSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  whatsappNumber: z.string().optional(),
  description: z.string().optional(),
  businessHours: z.string().optional(),
  logo: z.string().optional(), // base64 data URL
});

router.put('/me', authenticate, validate(updateStoreSchema), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.storeId) {
      return res.status(404).json({ error: 'No store associated' });
    }

    const store = await prisma.store.update({
      where: { id: req.user.storeId },
      data: req.body,
    });

    res.json(store);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update store' });
  }
});

// ─── GET STORE BY SLUG (public — for customer QR scan) ───────
router.get('/public/:slug', async (req, res: Response) => {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: req.params.slug, isActive: true },
      select: {
        id: true,
        name: true,
        logo: true,
        address: true,
        city: true,
        phone: true,
        description: true,
      },
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// ─── ADMIN: LIST ALL STORES ─────────────────────────────────
router.get('/', authenticate, requireRole('SUPER_ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        subscription: true,
        _count: { select: { products: true, customers: true, orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(stores);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

export default router;
