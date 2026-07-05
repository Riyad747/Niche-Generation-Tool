import { PrismaClient } from '@prisma/client';

/**
 * Prisma singleton. In dev, Next.js hot-reload would otherwise spawn a new
 * client per reload and exhaust connections. This is the ONLY module allowed
 * to import PrismaClient — everything else goes through repositories.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
