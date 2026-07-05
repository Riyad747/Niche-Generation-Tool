import { describe, it, expect } from 'vitest';
import type { AiClient } from '@/lib/ai/client';
import { NicheExpansionService } from '@/lib/services/niche-expansion.service';
import { ScoringService } from '@/lib/services/scoring.service';
import type { NicheAssessment } from '@/lib/ai/schemas';

/** A stub AiClient that returns canned structured output based on the schema. */
function makeStubAi(): AiClient {
  return {
    async json<T>(req: { user: string; schema: { parse: (v: unknown) => T } }): Promise<T> {
      // Expansion request → return two children.
      if (req.user.includes('Expand the niche')) {
        return req.schema.parse({
          children: [
            { name: 'Telemedicine', description: 'remote care', kind: 'sub' },
            { name: 'Elderly Care', description: 'aging population', kind: 'related' },
          ],
        });
      }
      // Assessment request → return a mid-range assessment.
      return req.schema.parse({
        demand: 70,
        competition: 30,
        trend: 65,
        seasonality: 40,
        commercialSafety: 90,
        approvalProbability: 75,
        growthState: 'RISING',
        aiCompat: {
          complexity: 20,
          textRequirements: 5,
          diagramRequirements: 10,
          consistencyRequirements: 10,
          objectCount: 20,
          detailDensity: 20,
        },
        vector: {
          edgeSimplicity: 80,
          shapeSeparation: 80,
          colorSimplicity: 80,
          noiseRisk: 10,
          detailDensity: 15,
        },
        estimated: true,
      } satisfies NicheAssessment);
    },
    async vision<T>(req: { schema: { parse: (v: unknown) => T } }): Promise<T> {
      return req.schema.parse({});
    },
    async text() {
      return '';
    },
    async embed() {
      return [];
    },
  };
}

describe('NicheExpansionService.expandTree', () => {
  it('builds a bounded tree with correct paths and depths', async () => {
    const svc = new NicheExpansionService(makeStubAi());
    const nodes = await svc.expandTree('Healthcare', { depth: 2, breadth: 2, max: 100 });

    // depth 1: 2 children; depth 2: each of those → 2 = 4. Total 6.
    expect(nodes).toHaveLength(6);
    expect(nodes.filter((n) => n.depth === 1)).toHaveLength(2);
    expect(nodes.filter((n) => n.depth === 2)).toHaveLength(4);

    const first = nodes[0];
    expect(first.path).toBe('healthcare.telemedicine');
    expect(first.parentPath).toBe('healthcare');
  });

  it('respects the max-niches cap', async () => {
    const svc = new NicheExpansionService(makeStubAi());
    const nodes = await svc.expandTree('Healthcare', { depth: 5, breadth: 2, max: 3 });
    expect(nodes.length).toBeLessThanOrEqual(3);
  });
});

describe('ScoringService.scoreNiche (via stub AI)', () => {
  it('turns an assessment into all eight sub-scores + a bounded opportunity score', async () => {
    const svc = new ScoringService(makeStubAi());
    const result = await svc.scoreNiche('Telemedicine', 'remote care');

    expect(result.scores.demandScore).toBe(70);
    expect(result.scores.competitionScore).toBe(30);
    // AI-compat: mostly easy → high score
    expect(result.scores.aiCompatScore).toBeGreaterThan(75);
    // Vectorization: clean flat → high score
    expect(result.scores.vectorCompatScore).toBeGreaterThan(70);
    expect(result.opportunityScore).toBeGreaterThan(0);
    expect(result.opportunityScore).toBeLessThanOrEqual(100);
    expect(result.growthState).toBe('RISING');
    expect(result.saturation).toBe('YELLOW'); // competition 30 → YELLOW
  });
});
