import { requireUser } from '@/lib/auth/require-user';
import { reportRepo } from '@/lib/db/repositories/report-repo';
import { handle, ok, fail } from '@/lib/api/respond';

/** GET /api/reports/:id — fetch a report's full content. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const report = await reportRepo.get(id, user.id);
    if (!report) return fail('NOT_FOUND', 'Report not found', 404);
    return ok(report);
  });
}
