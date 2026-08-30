export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const product = await prisma.product.findFirst({ where: { id: params.id, storeId: authUser.storeId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const body = await req.json();
    const updated = await prisma.product.update({ where: { id: product.id }, data: body, include: { category: true } });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const product = await prisma.product.findFirst({ where: { id: params.id, storeId: authUser.storeId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    await prisma.product.update({ where: { id: product.id }, data: { isActive: false } });
    return NextResponse.json({ message: 'Product deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
