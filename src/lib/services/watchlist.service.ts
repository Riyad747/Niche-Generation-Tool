import type { AiClient } from '@/lib/ai/client';
import { watchlistRepo } from '@/lib/db/repositories/watchlist-repo';
import { ScoringService } from './scoring.service';
import { SignalsService } from './signals.service';

export interface WatchDelta {
  opportunity: number;
  demand: number;
  competition: number;
  trend: number;
}

/**
 * WatchlistService — captures periodic snapshots of a watched niche/keyword and
 * computes change vs the previous snapshot. Snapshotting blends real signals
 * (trend/saturation) with a fresh AI assessment, reusing the same scoring path
 * as Mode 1 so watched scores are comparable to research scores.
 */
export class WatchlistService {
  private scoring: ScoringService;
  private signals: SignalsService;

  constructor(private ai: AiClient) {
    this.scoring = new ScoringService(ai);
    this.signals = new SignalsService();
  }

  /** Capture a fresh snapshot for one watchlist entry. */
  async snapshot(watchlistId: string, target: string) {
    const signals = await this.signals.forNiche(target);
    const scored = await this.scoring.scoreNiche(target, undefined, { signals });
    return watchlistRepo.addSnapshot({
      watchlistId,
      demandScore: scored.scores.demandScore,
      competitionScore: scored.scores.competitionScore,
      trendScore: scored.scores.trendScore,
      opportunityScore: scored.opportunityScore,
    });
  }

  /** Snapshot every entry for a user — the watchlist-scan cron entry point. */
  async scanAll(userId: string) {
    const items = await watchlistRepo.list(userId);
    for (const item of items) {
      await this.snapshot(item.id, item.target);
    }
    return items.length;
  }
}

/** Delta between the two most-recent snapshots (positive = improving). */
export function computeDelta(
  snapshots: { opportunityScore: number; demandScore: number; competitionScore: number; trendScore: number }[],
): WatchDelta | null {
  if (snapshots.length < 2) return null;
  const [latest, prev] = snapshots; // list() returns desc
  return {
    opportunity: latest.opportunityScore - prev.opportunityScore,
    demand: latest.demandScore - prev.demandScore,
    competition: latest.competitionScore - prev.competitionScore,
    trend: latest.trendScore - prev.trendScore,
  };
}
