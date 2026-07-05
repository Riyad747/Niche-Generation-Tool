import { prisma } from '@/lib/db/client';
import { getAiClient } from '@/lib/ai';
import { WatchlistService } from '@/lib/services/watchlist.service';

/**
 * GET /api/cron/watchlist-scan — Vercel Cron entry point. Snapshots every
 * watchlist entry so change-detection has fresh data. Protected by CRON_SECRET
 * (Vercel Cron sends it as a Bearer token). Marked public in middleware.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const users = await prisma.watchlist.findMany({
    distinct: ['userId'],
    select: { userId: true },
  });

  let scanned = 0;
  for (const { userId } of users) {
    const ai = getAiClient(userId);
    scanned += await new WatchlistService(ai).scanAll(userId);
  }

  return Response.json({ ok: true, users: users.length, entries: scanned });
}
