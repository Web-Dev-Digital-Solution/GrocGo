import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth';
import storeRoutes from './routes/stores';
import customerRoutes from './routes/customers';
import productRoutes, { publicRouter } from './routes/products';
import orderRoutes, { publicRouter as publicOrderRoutes } from './routes/orders';
import invoiceRoutes from './routes/invoices';
import dashboardRoutes from './routes/dashboard';
import whatsappRoutes from './routes/whatsapp';
import adminRoutes from './routes/admin';
import qrRoutes from './routes/qr';

const app = express();
export const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;

// ─── MIDDLEWARE ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── STATIC FILES (uploads, QR codes) ───────────────────────
app.use('/uploads', express.static('uploads'));

// ─── API ROUTES ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', publicRouter);
app.use('/api/products', productRoutes);
app.use('/api/orders', publicOrderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);

// ─── HEALTH CHECK ────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'grocgo-api', timestamp: new Date().toISOString() });
});

// ─── 404 HANDLER ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── ERROR HANDLER ───────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── START SERVER ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🟢 GrocGo API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
