export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { parsePagination, normalizePhone, generateOrderNumber } from '@/lib/utils/helpers';
import { Prisma } from '@prisma/client';

const createSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(10),
  customerAddress: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    productName: z.string().min(1),
    quantity: z.number().min(0.01),
    unit: z.string().default('piece'),
    unitPrice: z.number().min(0),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const { page, limit, offset } = parsePagination({ page: searchParams.get('page') || '1', limit: searchParams.get('limit') || '20' });
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const storeId = authUser.storeId;

    const where: any = { storeId };
    if (status && status !== 'all') where.status = status;
    if (search) where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customer: { name: { contains: search, mode: 'insensitive' } } },
    ];

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, include: { customer: { select: { id: true, name: true, phone: true } }, items: true, processedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' }, skip: offset, take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

    const { customerName, customerPhone, customerAddress, notes, items } = parsed.data;
    const storeId = authUser.storeId;
    const normalizedPhone = normalizePhone(customerPhone);

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
          orderNumber, storeId, customerId: customer!.id, notes, totalAmount, itemCount: items.length, processedById: authUser.id,
          items: { create: items.map((item: any) => ({ productName: item.productName, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice, productId: item.productId || null })) },
        },
        include: { items: true, customer: true },
      });
      await tx.customer.update({ where: { id: customer!.id }, data: { totalOrders: { increment: 1 }, lastOrderAt: new Date() } });
      await tx.monthlyReminder.upsert({
        where: { customerId_storeId: { customerId: customer!.id, storeId } },
        create: { customerId: customer!.id, storeId, lastOrderId: newOrder.id, nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        update: { lastOrderId: newOrder.id, nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
