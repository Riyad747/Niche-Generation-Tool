import { env } from '@/lib/env';

export type JobType = 'nicheExpansion' | 'imageAnalysis' | 'portfolioAnalysis';

export interface JobPayload {
  nicheExpansion: { sessionId: string; userId: string; seed: string; depth?: number; breadth?: number };
  imageAnalysis: { imageId: string; userId: string };
  portfolioAnalysis: { uploadId: string; userId: string };
}

/**
 * Enqueue a background job. In production this publishes to Upstash QStash,
 * which calls back into /api/jobs/[type]. In local dev (no QSTASH_TOKEN) it runs
 * the processor inline on the next tick so the app works end-to-end without
 * external infra — see `runInline`.
 */
export async function enqueue<T extends JobType>(type: T, payload: JobPayload[T]): Promise<void> {
  if (env.QSTASH_TOKEN) {
    const { Client } = await import('@upstash/qstash');
    const client = new Client({ token: env.QSTASH_TOKEN });
    await client.publishJSON({
      url: `${env.NEXT_PUBLIC_APP_URL}/api/jobs/${type}`,
      body: payload,
    });
    return;
  }
  // Dev fallback: run without blocking the response.
  void runInline(type, payload);
}

async function runInline<T extends JobType>(type: T, payload: JobPayload[T]): Promise<void> {
  const { processJob } = await import('./processors');
  try {
    await processJob(type, payload);
  } catch (err) {
    console.error(`[job:${type}] failed`, err);
  }
}
