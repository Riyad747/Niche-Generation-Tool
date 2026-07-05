import { z } from 'zod';
import type { AiClient } from '@/lib/ai/client';
import { modelFor } from '@/lib/ai/model-policy';
import { nicheRepo } from '@/lib/db/repositories/niche-repo';
import { DiscoveryService, type DiscoveryWindow } from './discovery.service';

/**
 * CopilotService — a ReAct-lite research assistant. Rather than extend the
 * AiClient with full tool-use streaming, it runs a two-step loop with the
 * existing json()/text() methods:
 *   1. route: pick a tool + args (or answer directly) — structured JSON
 *   2. compose: answer the user grounded in the tool result
 * Tools are read-only and user-scoped, so the Copilot can only surface the
 * user's own data. The routing step is fully unit-tested with a stub AI.
 */

const RouteSchema = z.object({
  action: z.enum(['answer', 'find_opportunities', 'search_niches']),
  window: z.enum(['day', 'week', 'month', 'all']).optional(),
  query: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
  answer: z.string().optional(),
});
export type CopilotRoute = z.infer<typeof RouteSchema>;

export interface CopilotReply {
  answer: string;
  toolUsed: CopilotRoute['action'];
  data?: unknown;
}

const ROUTER_SYSTEM =
  'You route a microstock creator’s question to a tool. Tools:\n' +
  '- find_opportunities: top scored opportunities in a time window (day|week|month|all)\n' +
  '- search_niches: find niches matching a text query\n' +
  '- answer: reply directly when no data lookup is needed.\n' +
  'Return JSON { action, window?, query?, limit?, answer? }.';

export class CopilotService {
  constructor(private ai: AiClient) {}

  async ask(userId: string, message: string, now: Date): Promise<CopilotReply> {
    const route = await this.ai.json<CopilotRoute>({
      system: ROUTER_SYSTEM,
      user: message,
      schema: RouteSchema,
      model: modelFor('copilot'),
      engine: 'copilot',
    });

    if (route.action === 'answer') {
      return { answer: route.answer ?? '…', toolUsed: 'answer' };
    }

    const data = await this.runTool(userId, route, now);
    const answer = await this.ai.text({
      system:
        'You are a microstock research assistant. Answer the user concisely using ONLY the JSON ' +
        'data provided. Reference concrete niche names and scores. If the data is empty, say so and ' +
        'suggest running a niche research first.',
      user: `Question: ${message}\n\nData:\n${JSON.stringify(data).slice(0, 6000)}`,
      model: modelFor('copilot'),
      engine: 'copilot',
    });

    return { answer, toolUsed: route.action, data };
  }

  private async runTool(userId: string, route: CopilotRoute, now: Date): Promise<unknown> {
    if (route.action === 'find_opportunities') {
      const window = (route.window ?? 'week') as DiscoveryWindow;
      return new DiscoveryService().top(userId, window, now, route.limit ?? 20);
    }
    // search_niches
    return nicheRepo.searchForUser(userId, route.query ?? '', route.limit ?? 15);
  }
}
