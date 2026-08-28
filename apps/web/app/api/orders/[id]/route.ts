import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const order = await prisma.order.findFirst({
      where: { id: params.id, storeId: authUser.storeId },
      include: { customer: true, items: true, processedBy: { select: { id: true, name: true } }, invoice: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const order = await prisma.order.findFirst({ where: { id: params.id, storeId: authUser.storeId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (!['NEW', 'CANCELLED'].includes(order.status)) return NextResponse.json({ error: 'Can only delete new or cancelled orders' }, { status: 400 });

    await prisma.$transaction(async (tx: any) => {
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
