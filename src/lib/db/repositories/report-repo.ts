import { prisma } from '@/lib/db/client';
import type { ReportKind, Prisma } from '@prisma/client';

/** Report DB access, scoped by userId. */
export const reportRepo = {
  create(data: { userId: string; kind: ReportKind; title: string; content: Prisma.InputJsonValue }) {
    return prisma.report.create({ data });
  },
  list(userId: string) {
    return prisma.report.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, kind: true, title: true, createdAt: true },
    });
  },
  get(id: string, userId: string) {
    return prisma.report.findFirst({ where: { id, userId } });
  },
};
