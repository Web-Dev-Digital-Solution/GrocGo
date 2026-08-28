import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { Prisma } from '@prisma/client';

const schema = z.object({
  items: z.array(z.object({ productId: z.string().optional().nullable(), productName: z.string().min(1), quantity: z.number().min(0), unit: z.string().default('piece'), unitPrice: z.number().min(0) })).min(1),
  adminNotes: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

    const order = await prisma.order.findFirst({ where: { id: params.id, storeId: authUser.storeId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { items, adminNotes } = parsed.data;
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.orderItem.deleteMany({ where: { orderId: order.id } });
      await tx.orderItem.createMany({ data: items.map((item: any) => ({ orderId: order.id, productName: item.productName, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice, productId: item.productId || null })) });
      return tx.order.update({ where: { id: order.id }, data: { totalAmount, itemCount: items.length, ...(adminNotes && { adminNotes }) }, include: { items: true, customer: true } });
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update order items' }, { status: 500 });
  }
}
