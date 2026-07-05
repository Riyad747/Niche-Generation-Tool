import { BLEND } from '@/config/weights';

/** Clamp a number into [min, max]. */
export function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

/** Clamp to 0..100 and round to an integer — the canonical score shape. */
export function toScore(n: number): number {
  return Math.round(clamp(n, 0, 100));
}

/** Min-max normalize a value into 0..100 given an expected range. */
export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/**
 * Blend a measured "hard" signal with an AI estimate. When a hard signal is
 * unavailable (null), we fall back entirely to the AI estimate and the caller
 * should mark the input `estimated: true` in the score breakdown.
 */
export function blend(hard: number | null, aiEstimate: number): number {
  if (hard === null) return toScore(aiEstimate);
  return toScore(BLEND.hard * hard + BLEND.ai * aiEstimate);
}

export function mean(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
