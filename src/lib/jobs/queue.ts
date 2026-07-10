import { after } from 'next/server';
import { env } from '@/lib/env';

export type JobType = 'nicheExpansion' | 'imageAnalysis' | 'portfolioAnalysis';

export interface JobPayload {
  nicheExpansion: { sessionId: string; userId: string; seed: string; depth?: number; breadth?: number };
  imageAnalysis: { imageId: string; userId: string };
  portfolioAnalysis: { uploadId: string; userId: string };
}

/**
 * Enqueue a background job. With QSTASH_TOKEN set this publishes to Upstash
 * QStash, which calls back into /api/jobs/[type]. Without it, the job runs
 * inline via Next's `after()` — which tells Vercel to keep the function alive
 * after the response is sent (a bare fire-and-forget promise would be frozen
 * mid-run when the serverless function suspends). The calling route must set a
 * `maxDuration` large enough for the job.
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
  try {
    after(() => runInline(type, payload));
  } catch {
    // outside a request scope (worker/scripts): plain fire-and-forget is fine
    void runInline(type, payload);
  }
}

async function runInline<T extends JobType>(type: T, payload: JobPayload[T]): Promise<void> {
  const { processJob } = await import('./processors');
  try {
    await processJob(type, payload);
  } catch (err) {
    console.error(`[job:${type}] failed`, err);
  }
}
