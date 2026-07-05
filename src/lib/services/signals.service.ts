import type { TrendConnector, StockConnector } from '@/lib/connectors';
import { getTrendConnector, getStockConnector } from '@/lib/connectors';
import { analyzeTrend } from '@/lib/engines/trend';
import { supplyIndex, levelFromIndex, type SaturationLevel } from '@/lib/engines/saturation';
import type { GrowthState } from '@prisma/client';

export interface NicheSignals {
  trendScore: number;
  growthState: GrowthState;
  trendEstimated: boolean;
  competitionScore: number;
  saturationLevel: SaturationLevel;
  saturationEstimated: boolean;
}

/**
 * SignalsService — fetches real external signals for a niche (trend momentum +
 * stock saturation) via connectors and reduces them to the measured sub-scores.
 * Connectors are cached and degrade to estimates, so this never throws.
 */
export class SignalsService {
  constructor(
    private trends: TrendConnector = getTrendConnector(),
    private stock: StockConnector = getStockConnector(),
  ) {}

  async forNiche(term: string): Promise<NicheSignals> {
    const [series, sample] = await Promise.all([
      this.trends.series(term),
      this.stock.resultCount(term),
    ]);

    const trend = analyzeTrend(series.points);
    const competitionScore = supplyIndex(sample.resultCount);

    return {
      trendScore: trend.trendScore,
      growthState: trend.growthState,
      trendEstimated: series.estimated,
      competitionScore,
      saturationLevel: levelFromIndex(competitionScore),
      saturationEstimated: sample.estimated,
    };
  }
}
