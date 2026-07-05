import { prisma } from '@/lib/db/client';
import type { Prisma, Platform, SessionStatus } from '@prisma/client';

/** All PortfolioUpload / asset / gap DB access, scoped by userId. */
export const portfolioRepo = {
  createUpload(data: {
    userId: string;
    projectId?: string;
    platform: Platform;
    fileName: string;
    rowCount: number;
  }) {
    return prisma.portfolioUpload.create({ data: { ...data, status: 'PENDING' } });
  },

  getUpload(id: string, userId: string) {
    return prisma.portfolioUpload.findFirst({ where: { id, userId } });
  },

  listUploads(userId: string) {
    return prisma.portfolioUpload.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  addAssets(rows: Prisma.PortfolioAssetCreateManyInput[]) {
    return prisma.portfolioAsset.createMany({ data: rows });
  },

  replaceGaps(uploadId: string, rows: Prisma.PortfolioGapCreateManyInput[]) {
    return prisma.$transaction([
      prisma.portfolioGap.deleteMany({ where: { uploadId } }),
      prisma.portfolioGap.createMany({ data: rows }),
    ]);
  },

  listGaps(uploadId: string) {
    return prisma.portfolioGap.findMany({
      where: { uploadId },
      orderBy: { opportunityScore: 'desc' },
    });
  },

  updateUpload(id: string, data: { status?: SessionStatus; summary?: Prisma.InputJsonValue; rowCount?: number }) {
    return prisma.portfolioUpload.update({ where: { id }, data });
  },
};
