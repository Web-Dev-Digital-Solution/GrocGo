import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { normalizePhone, generateSlug } from '../utils/helpers';
import { seedGroceryProducts } from '../utils/grocerySeed';

const router = Router();

// ─── VALIDATION SCHEMAS ──────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(10),
  storeName: z.string().min(2).max(200),
  storeAddress: z.string().min(5),
  storeCity: z.string().min(2),
  storeState: z.string().min(2),
  storePincode: z.string().min(4),
  storePhone: z.string().min(10),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── REGISTER (creates store + shopkeeper) ───────────────────
router.post('/register', validate(registerSchema), async (req, res: Response) => {
  try {
    const {
      name, email, password, phone,
      storeName, storeAddress, storeCity, storeState, storePincode, storePhone,
    } = req.body;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = generateSlug(storeName) + '-' + Date.now().toString(36);

    // Create store + user in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const store = await tx.store.create({
        data: {
          name: storeName,
          slug,
          address: storeAddress,
          city: storeCity,
          state: storeState,
          pincode: storePincode,
          phone: normalizePhone(storePhone),
        },
      });

      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone: normalizePhone(phone),
          role: 'SHOPKEEPER',
          storeId: store.id,
        },
      });

      // Create default subscription
      await tx.subscription.create({
        data: {
          storeId: store.id,
          plan: 'free',
        },
      });

      return { store, user };
    });

    // Seed default grocery products for new store
    seedGroceryProducts(prisma, result.store.id)
      .then((r) => console.log(`Seeded ${r.productsCreated} products, ${r.categoriesCreated} categories for ${result.store.name}`))
      .catch((err) => console.error('Seed error:', err));

    const token = generateToken(result.user);

    res.status(201).json({
      message: 'Store created successfully',
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      store: {
        id: result.store.id,
        name: result.store.name,
        slug: result.store.slug,
      },
    });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── LOGIN ───────────────────────────────────────────────────
router.post('/login', validate(loginSchema), async (req, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: { select: { id: true, name: true, slug: true, isActive: true } } },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeId: user.storeId,
      },
      store: user.store,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET PROFILE ─────────────────────────────────────────────
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        store: {
          select: { id: true, name: true, slug: true, logo: true, phone: true, address: true, city: true, state: true, pincode: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      store: user.store,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
