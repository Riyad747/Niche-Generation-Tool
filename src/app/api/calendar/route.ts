import { requireUser } from '@/lib/auth/require-user';
import { upcomingEvents } from '@/lib/engines/event-calendar';
import { handle, ok } from '@/lib/api/respond';

/** GET /api/calendar?horizon=150 — upcoming content opportunities with lead times. */
export async function GET(req: Request) {
  return handle(async () => {
    await requireUser();
    const raw = Number(new URL(req.url).searchParams.get('horizon') ?? 150);
    const horizon = Number.isFinite(raw) ? Math.min(Math.max(raw, 30), 366) : 150;
    return ok({ data: upcomingEvents(new Date(), horizon) });
  });
}
