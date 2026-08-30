export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const storeId = authUser.storeId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, monthOrders, totalCustomers, totalProducts, pendingOrders, monthRevenue] = await Promise.all([
      prisma.order.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: startOfMonth } } }),
      prisma.customer.count({ where: { storeId } }),
      prisma.product.count({ where: { storeId, isActive: true } }),
      prisma.order.count({ where: { storeId, status: { in: ['NEW', 'PREPARING'] } } }),
      prisma.order.aggregate({ where: { storeId, createdAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({ totalOrders, monthOrders, totalCustomers, totalProducts, pendingOrders, monthRevenue: monthRevenue._sum.totalAmount || 0 });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
