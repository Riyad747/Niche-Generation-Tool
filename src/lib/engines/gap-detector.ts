import type { SubScores } from './opportunity-score';
import type { SaturationLevel } from './saturation';

export type GapType = 'overserved' | 'underserved' | 'unexplored' | 'future';

/**
 * Market Gap Detector — buckets a niche by the demand-vs-supply relationship.
 * In Mode 4, `inPortfolio` additionally distinguishes a market gap from a
 * personal-portfolio gap.
 */
export function classifyGap(
  scores: SubScores,
  saturation: SaturationLevel,
  opts?: { emerging?: boolean; inPortfolio?: boolean },
): GapType {
  const highDemand = scores.demandScore >= 55 || scores.trendScore >= 60;
  const lowSupply = saturation === 'GREEN' || saturation === 'YELLOW';

  if (opts?.emerging && scores.demandScore < 50) return 'future';
  if (highDemand && lowSupply) return 'underserved';
  if (lowSupply && !highDemand) return 'unexplored';
  return 'overserved';
}

/** How many assets to create to meaningfully fill a gap. */
export function suggestedFillCount(gap: GapType, scalingPotential: number): number {
  if (gap === 'overserved') return 0;
  const base = gap === 'underserved' ? 40 : gap === 'future' ? 15 : 25;
  return base + Math.round((scalingPotential / 100) * 60);
}
