export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/utils/helpers';

export async function POST(req: NextRequest, { params }: { params: { orderId: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const storeId = authUser.storeId;
    const order = await prisma.order.findFirst({ where: { id: params.orderId, storeId }, include: { customer: true, items: true, invoice: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.invoice) return NextResponse.json({ error: 'Invoice already exists', invoice: order.invoice }, { status: 409 });

    const invoiceCount = await prisma.invoice.count({ where: { storeId } });
    const invoiceNumber = generateInvoiceNumber(invoiceCount + 1);
    const body = await req.json().catch(() => ({}));
    const { discount = 0, taxRate = 0, paymentMethod = 'cash' } = body;
    const subtotal = order.totalAmount;
    const taxAmount = ((subtotal - discount) * taxRate) / 100;
    const total = subtotal - discount + taxAmount;

    const invoice = await prisma.invoice.create({
      data: { invoiceNumber, orderId: order.id, storeId, customerId: order.customerId, subtotal, discount, taxRate, taxAmount, total, paymentMethod, paymentStatus: 'PAID' },
      include: { order: { include: { items: true } }, customer: true, store: true },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
