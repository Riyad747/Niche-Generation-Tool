import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { UnauthorizedError } from '@/lib/auth/require-user';
import { QuotaExceededError } from '@/lib/services/quota.service';
import { MissingApiKeyError } from '@/lib/ai/client';
import { rateLimit } from '@/lib/cache/rate-limit';
import { log, requestId } from '@/lib/log';

/** Consistent error envelope: { error: { code, message, details? } }. */
export function fail(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Wrap a route handler with uniform request logging, timing, and error mapping.
 * Domain errors get typed status codes; anything else is a 500 with no leak.
 */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  const rid = requestId();
  const start = Date.now();
  return fn()
    .then((res) => {
      log.info('request.ok', { rid, status: res.status, ms: Date.now() - start });
      return res;
    })
    .catch((err) => {
      const ms = Date.now() - start;
      if (err instanceof UnauthorizedError) return fail('UNAUTHORIZED', 'Sign in required', 401);
      if (err instanceof ZodError) return fail('VALIDATION', 'Invalid request', 422, err.flatten());
      if (err instanceof MissingApiKeyError) {
        log.warn('request.missingKey', { rid, provider: err.provider, ms });
        return fail('MISSING_API_KEY', err.message, 400, { provider: err.provider });
      }
      if (err instanceof QuotaExceededError) {
        log.warn('request.quota', { rid, kind: err.kind, ms });
        return fail('QUOTA_EXCEEDED', `You've hit your plan limit for ${err.kind}`, 402, {
          kind: err.kind,
        });
      }
      log.error('request.error', { rid, ms, err: err instanceof Error ? err.message : String(err) });
      return fail('INTERNAL', 'Something went wrong', 500);
    });
}

/**
 * Enforce a per-user, per-route rate limit. Returns a 429 Response to short-
 * circuit, or null to proceed. Use at the top of AI-heavy handlers.
 */
export async function enforceRate(
  subject: string,
  route: string,
  limitPerMin: number,
): Promise<Response | null> {
  const r = await rateLimit(subject, route, limitPerMin, 60);
  if (r.ok) return null;
  return NextResponse.json(
    { error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } },
    { status: 429, headers: { 'Retry-After': String(r.resetSeconds) } },
  );
}
