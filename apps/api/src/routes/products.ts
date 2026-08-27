import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { parsePagination } from '../utils/helpers';

const router = Router();
const publicRouter = Router();

// ─── PUBLIC: GET STORE PRODUCTS (for customer ordering) ──────
publicRouter.get('/public/:storeId', async (req, res: Response) => {
  try {
    const store = await prisma.store.findUnique({ where: { id: req.params.storeId } });
    if (!store) return res.status(404).json({ error: 'Store not found' });

    const products = await prisma.product.findMany({
      where: { storeId: req.params.storeId, isActive: true, isAvailable: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });

    // Group by category
    const grouped = products.reduce((acc: any, product: typeof products[number]) => {
      const catName = product.category?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(product);
      return acc;
    }, {});

    res.json({ products, grouped });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

publicRouter.get('/public/categories/:storeId', async (req, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { storeId: req.params.storeId, isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.use(authenticate, requireStoreAccess);

// ─── LIST PRODUCTS ───────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, offset } = parsePagination(req.query as any);
    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;
    const available = req.query.available as string | undefined;
    const storeId = req.user!.storeId!;

    const where: any = { storeId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (available !== undefined) where.isAvailable = available === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ─── CREATE PRODUCT ──────────────────────────────────────────
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().min(0),
  unit: z.enum(['piece', 'packet', 'kg', 'g', 'litre', 'ml', 'dozen', 'custom']).default('piece'),
  customUnit: z.string().optional(),
  imageUrl: z.string().optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  isAvailable: z.boolean().default(true),
  searchAliases: z.string().optional(),
});

router.post('/', validate(createProductSchema), async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;

    const product = await prisma.product.create({
      data: { ...req.body, storeId },
      include: { category: true },
    });

    res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Product with this SKU already exists in this store' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ─── UPDATE PRODUCT ──────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, storeId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: req.body,
      include: { category: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ─── DELETE PRODUCT (soft delete) ────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, storeId },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { isActive: false },
    });

    res.json({ message: 'Product deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── CATEGORIES ──────────────────────────────────────────────
router.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const categories = await prisma.category.findMany({
      where: { storeId, isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().default(0),
});

router.post('/categories', validate(createCategorySchema), async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const category = await prisma.category.create({
      data: { ...req.body, storeId },
    });
    res.status(201).json(category);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export { publicRouter };
export default router;
