'use client';

import { useState } from 'react';
import { useCalendar, useEventIdeas, type UpcomingEventDto } from '@/hooks/use-calendar';
import { cn } from '@/lib/utils/cn';

const URGENCY: Record<string, { label: string; cls: string }> = {
  'create-now': { label: 'Create now', cls: 'bg-score-red/15 text-score-red' },
  'start-soon': { label: 'Start soon', cls: 'bg-score-orange/15 text-score-orange' },
  'plan-ahead': { label: 'Plan ahead', cls: 'bg-score-green/15 text-score-green' },
};

const CATEGORY_CLS: Record<string, string> = {
  holiday: 'bg-primary/10 text-primary',
  seasonal: 'bg-score-green/15 text-score-green',
  awareness: 'bg-score-yellow/15 text-score-yellow',
  shopping: 'bg-score-orange/15 text-score-orange',
  cultural: 'bg-muted text-muted-foreground',
};

/**
 * Content Calendar — the master planner. Shows upcoming holidays, seasons,
 * awareness days and shopping events, when to START creating (lead time), and
 * generates content ideas per event.
 */
export function ContentCalendar() {
  const { data, isLoading } = useCalendar(180);
  const [openId, setOpenId] = useState<string | null>(null);

  const groups: { key: string; title: string }[] = [
    { key: 'create-now', title: '🔴 Create now — you should already be making these' },
    { key: 'start-soon', title: '🟠 Start soon — begin within a month' },
    { key: 'plan-ahead', title: '🟢 Plan ahead' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Your seasonal reminder engine — what to create next for upcoming holidays, seasons, and
          events. Stock platforms reward early uploads, so &quot;create by&quot; dates build in lead time.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading calendar…</p>}

      {groups.map((g) => {
        const items = (data ?? []).filter((e) => e.urgency === g.key);
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{g.title}</h2>
            <div className="space-y-2">
              {items.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  open={openId === e.id}
                  onToggle={() => setOpenId(openId === e.id ? null : e.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function EventRow({
  event,
  open,
  onToggle,
}: {
  event: UpcomingEventDto;
  open: boolean;
  onToggle: () => void;
}) {
  const ideas = useEventIdeas();

  function generate() {
    if (!open) onToggle();
    if (!ideas.data && !ideas.isPending) ideas.mutate(event.id);
  }

  const dateStr = new Date(event.date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{event.name}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', CATEGORY_CLS[event.category])}>
              {event.category}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', URGENCY[event.urgency].cls)}>
              {URGENCY[event.urgency].label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>
        </div>

        <div className="text-right text-xs">
          <div className="font-medium">
            {dateStr}
            {event.approx && <span className="text-muted-foreground"> (approx)</span>}
          </div>
          <div className="text-muted-foreground">in {event.daysUntil} days</div>
          <div className="mt-0.5 text-muted-foreground">
            {event.daysUntilCreateBy <= 0
              ? 'create window open'
              : `start in ${event.daysUntilCreateBy}d`}
          </div>
        </div>

        <button
          onClick={generate}
          disabled={ideas.isPending}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
        >
          {ideas.isPending ? 'Generating…' : ideas.data ? 'View ideas' : 'Generate ideas'}
        </button>
      </div>

      {open && (
        <div className="border-t p-4">
          {ideas.error && <p className="text-sm text-destructive">{(ideas.error as Error).message}</p>}
          {!ideas.data && !ideas.isPending && !ideas.error && (
            <p className="text-sm text-muted-foreground">Click “Generate ideas” for keywords and asset prompts.</p>
          )}
          {ideas.data && (
            <div className="space-y-4">
              <section>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Asset ideas
                </h4>
                <ul className="space-y-2 text-sm">
                  {ideas.data.ideas.slice(0, 12).map((idea, i) => (
                    <li key={i} className="rounded-lg border p-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {idea.assetType}
                        </span>
                        <span className="font-medium">{idea.title}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{idea.prompt}</p>
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {ideas.data.keywords.slice(0, 40).map((k, i) => (
                    <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">
                      {k.term}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
