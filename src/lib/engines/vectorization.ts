import { VECTOR } from '@/config/weights';
import { toScore } from '@/lib/utils/score-math';

/**
 * Vectorization Suitability Engine — predicts Vectorizer.ai success.
 * Flat, clean, few-color, high-contrast subjects score high; photographic,
 * noisy, gradient-heavy subjects score low.
 *
 * Positive drivers (edge/shape/color simplicity) add; noise and detail subtract.
 */
export interface VectorFactors {
  edgeSimplicity: number; // 0..100 higher = cleaner edges
  shapeSeparation: number; // 0..100 higher = well-separated shapes
  colorSimplicity: number; // 0..100 higher = fewer flat colors
  noiseRisk: number; // 0..100 higher = more photographic noise
  detailDensity: number; // 0..100 higher = more fine detail
}

export function computeVectorScore(f: VectorFactors): number {
  const raw =
    f.edgeSimplicity * VECTOR.edgeSimplicity +
    f.shapeSeparation * VECTOR.shapeSeparation +
    f.colorSimplicity * VECTOR.colorSimplicity -
    f.noiseRisk * VECTOR.noiseRisk -
    f.detailDensity * VECTOR.detailDensity;

  return toScore(raw);
}
