import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { getUserAiClient } from '@/lib/ai';
import { modelFor } from '@/lib/ai/model-policy';
import { PromptPackSchema, type PromptPack } from '@/lib/ai/schemas';
import { handle, ok, enforceRate } from '@/lib/api/respond';
import { PLAN_LIMITS } from '@/config/plans';

export const maxDuration = 60;

const schema = z.object({ topic: z.string().min(2).max(120) });

/** POST /api/prompts/generate — a prompt pack (MidJourney/Flux/Vector/Illustration). */
export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const limited = await enforceRate(user.id, 'prompts', PLAN_LIMITS[user.plan].aiRatePerMin);
    if (limited) return limited;

    const { topic } = schema.parse(await req.json());
    const ai = await getUserAiClient(user.id);

    const pack = await ai.json<PromptPack>({
      system:
        'You are a prompt engineer for microstock creators using MidJourney, Flux and vector ' +
        'illustration workflows (Vectorizer.ai + Illustrator). Prompts must be commercially safe: ' +
        'no brands, logos, celebrities, or trademarked characters.',
      user: `Create a prompt pack for the topic "${topic}".
Return JSON: { "prompts": [ { "kind", "body", "variations" } ] }
- ~8 prompts total across kinds MIDJOURNEY, FLUX, VECTOR, ILLUSTRATION (at least one of each)
- body = a complete ready-to-paste prompt (include style, composition, lighting; for VECTOR use flat
  design, clean edges, limited palette, white background so it vectorizes well)
- variations = 2-3 short alternates of that prompt`,
      schema: PromptPackSchema,
      model: modelFor('prompt-generator'),
      engine: 'prompt-generator',
      maxTokens: 4096,
    });

    return ok(pack);
  });
}
