import { nicheRepo } from '@/lib/db/repositories/niche-repo';
import { classifyGap } from '@/lib/engines/gap-detector';
import type { GapType } from '@/lib/engines/gap-detector';
import type { Niche } from '@prisma/client';

export type DiscoveryWindow = 'day' | 'week' | 'month' | 'all';

export interface DiscoveredOpportunity {
  id: string;
  name: string;
  description: string | null;
  opportunityScore: number;
  demandScore: number;
  competitionScore: number;
  trendScore: number;
  aiCompatScore: number;
  vectorCompatScore: number;
  approvalProbabilityScore: number;
  growthState: string | null;
  saturation: string | null;
  gap: GapType;
  sessionId: string;
}

const WINDOW_MS: Record<Exclude<DiscoveryWindow, 'all'>, number> = {
  day: 24 * 3600_000,
  week: 7 * 24 * 3600_000,
  month: 30 * 24 * 3600_000,
};

/**
 * DiscoveryService (Mode 2) — surfaces the top opportunities for a user within a
 * time window, drawn from all their scored niches and tagged with a market-gap
 * classification. `now` is injected so the window math is testable.
 */
export class DiscoveryService {
  async top(userId: string, window: DiscoveryWindow, now: Date, limit = 25): Promise<DiscoveredOpportunity[]> {
    const since = window === 'all' ? null : new Date(now.getTime() - WINDOW_MS[window]);
    const niches = await nicheRepo.topForUser(userId, since, limit);
    return niches.map(toOpportunity);
  }
}

function toOpportunity(n: Niche): DiscoveredOpportunity {
  const scores = {
    demandScore: n.demandScore,
    competitionScore: n.competitionScore,
    trendScore: n.trendScore,
    seasonalityScore: n.seasonalityScore,
    aiCompatScore: n.aiCompatScore,
    vectorCompatScore: n.vectorCompatScore,
    commercialSafetyScore: n.commercialSafetyScore,
    approvalProbabilityScore: n.approvalProbabilityScore,
  };
  return {
    id: n.id,
    name: n.name,
    description: n.description,
    opportunityScore: n.opportunityScore,
    demandScore: n.demandScore,
    competitionScore: n.competitionScore,
    trendScore: n.trendScore,
    aiCompatScore: n.aiCompatScore,
    vectorCompatScore: n.vectorCompatScore,
    approvalProbabilityScore: n.approvalProbabilityScore,
    growthState: n.growthState,
    saturation: n.saturation,
    gap: classifyGap(scores, n.saturation ?? 'YELLOW', {
      emerging: n.growthState === 'EMERGING' || n.growthState === 'EXPLOSIVE',
    }),
    sessionId: n.sessionId,
  };
}
