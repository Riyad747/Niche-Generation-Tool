import { prisma } from '@/lib/db/client';
import type { Prisma } from '@prisma/client';

// `id` stays optional so ResearchService can pre-generate ids and link the tree
// by path in a single bulk insert; createdAt/updatedAt are DB-managed.
export type NicheCreateInput = Omit<Prisma.NicheCreateManyInput, 'createdAt' | 'updatedAt'>;

/** All Niche DB access. Reads scoped by userId; writes are bulk where possible. */
export const nicheRepo = {
  createMany(rows: NicheCreateInput[]) {
    return prisma.niche.createMany({ data: rows });
  },

  create(row: NicheCreateInput) {
    return prisma.niche.create({ data: row });
  },

  get(id: string, userId: string) {
    return prisma.niche.findFirst({ where: { id, userId } });
  },

  /** Ranked list for a session (highest opportunity first). */
  listBySession(sessionId: string, userId: string) {
    return prisma.niche.findMany({
      where: { sessionId, userId },
      orderBy: { opportunityScore: 'desc' },
    });
  },

  listChildren(parentId: string, userId: string) {
    return prisma.niche.findMany({
      where: { parentId, userId },
      orderBy: { opportunityScore: 'desc' },
    });
  },

  countBySession(sessionId: string) {
    return prisma.niche.count({ where: { sessionId } });
  },

  /** Text search over a user's niches — powers the Copilot's search tool. */
  searchForUser(userId: string, query: string, limit = 15) {
    return prisma.niche.findMany({
      where: {
        userId,
        depth: { gt: 0 },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { opportunityScore: 'desc' },
      take: limit,
    });
  },

  /** Top-scoring niches for a user since a cutoff — powers Mode 2 leaderboards. */
  topForUser(userId: string, since: Date | null, limit = 25) {
    return prisma.niche.findMany({
      where: {
        userId,
        depth: { gt: 0 }, // exclude the seed root
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      orderBy: { opportunityScore: 'desc' },
      take: limit,
    });
  },

  updateScores(id: string, data: Prisma.NicheUpdateInput) {
    return prisma.niche.update({ where: { id }, data });
  },
};
