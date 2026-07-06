import { EVENTS, type CalendarEvent } from '@/config/events';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 'create-now' = start already; 'start-soon' = within 30d of the create-by date. */
export type EventUrgency = 'create-now' | 'start-soon' | 'plan-ahead';

export interface UpcomingEvent extends CalendarEvent {
  /** next occurrence, ISO date (UTC midnight) */
  date: string;
  daysUntil: number;
  /** recommended date to START creating (occurrence − leadDays) */
  createByDate: string;
  daysUntilCreateBy: number;
  urgency: EventUrgency;
}

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Next occurrence of a month/day at or after `now` (rolls to next year if passed). */
function nextOccurrence(now: Date, month: number, day: number): number {
  const year = now.getUTCFullYear();
  const today = startOfUtcDay(now);
  let ts = Date.UTC(year, month - 1, day);
  if (ts < today) ts = Date.UTC(year + 1, month - 1, day);
  return ts;
}

function urgencyFor(daysUntilCreateBy: number): EventUrgency {
  if (daysUntilCreateBy <= 0) return 'create-now';
  if (daysUntilCreateBy <= 30) return 'start-soon';
  return 'plan-ahead';
}

/**
 * Upcoming content opportunities within `horizonDays`, sorted by soonest event.
 * `now` is injected so the calendar is deterministic and testable.
 */
export function upcomingEvents(now: Date, horizonDays = 150, events = EVENTS): UpcomingEvent[] {
  const today = startOfUtcDay(now);
  return events
    .map((e) => {
      const occ = nextOccurrence(now, e.month, e.day);
      const createBy = occ - e.leadDays * DAY_MS;
      const daysUntil = Math.round((occ - today) / DAY_MS);
      const daysUntilCreateBy = Math.round((createBy - today) / DAY_MS);
      return {
        ...e,
        date: new Date(occ).toISOString().slice(0, 10),
        daysUntil,
        createByDate: new Date(createBy).toISOString().slice(0, 10),
        daysUntilCreateBy,
        urgency: urgencyFor(daysUntilCreateBy),
      };
    })
    .filter((e) => e.daysUntil <= horizonDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** Find one event by id (for idea generation). */
export function findEvent(id: string): CalendarEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}
