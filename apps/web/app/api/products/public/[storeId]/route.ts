import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { storeId: string } }) {
  try {
    const store = await prisma.store.findUnique({ where: { id: params.storeId } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const products = await prisma.product.findMany({
      where: { storeId: params.storeId, isActive: true, isAvailable: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });

    const grouped = products.reduce((acc: any, product: typeof products[number]) => {
      const catName = product.category?.name || 'Uncategorized';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(product);
      return acc;
    }, {});

    return NextResponse.json({ products, grouped });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
