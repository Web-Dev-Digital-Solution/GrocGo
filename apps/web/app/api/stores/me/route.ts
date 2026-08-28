import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const store = await prisma.store.findUnique({ where: { id: authUser.storeId } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const body = await req.json();
    const store = await prisma.store.update({ where: { id: authUser.storeId }, data: body });
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}
