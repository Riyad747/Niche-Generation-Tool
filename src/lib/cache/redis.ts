import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

/**
 * Upstash Redis (REST) singleton + cache-aside helper.
 * Falls back to a no-op in-memory shim when Redis isn't configured (local dev)
 * so the app still runs without a Redis instance.
 */
type Store = Pick<Redis, 'get' | 'set' | 'incr' | 'expire'>;

function createRedis(): Store {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  const mem = new Map<string, { v: unknown; exp: number }>();
  const alive = (key: string) => {
    const hit = mem.get(key);
    if (!hit) return null;
    if (hit.exp && hit.exp < Date.now()) {
      mem.delete(key);
      return null;
    }
    return hit;
  };
  return {
    async get<T>(key: string) {
      return (alive(key)?.v as T) ?? null;
    },
    async set(key: string, value: unknown, opts?: { ex?: number }) {
      mem.set(key, { v: value, exp: opts?.ex ? Date.now() + opts.ex * 1000 : 0 });
      return 'OK' as const;
    },
    async incr(key: string) {
      const hit = alive(key);
      const next = ((hit?.v as number) ?? 0) + 1;
      mem.set(key, { v: next, exp: hit?.exp ?? 0 });
      return next;
    },
    async expire(key: string, seconds: number) {
      const hit = alive(key);
      if (!hit) return 0 as const;
      hit.exp = Date.now() + seconds * 1000;
      return 1 as const;
    },
  } as unknown as Store;
}

export const redis = createRedis();

/**
 * Read-through cache. Returns the cached value if present, otherwise runs
 * `fn`, stores the result with a TTL, and returns it.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const hit = await redis.get<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await fn();
  await redis.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}

/** Stable hash for building cache keys from arbitrary input. */
export function hashKey(input: unknown): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return (h >>> 0).toString(36);
}
