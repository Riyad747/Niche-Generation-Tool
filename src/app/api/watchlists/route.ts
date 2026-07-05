import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { watchlistRepo } from '@/lib/db/repositories/watchlist-repo';
import { getUserAiClient } from '@/lib/ai';
import { WatchlistService, computeDelta } from '@/lib/services/watchlist.service';
import { handle, ok } from '@/lib/api/respond';

const schema = z.object({
  target: z.string().min(2).max(80),
  targetType: z.enum(['NICHE', 'KEYWORD', 'TOPIC', 'INDUSTRY']).default('NICHE'),
});

/** GET /api/watchlists — entries with latest snapshot + delta. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const items = await watchlistRepo.list(user.id);
    const data = items.map((w) => ({
      id: w.id,
      target: w.target,
      targetType: w.targetType,
      latest: w.snapshots[0] ?? null,
      delta: computeDelta(w.snapshots),
    }));
    return ok({ data });
  });
}

/** POST /api/watchlists — add a target and capture its first snapshot. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { target, targetType } = schema.parse(await req.json());
    const entry = await watchlistRepo.create({ userId: user.id, targetType, target });

    // Capture an initial snapshot so the entry has data immediately.
    const ai = await getUserAiClient(user.id);
    await new WatchlistService(ai).snapshot(entry.id, target);

    return ok({ id: entry.id }, 201);
  });
}
