'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

interface KeyStatus {
  anthropic: { set: boolean; masked: string | null };
  openai: { set: boolean; masked: string | null };
  gemini: { count: number; masked: string[]; model: string | null };
}

type KeyBody = {
  anthropicKey?: string;
  openaiKey?: string;
  addGeminiKey?: string;
  removeGeminiIndex?: number;
  geminiModel?: string;
};

const GEMINI_MODEL_OPTIONS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash — default, most free quota' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash — smarter, good free quota' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro — strongest reasoning, low free quota' },
  { id: 'gemini-3-flash', label: 'Gemini 3 Flash — newest' },
  { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (preview)' },
];

/**
 * BYOK settings. Gemini (free) supports MULTIPLE keys — add several and the app
 * rotates across them and fails over on rate limits. Keys are encrypted server-
 * side and only ever read back masked, so the list is managed by add/remove
 * operations rather than resending raw values.
 */
export function ApiKeysForm() {
  const qc = useQueryClient();
  const status = useQuery({
    queryKey: ['key-status'],
    queryFn: () => apiFetch<KeyStatus>('/api/settings/keys'),
  });

  const [newGemini, setNewGemini] = useState('');
  const [anthropic, setAnthropic] = useState('');
  const [openai, setOpenai] = useState('');

  const save = useMutation({
    mutationFn: (body: KeyBody) =>
      apiFetch<KeyStatus>('/api/settings/keys', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: () => {
      setNewGemini('');
      setAnthropic('');
      setOpenai('');
      qc.invalidateQueries({ queryKey: ['key-status'] });
    },
  });

  const s = status.data;

  function addGemini() {
    const k = newGemini.trim();
    if (k) save.mutate({ addGeminiKey: k });
  }

  return (
    <div className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">AI API keys</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bring your own key. Keys are encrypted and used only for your account&apos;s AI features. A{' '}
        <strong>free Google Gemini key</strong> runs the whole app — grab one at{' '}
        <a className="text-primary underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
          aistudio.google.com/apikey
        </a>
        .
      </p>

      <div className="mt-5 rounded-lg border border-primary/40 bg-primary/5 p-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            Free · Recommended
          </span>
          <span className="text-sm font-medium">Google Gemini keys</span>
          {s && <span className="text-xs text-muted-foreground">· {s.gemini.count} saved</span>}
        </div>

        {s && s.gemini.count > 0 && (
          <ul className="mb-3 space-y-1.5">
            {s.gemini.masked.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <span className="font-mono">{m}</span>
                <button
                  onClick={() => save.mutate({ removeGeminiIndex: i })}
                  disabled={save.isPending}
                  className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="password"
            autoComplete="off"
            value={newGemini}
            onChange={(e) => setNewGemini(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGemini()}
            placeholder="AIza… (add another key)"
            className="flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={addGemini}
            disabled={save.isPending || !newGemini.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {save.isPending ? '…' : 'Add key'}
          </button>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Add 2–3 keys to avoid rate limits — the app rotates across them. For real extra quota,
          create each key in a different Google project (or account), since keys in the same project
          share one limit.
        </p>

        <div className="mt-4 border-t pt-3">
          <label className="text-xs font-medium">Model</label>
          <select
            value={s?.gemini.model ?? 'gemini-2.0-flash'}
            onChange={(e) => save.mutate({ geminiModel: e.target.value })}
            disabled={save.isPending}
            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            {GEMINI_MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            If a model isn&apos;t available to your key yet, the app automatically falls back to
            Gemini 2.5 / 2.0 Flash. Note: newer models often have smaller free-tier limits.
          </p>
        </div>
        {save.error && <p className="mt-2 text-sm text-destructive">{(save.error as Error).message}</p>}
      </div>

      <details className="mt-4 rounded-lg border p-4">
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
            onSave={() => anthropic.trim() && save.mutate({ anthropicKey: anthropic.trim() })}
            onRemove={() => save.mutate({ anthropicKey: '' })}
            pending={save.isPending}
          />
          <KeyField
            label="OpenAI (embeddings)"
            placeholder="sk-…"
            value={openai}
            onChange={setOpenai}
            status={s?.openai}
            onSave={() => openai.trim() && save.mutate({ openaiKey: openai.trim() })}
            onRemove={() => save.mutate({ openaiKey: '' })}
            pending={save.isPending}
          />
        </div>
      </details>
    </div>
  );
}

function KeyField({
  label,
  placeholder,
  value,
  onChange,
  status,
  onSave,
  onRemove,
  pending,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  status?: { set: boolean; masked: string | null };
  onSave: () => void;
  onRemove: () => void;
  pending: boolean;
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
      <div className="flex gap-2">
        <input
          type="password"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={status?.set ? 'Enter a new key to replace' : placeholder}
          className="flex-1 rounded-lg border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={onSave}
          disabled={pending || !value.trim()}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </div>
  );
}
