export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getAuthUser, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser || !authUser.storeId) return unauthorized();

  try {
    const store = await prisma.store.findUnique({ where: { id: authUser.storeId } });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    const frontendUrl = process.env.NEXTAUTH_URL || 'https://main.dutajbalf8fob.amplifyapp.com';
    const orderingUrl = `${frontendUrl}/order/${store.slug}`;

    const qrDataUrl = await QRCode.toDataURL(orderingUrl, {
      width: 400, margin: 2,
      color: { dark: '#1a1a1a', light: '#ffffff' },
    });

    await prisma.store.update({ where: { id: authUser.storeId }, data: { qrCode: qrDataUrl } });

    return NextResponse.json({ qrCode: qrDataUrl, url: orderingUrl, slug: store.slug });
  } catch (err) {
    console.error('QR generate error:', err);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
