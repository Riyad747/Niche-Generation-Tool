import { processJob } from '@/lib/jobs/processors';
import type { JobType } from '@/lib/jobs/queue';
import { env } from '@/lib/env';

const VALID: JobType[] = ['nicheExpansion', 'imageAnalysis', 'portfolioAnalysis'];

/**
 * QStash callback endpoint. In production, QStash signs requests; we verify the
 * signature before running the processor. In dev (no signing keys) jobs run
 * inline via the queue fallback and never hit this route.
 */
export async function POST(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID.includes(type as JobType)) {
    return Response.json({ error: 'unknown job type' }, { status: 400 });
  }

  const raw = await req.text();

  const signingKey = env.QSTASH_TOKEN; // presence implies QStash configured
  if (signingKey) {
    const { Receiver } = await import('@upstash/qstash');
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY ?? '',
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY ?? '',
    });
    const signature = req.headers.get('upstash-signature') ?? '';
    const valid = await receiver.verify({ signature, body: raw }).catch(() => false);
    if (!valid) return Response.json({ error: 'invalid signature' }, { status: 401 });
  }

  try {
    await processJob(type as JobType, JSON.parse(raw));
    return Response.json({ ok: true });
  } catch (err) {
    console.error(`[job:${type}]`, err);
    return Response.json({ error: 'job failed' }, { status: 500 });
  }
}
