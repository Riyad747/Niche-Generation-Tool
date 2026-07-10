import { z } from 'zod';
import { requireUser } from '@/lib/auth/require-user';
import { secretsService } from '@/lib/services/secrets.service';
import { handle, ok, fail } from '@/lib/api/respond';

/** GET /api/settings/keys — masked status of the user's stored AI keys. */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    const status = await secretsService.status(user.id);
    return ok(status);
  });
}

// Operations: replace/clear anthropic|openai (empty string clears), append one
// Gemini key, or remove a Gemini key by index. Omitted fields are untouched.
const schema = z.object({
  anthropicKey: z
    .string()
    .refine((v) => v === '' || v.startsWith('sk-ant-'), 'Anthropic keys start with "sk-ant-"')
    .optional(),
  openaiKey: z
    .string()
    .refine((v) => v === '' || v.startsWith('sk-'), 'OpenAI keys start with "sk-"')
    .optional(),
  addGeminiKey: z.string().refine((v) => v.startsWith('AIza'), 'Gemini keys start with "AIza"').optional(),
  removeGeminiIndex: z.number().int().min(0).optional(),
  geminiModel: z
    .string()
    .max(60)
    .regex(/^[a-z0-9.-]*$/i, 'Invalid model id')
    .optional(),
});

/** PUT /api/settings/keys — save/clear/add/remove keys (encrypted at rest). */
export async function PUT(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (
      body.anthropicKey === undefined &&
      body.openaiKey === undefined &&
      body.addGeminiKey === undefined &&
      body.removeGeminiIndex === undefined &&
      body.geminiModel === undefined
    ) {
      return fail('VALIDATION', 'No changes provided', 422);
    }

    if (body.anthropicKey !== undefined || body.openaiKey !== undefined) {
      await secretsService.setKeys(user.id, {
        anthropicKey: body.anthropicKey,
        openaiKey: body.openaiKey,
      });
    }
    if (body.addGeminiKey !== undefined) await secretsService.addGeminiKey(user.id, body.addGeminiKey);
    if (body.removeGeminiIndex !== undefined)
      await secretsService.removeGeminiKeyAt(user.id, body.removeGeminiIndex);
    if (body.geminiModel !== undefined)
      await secretsService.setGeminiModel(user.id, body.geminiModel);

    return ok(await secretsService.status(user.id));
  });
}
