import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { parsePagination, normalizePhone } from '../utils/helpers';

const router = Router();
router.use(authenticate, requireStoreAccess);

// ─── LIST CUSTOMERS ──────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const search = req.query.search as string | undefined;
    const storeId = req.user!.storeId!;

    const where: any = { storeId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: { select: { orders: true } },
          orders: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { lastOrderAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      customers: customers.map((c: typeof customers[number]) => ({
        ...c,
        totalOrders: c._count.orders,
        lastOrderAt: c.orders[0]?.createdAt || c.lastOrderAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// ─── GET CUSTOMER DETAILS ────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId! },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { items: true },
        },
        invoices: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// ─── FIND OR CREATE CUSTOMER (used during order creation) ────
const findOrCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(10),
  address: z.string().optional(),
});

router.post('/find-or-create', validate(findOrCreateSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, address } = req.body;
    const storeId = req.user!.storeId!;
    const normalizedPhone = normalizePhone(phone);

    const existing = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone: normalizedPhone } },
    });

    if (existing) {
      // Update name/address if provided
      const updated = await prisma.customer.update({
        where: { id: existing.id },
        data: {
          ...(name && { name }),
          ...(address && { address }),
        },
      });
      return res.json(updated);
    }

    const customer = await prisma.customer.create({
      data: { name, phone: normalizedPhone, address, storeId },
    });

    res.status(201).json(customer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to find or create customer' });
  }
});

// ─── UPDATE CUSTOMER ─────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId! },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: req.body,
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;
