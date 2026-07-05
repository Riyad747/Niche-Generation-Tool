import { requireUser } from '@/lib/auth/require-user';
import { watchlistRepo } from '@/lib/db/repositories/watchlist-repo';
import { handle, ok } from '@/lib/api/respond';

/** DELETE /api/watchlists/:id — stop watching a target. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    await watchlistRepo.remove(id, user.id);
    return ok({ ok: true });
  });
}
