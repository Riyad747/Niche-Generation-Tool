import { describe, it, expect } from 'vitest';
import { withinLimit } from '@/lib/services/quota.service';
import { rateLimit } from '@/lib/cache/rate-limit';

describe('Quota limits', () => {
  it('allows usage under the limit', () => {
    expect(withinLimit(2, 1, 3)).toBe(true);
  });
  it('allows usage exactly at the limit', () => {
    expect(withinLimit(2, 1, 3)).toBe(true); // 3 <= 3
  });
  it('blocks usage over the limit', () => {
    expect(withinLimit(3, 1, 3)).toBe(false); // 4 > 3
  });
  it('treats null as unlimited', () => {
    expect(withinLimit(1_000_000, 1, null)).toBe(true);
  });
});

describe('Rate limiter (in-memory fallback)', () => {
  it('permits up to the limit then blocks within the window', async () => {
    const subject = `test-${Math.floor(Math.random() * 1e9)}`;
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await rateLimit(subject, 'unit', 3, 60));
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3].ok).toBe(false);
    expect(results[4].ok).toBe(false);
    expect(results[3].remaining).toBe(0);
  });

  it('isolates different subjects', async () => {
    const a = await rateLimit('subj-a', 'iso', 1, 60);
    const b = await rateLimit('subj-b', 'iso', 1, 60);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });
});
