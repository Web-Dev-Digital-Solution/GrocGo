export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: params.slug },
      select: { id: true, name: true, slug: true, logo: true, qrCode: true },
    });
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 });

    if (!store.qrCode) {
      const frontendUrl = process.env.NEXTAUTH_URL || 'https://main.dutajbalf8fob.amplifyapp.com';
      const orderingUrl = `${frontendUrl}/order/${store.slug}`;
      const qrDataUrl = await QRCode.toDataURL(orderingUrl, { width: 400, margin: 2 });
      await prisma.store.update({ where: { id: store.id }, data: { qrCode: qrDataUrl } });
      store.qrCode = qrDataUrl;
    }

    return NextResponse.json(store);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch QR code' }, { status: 500 });
  }
}
