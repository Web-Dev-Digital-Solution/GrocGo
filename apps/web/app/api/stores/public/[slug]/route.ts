import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      select: { id: true, name: true, slug: true, logo: true, address: true, city: true, phone: true, description: true, businessHours: true, isActive: true },
    });
    if (!store || !store.isActive) return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}
