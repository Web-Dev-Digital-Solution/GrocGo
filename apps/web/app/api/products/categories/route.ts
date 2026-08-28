import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const categories = await prisma.category.findMany({
      where: { storeId: authUser.storeId, isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const body = await req.json();
    const schema = z.object({ name: z.string().min(1).max(100), sortOrder: z.number().int().default(0) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    const category = await prisma.category.create({ data: { ...parsed.data, storeId: authUser.storeId } });
    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
