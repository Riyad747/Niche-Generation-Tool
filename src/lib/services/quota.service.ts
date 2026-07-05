import { prisma } from '@/lib/db/client';
import { PLAN_LIMITS, PERIOD_MS, type QuotaKind } from '@/config/plans';
import type { Plan } from '@prisma/client';

export class QuotaExceededError extends Error {
  constructor(public kind: QuotaKind) {
    super(`Quota exceeded for ${kind}`);
    this.name = 'QuotaExceededError';
  }
}

const COLUMN: Record<QuotaKind, 'researchSessionsUsed' | 'imageAnalysesUsed' | 'aiTokensUsed'> = {
  researchSessions: 'researchSessionsUsed',
  imageAnalyses: 'imageAnalysesUsed',
  aiTokens: 'aiTokensUsed',
};

/** Decide whether a usage count is within a plan limit (`null` = unlimited). */
export function withinLimit(used: number, amount: number, limit: number | null): boolean {
  if (limit === null) return true;
  return used + amount <= limit;
}

/**
 * QuotaService — plan-based monthly usage caps. Period auto-rolls every 30 days.
 * `consume` is check-then-increment: it throws QuotaExceededError before any
 * expensive work runs, so a user on FREE can't burn unlimited AI spend.
 */
export class QuotaService {
  private async current(userId: string, now: Date) {
    const existing = await prisma.usageQuota.findUnique({ where: { userId } });
    if (!existing) {
      return prisma.usageQuota.create({ data: { userId, periodStart: now } });
    }
    // Roll the period over if it's older than 30 days.
    if (now.getTime() - existing.periodStart.getTime() > PERIOD_MS) {
      return prisma.usageQuota.update({
        where: { userId },
        data: {
          periodStart: now,
          researchSessionsUsed: 0,
          imageAnalysesUsed: 0,
          aiTokensUsed: 0,
        },
      });
    }
    return existing;
  }

  /** Throws QuotaExceededError if consuming would exceed the plan; else increments. */
  async consume(userId: string, plan: Plan, kind: QuotaKind, amount = 1, now = new Date()) {
    const quota = await this.current(userId, now);
    const used = quota[COLUMN[kind]];
    const limit = PLAN_LIMITS[plan][kind];
    if (!withinLimit(used, amount, limit)) throw new QuotaExceededError(kind);

    await prisma.usageQuota.update({
      where: { userId },
      data: { [COLUMN[kind]]: { increment: amount } },
    });
  }
}
