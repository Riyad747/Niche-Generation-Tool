import { requireUser } from '@/lib/auth/require-user';
import { PortfolioService } from '@/lib/services/portfolio.service';
import { handle, ok } from '@/lib/api/respond';

const ALLOWED = [50, 100, 500];

/** GET /api/portfolio/:id/plan?size=50|100|500 — Next-N asset plan from gaps. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await params;
    const raw = Number(new URL(req.url).searchParams.get('size') ?? 50);
    const size = ALLOWED.includes(raw) ? raw : 50;
    const slots = await new PortfolioService().plan(id, user.id, size);
    return ok({ size, slots });
  });
}
