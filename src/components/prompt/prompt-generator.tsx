'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

interface PromptPack {
  prompts: { kind: string; body: string; variations: string[] }[];
}

const KIND_CLS: Record<string, string> = {
  MIDJOURNEY: 'bg-primary/10 text-primary',
  FLUX: 'bg-score-green/15 text-score-green',
  VECTOR: 'bg-score-orange/15 text-score-orange',
  ILLUSTRATION: 'bg-score-yellow/15 text-score-yellow',
};

const EXAMPLES = ['Telemedicine icons', 'Autumn cozy home', 'Halloween patterns', 'Fitness lifestyle'];

/** Prompt Generator — ready-to-paste prompt packs for a topic. */
export function PromptGenerator() {
  const [topic, setTopic] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const gen = useMutation({
    mutationFn: (t: string) =>
      apiFetch<PromptPack>('/api/prompts/generate', {
        method: 'POST',
        body: JSON.stringify({ topic: t }),
      }),
  });

  function run(t: string) {
    const v = t.trim();
    if (v.length >= 2) gen.mutate(v);
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Generator</h1>
        <p className="text-sm text-muted-foreground">
          Turn any topic into ready-to-paste MidJourney, Flux, vector and illustration prompts.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(topic)}
            placeholder="e.g. Telemedicine icons"
            className="flex-1 rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={() => run(topic)}
            disabled={gen.isPending || topic.trim().length < 2}
            className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground disabled:opacity-50"
          >
            {gen.isPending ? 'Generating…' : 'Generate'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => {
                setTopic(ex);
                run(ex);
              }}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              {ex}
            </button>
          ))}
        </div>
        {gen.error && <p className="mt-3 text-sm text-destructive">{(gen.error as Error).message}</p>}
      </div>

      {gen.data && (
        <div className="space-y-3">
          {gen.data.prompts.map((p, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', KIND_CLS[p.kind])}>
                  {p.kind}
                </span>
                <button
                  onClick={() => copy(p.body)}
                  className="shrink-0 rounded-lg border px-3 py-1 text-xs hover:bg-muted"
                >
                  {copied === p.body ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 font-mono text-sm">{p.body}</p>
              {p.variations.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t pt-3">
                  {p.variations.map((v, j) => (
                    <li key={j} className="flex items-start justify-between gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{v}</span>
                      <button
                        onClick={() => copy(v)}
                        className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {copied === v ? '✓' : 'copy'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
