import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:npg_VgvB7JF5tSGH@ep-young-mountain-ax27vn6e-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require';

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: { db: { url: DATABASE_URL } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
