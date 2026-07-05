import { requireUser } from '@/lib/auth/require-user';
import { nicheRepo } from '@/lib/db/repositories/niche-repo';
import { handle, ok, fail } from '@/lib/api/respond';

/** GET /api/niches/:id — a single niche with its children. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const niche = await nicheRepo.get(id, user.id);
    if (!niche) return fail('NOT_FOUND', 'Niche not found', 404);
    const children = await nicheRepo.listChildren(id, user.id);
    return ok({ ...niche, children });
  });
}
