import { prisma } from '@/lib/db/client';
import type { AiClient, UsageSink } from './client';
import { RealAiClient } from './anthropic';
import { GeminiAiClient } from './gemini';
import { secretsService } from '@/lib/services/secrets.service';

export * from './client';
export { modelFor } from './model-policy';

/**
 * Build an AiClient bound to a user, so every AI call is logged to `AiUsage`
 * for cost tracking and quota enforcement. Pricing table is approximate and
 * lives here so cost math is auditable in one spot.
 */
const PRICE_PER_MTOK: Record<string, { in: number; out: number }> = {
  'claude-opus-4-8': { in: 15, out: 75 },
  'claude-sonnet-5': { in: 3, out: 15 },
  'claude-haiku-4-5-20251001': { in: 0.8, out: 4 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gemini-2.0-flash': { in: 0, out: 0 }, // free tier
};

function usageSink(userId?: string, sessionId?: string): UsageSink | undefined {
  if (!userId) return undefined;
  return {
    async record(u) {
      const p = PRICE_PER_MTOK[u.model] ?? { in: 0, out: 0 };
      const costUsd = (u.inputTok / 1e6) * p.in + (u.outputTok / 1e6) * p.out;
      await prisma.aiUsage.create({
        data: {
          userId,
          engine: u.engine,
          provider: u.provider,
          model: u.model,
          inputTok: u.inputTok,
          outputTok: u.outputTok,
          costUsd,
          sessionId,
        },
      });
    },
  };
}

/** Env-key-only client (server contexts with no specific user). */
export function getAiClient(userId?: string, sessionId?: string): AiClient {
  return new RealAiClient({ usage: usageSink(userId, sessionId) });
}

/**
 * Preferred: an AiClient using the user's own keys (BYOK) when set, falling back
 * to server env keys. A Gemini key (free tier) takes precedence and runs the
 * whole app on Gemini; otherwise we use Anthropic + OpenAI. Every user-facing
 * AI route should use this.
 */
export async function getUserAiClient(userId: string, sessionId?: string): Promise<AiClient> {
  const keys = await secretsService.getKeys(userId);
  const sink = usageSink(userId, sessionId);

  if (keys.geminiKey || (!keys.anthropicKey && process.env.GEMINI_API_KEY)) {
    return new GeminiAiClient({ usage: sink, apiKey: keys.geminiKey });
  }

  return new RealAiClient({
    usage: sink,
    anthropicKey: keys.anthropicKey,
    openaiKey: keys.openaiKey,
  });
}
