import { requireUser } from '@/lib/auth/require-user';
import { DiscoveryService, type DiscoveryWindow } from '@/lib/services/discovery.service';
import { handle, ok } from '@/lib/api/respond';

const WINDOWS: DiscoveryWindow[] = ['day', 'week', 'month', 'all'];

/** GET /api/opportunities?window=day|week|month|all — Mode 2 leaderboard. */
export async function GET(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const raw = url.searchParams.get('window') ?? 'week';
    const window = (WINDOWS.includes(raw as DiscoveryWindow) ? raw : 'week') as DiscoveryWindow;

    const data = await new DiscoveryService().top(user.id, window, new Date());
    return ok({ window, data });
  });
}
