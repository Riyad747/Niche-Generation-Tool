import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { getUserAiClient } from '@/lib/ai';
import { ContentService } from '@/lib/services/content.service';
import { findEvent } from '@/lib/engines/event-calendar';
import { handle, ok, fail, enforceRate } from '@/lib/api/respond';
import { PLAN_LIMITS } from '@/config/plans';

export const maxDuration = 60;

const schema = z.object({ eventId: z.string().min(1) });

/**
 * POST /api/calendar/ideas — generate microstock content ideas (keywords, titles,
 * asset prompts) for an upcoming event. Reuses ContentService (cached).
 */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const limited = await enforceRate(user.id, 'calendar', PLAN_LIMITS[user.plan].aiRatePerMin);
    if (limited) return limited;

    const { eventId } = schema.parse(await req.json());
    const event = findEvent(eventId);
    if (!event) return fail('NOT_FOUND', 'Event not found', 404);

    const ai = await getUserAiClient(user.id);
    const content = await new ContentService(ai).generate(
      event.name,
      `${event.category} content opportunity — ${event.note} Create commercially-safe microstock assets to publish ahead of ${event.name}.`,
    );
    return ok(content);
  });
}
