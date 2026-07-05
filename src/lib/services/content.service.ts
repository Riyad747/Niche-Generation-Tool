import type { AiClient } from '@/lib/ai/client';
import { modelFor } from '@/lib/ai/model-policy';
import { NicheContentSchema, type NicheContent } from '@/lib/ai/schemas';
import { contentPrompt } from '@/lib/ai/prompts/niche';
import { cached, hashKey } from '@/lib/cache/redis';
import { CACHE_TTL } from '@/config/constants';

/**
 * ContentService — generates microstock-ready keywords, titles, and asset ideas
 * (each with a ready-to-use prompt) for a niche. Cached by niche name so repeat
 * opens are instant and don't re-bill the AI.
 */
export class ContentService {
  constructor(private ai: AiClient) {}

  async generate(niche: string, description?: string): Promise<NicheContent> {
    return cached(`content:${hashKey({ niche, description })}`, CACHE_TTL.aiMemo, async () => {
      const { system, user } = contentPrompt(niche, description);
      return this.ai.json<NicheContent>({
        system,
        user,
        schema: NicheContentSchema,
        model: modelFor('keyword'),
        engine: 'content',
        maxTokens: 4096,
      });
    });
  }
}
