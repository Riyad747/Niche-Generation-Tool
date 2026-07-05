import { SATURATION_THRESHOLDS } from '@/config/weights';
import { clamp, normalize } from '@/lib/utils/score-math';

export type SaturationLevel = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';

/**
 * Saturation Engine — turns raw supply signals into a 0..100 index and a
 * traffic-light level. GREEN = underserved, RED = overserved.
 */
export interface SaturationSignals {
  /** total stock result count across platforms for the niche's canonical queries */
  resultCount: number;
  /** 0..100 visual-similarity density (pgvector clustering of top results) */
  similarityDensity: number;
  /** 0..100 how repetitive the top assets are */
  assetRepetition: number;
  /** 0..100 how repetitive the styles are */
  styleRepetition: number;
}

/** Result counts are heavy-tailed; log-normalize against an expected ceiling. */
function normalizeResultCount(count: number): number {
  const logged = Math.log10(Math.max(count, 1)); // 0..~6 for up to 1M results
  return normalize(logged, 0, 6);
}

/**
 * Supply-only saturation index from result count alone — the part we can
 * actually measure from a stock connector when similarity/repetition signals
 * aren't available. Rounds to 0..100.
 */
export function supplyIndex(resultCount: number): number {
  return Math.round(clamp(normalizeResultCount(resultCount), 0, 100));
}

export function computeSaturationIndex(s: SaturationSignals): number {
  const supply = normalizeResultCount(s.resultCount);
  const index =
    0.4 * supply + 0.3 * s.similarityDensity + 0.15 * s.assetRepetition + 0.15 * s.styleRepetition;
  return Math.round(clamp(index, 0, 100));
}

export function levelFromIndex(index: number): SaturationLevel {
  if (index <= SATURATION_THRESHOLDS.green) return 'GREEN';
  if (index <= SATURATION_THRESHOLDS.yellow) return 'YELLOW';
  if (index <= SATURATION_THRESHOLDS.orange) return 'ORANGE';
  return 'RED';
}

/** Convenience: saturation index also acts as the competition sub-score. */
export function competitionFromSaturation(index: number): number {
  return index;
}
