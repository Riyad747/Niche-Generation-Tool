import { requireUser } from '@/lib/auth/require-user';
import { sessionRepo } from '@/lib/db/repositories/session-repo';
import { createSessionSchema } from '@/lib/validation/research';
import { enqueue } from '@/lib/jobs/queue';
import { handle, ok, enforceRate } from '@/lib/api/respond';
import { QuotaService } from '@/lib/services/quota.service';
import { PLAN_LIMITS } from '@/config/plans';

// Without QStash, the research job runs inline after the response (see queue.ts)
// — give it room to finish. Requires Fluid Compute (default on new projects).
export const maxDuration = 300;

/** POST /api/research/sessions — start a Mode 1 run (enqueues, returns 202). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const limited = await enforceRate(user.id, 'research', PLAN_LIMITS[user.plan].aiRatePerMin);
    if (limited) return limited;

    const body = createSessionSchema.parse(await req.json());

    // Reserve quota before enqueuing the expensive fan-out job.
    await new QuotaService().consume(user.id, user.plan, 'researchSessions');

    const session = await sessionRepo.create({
      userId: user.id,
      projectId: body.projectId,
      seed: body.seed,
      params: { depth: body.depth, breadth: body.breadth },
    });

    await enqueue('nicheExpansion', {
      sessionId: session.id,
      userId: user.id,
      seed: body.seed,
      depth: body.depth,
      breadth: body.breadth,
    });

    return ok({ id: session.id, status: session.status }, 202);
  });
}

/** GET /api/research/sessions — recent sessions for the user. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const sessions = await sessionRepo.listForUser(user.id);
    return ok({ data: sessions });
  });
}
