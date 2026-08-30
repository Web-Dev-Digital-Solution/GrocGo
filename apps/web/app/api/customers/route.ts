export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { parsePagination, normalizePhone } from '@/lib/utils/helpers';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination({ page: searchParams.get('page') || '1', limit: searchParams.get('limit') || '20' });
    const search = searchParams.get('search') || undefined;
    const storeId = authUser.storeId;

    const where: any = { storeId };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { phone: { contains: search, mode: 'insensitive' } }];

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where, include: { _count: { select: { orders: true } }, orders: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 } },
        orderBy: { lastOrderAt: 'desc' }, skip: offset, take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers: customers.map((c: typeof customers[number]) => ({ ...c, totalOrders: c._count.orders, lastOrderAt: c.orders[0]?.createdAt || c.lastOrderAt })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
