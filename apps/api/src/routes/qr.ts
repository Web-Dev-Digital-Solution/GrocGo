import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── GENERATE QR CODE FOR STORE ──────────────────────────────
router.post('/generate', authenticate, requireStoreAccess, async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const store = await prisma.store.findUnique({ where: { id: storeId } });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const orderingUrl = `${frontendUrl}/order/${store.slug}`;

    const qrDataUrl = await QRCode.toDataURL(orderingUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
    });

    // Save QR code reference to store
    await prisma.store.update({
      where: { id: storeId },
      data: { qrCode: qrDataUrl },
    });

    res.json({
      qrCode: qrDataUrl,
      url: orderingUrl,
      slug: store.slug,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ─── GET STORE QR CODE ───────────────────────────────────────
router.get('/store/:slug', async (req, res: Response) => {
  try {
    const store = await prisma.store.findUnique({
      where: { slug: req.params.slug },
      select: { id: true, name: true, slug: true, logo: true, qrCode: true },
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Generate if not already generated
    if (!store.qrCode) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const orderingUrl = `${frontendUrl}/order/${store.slug}`;
      const qrDataUrl = await QRCode.toDataURL(orderingUrl, {
        width: 400,
        margin: 2,
      });

      await prisma.store.update({
        where: { id: store.id },
        data: { qrCode: qrDataUrl },
      });

      store.qrCode = qrDataUrl;
    }

    res.json(store);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch QR code' });
  }
});

export default router;
