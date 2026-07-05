import { requireUser } from '@/lib/auth/require-user';
import { portfolioRepo } from '@/lib/db/repositories/portfolio-repo';
import { handle, ok, fail } from '@/lib/api/respond';

/** GET /api/portfolio/:id/gaps — ranked portfolio gaps + distribution summary. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const upload = await portfolioRepo.getUpload(id, user.id);
    if (!upload) return fail('NOT_FOUND', 'Upload not found', 404);
    const gaps = await portfolioRepo.listGaps(id);
    return ok({ status: upload.status, summary: upload.summary, gaps });
  });
}
