import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { parsePagination } from '@/lib/utils/helpers';

const createSchema = z.object({
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

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination({ page: searchParams.get('page') || '1', limit: searchParams.get('limit') || '20' });
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const available = searchParams.get('available') || undefined;
    const storeId = authUser.storeId;

    const where: any = { storeId, isActive: true };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    if (categoryId) where.categoryId = categoryId;
    if (available !== undefined) where.isAvailable = available === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: { select: { id: true, name: true } } }, orderBy: { name: 'asc' }, skip: offset, take: limit }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

    const product = await prisma.product.create({ data: { ...parsed.data, storeId: authUser.storeId }, include: { category: true } });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') return NextResponse.json({ error: 'Product with this SKU already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
