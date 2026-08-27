import { Router, Response } from 'express';
import { z } from 'zod';
import PDFDocument from 'pdfkit';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateInvoiceNumber } from '../utils/helpers';
import axios from 'axios';

const router = Router();
router.use(authenticate, requireStoreAccess);

// ─── GENERATE INVOICE FROM ORDER ─────────────────────────────
router.post('/generate/:orderId', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const order = await prisma.order.findFirst({
      where: { id: req.params.orderId, storeId },
      include: { customer: true, items: true, invoice: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.invoice) {
      return res.status(409).json({ error: 'Invoice already exists for this order', invoice: order.invoice });
    }

    // Generate invoice
    const invoiceCount = await prisma.invoice.count({ where: { storeId } });
    const invoiceNumber = generateInvoiceNumber(invoiceCount + 1);

    const { discount = 0, taxRate = 0, paymentMethod = 'cash' } = req.body;
    const subtotal = order.totalAmount;
    const taxAmount = ((subtotal - discount) * taxRate) / 100;
    const total = subtotal - discount + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        storeId,
        customerId: order.customerId,
        subtotal,
        discount,
        taxRate,
        taxAmount,
        total,
        paymentMethod,
        paymentStatus: 'PAID',
      },
      include: { order: { include: { items: true } }, customer: true, store: true },
    });

    res.status(201).json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// ─── GET INVOICE ─────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId! },
      include: {
        order: { include: { items: true } },
        customer: true,
        store: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// ─── HELPER: Fetch store logo as Buffer ─────────────────────
async function fetchLogoBuffer(logoUrl: string): Promise<Buffer | null> {
  try {
    const res = await axios.get(logoUrl, { responseType: 'arraybuffer', timeout: 5000 });
    return Buffer.from(res.data);
  } catch {
    return null;
  }
}

// ─── DRAW STORE INITIAL (helper) ──────────────────────────
function drawStoreInitial(doc: any, name: string, centerX: number, y: number, color: string): number {
  doc.save();
  doc.roundedRect(centerX - 20, y, 40, 40, 6).fill(color);
  doc.fontSize(18).fillColor('white').font('Helvetica-Bold');
  doc.text(name.charAt(0).toUpperCase(), centerX - 20, y + 9, { width: 40, align: 'center' });
  doc.restore();
  return y + 46;
}

// ─── DOWNLOAD INVOICE AS PDF ────────────────────────────────
router.get('/:id/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, storeId: req.user!.storeId! },
      include: {
        order: { include: { items: true } },
        customer: true,
        store: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 30, autoFirstPage: false });
    doc.addPage();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const marginLeft = 30;
    const marginRight = 30;
    const contentWidth = pageWidth - marginLeft - marginRight;
    const centerX = pageWidth / 2;
    const greenColor = '#16a34a';
    const darkColor = '#1e293b';
    const grayColor = '#64748b';
    const lightGray = '#e2e8f0';

    let Y = 28;

    // ─── HEADER: Store Logo + Name ──────────────────────────
    if (invoice.store.logo) {
      try {
        const logoBuffer = await fetchLogoBuffer(invoice.store.logo);
        if (logoBuffer) {
          doc.image(logoBuffer, centerX - 22, Y, { width: 44, height: 44, fit: [44, 44] });
          Y += 48;
        } else {
          Y = drawStoreInitial(doc, invoice.store.name, centerX, Y, greenColor);
        }
      } catch {
        Y = drawStoreInitial(doc, invoice.store.name, centerX, Y, greenColor);
      }
    } else {
      Y = drawStoreInitial(doc, invoice.store.name, centerX, Y, greenColor);
    }

    // Store name
    doc.fontSize(15).fillColor(darkColor).font('Helvetica-Bold');
    doc.text(invoice.store.name, marginLeft, Y, { width: contentWidth, align: 'center' });
    Y += 18;

    // Store address
    doc.fontSize(8).fillColor(grayColor).font('Helvetica');
    const addrParts = [invoice.store.address, `${invoice.store.city}, ${invoice.store.state} ${invoice.store.pincode}`].filter(Boolean);
    if (addrParts.length) {
      doc.text(addrParts.join(', '), marginLeft, Y, { width: contentWidth, align: 'center' });
      Y += 11;
    }

    // Phone + Email
    const contactParts = [];
    if (invoice.store.phone) contactParts.push(`Phone: ${invoice.store.phone}`);
    if (invoice.store.email) contactParts.push(`Email: ${invoice.store.email}`);
    if (contactParts.length) {
      doc.text(contactParts.join('  |  '), marginLeft, Y, { width: contentWidth, align: 'center' });
      Y += 11;
    }

    // Green divider
    Y += 4;
    doc.save().moveTo(marginLeft, Y).lineTo(pageWidth - marginRight, Y).lineWidth(1.5).strokeColor(greenColor).stroke().restore();
    Y += 10;

    // ─── BILL TO + INVOICE INFO ─────────────────────────────
    doc.fontSize(7).fillColor(greenColor).font('Helvetica-Bold');
    doc.text('BILL TO', marginLeft, Y);
    doc.fontSize(9).fillColor(darkColor).font('Helvetica');
    doc.text(invoice.customer.name, marginLeft, Y + 10);
    doc.fontSize(8).fillColor(grayColor);
    if (invoice.customer.phone) doc.text(invoice.customer.phone, marginLeft, Y + 20);
    if (invoice.customer.address) doc.text(invoice.customer.address, marginLeft, Y + 30, { width: 150 });

    doc.fontSize(14).fillColor(greenColor).font('Helvetica-Bold');
    doc.text('INVOICE', pageWidth - marginRight - 155, Y - 1, { width: 155, align: 'right' });
    doc.fontSize(8).fillColor(darkColor).font('Helvetica');
    doc.text(`#${invoice.invoiceNumber}`, pageWidth - marginRight - 155, Y + 14, { width: 155, align: 'right' });
    doc.fontSize(8).fillColor(grayColor);
    doc.text(`Date: ${invoice.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, pageWidth - marginRight - 155, Y + 24, { width: 155, align: 'right' });
    doc.text(`Order: ${invoice.order.orderNumber}`, pageWidth - marginRight - 155, Y + 34, { width: 155, align: 'right' });

    Y += 44;

    // ─── ITEMS TABLE ────────────────────────────────────────
    // Table header
    doc.save().roundedRect(marginLeft, Y, contentWidth, 18, 2).fill('#f1f5f9').restore();
    const col1 = marginLeft + 4;       // Item
    const col2 = marginLeft + contentWidth * 0.58; // Qty
    const col3 = marginLeft + contentWidth * 0.68; // Unit
    const col4 = marginLeft + contentWidth * 0.78; // Rate
    const col5 = marginLeft + contentWidth * 0.89; // Amount

    doc.fontSize(7).fillColor(grayColor).font('Helvetica-Bold');
    doc.text('Item', col1, Y + 5, { width: contentWidth * 0.55 });
    doc.text('Qty', col2, Y + 5, { width: contentWidth * 0.09, align: 'right' });
    doc.text('Unit', col3, Y + 5, { width: contentWidth * 0.09, align: 'right' });
    doc.text('Rate', col4, Y + 5, { width: contentWidth * 0.1, align: 'right' });
    doc.text('Amount', col5, Y + 5, { width: contentWidth * 0.1, align: 'right' });
    Y += 22;

    // Item rows
    doc.font('Helvetica').fontSize(8).fillColor(darkColor);
    invoice.order.items.forEach((item: typeof invoice.order.items[number], idx: number) => {
      if (idx % 2 === 0) {
        doc.save().rect(marginLeft, Y - 1, contentWidth, 18).fill('#f8fafc').restore();
      }
      doc.fillColor(darkColor).font('Helvetica');
      doc.text(item.productName, col1, Y, { width: contentWidth * 0.55, ellipsis: true });
      doc.text(String(item.quantity), col2, Y, { width: contentWidth * 0.09, align: 'right' });
      doc.text(item.unit, col3, Y, { width: contentWidth * 0.09, align: 'right' });
      doc.text(`\u20B9${item.unitPrice.toFixed(2)}`, col4, Y, { width: contentWidth * 0.1, align: 'right' });
      doc.font('Helvetica-Bold').text(`\u20B9${item.totalPrice.toFixed(2)}`, col5, Y, { width: contentWidth * 0.1, align: 'right' });
      doc.font('Helvetica');
      Y += 18;
    });

    // Table bottom border
    Y += 3;
    doc.save().moveTo(marginLeft, Y).lineTo(pageWidth - marginRight, Y).lineWidth(0.5).strokeColor(lightGray).stroke().restore();
    Y += 8;

    // ─── TOTALS (right-aligned) ─────────────────────────────
    const totalsLeft = pageWidth - marginRight - 180;
    const totalsRight = pageWidth - marginRight;

    doc.fontSize(8).fillColor(grayColor).font('Helvetica');
    doc.text('Subtotal', totalsLeft, Y, { width: 100 });
    doc.text(`\u20B9${invoice.subtotal.toFixed(2)}`, totalsRight - 70, Y, { width: 70, align: 'right' });
    Y += 14;

    if (invoice.discount > 0) {
      doc.fillColor(greenColor).font('Helvetica');
      doc.text('Discount', totalsLeft, Y, { width: 100 });
      doc.text(`-\u20B9${invoice.discount.toFixed(2)}`, totalsRight - 70, Y, { width: 70, align: 'right' });
      Y += 14;
    }

    if (invoice.taxAmount > 0) {
      doc.fillColor(grayColor).font('Helvetica');
      doc.text(`Tax (${invoice.taxRate}%)`, totalsLeft, Y, { width: 100 });
      doc.text(`\u20B9${invoice.taxAmount.toFixed(2)}`, totalsRight - 70, Y, { width: 70, align: 'right' });
      Y += 14;
    }

    // Total bold line
    Y += 1;
    doc.save().moveTo(totalsLeft, Y).lineTo(totalsRight, Y).lineWidth(1).strokeColor(darkColor).stroke().restore();
    Y += 5;

    doc.fontSize(11).fillColor(darkColor).font('Helvetica-Bold');
    doc.text('TOTAL', totalsLeft, Y, { width: 100 });
    doc.text(`\u20B9${invoice.total.toFixed(2)}`, totalsRight - 70, Y, { width: 70, align: 'right' });
    Y += 18;

    // Payment info
    doc.fontSize(8).fillColor(grayColor).font('Helvetica');
    doc.text(`Payment: ${invoice.paymentMethod || 'Cash'}`, marginLeft, Y);
    doc.text(`Status: ${invoice.paymentStatus}`, marginLeft + 120, Y);
    Y += 20;

    // ─── FOOTER: GrocGo branding ────────────────────────────
    doc.save().moveTo(marginLeft, Y).lineTo(pageWidth - marginRight, Y).lineWidth(0.5).strokeColor(lightGray).stroke().restore();
    Y += 8;

    doc.fontSize(8).fillColor(darkColor).font('Helvetica-Bold');
    doc.text('Thank you for shopping with us!', marginLeft, Y, { width: contentWidth, align: 'center' });
    Y += 13;

    doc.fontSize(7).fillColor(greenColor).font('Helvetica-Bold');
    doc.text('Powered by GrocGo', marginLeft, Y, { width: contentWidth, align: 'center' });
    Y += 10;
    doc.fontSize(6).fillColor(grayColor).font('Helvetica');
    doc.text('groogo.com  |  Digitize your grocery store', marginLeft, Y, { width: contentWidth, align: 'center' });

    doc.end();
  } catch (err: any) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── LIST INVOICES ───────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const invoices = await prisma.invoice.findMany({
      where: { storeId },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(invoices);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

export default router;
