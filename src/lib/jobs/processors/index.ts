import { getUserAiClient } from '@/lib/ai';
import { ResearchService } from '@/lib/services/research.service';
import type { JobType, JobPayload } from '../queue';

/** Routes a job payload to its processor. Add new job types here. */
export async function processJob<T extends JobType>(type: T, payload: JobPayload[T]): Promise<void> {
  switch (type) {
    case 'nicheExpansion': {
      const p = payload as JobPayload['nicheExpansion'];
      const ai = await getUserAiClient(p.userId, p.sessionId);
      await new ResearchService(ai).run(p.sessionId, p.userId, p.seed, {
        depth: p.depth,
        breadth: p.breadth,
      });
      return;
    }
    case 'imageAnalysis':
    case 'portfolioAnalysis':
      // Implemented in Phase 3.
      throw new Error(`Job type "${type}" not yet implemented`);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown job type: ${String(_exhaustive)}`);
    }
  }
}
