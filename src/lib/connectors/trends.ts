import { cached, hashKey } from '@/lib/cache/redis';
import { CACHE_TTL } from '@/config/constants';
import type { TrendConnector, TrendSeries } from './types';
import { estimatedTrendSeries } from './deterministic';

/**
 * Reddit trend connector — a real, ToS-friendly example. Reddit exposes a public
 * search JSON endpoint; we use recent post cadence as a coarse momentum proxy.
 * On any failure (rate limit, network, shape change) we fall back to the
 * deterministic estimate. Result is cached 12h.
 *
 * Google Trends / Pinterest have no stable public API; add them here behind the
 * same interface when you obtain access (SerpAPI, official partner API, etc.).
 * Until then they resolve to the estimated series — flagged accordingly.
 */
export class RedditTrendConnector implements TrendConnector {
  async series(term: string): Promise<TrendSeries> {
    return cached(`trend:reddit:${hashKey(term)}`, CACHE_TTL.trend, async () => {
      try {
        const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
          term,
        )}&sort=new&limit=100`;
        const res = await fetch(url, {
          headers: { 'user-agent': 'microstock-opportunity-intel/0.1' },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`reddit ${res.status}`);
        const json = (await res.json()) as {
          data?: { children?: { data?: { created_utc?: number } }[] };
        };
        const posts = json.data?.children ?? [];
        if (posts.length === 0) throw new Error('no posts');
        const series = bucketByRecency(posts.map((p) => p.data?.created_utc ?? 0));
        return { points: series, estimated: false, source: 'REDDIT' as const };
      } catch {
        return { points: estimatedTrendSeries(term), estimated: true, source: 'REDDIT' as const };
      }
    });
  }
}

/** Bucket post timestamps into a 24-slot recency histogram, normalized 0..100. */
function bucketByRecency(timestamps: number[], slots = 24): number[] {
  const valid = timestamps.filter((t) => t > 0);
  if (valid.length === 0) return new Array(slots).fill(0);
  const now = Math.max(...valid);
  const oldest = Math.min(...valid);
  const span = Math.max(now - oldest, 1);
  const counts = new Array(slots).fill(0);
  for (const t of valid) {
    const idx = Math.min(slots - 1, Math.floor(((t - oldest) / span) * slots));
    counts[idx]++;
  }
  const max = Math.max(...counts, 1);
  return counts.map((c) => Math.round((c / max) * 100));
}

/** Estimate-only connector for sources without a public API yet. */
export class EstimatedTrendConnector implements TrendConnector {
  constructor(private source: TrendSeries['source']) {}
  async series(term: string): Promise<TrendSeries> {
    return { points: estimatedTrendSeries(term), estimated: true, source: this.source };
  }
}
