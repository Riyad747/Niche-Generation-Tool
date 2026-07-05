import { hashKey } from '@/lib/cache/redis';

/**
 * Seeded pseudo-random helpers for deterministic fallback signals. A given term
 * always yields the same series, so estimates are stable across runs (and tests
 * are reproducible) — while being clearly flagged `estimated: true` upstream.
 */
function seedFromString(s: string): number {
  const h = hashKey(s);
  let seed = 0;
  for (let i = 0; i < h.length; i++) seed = (seed * 31 + h.charCodeAt(i)) >>> 0;
  return seed || 1;
}

/** Mulberry32 PRNG — small, fast, deterministic. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A plausible 24-point 0..100 trend series with a gentle drift (some terms
 * rising, some declining, some flat), derived deterministically from the term.
 */
export function estimatedTrendSeries(term: string, length = 24): number[] {
  const rng = mulberry32(seedFromString(term));
  const base = 30 + rng() * 40; // 30..70 baseline
  const drift = (rng() - 0.5) * 3; // per-step drift, -1.5..1.5
  const points: number[] = [];
  let value = base;
  for (let i = 0; i < length; i++) {
    value += drift + (rng() - 0.5) * 8; // drift + noise
    points.push(Math.max(0, Math.min(100, Math.round(value))));
  }
  return points;
}

/** A plausible stock result count (heavy-tailed) derived from the term. */
export function estimatedResultCount(term: string): number {
  const rng = mulberry32(seedFromString(`count:${term}`));
  // 200 .. ~800k, log-distributed
  const exp = 2.3 + rng() * 3.6;
  return Math.round(10 ** exp);
}
