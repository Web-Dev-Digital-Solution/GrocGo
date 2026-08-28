import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) return unauthorized();

  try {
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { store: { select: { id: true, name: true, slug: true, logo: true, phone: true, address: true, city: true, state: true, pincode: true } } },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, store: user.store });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
