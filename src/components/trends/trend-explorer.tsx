'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { ScoreBadge } from '@/components/scores/score-badge';
import { cn } from '@/lib/utils/cn';

interface TrendResult {
  term: string;
  points: number[];
  estimated: boolean;
  source: string;
  trendScore: number;
  growthState: string;
  competitionScore: number;
  saturation: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED';
}

const EXAMPLES = ['telemedicine', 'ai art', 'sustainable fashion', 'remote work', 'halloween'];

const GROWTH_CLS: Record<string, string> = {
  EXPLOSIVE: 'bg-score-green/15 text-score-green',
  RISING: 'bg-score-green/15 text-score-green',
  EMERGING: 'bg-primary/10 text-primary',
  STABLE: 'bg-score-yellow/15 text-score-yellow',
  DECLINING: 'bg-score-red/15 text-score-red',
};

const SAT_CLS: Record<string, string> = {
  GREEN: 'bg-score-green/15 text-score-green',
  YELLOW: 'bg-score-yellow/15 text-score-yellow',
  ORANGE: 'bg-score-orange/15 text-score-orange',
  RED: 'bg-score-red/15 text-score-red',
};

/** Trend Explorer — momentum + saturation for any term. Works without AI keys. */
export function TrendExplorer() {
  const [term, setTerm] = useState('');
  const analyze = useMutation({
    mutationFn: (t: string) => apiFetch<TrendResult>(`/api/trends?term=${encodeURIComponent(t)}`),
  });

  function run(t: string) {
    const v = t.trim();
    if (v.length >= 2) analyze.mutate(v);
  }

  const r = analyze.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Trend Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Check momentum and market saturation for any niche or keyword before you create.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2">
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(term)}
            placeholder="e.g. telemedicine"
            className="flex-1 rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => run(term)}
            disabled={analyze.isPending || term.trim().length < 2}
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground disabled:opacity-50"
          >
            {analyze.isPending ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setTerm(ex);
                run(ex);
              }}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              {ex}
            </button>
          ))}
        </div>
        {analyze.error && (
          <p className="mt-3 text-sm text-destructive">{(analyze.error as Error).message}</p>
        )}
      </div>

      {r && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="text-xs text-muted-foreground">Trend score</div>
              <div className="mt-1"><ScoreBadge score={r.trendScore} /></div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="text-xs text-muted-foreground">Growth</div>
              <div className="mt-1">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', GROWTH_CLS[r.growthState])}>
                  {r.growthState}
                </span>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="text-xs text-muted-foreground">Competition</div>
              <div className="mt-1"><ScoreBadge score={100 - r.competitionScore} label="inv" /></div>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <div className="text-xs text-muted-foreground">Saturation</div>
              <div className="mt-1">
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', SAT_CLS[r.saturation])}>
                  {r.saturation}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">“{r.term}” momentum</h3>
              <span className="text-xs text-muted-foreground">
                {r.estimated ? 'estimated signal' : `source: ${r.source.toLowerCase()}`}
              </span>
            </div>
            <Sparkline points={r.points} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Minimal dependency-free sparkline. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <p className="text-sm text-muted-foreground">Not enough data.</p>;
  const w = 600;
  const h = 80;
  const max = Math.max(...points, 1);
  const step = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - (p / max) * (h - 6) - 3).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label="trend sparkline">
      <path d={path} fill="none" stroke="hsl(262 83% 58%)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
