'use client';

import { useNicheContent } from '@/hooks/use-research';
import { ScoreBadge } from '@/components/scores/score-badge';
import { ScoreBreakdown } from '@/components/scores/score-breakdown';
import type { NicheDto } from '@/types/dto';

/** Right-hand detail for a selected niche: scores + on-demand content generation. */
export function NicheDetailPanel({ niche }: { niche: NicheDto }) {
  const content = useNicheContent();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{niche.name}</h2>
          <ScoreBadge score={niche.opportunityScore} label="opp" />
        </div>
        {niche.description && (
          <p className="mt-1 text-sm text-muted-foreground">{niche.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {niche.growthState && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {niche.growthState}
            </span>
          )}
          {niche.saturation && (
            <span className="rounded-full bg-muted px-2 py-0.5">{niche.saturation} saturation</span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5">{niche.kind}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold">Score breakdown</h3>
        <ScoreBreakdown niche={niche} />
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Keywords, titles & asset ideas</h3>
          <button
            onClick={() => content.mutate(niche.id)}
            disabled={content.isPending}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {content.isPending ? 'Generating…' : content.data ? 'Regenerate' : 'Generate'}
          </button>
        </div>

        {content.error && (
          <p className="text-sm text-destructive">Failed: {content.error.message}</p>
        )}

        {content.data && (
          <div className="space-y-4">
            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Keywords ({content.data.keywords.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {content.data.keywords.map((k, i) => (
                  <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs" title={k.kind}>
                    {k.term}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Titles ({content.data.titles.length})
              </h4>
              <ul className="space-y-1 text-sm">
                {content.data.titles.map((t, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-muted-foreground">{t.kind}:</span>
                    <span>{t.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Asset ideas ({content.data.ideas.length})
              </h4>
              <ul className="space-y-2 text-sm">
                {content.data.ideas.map((idea, i) => (
                  <li key={i} className="rounded-lg border p-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {idea.assetType}
                      </span>
                      <span className="font-medium">{idea.title}</span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{idea.prompt}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {!content.data && !content.isPending && (
          <p className="text-sm text-muted-foreground">
            Generate 30+ keywords, 10 titles, and ready-to-use asset prompts for this niche.
          </p>
        )}
      </div>
    </div>
  );
}
