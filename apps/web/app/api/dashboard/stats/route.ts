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
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders, todayOrders, weekOrders, monthOrders,
      newOrders, preparingOrders, readyOrders, collectedOrders, cancelledOrders,
      totalCustomers, newCustomers,
      totalProducts,
      totalRevenue, monthRevenue,
    ] = await Promise.all([
      prisma.order.count({ where: { storeId } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: startOfWeek } } }),
      prisma.order.count({ where: { storeId, createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { storeId, status: 'NEW' } }),
      prisma.order.count({ where: { storeId, status: 'PREPARING' } }),
      prisma.order.count({ where: { storeId, status: 'READY_FOR_PICKUP' } }),
      prisma.order.count({ where: { storeId, status: 'COLLECTED' } }),
      prisma.order.count({ where: { storeId, status: 'CANCELLED' } }),
      prisma.customer.count({ where: { storeId } }),
      prisma.customer.count({ where: { storeId, createdAt: { gte: startOfMonth } } }),
      prisma.product.count({ where: { storeId, isActive: true } }),
      prisma.order.aggregate({ where: { storeId }, _sum: { totalAmount: true } }),
      prisma.order.aggregate({ where: { storeId, createdAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
    ]);

    return NextResponse.json({
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
        byStatus: {
          new: newOrders,
          preparing: preparingOrders,
          ready: readyOrders,
          collected: collectedOrders,
          cancelled: cancelledOrders,
        },
      },
      customers: { total: totalCustomers, newThisMonth: newCustomers },
      products: { total: totalProducts },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        thisMonth: monthRevenue._sum.totalAmount || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
