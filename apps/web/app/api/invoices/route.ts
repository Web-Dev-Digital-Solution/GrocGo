export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/utils/helpers';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const invoices = await prisma.invoice.findMany({
      where: { storeId: authUser.storeId },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
