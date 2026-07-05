'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCreateResearchSession, useSessions } from '@/hooks/use-research';
import { ScoreBadge } from '@/components/scores/score-badge';

const EXAMPLES = ['Healthcare', 'Sustainable living', 'Remote work', 'Fintech', 'Wellness'];

/** Mode 1 entry: enter a seed niche → start a run → jump to live results. */
export function ResearchLauncher() {
  const router = useRouter();
  const [seed, setSeed] = useState('');
  const create = useCreateResearchSession();
  const sessions = useSessions();

  async function start(value: string) {
    const s = value.trim();
    if (s.length < 2) return;
    const res = await create.mutateAsync({ seed: s });
    router.push(`/niches/${res.id}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Niche Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Enter a seed niche. We expand it into a scored, ranked opportunity tree.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2">
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && start(seed)}
            placeholder="e.g. Healthcare"
            className="flex-1 rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => start(seed)}
            disabled={create.isPending || seed.trim().length < 2}
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground disabled:opacity-50"
          >
            {create.isPending ? 'Starting…' : 'Research'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => start(ex)}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              {ex}
            </button>
          ))}
        </div>
        {create.error && (
          <p className="mt-3 text-sm text-destructive">{create.error.message}</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Recent research</h2>
        <div className="space-y-2">
          {sessions.data?.map((s) => (
            <button
              key={s.id}
              onClick={() => router.push(`/niches/${s.id}`)}
              className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left hover:bg-muted/50"
            >
              <span className="font-medium capitalize">{s.seed}</span>
              <span className="flex items-center gap-3 text-xs text-muted-foreground">
                {s.status !== 'COMPLETE' && <span>{s.progress}%</span>}
                <ScoreBadge score={s.status === 'COMPLETE' ? 100 : s.progress} label={s.status} />
              </span>
            </button>
          ))}
          {sessions.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No research yet — start one above.</p>
          )}
        </div>
      </div>
    </div>
  );
}
