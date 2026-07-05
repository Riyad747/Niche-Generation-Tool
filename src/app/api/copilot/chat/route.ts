import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { getUserAiClient } from '@/lib/ai';
import { CopilotService } from '@/lib/services/copilot.service';
import { handle, ok, enforceRate } from '@/lib/api/respond';
import { PLAN_LIMITS } from '@/config/plans';

export const maxDuration = 60;

const schema = z.object({ message: z.string().min(1).max(2000) });

/** POST /api/copilot/chat — ask the research assistant a question. */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const limited = await enforceRate(user.id, 'copilot', PLAN_LIMITS[user.plan].aiRatePerMin);
    if (limited) return limited;

    const { message } = schema.parse(await req.json());
    const ai = await getUserAiClient(user.id);
    const reply = await new CopilotService(ai).ask(user.id, message, new Date());
    return ok(reply);
  });
}
