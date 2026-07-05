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

// Empty string clears a key; omitted field leaves it unchanged. Light format
// checks catch obvious paste mistakes before they reach the provider.
const schema = z.object({
  anthropicKey: z
    .string()
    .refine((v) => v === '' || v.startsWith('sk-ant-'), 'Anthropic keys start with "sk-ant-"')
    .optional(),
  openaiKey: z
    .string()
    .refine((v) => v === '' || v.startsWith('sk-'), 'OpenAI keys start with "sk-"')
    .optional(),
});

/** PUT /api/settings/keys — save/clear the user's AI keys (encrypted at rest). */
export async function PUT(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    if (body.anthropicKey === undefined && body.openaiKey === undefined) {
      return fail('VALIDATION', 'No keys provided', 422);
    }
    await secretsService.setKeys(user.id, body);
    const status = await secretsService.status(user.id);
    return ok(status);
  });
}
