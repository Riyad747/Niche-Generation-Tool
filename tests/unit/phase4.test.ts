import { describe, it, expect } from 'vitest';
import { computeDelta } from '@/lib/services/watchlist.service';
import { CopilotService } from '@/lib/services/copilot.service';
import type { AiClient } from '@/lib/ai/client';

describe('Copilot routing', () => {
  it('answers directly without hitting a tool when the router says "answer"', async () => {
    const ai: Partial<AiClient> = {
      async json<T>(req: { schema: { parse: (v: unknown) => T } }): Promise<T> {
        return req.schema.parse({ action: 'answer', answer: 'Create seasonal vector icons.' });
      },
    };
    const reply = await new CopilotService(ai as AiClient).ask('user-1', 'What next?', new Date(0));
    expect(reply.toolUsed).toBe('answer');
    expect(reply.answer).toContain('seasonal');
    expect(reply.data).toBeUndefined();
  });
});

describe('Watchlist delta', () => {
  it('returns null with fewer than two snapshots', () => {
    expect(computeDelta([])).toBeNull();
    expect(computeDelta([{ opportunityScore: 50, demandScore: 50, competitionScore: 50, trendScore: 50 }])).toBeNull();
  });

  it('computes latest-minus-previous (list is desc)', () => {
    const delta = computeDelta([
      { opportunityScore: 70, demandScore: 60, competitionScore: 40, trendScore: 80 }, // latest
      { opportunityScore: 55, demandScore: 50, competitionScore: 45, trendScore: 60 }, // previous
    ]);
    expect(delta).toEqual({ opportunity: 15, demand: 10, competition: -5, trend: 20 });
  });
});
