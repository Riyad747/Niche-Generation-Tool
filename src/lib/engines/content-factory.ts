import { clamp } from '@/lib/utils/score-math';
import type { SubScores } from './opportunity-score';

/**
 * Content Factory Planner — per-opportunity production economics: how long to
 * make, how big a portfolio to build, how much it can scale, and rough sales
 * potential. All derived from the sub-scores so it stays consistent with the
 * rest of the system.
 */
export interface ProductionPlan {
  estProductionMinutes: number;
  estPortfolioSize: number;
  estScalingPotential: number; // 0..100
  estSalesPotential: number; // 0..100
}

export function planProduction(
  scores: SubScores,
  assetType: 'PNG' | 'VECTOR' | 'ILLUSTRATION',
): ProductionPlan {
  // Base minutes per asset type; easier AI/vector generation shortens it.
  const baseMinutes = assetType === 'ILLUSTRATION' ? 40 : assetType === 'VECTOR' ? 25 : 15;
  const easeFactor =
    1 - ((scores.aiCompatScore + scores.vectorCompatScore) / 200) * 0.6; // up to 60% faster
  const estProductionMinutes = Math.max(4, Math.round(baseMinutes * easeFactor));

  // Sales potential ~ demand × trend dampened by competition.
  const estSalesPotential = Math.round(
    clamp((scores.demandScore * 0.6 + scores.trendScore * 0.4) * (1 - scores.competitionScore / 200), 0, 100),
  );

  // Scaling potential: how many variations the niche supports — favored by high
  // AI/vector compat and demand, hurt by saturation.
  const estScalingPotential = Math.round(
    clamp(
      0.4 * scores.aiCompatScore + 0.3 * scores.demandScore + 0.3 * (100 - scores.competitionScore),
      0,
      100,
    ),
  );

  // Suggested portfolio size scales with the scaling potential.
  const estPortfolioSize = 20 + Math.round((estScalingPotential / 100) * 180); // 20..200

  return { estProductionMinutes, estPortfolioSize, estScalingPotential, estSalesPotential };
}
