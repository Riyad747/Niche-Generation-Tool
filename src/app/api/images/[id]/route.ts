import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { handle, ok, fail } from '@/lib/api/respond';

/** GET /api/images/:id — fetch a stored image analysis. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const analysis = await prisma.imageAnalysis.findFirst({ where: { id, userId: user.id } });
    if (!analysis) return fail('NOT_FOUND', 'Analysis not found', 404);
    return ok(analysis);
  });
}
