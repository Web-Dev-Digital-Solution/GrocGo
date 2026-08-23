import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { parsePagination, normalizePhone, generateOrderNumber } from '../utils/helpers';
import { parseMultilingualList } from '../utils/multilingualParser';

const router = Router();
const publicRouter = Router();

// ─── PUBLIC: CREATE ORDER (customer QR scan — no auth) ──────
const publicCreateOrderSchema = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(5),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional().nullable(),
    productName: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.string().default('piece'),
    unitPrice: z.number().min(0),
  })).min(1),
});

publicRouter.post('/create', validate(publicCreateOrderSchema), async (req, res: Response) => {
  try {
    const { storeId, customerName, customerPhone, customerAddress, notes, items } = req.body;
    const normalizedPhone = normalizePhone(customerPhone);

    // Verify store exists and is active
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.isActive) {
      return res.status(404).json({ error: 'Store not found or inactive' });
    }

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone: normalizedPhone } },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: customerName, ...(customerAddress && { address: customerAddress }) },
      });
    } else {
      customer = await prisma.customer.create({
        data: { name: customerName, phone: normalizedPhone, address: customerAddress, storeId },
      });
    }

    // Generate order number
    const orderCount = await prisma.order.count({ where: { storeId } });
    const orderNumber = generateOrderNumber(orderCount + 1);

    // Calculate totals
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          storeId,
          customerId: customer.id,
          notes,
          totalAmount,
          itemCount: items.length,
          items: {
            create: items.map((item: any) => ({
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              productId: item.productId || null,
            })),
          },
        },
        include: { items: true, customer: true, store: { select: { name: true, phone: true, address: true, city: true } } },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: customer!.id },
        data: {
          totalOrders: { increment: 1 },
          lastOrderAt: new Date(),
        },
      });

      return newOrder;
    });

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.itemCount,
        items: order.items,
        customer: order.customer,
        store: order.store,
        createdAt: order.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Public create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── PUBLIC: CHECK ORDER STATUS ─────────────────────────────
publicRouter.get('/status/:orderNumber', async (req, res: Response) => {
  try {
    const { orderNumber } = req.params;
    const { storeId, phone } = req.query;

    if (!storeId || !phone) {
      return res.status(400).json({ error: 'storeId and phone query params required' });
    }

    const normalizedPhone = normalizePhone(phone as string);

    const customer = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId: storeId as string, phone: normalizedPhone } },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        storeId: storeId as string,
        customerId: customer.id,
      },
      include: { items: true, store: { select: { name: true, phone: true, address: true, city: true } } },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
      store: order.store,
      createdAt: order.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check order status' });
  }
});

// ─── PUBLIC: PARSE TEXT SHOPPING LIST ───────────────────────
const publicParseListSchema = z.object({
  storeId: z.string().min(1),
  text: z.string().min(1),
});

publicRouter.post('/parse-list', validate(publicParseListSchema), async (req, res: Response) => {
  try {
    const { storeId, text } = req.body;

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const products = await prisma.product.findMany({
      where: { storeId, isActive: true, isAvailable: true },
      select: { id: true, name: true, price: true, unit: true, searchAliases: true },
    });

    const parsedItems = parseMultilingualList(text, products);

    res.json({ items: parsedItems, totalItems: parsedItems.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to parse list' });
  }
});

router.use(authenticate, requireStoreAccess);

// ─── LIST ORDERS ─────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const storeId = req.user!.storeId!;

    const where: any = { storeId };
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
          processedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── GET ORDER DETAILS ──────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId! },
      include: {
        customer: true,
        items: true,
        processedBy: { select: { id: true, name: true } },
        invoice: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ─── CREATE ORDER ────────────────────────────────────────────
const createOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1),
    quantity: z.number().min(0.01),
    unit: z.string().default('piece'),
    unitPrice: z.number().min(0),
  })).min(1),
});

