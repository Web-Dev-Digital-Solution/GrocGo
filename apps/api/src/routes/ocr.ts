import { Router, Response } from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';
import { normalizePhone } from '../utils/helpers';

const router = Router();

// Multer config for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ─── OCR: PROCESS UPLOADED IMAGE ─────────────────────────────
router.post('/upload', authenticate, requireStoreAccess, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const storeId = req.user!.storeId!;

    // Run OCR
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    // Fetch store products for matching
    const products = await prisma.product.findMany({
      where: { storeId, isActive: true, isAvailable: true },
      select: { id: true, name: true, price: true, unit: true, searchAliases: true },
    });

    // Parse the OCR text into items (same logic as text parsing)
    const lines = text.split('\n').filter((l) => l.trim());
    const parsedItems: any[] = [];

    for (const line of lines) {
      const cleaned = line.replace(/^[-•*\d.)\s]+/, '').trim();
      if (!cleaned || cleaned.length < 2) continue;

      const qtyMatch = cleaned.match(/([\d.]+)\s*(kg|g|ltr|litre|l|ml|piece|pc|packet|pkt|dozen|dz|bottle|btl|bag|box|tin|can|bundle|bunch)?\s*(of\s+)?/i);
      const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : 1;
      const unit = qtyMatch?.[2] || 'piece';

      let itemName = cleaned;
      if (qtyMatch) {
        itemName = cleaned.substring(qtyMatch[0].length).trim();
      }
      itemName = itemName.replace(/\s*[-–—]\s*\d+.*$/, '').trim();

      if (!itemName || itemName.length < 2) continue;

      const matchedProduct = products.find((p: typeof products[number]) => {
        const nameLower = p.name.toLowerCase();
        const itemLower = itemName.toLowerCase();
        return (
          nameLower.includes(itemLower) ||
          itemLower.includes(nameLower) ||
          (p.searchAliases && p.searchAliases.toLowerCase().includes(itemLower))
        );
      });

      parsedItems.push({
        productName: matchedProduct?.name || itemName,
        productId: matchedProduct?.id || null,
        quantity,
        unit: matchedProduct?.unit || unit,
        unitPrice: matchedProduct?.price || 0,
        matched: !!matchedProduct,
      });
    }

    res.json({
      rawText: text,
      items: parsedItems,
      totalItems: parsedItems.length,
    });
  } catch (err: any) {
    console.error('OCR error:', err);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

export default router;
