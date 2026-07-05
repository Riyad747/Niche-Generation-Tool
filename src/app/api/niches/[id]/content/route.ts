import { requireUser } from '@/lib/auth/require-user';
import { nicheRepo } from '@/lib/db/repositories/niche-repo';
import { getAiClient } from '@/lib/ai';
import { ContentService } from '@/lib/services/content.service';
import { handle, ok, fail } from '@/lib/api/respond';

/**
 * POST /api/niches/:id/content — generate keywords, titles, and asset ideas
 * (with prompts) for a niche. Cached server-side by niche.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const niche = await nicheRepo.get(id, user.id);
    if (!niche) return fail('NOT_FOUND', 'Niche not found', 404);

    const ai = getAiClient(user.id);
    const content = await new ContentService(ai).generate(niche.name, niche.description ?? undefined);
    return ok(content);
  });
}
