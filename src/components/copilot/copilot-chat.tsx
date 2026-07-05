'use client';

import { useState } from 'react';
import { useCopilot } from '@/hooks/use-copilot';
import { cn } from '@/lib/utils/cn';

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  tool?: string;
}

const SUGGESTIONS = [
  'What should I create this week?',
  'Find 20 underserved healthcare niches',
  'Find niches suitable for MidJourney and vectorization',
  'Show my top opportunities this month',
];

/** AI Copilot — conversational access to the user's opportunity data. */
export function CopilotChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const copilot = useCopilot();

  async function send(text: string) {
    const q = text.trim();
    if (!q || copilot.isPending) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    try {
      const reply = await copilot.mutateAsync(q);
      setMessages((m) => [...m, { role: 'assistant', text: reply.answer, tool: reply.toolUsed }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Error: ${(e as Error).message}` },
      ]);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div>
        <h1 className="text-2xl font-bold">AI Copilot</h1>
        <p className="text-sm text-muted-foreground">Ask about your niches, trends, and opportunities.</p>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm',
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted',
              )}
            >
              {m.tool && m.tool !== 'answer' && (
                <div className="mb-1 text-[10px] uppercase tracking-wide opacity-60">via {m.tool}</div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {copilot.isPending && <div className="text-sm text-muted-foreground">Thinking…</div>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="Ask anything…"
          className="flex-1 rounded-lg border bg-background px-4 py-2.5 outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={() => send(input)}
          disabled={copilot.isPending}
          className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
