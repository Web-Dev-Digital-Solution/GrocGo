export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { generateToken } from '@/lib/auth';
import { normalizePhone, generateSlug } from '@/lib/utils/helpers';
import { seedGroceryProducts } from '@/lib/utils/grocerySeed';
import { Prisma } from '@prisma/client';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().min(5),
  storeName: z.string().min(2),
  storeAddress: z.string().min(5),
  storeCity: z.string().min(2),
  storeState: z.string().min(2),
  storePincode: z.string().min(4),
  storePhone: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });

    const { name, email, password, phone, storeName, storeAddress, storeCity, storeState, storePincode, storePhone } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const slug = generateSlug(storeName) + '-' + Date.now().toString(36);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const store = await tx.store.create({
        data: { name: storeName, slug, address: storeAddress, city: storeCity, state: storeState, pincode: storePincode, phone: normalizePhone(storePhone) },
      });
      const user = await tx.user.create({
        data: { name, email, passwordHash, phone: normalizePhone(phone), role: 'SHOPKEEPER', storeId: store.id },
      });
      await tx.subscription.create({ data: { storeId: store.id, plan: 'free' } });
      return { store, user };
    });

    seedGroceryProducts(prisma, result.store.id).catch(console.error);
    const token = generateToken(result.user);

    return NextResponse.json({
      message: 'Store created successfully', token,
      user: { id: result.user.id, name: result.user.name, email: result.user.email, role: result.user.role },
      store: { id: result.store.id, name: result.store.name, slug: result.store.slug },
    }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Registration failed', detail: message }, { status: 500 });
  }
}
