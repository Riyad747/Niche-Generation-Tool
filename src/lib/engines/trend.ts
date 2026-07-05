import { clamp, toScore, mean } from '@/lib/utils/score-math';
import type { GrowthState } from '@prisma/client';

/**
 * Trend Engine — turns a normalized 0..100 time series into a momentum score and
 * a growth state, from slope (overall direction), acceleration (is it speeding
 * up), and current level.
 */
export interface TrendResult {
  trendScore: number;
  growthState: GrowthState;
  slope: number;
  acceleration: number;
  level: number;
}

/** Least-squares slope over an evenly-spaced series (per-step change). */
function slopeOf(points: number[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = mean(points);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (points[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function analyzeTrend(points: number[]): TrendResult {
  if (points.length === 0) {
    return { trendScore: 0, growthState: 'STABLE', slope: 0, acceleration: 0, level: 0 };
  }
  const slope = slopeOf(points);
  const mid = Math.floor(points.length / 2);
  const firstHalf = slopeOf(points.slice(0, mid));
  const secondHalf = slopeOf(points.slice(mid));
  const acceleration = secondHalf - firstHalf;
  const level = mean(points);

  // Score: blend recent level with momentum (slope scaled to a sensible range).
  const momentum = clamp(50 + slope * 8, 0, 100);
  const trendScore = toScore(0.5 * level + 0.5 * momentum);

  return { trendScore, growthState: classify(slope, acceleration, level), slope, acceleration, level };
}

function classify(slope: number, acceleration: number, level: number): GrowthState {
  if (slope > 1.5 && acceleration > 0.5) return 'EXPLOSIVE';
  if (slope > 0.4) return 'RISING';
  if (slope < -0.4) return 'DECLINING';
  // Flat overall, but low base with upward acceleration → something new starting.
  if (level < 40 && acceleration > 0.3) return 'EMERGING';
  return 'STABLE';
}
