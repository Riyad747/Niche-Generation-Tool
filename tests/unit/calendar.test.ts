import { describe, it, expect } from 'vitest';
import { upcomingEvents } from '@/lib/engines/event-calendar';

const NOW = new Date('2026-07-06T12:00:00Z');

describe('Content calendar', () => {
  it('returns events within the horizon, sorted soonest-first', () => {
    const list = upcomingEvents(NOW, 180);
    expect(list.length).toBeGreaterThan(0);
    for (const e of list) {
      expect(e.daysUntil).toBeGreaterThanOrEqual(0);
      expect(e.daysUntil).toBeLessThanOrEqual(180);
    }
    const sorted = [...list].sort((a, b) => a.daysUntil - b.daysUntil);
    expect(list.map((e) => e.id)).toEqual(sorted.map((e) => e.id));
  });

  it('rolls past dates to next year (New Year is ~180 days out, excluded from 150h)', () => {
    const list = upcomingEvents(NOW, 150);
    expect(list.find((e) => e.id === 'new-year')).toBeUndefined();
    const wide = upcomingEvents(NOW, 200);
    const ny = wide.find((e) => e.id === 'new-year');
    expect(ny?.date).toBe('2027-01-01');
  });

  it('flags an event whose create-by date has passed as "create-now"', () => {
    // Back to School (Aug 15, 60d lead) → create-by Jun 16, before Jul 6.
    const bts = upcomingEvents(NOW, 180).find((e) => e.id === 'back-to-school');
    expect(bts?.urgency).toBe('create-now');
  });

  it('classifies Christmas as plan-ahead in July with a lead-time create-by date', () => {
    const xmas = upcomingEvents(NOW, 200).find((e) => e.id === 'christmas');
    expect(xmas?.date).toBe('2026-12-25');
    expect(xmas?.createByDate).toBe('2026-09-26'); // 90 days before
    expect(xmas?.urgency).toBe('plan-ahead');
  });
});
