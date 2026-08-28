import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { parseMultilingualList } from '@/lib/utils/multilingualParser';

const schema = z.object({ storeId: z.string().min(1), text: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

    const { storeId, text } = parsed.data;
    const products = await prisma.product.findMany({ where: { storeId, isActive: true, isAvailable: true }, select: { id: true, name: true, price: true, unit: true, searchAliases: true } });
    const parsedItems = parseMultilingualList(text, products);
    return NextResponse.json({ items: parsedItems, totalItems: parsedItems.length });
  } catch {
    return NextResponse.json({ error: 'Failed to parse list' }, { status: 500 });
  }
}
