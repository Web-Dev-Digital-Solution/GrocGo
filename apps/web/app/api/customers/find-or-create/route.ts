import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';
import { normalizePhone } from '@/lib/utils/helpers';

const schema = z.object({ name: z.string().min(1), phone: z.string().min(10), address: z.string().optional() });

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });

    const { name, phone, address } = parsed.data;
    const storeId = authUser.storeId;
    const normalizedPhone = normalizePhone(phone);

    const existing = await prisma.customer.findUnique({ where: { storeId_phone: { storeId, phone: normalizedPhone } } });
    if (existing) {
      const updated = await prisma.customer.update({ where: { id: existing.id }, data: { ...(name && { name }), ...(address && { address }) } });
      return NextResponse.json(updated);
    }

    const customer = await prisma.customer.create({ data: { name, phone: normalizedPhone, address, storeId } });
    return NextResponse.json(customer, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to find or create customer' }, { status: 500 });
  }
}
