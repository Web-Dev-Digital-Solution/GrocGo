import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils/helpers';

export async function GET(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const phone = searchParams.get('phone');
    if (!storeId || !phone) return NextResponse.json({ error: 'storeId and phone required' }, { status: 400 });

    const normalizedPhone = normalizePhone(phone);
    const customer = await prisma.customer.findUnique({ where: { storeId_phone: { storeId, phone: normalizedPhone } } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const order = await prisma.order.findFirst({
      where: { orderNumber: params.orderNumber, storeId, customerId: customer.id },
      include: { items: true, store: { select: { name: true, phone: true, address: true, city: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({ orderNumber: order.orderNumber, status: order.status, totalAmount: order.totalAmount, items: order.items, store: order.store, createdAt: order.createdAt });
  } catch {
    return NextResponse.json({ error: 'Failed to check order status' }, { status: 500 });
  }
}
