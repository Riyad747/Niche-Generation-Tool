import { prisma } from '@/lib/db/client';
import type { WatchTargetType } from '@prisma/client';

/** Watchlist + snapshot DB access, scoped by userId. */
export const watchlistRepo = {
  create(data: { userId: string; targetType: WatchTargetType; target: string }) {
    return prisma.watchlist.upsert({
      where: {
        userId_targetType_target: {
          userId: data.userId,
          targetType: data.targetType,
          target: data.target,
        },
      },
      update: {},
      create: data,
    });
  },

  list(userId: string) {
    return prisma.watchlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { snapshots: { orderBy: { capturedAt: 'desc' }, take: 2 } },
    });
  },

  get(id: string, userId: string) {
    return prisma.watchlist.findFirst({ where: { id, userId } });
  },

  remove(id: string, userId: string) {
    return prisma.watchlist.deleteMany({ where: { id, userId } });
  },

  addSnapshot(data: {
    watchlistId: string;
    demandScore: number;
    competitionScore: number;
    trendScore: number;
    opportunityScore: number;
  }) {
    return prisma.watchlistSnapshot.create({ data });
  },
};
