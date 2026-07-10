import { requireUser } from '@/lib/auth/require-user';
import { getTrendConnector, getStockConnector } from '@/lib/connectors';
import { analyzeTrend } from '@/lib/engines/trend';
import { supplyIndex, levelFromIndex } from '@/lib/engines/saturation';
import { handle, ok, fail } from '@/lib/api/respond';

/**
 * GET /api/trends?term=... — trend analysis for any term. No AI key required:
 * uses the Reddit momentum connector (with deterministic fallback) + the pure
 * trend/saturation engines, so this page always works.
 */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();
    const term = (new URL(req.url).searchParams.get('term') ?? '').trim();
    if (term.length < 2) return fail('VALIDATION', 'Provide a term of at least 2 characters', 422);

    const [series, sample] = await Promise.all([
      getTrendConnector().series(term),
      getStockConnector().resultCount(term),
    ]);
    const trend = analyzeTrend(series.points);
    const competition = supplyIndex(sample.resultCount);

    return ok({
      term,
      points: series.points,
      estimated: series.estimated,
      source: series.source,
      trendScore: trend.trendScore,
      growthState: trend.growthState,
      competitionScore: competition,
      saturation: levelFromIndex(competition),
    });
  });
}
