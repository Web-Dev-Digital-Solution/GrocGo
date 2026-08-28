import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const customer = await prisma.customer.findFirst({
      where: { id: params.id, storeId: authUser.storeId },
      include: { orders: { orderBy: { createdAt: 'desc' }, take: 20, include: { items: true } }, invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json(customer);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const customer = await prisma.customer.findFirst({ where: { id: params.id, storeId: authUser.storeId } });
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    const body = await req.json();
    const updated = await prisma.customer.update({ where: { id: customer.id }, data: body });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
