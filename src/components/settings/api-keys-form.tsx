'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

interface KeyStatus {
  anthropic: { set: boolean; masked: string | null };
  openai: { set: boolean; masked: string | null };
}

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

  const [anthropic, setAnthropic] = useState('');
  const [openai, setOpenai] = useState('');

  const save = useMutation({
    mutationFn: (body: { anthropicKey?: string; openaiKey?: string }) =>
      apiFetch<KeyStatus>('/api/settings/keys', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      setAnthropic('');
      setOpenai('');
      qc.invalidateQueries({ queryKey: ['key-status'] });
    },
  });

  function submit() {
    const body: { anthropicKey?: string; openaiKey?: string } = {};
    if (anthropic.trim()) body.anthropicKey = anthropic.trim();
    if (openai.trim()) body.openaiKey = openai.trim();
    if (Object.keys(body).length) save.mutate(body);
  }

  const s = status.data;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">AI API keys</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bring your own keys. They&apos;re encrypted and used only for your account&apos;s AI features
        (niche research, image analysis, Copilot). Get them from{' '}
        <a className="text-primary underline" href="https://console.anthropic.com" target="_blank" rel="noreferrer">
          console.anthropic.com
        </a>{' '}
        and{' '}
        <a className="text-primary underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
          platform.openai.com
        </a>
        .
      </p>

      <div className="mt-5 space-y-4">
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

      {save.error && (
        <p className="mt-3 text-sm text-destructive">
          {(save.error as Error).message}
        </p>
      )}

      <button
        onClick={submit}
        disabled={save.isPending || (!anthropic.trim() && !openai.trim())}
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
