'use client';

import { useState } from 'react';
import {
  useUploadPortfolio,
  usePortfolioGaps,
  usePortfolioPlan,
} from '@/hooks/use-portfolio';
import { ScoreBadge } from '@/components/scores/score-badge';
import { cn } from '@/lib/utils/cn';

const PLATFORMS = ['ADOBE_STOCK', 'SHUTTERSTOCK', 'FREEPIK', 'CREATIVE_MARKET', 'ENVATO'];
const GAP_STYLE: Record<string, string> = {
  growth: 'bg-primary/10 text-primary',
  missing: 'bg-score-orange/15 text-score-orange',
  weak: 'bg-score-yellow/15 text-score-yellow',
};

/** Mode 4 — upload a contributor CSV, see gaps and a Next-N asset plan. */
export function PortfolioAnalyzer() {
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [planSize, setPlanSize] = useState(50);

  const upload = useUploadPortfolio();
  const gaps = usePortfolioGaps(uploadId);
  const plan = usePortfolioPlan(uploadId, planSize);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const csv = await file.text();
    const res = await upload.mutateAsync({ csv, platform, fileName: file.name });
    setUploadId(res.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio Analyzer</h1>
        <p className="text-sm text-muted-foreground">
          Upload your Adobe Stock or Shutterstock CSV export — find missing niches and get your next
          50 / 100 / 500 assets.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.replace('_', ' ')}</option>
          ))}
        </select>
        <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {upload.isPending ? 'Processing…' : 'Upload CSV'}
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {upload.error && <span className="text-sm text-destructive">{upload.error.message}</span>}
        {gaps.data?.summary && (
          <span className="text-sm text-muted-foreground">{gaps.data.summary.total} assets analyzed</span>
        )}
      </div>

      {gaps.data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card">
            <div className="border-b px-4 py-3"><h2 className="font-semibold">Gaps</h2></div>
            <ul className="divide-y">
              {gaps.data.gaps.slice(0, 25).map((g) => (
                <li key={g.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <div>
                    <div className="font-medium">{g.label}</div>
                    <div className="text-xs text-muted-foreground">{g.rationale?.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', GAP_STYLE[g.gapType])}>
                      {g.gapType}
                    </span>
                    <ScoreBadge score={g.opportunityScore} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">Next assets</h2>
              <div className="flex gap-1 rounded-lg border p-0.5">
                {[50, 100, 500].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlanSize(s)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium',
                      planSize === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <ul className="divide-y">
              {plan.data?.slots.map((s, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{s.label} <span className="text-xs text-muted-foreground">· {s.category}</span></span>
                  <span className="font-semibold tabular-nums">×{s.count}</span>
                </li>
              ))}
              {plan.isLoading && <li className="px-4 py-6 text-center text-muted-foreground">Building plan…</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
