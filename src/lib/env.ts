import { z } from 'zod';

/**
 * Centralized, validated environment access. Import `env` instead of reading
 * process.env directly so a missing/invalid var fails fast at boot, not deep
 * inside a request. Client-safe vars are the NEXT_PUBLIC_* ones only.
 */
const schema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  QSTASH_TOKEN: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),

  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

// During `next build` / typecheck we don't want to hard-crash if envs are absent,
// so parse leniently there and strictly at runtime on the server.
const parsed = schema.safeParse(process.env);

if (!parsed.success && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = (parsed.success ? parsed.data : (process.env as unknown)) as z.infer<typeof schema>;
