import { requireUser } from '@/lib/auth/require-user';
import { sessionRepo } from '@/lib/db/repositories/session-repo';
import { nicheRepo } from '@/lib/db/repositories/niche-repo';
import { handle, ok, fail } from '@/lib/api/respond';

/** GET /api/research/sessions/:id — poll session status + niche count. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const session = await sessionRepo.get(id, user.id);
    if (!session) return fail('NOT_FOUND', 'Session not found', 404);
    const nicheCount = await nicheRepo.countBySession(id);
    return ok({ ...session, nicheCount });
  });
}
