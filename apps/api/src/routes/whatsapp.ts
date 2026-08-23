import { Router, Response } from 'express';
import axios from 'axios';
import { prisma } from '../index';
import { authenticate, requireStoreAccess, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── WHATSAPP PROVIDER ABSTRACTION ───────────────────────────
// Switch providers by changing env WHATSAPP_PROVIDER
// Supported: "meta" (WhatsApp Business API), "twilio", "none"

async function sendWhatsAppMessage(
  storeId: string,
  to: string,
  message: string,
  messageType: string = 'text'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = process.env.WHATSAPP_PROVIDER || 'none';

  if (provider === 'none') {
    // Log but don't send
    await prisma.whatsAppLog.create({
      data: { storeId, direction: 'outbound', toFrom: to, messageType, messageBody: message, status: 'simulated', provider: 'none' },
    });
    return { success: true, messageId: 'simulated' };
  }

  try {
    if (provider === 'meta') {
      // WhatsApp Cloud API (Meta)
      const apiUrl = `${process.env.WHATSAPP_API_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const response = await axios.post(apiUrl, {
        messaging_product: 'whatsapp',
        to: to.replace('+', ''),
        type: 'text',
        text: { body: message },
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data?.messages?.[0]?.id;
      await prisma.whatsAppLog.create({
        data: { storeId, direction: 'outbound', toFrom: to, messageType, messageBody: message, status: 'sent', provider: 'meta', orderId: messageId },
      });

      return { success: true, messageId };
    }

    if (provider === 'twilio') {
      // Twilio WhatsApp API
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = process.env.WHATSAPP_FROM_NUMBER;

      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        new URLSearchParams({
          From: `whatsapp:${fromNumber}`,
          To: `whatsapp:${to}`,
          Body: message,
        }),
        {
          auth: { username: accountSid!, password: authToken! },
        }
      );

      const messageId = response.data.sid;
      await prisma.whatsAppLog.create({
        data: { storeId, direction: 'outbound', toFrom: to, messageType, messageBody: message, status: 'sent', provider: 'twilio', orderId: messageId },
      });

      return { success: true, messageId };
    }

    return { success: false, error: `Unknown provider: ${provider}` };
  } catch (err: any) {
    console.error('WhatsApp send error:', err.message);
    await prisma.whatsAppLog.create({
      data: { storeId, direction: 'outbound', toFrom: to, messageType, messageBody: message, status: 'failed', provider },
    });
    return { success: false, error: err.message };
  }
}

// ─── SEND ORDER CONFIRMATION ─────────────────────────────────
router.post('/send-order-confirmation', authenticate, requireStoreAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    const storeId = req.user!.storeId!;

    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { customer: true, store: true, items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const itemsList = order.items
      .map((item) => `• ${item.productName} x${item.quantity} (${item.unit})`)
      .join('\n');

    const message = `🟢 *GrocGo Order Confirmed*\n\n` +
      `Order #: ${order.orderNumber}\n` +
      `Store: ${order.store.name}\n\n` +
      `*Items:*\n${itemsList}\n\n` +
      `Total: ₹${order.totalAmount.toFixed(2)}\n\n` +
      `We'll notify you when your order is ready for pickup!`;

    const result = await sendWhatsAppMessage(storeId, order.customer.phone, message);

    res.json({ success: result.success, messageId: result.messageId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send confirmation' });
  }
});

// ─── SEND READY FOR PICKUP NOTIFICATION ──────────────────────
router.post('/send-ready-notification', authenticate, requireStoreAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;
    const storeId = req.user!.storeId!;

    const order = await prisma.order.findFirst({
      where: { id: orderId, storeId },
      include: { customer: true, store: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const message = `✅ *Your Order is Ready!*\n\n` +
      `Order #: ${order.orderNumber}\n` +
      `Store: ${order.store.name}\n` +
      `Address: ${order.store.address}, ${order.store.city}\n\n` +
      `Please visit the store to collect your groceries.\n` +
      `Store Phone: ${order.store.phone}`;

    const result = await sendWhatsAppMessage(storeId, order.customer.phone, message);

    res.json({ success: result.success, messageId: result.messageId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send ready notification' });
  }
});

// ─── SEND MONTHLY REMINDER ───────────────────────────────────
router.post('/send-monthly-reminder', authenticate, requireStoreAccess, async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.body;
    const storeId = req.user!.storeId!;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, storeId },
      include: { store: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const reorderUrl = `${frontendUrl}/order/${customer.store.slug}?reorder=${customer.id}`;

    const message = `🛒 *Monthly Grocery Reminder*\n\n` +
      `Hi ${customer.name}!\n\n` +
      `It's time for your monthly grocery shopping at ${customer.store.name}.\n\n` +
      `Update your grocery list and place your order:\n${reorderUrl}\n\n` +
      `We'll prepare your order for quick pickup!`;

    const result = await sendWhatsAppMessage(storeId, customer.phone, message);

    // Update reminder record
    await prisma.monthlyReminder.upsert({
      where: { customerId_storeId: { customerId, storeId } },
      create: { customerId, storeId, lastSentAt: new Date(), nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      update: { lastSentAt: new Date(), nextSendAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    res.json({ success: result.success, messageId: result.messageId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send reminder' });
  }
});

// ─── WHATSAPP WEBHOOK (receive messages — for future use) ────
router.post('/webhook', async (req, res) => {
  // Verify webhook
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }

  // Log incoming message
  try {
    const body = req.body;
    if (body.entry?.[0]?.changes?.[0]?.value?.messages) {
      const message = body.entry[0].changes[0].value.messages[0];
      console.log('WhatsApp incoming:', message);
      // TODO: Process incoming messages (customer replies, etc.)
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  res.sendStatus(200);
});

// ─── GET WHATSAPP LOGS ───────────────────────────────────────
router.get('/logs', authenticate, requireStoreAccess, async (req: AuthRequest, res: Response) => {
  try {
    const storeId = req.user!.storeId!;
    const logs = await prisma.whatsAppLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
