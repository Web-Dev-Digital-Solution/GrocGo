export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, storeId: authUser.storeId },
      include: { order: { include: { items: true } }, customer: true, store: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}
