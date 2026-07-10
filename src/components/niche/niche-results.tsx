'use client';

import { useState, useMemo } from 'react';
import { useSession, useNiches } from '@/hooks/use-research';
import { NicheDetailPanel } from './niche-detail-panel';
import { ScoreBadge } from '@/components/scores/score-badge';
import { cn } from '@/lib/utils/cn';
import type { NicheDto } from '@/types/dto';

/** Full Mode 1 results view: live progress → ranked list + detail panel. */
export function NicheResults({ sessionId }: { sessionId: string }) {
  const session = useSession(sessionId);
  const live = session.data ? session.data.status !== 'COMPLETE' && session.data.status !== 'FAILED' : true;
  const niches = useNiches(sessionId, live);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [onlyUnderserved, setOnlyUnderserved] = useState(false);

  const rows = useMemo(() => {
    const all = niches.data ?? [];
    return onlyUnderserved
      ? all.filter((n) => n.opportunityScore >= 60 && (n.saturation === 'GREEN' || n.saturation === 'YELLOW'))
      : all;
  }, [niches.data, onlyUnderserved]);

  const selected = rows.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold capitalize">{session.data?.seed ?? 'Research'}</h1>
          <p className="text-sm text-muted-foreground">
            {session.data?.status === 'COMPLETE'
              ? `${rows.length} niches scored`
              : `Status: ${session.data?.status ?? 'loading'} · ${session.data?.progress ?? 0}%`}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyUnderserved}
            onChange={(e) => setOnlyUnderserved(e.target.checked)}
          />
          Underserved only
        </label>
      </header>

      {live && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${session.data?.progress ?? 0}%` }}
          />
        </div>
      )}

      {session.data?.status === 'FAILED' && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Run failed: {session.data.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-2.5 font-medium">Niche</th>
                <th className="px-3 py-2.5 font-medium">Opp</th>
                <th className="px-3 py-2.5 font-medium">Demand</th>
                <th className="px-3 py-2.5 font-medium">AI</th>
                <th className="px-3 py-2.5 font-medium">Vec</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n: NicheDto) => (
                <tr
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={cn(
                    'cursor-pointer border-b last:border-0 hover:bg-muted/50',
                    selectedId === n.id && 'bg-primary/5',
                  )}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{n.name}</div>
                    <div className="text-xs text-muted-foreground">{'·'.repeat(n.depth)} {n.kind}</div>
                  </td>
                  <td className="px-3 py-2.5"><ScoreBadge score={n.opportunityScore} /></td>
                  <td className="px-3 py-2.5"><ScoreBadge score={n.demandScore} /></td>
                  <td className="px-3 py-2.5"><ScoreBadge score={n.aiCompatScore} /></td>
                  <td className="px-3 py-2.5"><ScoreBadge score={n.vectorCompatScore} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {live ? 'Scoring niches…' : 'No niches yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (
            // key resets generated-content state when a different niche is selected
            <NicheDetailPanel key={selected.id} niche={selected} />
          ) : (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Select a niche to see its score breakdown and generate content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
