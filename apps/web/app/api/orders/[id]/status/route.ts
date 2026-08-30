export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const { status } = await req.json();
    const validStatuses = ['NEW', 'PREPARING', 'READY_FOR_PICKUP', 'COLLECTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id: params.id, storeId: authUser.storeId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const updateData: any = { status };
    if (status === 'COLLECTED') { updateData.pickupTime = new Date(); updateData.paymentStatus = 'PAID'; }
    if (status === 'PREPARING') updateData.processedById = authUser.id;

    const updated = await prisma.order.update({ where: { id: order.id }, data: updateData, include: { items: true, customer: true } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
