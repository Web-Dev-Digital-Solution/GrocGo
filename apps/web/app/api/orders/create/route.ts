import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizePhone, generateOrderNumber } from '@/lib/utils/helpers';
import { Prisma } from '@prisma/client';

const schema = z.object({
  storeId: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(5),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional().nullable(),
    productName: z.string().min(1),
    quantity: z.number().min(0),
    unit: z.string().default('piece'),
    unitPrice: z.number().min(0),
  })).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

    const { storeId, customerName, customerPhone, customerAddress, notes, items } = parsed.data;
    const normalizedPhone = normalizePhone(customerPhone);

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.isActive) return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 });

    let customer = await prisma.customer.findUnique({ where: { storeId_phone: { storeId, phone: normalizedPhone } } });
    if (customer) {
      customer = await prisma.customer.update({ where: { id: customer.id }, data: { name: customerName, ...(customerAddress && { address: customerAddress }) } });
    } else {
      customer = await prisma.customer.create({ data: { name: customerName, phone: normalizedPhone, address: customerAddress, storeId } });
    }

    const orderCount = await prisma.order.count({ where: { storeId } });
    const orderNumber = generateOrderNumber(orderCount + 1);
    const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);

    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber, storeId, customerId: customer!.id, notes, totalAmount, itemCount: items.length,
          items: { create: items.map((item: any) => ({ productName: item.productName, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice, productId: item.productId || null })) },
        },
        include: { items: true, customer: true, store: { select: { name: true, phone: true, address: true, city: true } } },
      });
      await tx.customer.update({ where: { id: customer!.id }, data: { totalOrders: { increment: 1 }, lastOrderAt: new Date() } });
      return newOrder;
    });

    return NextResponse.json({ success: true, order: { id: order.id, orderNumber: order.orderNumber, status: order.status, totalAmount: order.totalAmount, items: order.items, customer: order.customer, store: order.store, createdAt: order.createdAt } }, { status: 201 });
  } catch (err) {
    console.error('Public create order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
