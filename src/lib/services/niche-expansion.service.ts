import type { AiClient } from '@/lib/ai/client';
import { modelFor } from '@/lib/ai/model-policy';
import { ExpansionSchema, type Expansion, type ExpandedNiche } from '@/lib/ai/schemas';
import { expansionPrompt } from '@/lib/ai/prompts/niche';
import { EXPANSION } from '@/config/constants';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface ExpandedNode extends ExpandedNiche {
  path: string;
  depth: number;
  parentPath: string | null;
}

/**
 * NicheExpansionService — builds the recursive niche tree breadth-first,
 * bounded by depth/breadth/total caps so a run can never explode. Each node
 * gets a materialized `path` for cheap subtree queries.
 */
export class NicheExpansionService {
  constructor(private ai: AiClient) {}

  private async expandOne(name: string, breadth: number): Promise<ExpandedNiche[]> {
    const { system, user } = expansionPrompt(name, breadth);
    const res = await this.ai.json<Expansion>({
      system,
      user,
      schema: ExpansionSchema,
      model: modelFor('niche-expansion'),
      engine: 'niche-expansion',
    });
    return res.children.slice(0, breadth);
  }

  /**
   * Expand `seed` into a bounded tree. Returns nodes in BFS order (parents
   * before children) so the caller can persist and link by path.
   */
  async expandTree(
    seed: string,
    opts?: { depth?: number; breadth?: number; max?: number },
  ): Promise<ExpandedNode[]> {
    const depth = Math.min(opts?.depth ?? EXPANSION.DEFAULT_DEPTH, EXPANSION.MAX_DEPTH);
    const breadth = Math.min(opts?.breadth ?? EXPANSION.DEFAULT_BREADTH, EXPANSION.MAX_BREADTH);
    const max = Math.min(opts?.max ?? EXPANSION.MAX_NICHES_PER_SESSION, EXPANSION.MAX_NICHES_PER_SESSION);

    const out: ExpandedNode[] = [];
    let frontier: { name: string; path: string; depth: number }[] = [
      { name: seed, path: slug(seed), depth: 0 },
    ];

    for (let level = 0; level < depth && frontier.length > 0; level++) {
      const next: typeof frontier = [];
      for (const node of frontier) {
        if (out.length >= max) return out;
        const children = await this.expandOne(node.name, breadth);
        for (const child of children) {
          if (out.length >= max) return out;
          const childPath = `${node.path}.${slug(child.name)}`;
          out.push({ ...child, path: childPath, depth: node.depth + 1, parentPath: node.path });
          next.push({ name: child.name, path: childPath, depth: node.depth + 1 });
        }
      }
      frontier = next;
    }
    return out;
  }
}

export { slug };
