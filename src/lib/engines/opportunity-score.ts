import { OPPORTUNITY } from '@/config/weights';
import { clamp, toScore } from '@/lib/utils/score-math';

/** The eight sub-scores every niche/opportunity carries (each 0..100). */
export interface SubScores {
  demandScore: number;
  competitionScore: number;
  trendScore: number;
  seasonalityScore: number;
  aiCompatScore: number;
  vectorCompatScore: number;
  commercialSafetyScore: number;
  approvalProbabilityScore: number;
}

/**
 * Unified Opportunity Score (docs/04-SCORING-ENGINES.md).
 *
 * The spec's raw formula `sum(positives) / competition` is unbounded and blows
 * up as competition → 0. We keep its spirit — reward demand/trend/AI/vector/
 * safety/approval, punish competition — but as a bounded 0..100 value:
 *
 *   base   = mean(6 positive scores)
 *   comp   = 1 - (competition/100) * COMP_WEIGHT
 *   season = SEASON_FLOOR + SEASON_SPAN * (seasonality/100)
 *   score  = base * comp * season
 */
export function computeOpportunityScore(s: SubScores): number {
  const base =
    (s.demandScore +
      s.trendScore +
      s.aiCompatScore +
      s.vectorCompatScore +
      s.commercialSafetyScore +
      s.approvalProbabilityScore) /
    6;

  const competitionFactor = 1 - (s.competitionScore / 100) * OPPORTUNITY.COMP_WEIGHT;
  const seasonalityFactor =
    OPPORTUNITY.SEASON_FLOOR + OPPORTUNITY.SEASON_SPAN * (s.seasonalityScore / 100);

  return toScore(base * competitionFactor * seasonalityFactor);
}

/** Literal spec formula, exposed for debugging/comparison only (unbounded). */
export function computeSpecScore(s: SubScores): number {
  const raw =
    s.demandScore +
    s.trendScore +
    s.aiCompatScore +
    s.vectorCompatScore +
    s.commercialSafetyScore +
    s.approvalProbabilityScore;
  return raw / Math.max(s.competitionScore, 1);
}

/** An opportunity is "underserved" when it scores high but isn't saturated. */
export function isUnderserved(opportunityScore: number, saturationIndex: number): boolean {
  return opportunityScore >= 60 && saturationIndex <= 50;
}

export { clamp };
