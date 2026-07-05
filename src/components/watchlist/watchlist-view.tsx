'use client';

import { useState } from 'react';
import { useWatchlist, useAddWatch, useRemoveWatch } from '@/hooks/use-watchlist';
import { ScoreBadge } from '@/components/scores/score-badge';
import { cn } from '@/lib/utils/cn';

/** Watchlist — track niches/keywords and see score movement over time. */
export function WatchlistView() {
  const list = useWatchlist();
  const add = useAddWatch();
  const remove = useRemoveWatch();
  const [target, setTarget] = useState('');

  function submit() {
    const t = target.trim();
    if (t.length < 2) return;
    add.mutate(t);
    setTarget('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Watchlist</h1>
        <p className="text-sm text-muted-foreground">
          Track niches and keywords. We snapshot demand, competition, and trend so you see what’s
          moving.
        </p>
      </div>

      <div className="flex gap-2 rounded-xl border bg-card p-4">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Add a niche or keyword to watch…"
          className="flex-1 rounded-lg border bg-background px-4 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={submit}
          disabled={add.isPending}
          className="rounded-lg bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {add.isPending ? 'Adding…' : 'Watch'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2.5 font-medium">Target</th>
              <th className="px-3 py-2.5 font-medium">Opportunity</th>
              <th className="px-3 py-2.5 font-medium">Δ</th>
              <th className="px-3 py-2.5 font-medium">Demand</th>
              <th className="px-3 py-2.5 font-medium">Trend</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {list.data?.map((w) => (
              <tr key={w.id} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-medium">{w.target}</td>
                <td className="px-3 py-2.5">
                  {w.latest ? <ScoreBadge score={w.latest.opportunityScore} /> : '—'}
                </td>
                <td className="px-3 py-2.5">
                  <Delta value={w.delta?.opportunity} />
                </td>
                <td className="px-3 py-2.5">{w.latest ? <ScoreBadge score={w.latest.demandScore} /> : '—'}</td>
                <td className="px-3 py-2.5">{w.latest ? <ScoreBadge score={w.latest.trendScore} /> : '—'}</td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    onClick={() => remove.mutate(w.id)}
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {list.data?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Nothing watched yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Delta({ value }: { value?: number }) {
  if (value === undefined || value === null) return <span className="text-muted-foreground">new</span>;
  if (value === 0) return <span className="text-muted-foreground">0</span>;
  const up = value > 0;
  return (
    <span className={cn('font-semibold tabular-nums', up ? 'text-score-green' : 'text-score-red')}>
      {up ? '▲' : '▼'} {Math.abs(value)}
    </span>
  );
}
