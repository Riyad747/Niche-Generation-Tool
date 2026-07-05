import { redis } from './redis';

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Fixed-window rate limiter keyed by (subject, route). Simple and cheap: one
 * counter per window with a TTL. Good enough to protect AI-heavy routes from a
 * runaway client; swap for a sliding-window log if you need strict fairness.
 */
export async function rateLimit(
  subject: string,
  route: string,
  limit: number,
  windowSeconds = 60,
): Promise<RateResult> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `ratelimit:${route}:${subject}:${window}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSeconds);
  const resetSeconds = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds);
  return { ok: count <= limit, remaining: Math.max(0, limit - count), resetSeconds };
}
