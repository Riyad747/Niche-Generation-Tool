/**
 * All tunable scoring weights in one place (docs/04-SCORING-ENGINES.md).
 * Engines import from here so a weight change is a one-line, reviewable diff
 * and never requires touching engine logic.
 */

export const SCORE_VERSION = 1;

/** Unified opportunity score. */
export const OPPORTUNITY = {
  /** how punishing competition/saturation is (0..1) */
  COMP_WEIGHT: 0.9,
  /** seasonality multiplier floor and span: factor = FLOOR + SPAN*(seasonality/100) */
  SEASON_FLOOR: 0.85,
  SEASON_SPAN: 0.15,
};

/** AI Compatibility — penalties subtracted from 100 (each factor 0..100). */
export const AI_COMPAT = {
  complexity: 0.18,
  textRequirements: 0.28, // in-image text is the hardest for current models
  diagramRequirements: 0.22,
  consistencyRequirements: 0.18,
  objectCount: 0.08,
  detailDensity: 0.06,
} as const;

/**
 * Vectorization suitability — positive drivers minus noise/detail penalties.
 * Positive weights sum to 1.0 so a perfect flat-art subject can reach 100;
 * noise/detail are penalties on top that pull noisy/photographic subjects down.
 */
export const VECTOR = {
  edgeSimplicity: 0.4,
  shapeSeparation: 0.3,
  colorSimplicity: 0.3,
  noiseRisk: 0.3, // subtracted
  detailDensity: 0.2, // subtracted
} as const;

/** Blend weights between measured hard signal and AI estimate (must sum to 1). */
export const BLEND = {
  hard: 0.6,
  ai: 0.4,
} as const;

/** Saturation index → level thresholds. */
export const SATURATION_THRESHOLDS = { green: 25, yellow: 50, orange: 75 } as const;