router.post('/', validate(createOrderSchema), async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const { customerName, customerPhone, customerAddress, notes, items } = req.body;
    const normalizedPhone = normalizePhone(customerPhone);

    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { storeId_phone: { storeId, phone: normalizedPhone } },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name: customerName, ...(customerAddress && { address: customerAddress }) },
      });
    } else {
      customer = await prisma.customer.create({
        data: { name: customerName, phone: normalizedPhone, address: customerAddress, storeId },
      });
    }

    // Generate order number
    const orderCount = await prisma.order.count({ where: { storeId } });
    const orderNumber = generateOrderNumber(orderCount + 1);

    // Calculate totals
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
    const itemCount = items.reduce((sum: number, item: number) => sum + item, 0);

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          storeId,
          customerId: customer.id,
          notes,
          totalAmount,
          itemCount: items.length,
          processedById: req.user?.id,
          items: {
            create: items.map((item: any) => ({
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              productId: item.productId || null,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      // Update customer stats
      await tx.customer.update({
        where: { id: customer!.id },
        data: {
          totalOrders: { increment: 1 },
          lastOrderAt: new Date(),
        },
      });

      // Update or create monthly reminder
      await tx.monthlyReminder.upsert({
        where: { customerId_storeId: { customerId: customer!.id, storeId } },
        create: {
          customerId: customer!.id,
          storeId,
          lastOrderId: newOrder.id,
          nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          lastOrderId: newOrder.id,
          nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return newOrder;
    });

    res.status(201).json(order);
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── UPDATE ORDER STATUS ────────────────────────────────────
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['NEW', 'PREPARING', 'READY_FOR_PICKUP', 'COLLECTED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId! },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData: any = { status };

    // Auto-set timestamps
    if (status === 'COLLECTED') {
      updateData.pickupTime = new Date();
      updateData.paymentStatus = 'PAID'; // assume paid on collection
    }
    if (status === 'PREPARING') {
      updateData.processedById = req.user?.id;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: { items: true, customer: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ─── UPDATE ORDER ITEMS (shopkeeper adjustments) ────────────
const updateItemsSchema = z.object({
  items: z.array(z.object({
    productId: z.string().optional().nullable(),
    productName: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.string().default('piece'),
    unitPrice: z.number().min(0),
  })).min(1),
  adminNotes: z.string().optional(),
});

router.put('/:id/items', validate(updateItemsSchema), async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, storeId },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { items, adminNotes } = req.body;
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    const updated = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });

      // Create new items
      await tx.orderItem.createMany({
        data: items.map((item: any) => ({
          orderId: order.id,
          productName: item.productName,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          productId: item.productId || null,
        })),
      });

      // Update order total
      return tx.order.update({
        where: { id: order.id },
        data: { totalAmount, itemCount: items.length, ...(adminNotes && { adminNotes }) },
        include: { items: true, customer: true },
      });
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order items' });
  }
});

// ─── PARSE TEXT SHOPPING LIST (AI-powered item extraction) ───
const parseListSchema = z.object({
  text: z.string().min(1),
  storeId: z.string(),
});

router.post('/parse-list', validate(parseListSchema), async (req, res: Response) => {
  try {
    const { text, storeId } = req.body;

    const products = await prisma.product.findMany({
      where: { storeId, isActive: true, isAvailable: true },
      select: { id: true, name: true, price: true, unit: true, searchAliases: true },
    });

    const parsedItems = parseMultilingualList(text, products);

    res.json({ items: parsedItems, totalItems: parsedItems.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to parse list' });
  }
});

// ─── DELETE ORDER ────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { id: req.params.id };
    // Non-admin users can only delete their own store's orders
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.storeId) {
      where.storeId = req.user!.storeId;
    }

    const order = await prisma.order.findFirst({ where });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow deleting NEW or CANCELLED orders
    if (!['NEW', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ error: 'Can only delete new or cancelled orders' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
    });

    res.json({ success: true, message: 'Order deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

export { publicRouter };
export default router;
