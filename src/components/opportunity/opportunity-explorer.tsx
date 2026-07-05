'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useOpportunities, type DiscoveryWindow } from '@/hooks/use-opportunities';
import { ScoreBadge } from '@/components/scores/score-badge';
import { cn } from '@/lib/utils/cn';

const WINDOWS: { key: DiscoveryWindow; label: string }[] = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'all', label: 'All time' },
];

const GAP_STYLE: Record<string, string> = {
  underserved: 'bg-score-green/15 text-score-green',
  unexplored: 'bg-score-yellow/15 text-score-yellow',
  future: 'bg-primary/10 text-primary',
  overserved: 'bg-score-red/15 text-score-red',
};

/** Mode 2 — Market Opportunity Discovery leaderboard with time-window tabs. */
export function OpportunityExplorer() {
  const [window, setWindow] = useState<DiscoveryWindow>('week');
  const { data, isLoading } = useOpportunities(window);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Opportunity Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Top opportunities across your research, ranked by unified Opportunity Score.
        </p>
      </div>

      <div className="flex gap-1 rounded-lg border bg-card p-1">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWindow(w.key)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              window === w.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="px-4 py-2.5 font-medium">Opportunity</th>
              <th className="px-3 py-2.5 font-medium">Gap</th>
              <th className="px-3 py-2.5 font-medium">Score</th>
              <th className="px-3 py-2.5 font-medium">Demand</th>
              <th className="px-3 py-2.5 font-medium">Trend</th>
              <th className="px-3 py-2.5 font-medium">AI</th>
              <th className="px-3 py-2.5 font-medium">Vec</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="px-4 py-2.5">
                  <Link href={`/niches/${o.sessionId}`} className="font-medium hover:underline">
                    {o.name}
                  </Link>
                  {o.growthState && (
                    <span className="ml-2 text-xs text-muted-foreground">{o.growthState}</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', GAP_STYLE[o.gap])}>
                    {o.gap}
                  </span>
                </td>
                <td className="px-3 py-2.5"><ScoreBadge score={o.opportunityScore} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={o.demandScore} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={o.trendScore} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={o.aiCompatScore} /></td>
                <td className="px-3 py-2.5"><ScoreBadge score={o.vectorCompatScore} /></td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No opportunities in this window yet. Run a niche research to populate this board.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
