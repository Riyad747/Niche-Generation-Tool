'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

interface KeyStatus {
  anthropic: { set: boolean; masked: string | null };
  openai: { set: boolean; masked: string | null };
  gemini: { set: boolean; masked: string | null };
}

type KeyBody = { anthropicKey?: string; openaiKey?: string; geminiKey?: string };

/**
 * BYOK settings — users paste their own Anthropic/OpenAI keys. Keys are sent
 * once, stored encrypted server-side, and only ever read back masked. Leaving a
 * field blank keeps the existing key; the "Remove" action clears it.
 */
export function ApiKeysForm() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ['key-status'],
    queryFn: () => apiFetch<KeyStatus>('/api/settings/keys'),
  });

  const [gemini, setGemini] = useState('');
  const [anthropic, setAnthropic] = useState('');
  const [openai, setOpenai] = useState('');

  const save = useMutation({
    mutationFn: (body: KeyBody) =>
      apiFetch<KeyStatus>('/api/settings/keys', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      setGemini('');
      setAnthropic('');
      setOpenai('');
      qc.invalidateQueries({ queryKey: ['key-status'] });
    },
  });

  function submit() {
    const body: KeyBody = {};
    if (gemini.trim()) body.geminiKey = gemini.trim();
    if (anthropic.trim()) body.anthropicKey = anthropic.trim();
    if (openai.trim()) body.openaiKey = openai.trim();
    if (Object.keys(body).length) save.mutate(body);
  }

  const s = status.data;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">AI API keys</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bring your own key. It&apos;s encrypted and used only for your account&apos;s AI features
        (niche research, image analysis, Copilot). A <strong>free Google Gemini key</strong> runs the
        whole app — get one in a click at{' '}
        <a className="text-primary underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
          aistudio.google.com/apikey
        </a>
        .
      </p>

      <div className="mt-5 space-y-4">
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              Free · Recommended
            </span>
          </div>
          <KeyField
            label="Google Gemini"
            placeholder="AIza…"
            value={gemini}
            onChange={setGemini}
            status={s?.gemini}
            onRemove={() => save.mutate({ geminiKey: '' })}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Free tier, no card needed. When set, this powers everything — you don&apos;t need the
            keys below.
          </p>
        </div>

        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Advanced: use Anthropic / OpenAI instead
          </summary>
          <div className="mt-4 space-y-4">
            <KeyField
              label="Anthropic (Claude)"
              placeholder="sk-ant-…"
              value={anthropic}
              onChange={setAnthropic}
              status={s?.anthropic}
              onRemove={() => save.mutate({ anthropicKey: '' })}
            />
            <KeyField
              label="OpenAI (embeddings)"
              placeholder="sk-…"
              value={openai}
              onChange={setOpenai}
              status={s?.openai}
              onRemove={() => save.mutate({ openaiKey: '' })}
            />
          </div>
        </details>
      </div>

      {save.error && (
        <p className="mt-3 text-sm text-destructive">
          {(save.error as Error).message}
        </p>
      )}

      <button
        onClick={submit}
        disabled={save.isPending || (!gemini.trim() && !anthropic.trim() && !openai.trim())}
        className="mt-5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {save.isPending ? 'Saving…' : 'Save keys'}
      </button>
    </div>
  );
}

function KeyField({
  label,
  placeholder,
  value,
  onChange,
  status,
  onRemove,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  status?: { set: boolean; masked: string | null };
  onRemove: () => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        {status?.set ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-score-green/15 px-2 py-0.5 text-score-green">
              Saved · {status.masked}
            </span>
            <button onClick={onRemove} className="hover:text-destructive">
              Remove
            </button>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not set</span>
        )}
      </div>
      <input
        type="password"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={status?.set ? 'Enter a new key to replace' : placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
