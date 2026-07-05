import { prisma } from '@/lib/db/client';
import type { Prisma, SessionStatus } from '@prisma/client';

/** All ResearchSession DB access. Every read is scoped by userId. */
export const sessionRepo = {
  create(data: { userId: string; projectId?: string; seed: string; params?: Prisma.InputJsonValue }) {
    return prisma.researchSession.create({
      data: {
        userId: data.userId,
        projectId: data.projectId,
        seed: data.seed,
        params: data.params,
        status: 'PENDING',
      },
    });
  },

  get(id: string, userId: string) {
    return prisma.researchSession.findFirst({ where: { id, userId } });
  },

  listForUser(userId: string, limit = 20) {
    return prisma.researchSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  update(id: string, data: { status?: SessionStatus; progress?: number; error?: string | null }) {
    return prisma.researchSession.update({ where: { id }, data });
  },
};
