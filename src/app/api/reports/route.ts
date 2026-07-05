import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { reportRepo } from '@/lib/db/repositories/report-repo';
import { getUserAiClient } from '@/lib/ai';
import { ReportService } from '@/lib/services/report.service';
import { handle, ok } from '@/lib/api/respond';

const schema = z.object({
  kind: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'OPPORTUNITY', 'TREND', 'PORTFOLIO']).default('WEEKLY'),
});

/** GET /api/reports — list generated reports. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const data = await reportRepo.list(user.id);
    return ok({ data });
  });
}

/** POST /api/reports — generate a new report from current data. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { kind } = schema.parse(await req.json().catch(() => ({})));
    const ai = await getUserAiClient(user.id);
    const report = await new ReportService(ai).generate(user.id, kind, new Date());
    return ok({ id: report.id }, 201);
  });
}
