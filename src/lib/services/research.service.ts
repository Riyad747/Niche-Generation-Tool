import { randomUUID } from 'node:crypto';
import type { AiClient } from '@/lib/ai/client';
import { prisma } from '@/lib/db/client';
import { sessionRepo } from '@/lib/db/repositories/session-repo';
import { nicheRepo, type NicheCreateInput } from '@/lib/db/repositories/niche-repo';
import { redis } from '@/lib/cache/redis';
import { NicheExpansionService, slug } from './niche-expansion.service';
import { ScoringService } from './scoring.service';
import { SignalsService } from './signals.service';
import { pMap } from '@/lib/utils/p-map';
import { EXPANSION } from '@/config/constants';
import type { Prisma } from '@prisma/client';

/**
 * ResearchService — orchestrates a full Mode 1 run:
 *   expand tree → bulk-insert niches → score each (bounded concurrency) →
 *   persist scores → advance progress. Idempotent per session and resumable
 *   (progress is persisted); safe to re-invoke from a job processor.
 */
export class ResearchService {
  private expansion: NicheExpansionService;
  private scoring: ScoringService;
  private signals: SignalsService;

  constructor(private ai: AiClient) {
    this.expansion = new NicheExpansionService(ai);
    this.scoring = new ScoringService(ai);
    this.signals = new SignalsService();
  }

  private async setProgress(sessionId: string, progress: number) {
    await redis.set(`session:${sessionId}:progress`, progress, { ex: 3600 });
  }

  async run(sessionId: string, userId: string, seed: string, opts?: { depth?: number; breadth?: number }) {
    try {
      await sessionRepo.update(sessionId, { status: 'RUNNING', progress: 2 });
      await this.setProgress(sessionId, 2);

      // 1. Expand the tree.
      const nodes = await this.expansion.expandTree(seed, opts);
      await sessionRepo.update(sessionId, { progress: 20 });
      await this.setProgress(sessionId, 20);

      // 2. Pre-generate ids so we can link parent/child by path in one bulk insert.
      const rootId = randomUUID();
      const pathToId = new Map<string, string>([[slug(seed), rootId]]);
      for (const n of nodes) pathToId.set(n.path, randomUUID());

      const rows: NicheCreateInput[] = [
        {
          id: rootId,
          userId,
          sessionId,
          parentId: null,
          path: slug(seed),
          depth: 0,
          kind: 'sub',
          name: seed,
          description: `Seed niche: ${seed}`,
        },
        ...nodes.map((n) => ({
          id: pathToId.get(n.path)!,
          userId,
          sessionId,
          parentId: n.parentPath ? pathToId.get(n.parentPath) ?? null : null,
          path: n.path,
          depth: n.depth,
          kind: n.kind,
          name: n.name,
          description: n.description,
        })),
      ];
      await nicheRepo.createMany(rows);

      // 3. Score every niche with bounded concurrency, advancing progress 20→100.
      let done = 0;
      await pMap(
        rows,
        async (row) => {
          const signals = await this.signals.forNiche(row.name);
          const scored = await this.scoring.scoreNiche(row.name, row.description ?? undefined, {
            signals,
          });
          await nicheRepo.updateScores(row.id!, {
            ...scored.scores,
            opportunityScore: scored.opportunityScore,
            growthState: scored.growthState,
            saturation: scored.saturation,
            scoreBreakdown: scored.breakdown as Prisma.InputJsonValue,
          });
          done++;
          const progress = 20 + Math.round((done / rows.length) * 80);
          if (done % 5 === 0 || done === rows.length) {
            await sessionRepo.update(sessionId, { progress });
            await this.setProgress(sessionId, progress);
          }
        },
        EXPANSION.CONCURRENCY,
      );

      await sessionRepo.update(sessionId, { status: 'COMPLETE', progress: 100 });
      await this.setProgress(sessionId, 100);
      return { nicheCount: rows.length };
    } catch (err) {
      await sessionRepo.update(sessionId, {
        status: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }
}

export { prisma };
